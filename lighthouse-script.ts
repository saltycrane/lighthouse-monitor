// Import dotenv first to set up nvironment variables (not needed for Next.js app)
import "dotenv/config";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as cheerio from "cheerio";
import * as chromeLauncher from "chrome-launcher";
import lighthouse, * as LH from "lighthouse";
import puppeteer, { Browser, CookieData, LaunchOptions, Page } from "puppeteer";
import { execSync } from "child_process";

import {
  createMetrics,
  getAllHosts,
  getPathnamesToTest,
  updatePathnameTestedAt,
} from "./lib/db";
import * as log from "./lib/log";
import { TBrowserEnv } from "./lib/types";
import { fix, range, sleep, timeout } from "./lib/utils";

/**
 * Constants
 */
const DELAY_BETWEEN_TESTS_MS = 1000;
const LIGHTHOUSE_MAX_WAIT_FOR_LOAD = 120 * 1000;
const LIGHTHOUSE_STUCK_TIMEOUT_MS = LIGHTHOUSE_MAX_WAIT_FOR_LOAD + 120 * 1000;
const LIGHTHOUSE_STUCK_TIMEOUT_VALUE = "LIGHTHOUSE_STUCK_TIMEOUT_VALUE";
const CHROME_LAUNCHER_OPTIONS: chromeLauncher.Options = {
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    // Some info: https://github.com/puppeteer/puppeteer/issues/1834
    // https://github.com/foo-software/lighthouse-persist/blob/df201768d23ec23cc4c1899d193044e56c44f44c/src/options.ts
    "--disable-dev-shm-usage",
    "--ignore-certificate-errors",
  ],
};
const PUPPETEER_OPTIONS: LaunchOptions = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  // below options from https://github.com/GoogleChrome/lighthouse/blob/main/docs/puppeteer.md
  headless: true, // this is "new headless"
  defaultViewport: null,
  ignoreDefaultArgs: ["--enable-automation"],
};
const LIGHTHOUSE_CONFIG: LH.Config = {
  extends: "lighthouse:default",
  settings: {
    cpuQuietThresholdMs: 5.25 * 1000,
    disableFullPageScreenshot: true,
    // disableStorageReset is set dynamically
    maxWaitForFcp: 30 * 1000,
    maxWaitForLoad: 120 * 1000,
    networkQuietThresholdMs: 5.25 * 1000,
    onlyCategories: ["performance"],
    pauseAfterFcpMs: 5.25 * 1000,
    pauseAfterLoadMs: 5.25 * 1000,
    throttlingMethod: "simulate",
  },
};

/**
 * Run the main program
 */
main();

/**
 * main
 */
async function main() {
  log.debug("[main] start");

  try {
    const pathnameRows = await getPathnamesToTest();
    const hostRows = await getAllHosts();
    for (const pathnameRow of pathnameRows) {
      await updatePathnameTestedAt(pathnameRow.id);
      for (const hostRow of hostRows) {
        if (!hostRow.is_active) {
          continue;
        }
        if (process.env.USE_PUPPETEER === "true") {
          await runTestsForSingleUrlUsingPuppeteer(
            hostRow.host,
            pathnameRow.pathname,
          );
        } else {
          await runTestsForSingleUrl(hostRow.host, pathnameRow.pathname);
        }
      }
    }
  } catch (error) {
    log.error(`Failed to run tests for all URLs:`, error);
  }
}

/**
 * runTestsForSingleUrl
 */
async function runTestsForSingleUrl(host: string, pathname: string) {
  log.debug("[runTestsForSingleUrl] start");

  const url = `https://${host}${pathname}`;
  log.info("");
  log.info(`Testing ${url}`);
  log.info("Launching browser (chrome-launcher)...");

  const chrome = await chromeLauncher.launch(CHROME_LAUNCHER_OPTIONS);
  await sleep(DELAY_BETWEEN_TESTS_MS);

  for (const runNumber of range(1, 3)) {
    try {
      await runLighthouse({
        browserEnv: "chrome-launcher",
        browserWsPort: chrome.port,
        host,
        pathname,
        runNumber,
      });
      await sleep(DELAY_BETWEEN_TESTS_MS);
    } catch (error) {
      log.error(` ❌ Error measuring ${url}:`, error);
    }
  }

  log.info("Closing browser...");
  chrome.kill();
}

