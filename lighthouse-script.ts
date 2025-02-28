// Import dotenv first to set up nvironment variables (not needed for Next.js app)
import "dotenv/config";

import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import { URL } from "url";

import { createMetrics, getAllHosts, getAllPathnames } from "./lib/db";
import { fix, range, sleep } from "./lib/utils";

/**
 * Run the main program
 */
main();

/**
 * main
 */
async function main() {
  try {
    const pathnameRows = await getAllPathnames();
    const hostRows = await getAllHosts();
    for (const pathnameRow of pathnameRows) {
      if (!pathnameRow.is_active) {
        continue;
      }
      for (const hostRow of hostRows) {
        if (!hostRow.is_active) {
          continue;
        }
        await runTestsForSingleUrl(hostRow.host, pathnameRow.pathname);
      }
    }
  } catch (error) {
    console.error(`Failed to run tests for all URLs:`, error);
  }
}

/**
 * runTestsForSingleUrl
 */
async function runTestsForSingleUrl(host: string, pathname: string) {
  const timestamp = new Date().toISOString();
  const url = `https://${host}${pathname}`;
  console.log(`\n${timestamp}: ${url}`);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const port = parseInt(new URL(browser.wsEndpoint()).port, 10);

  for (const runNumber of range(1, 3)) {
    try {
      await runLighthouse(host, pathname, port, runNumber);
      await sleep(500);
    } catch (error) {
      console.error(` ❌ Error measuring ${url}:`, error);
    }
  }

  await browser.close();
}

/**
 * runLighthouse
 */
async function runLighthouse(
  host: string,
  pathname: string,
  browserWsPort: number,
  runNumber: number,
) {
  const url = `https://${host}${pathname}`;
  const result = await lighthouse(
    url,
    // Lighthouse flags
    {
      port: browserWsPort,
      output: "json",
      logLevel: "info",
    },
    // Lighthouse options
    {
      extends: "lighthouse:default",
      settings: {
        onlyCategories: ["performance"],
      },
    },
  );

  if (!result) {
    return null;
  }

  const audits = result.lhr.audits;

  let performanceScore = result.lhr.categories.performance.score;
  performanceScore = performanceScore === null ? null : performanceScore * 100;

  const firstContentfulPaint =
    result.lhr.audits["first-contentful-paint"].numericValue ?? null;
  const firstContentfulPaintSec =
    firstContentfulPaint === null ? null : firstContentfulPaint / 1000;

  const largestContentfulPaint =
    result.lhr.audits["largest-contentful-paint"].numericValue ?? null;
  const largestContentfulPaintSec =
    largestContentfulPaint === null ? null : largestContentfulPaint / 1000;

  const totalBlockingTimeMs =
    audits["total-blocking-time"].numericValue ?? null;

  const cumulativeLayoutShift =
    audits["cumulative-layout-shift"].numericValue ?? null;

  const speedIndex = result.lhr.audits["speed-index"].numericValue ?? null;
  const speedIndexSec = speedIndex === null ? null : speedIndex / 1000;

  const metrics = {
    host,
    pathname,
    runNumber,
    timestamp: new Date().toISOString(),
    performanceScore,
    firstContentfulPaintSec,
    largestContentfulPaintSec,
    totalBlockingTimeMs,
    cumulativeLayoutShift,
    speedIndexSec,
  };

  console.log(` ✅ Run ${runNumber}: ${fix(metrics.performanceScore, 0)}`);

  await createMetrics(metrics);
}