/**
 * runTestsForSingleUrlUsingPuppeteer
 */
async function runTestsForSingleUrlUsingPuppeteer(
  host: string,
  pathname: string,
) {
  log.debug("[runTestsForSingleUrlUsingPuppeteer] start");

  const url = `https://${host}${pathname}`;
  log.info("");
  log.info(`Testing ${url}`);
  log.info("Launching browser (puppeteer)...");

  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  await sleep(DELAY_BETWEEN_TESTS_MS);
  const puppeteerPage = await browser.newPage();

  // Set cookies to close the OneTrust cookie consent banner
  const cookies = await setCookiesToHideOneTrustCookieConsentBanner(
    browser,
    host,
  );

  // Run 2 tests per URL
  for (const runNumber of range(1, 3)) {
    try {
      const result = await Promise.race([
        runLighthouse({
          browserEnv: "puppeteer",
          cookies,
          host,
          pathname,
          puppeteerPage,
          runNumber,
        }),
        timeout(LIGHTHOUSE_STUCK_TIMEOUT_MS, LIGHTHOUSE_STUCK_TIMEOUT_VALUE),
      ]);
      if (result === LIGHTHOUSE_STUCK_TIMEOUT_VALUE) {
        throw Error("Lighthouse stuck timeout triggered");
      }
      await sleep(DELAY_BETWEEN_TESTS_MS);
    } catch (error) {
      log.error(` ❌ Error measuring ${url}:`, error);
    }
  }

  log.info("Closing browser...");
  await browser.close();
}

/**
 *
 */
async function setCookiesToHideOneTrustCookieConsentBanner(
  browser: Browser,
  host: string,
) {
  const COOKIES: CookieData[] = [
    {
      name: "OptanonAlertBoxClosed",
      value: new Date().toISOString(),
      domain: host,
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "OptanonConsent",
      value: "isGpcEnabled=0&datestamp=" + new Date().toISOString(),
      domain: host,
      path: "/",
      sameSite: "Lax",
    },
  ];
  const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const cookies = COOKIES.map((cookie) => ({
    ...cookie,
    expires: oneYearFromNow,
  }));
  log.info(`Setting cookies: ${JSON.stringify(cookies)}`);
  for (const cookie of cookies) {
    await browser.setCookie(cookie);
  }
  return cookies;
}

/**
 * runLighthouse
 */
type TRunLighthouseParam = {
  browserEnv: TBrowserEnv;
  browserWsPort?: number;
  cookies?: CookieData[];
  host: string;
  pathname: string;
  puppeteerPage?: Page;
  runNumber: number;
};

async function runLighthouse({
  browserEnv,
  browserWsPort,
  cookies,
  host,
  pathname,
  puppeteerPage,
  runNumber,
}: TRunLighthouseParam) {
  log.info(`Run ${runNumber}: running lighthouse...`);

  const url = `https://${host}${pathname}`;
  // 1st run is "uncached"; 2nd run is "cached"
  const isCached = runNumber > 1;
  const lighthouseConfig = {
    ...LIGHTHOUSE_CONFIG,
    settings: {
      ...LIGHTHOUSE_CONFIG.settings,
      disableStorageReset: isCached,
    },
  };

  const result = await lighthouse(
    url,
    // Lighthouse flags
    {
      port: browserWsPort,
      output: ["json", "html"],
      logLevel: "warn",
    },
    // Lighthouse config
    lighthouseConfig,
    puppeteerPage,
  );

  if (!result) {
    throw Error(" ❌ No result");
  }

  const audits = result.lhr.audits;
  let performanceScore = result.lhr.categories.performance.score;

  if (result.lhr.runWarnings.length > 0) {
    log.warn(" ⚠️ Warnings: ", JSON.stringify(result.lhr.runWarnings, null, 2));
  }
  if (performanceScore === null) {
    // log.debug(
    //   "[runLighthouse] result.lhr",
    //   JSON.stringify(result.lhr, null, 2),
    // );
    log.error(" ❌ Errors:", JSON.stringify(result.lhr.runtimeError, null, 2));
    throw Error(" ❌ No performance score");
  }

  performanceScore *= 100;
  const firstContentfulPaint =
    audits["first-contentful-paint"].numericValue ?? null;
  const firstContentfulPaintSec =
    firstContentfulPaint === null ? null : firstContentfulPaint / 1000;
  const largestContentfulPaint =
    audits["largest-contentful-paint"].numericValue ?? null;
  const largestContentfulPaintSec =
    largestContentfulPaint === null ? null : largestContentfulPaint / 1000;
  const totalBlockingTimeMs =
    audits["total-blocking-time"].numericValue ?? null;
  const cumulativeLayoutShift =
    audits["cumulative-layout-shift"].numericValue ?? null;
  const speedIndex = audits["speed-index"].numericValue ?? null;
  const speedIndexSec = speedIndex === null ? null : speedIndex / 1000;
  // INP only shows up if there is interaction (e.g. manual or scripted by puppeteer)
  // https://github.com/GoogleChrome/lighthouse/issues/15482
  const interactionToNextPaintMs =
    audits["interaction-to-next-paint"]?.numericValue ?? -1;

  // Upload HTML report to S3
  let s3Key: string | null = null;
  try {
    s3Key = `report-${Date.now()}.html`;
    const appendedReport = addConfigToEndOfReport(
      result.report[1],
      lighthouseConfig,
      runNumber,
      cookies,
    );
    await uploadHtmlReportToS3(s3Key, appendedReport);
  } catch (error) {
    log.error(" ❌ S3 upload error:", error);
  }

  // Save metrics to database
  await createMetrics({
    host,
    pathname,
    isCached,
    browserEnv,
    htmlReportS3Key: s3Key,
    performanceScore,
    firstContentfulPaintSec,
    largestContentfulPaintSec,
    totalBlockingTimeMs,
    cumulativeLayoutShift,
    speedIndexSec,
    interactionToNextPaintMs,
  });

  log.info(` ✅ Run ${runNumber}: ${fix(performanceScore, 0)}`);
}

/**
 * uploadHtmlReportToS3
 */
async function uploadHtmlReportToS3(s3Key: string, htmlReport: string) {
  log.debug("[uploadHtmlReportToS3] start");

  const s3Client = new S3Client({
    // set credentials if available in environment variables
    ...(process.env.AWS_S3_ACCESS_KEY_ID && process.env.AWS_S3_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
          },
        }
      : {}),
    region: "us-west-2",
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      ContentType: "text/html",
      Key: s3Key,
      Body: htmlReport,
    }),
  );

  log.info(`Uploaded HTML report to S3: ${s3Key}`);
}

/**
 * addConfigToEndOfReport
 */
function addConfigToEndOfReport(
  htmlReport: string,
  lighthouseConfig: LH.Config,
  runNumber: number,
  cookies: CookieData[],
) {
  const $ = cheerio.load(htmlReport);
  const codeVersion = getCodeVersionInfo();

  const isPuppeteer = process.env.USE_PUPPETEER === "true";
  const launcherOpts = isPuppeteer
    ? PUPPETEER_OPTIONS
    : CHROME_LAUNCHER_OPTIONS;

  $("body").append(`<pre>Run number: ${runNumber}</pre>`);
  $("body").append(`<pre>USE_PUPPETEER: ${process.env.USE_PUPPETEER}</pre>`);
  $("body").append(`<pre>COOKIES: ${JSON.stringify(cookies, null, 2)}</pre>`);
  $("body").append(
    `<pre>${isPuppeteer ? "Puppeteer options:" : "Chrome launcher options:"} ${JSON.stringify(launcherOpts, null, 2)}</pre>`,
  );
  $("body").append(
    `<pre>Lighthouse config: ${JSON.stringify(lighthouseConfig, null, 2)}</pre>`,
  );
  $("body").append(`<pre>Code version: ${codeVersion}</pre>`);

  return $.html();
}

/**
 * getCodeVersionInfo
 */
function getCodeVersionInfo() {
  let gitCommitInfo: string | null = null;
  try {
    gitCommitInfo = execSync("git show -s --format='%h %ci' HEAD", {
      encoding: "utf8",
    }).trim();
  } catch (error) {
    log.warn("Could not get git commit information:", error);
  }
  return gitCommitInfo;
}
