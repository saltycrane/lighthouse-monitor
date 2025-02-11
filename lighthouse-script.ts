import fs from "fs/promises";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import { URL } from "url";

/**
 * Types
 */
type TDataResult = {
  type: "data";
  url: string;
  timestamp: string;
  performanceScore: number | null;
  firstContentfulPaintSec: number | null;
  largestContentfulPaintSec: number | null;
  totalBlockingTimeMs: number | null;
  cumulativeLayoutShift: number | null;
  speedIndexSec: number | null;
};

type TErrorResult = {
  type: "error";
  url: string;
  timestamp: string;
  error: string;
};

type TResult = TDataResult | TErrorResult;

type TScriptConfig = {
  description: string;
  outputFilePath: string;
  testCount: number;
  runCount: number;
  urls: string[];
};

/**
 * Run the main program
 */
main();

/**
 * main
 */
async function main() {
  try {
    const config = await loadScriptConfig();
    const results = await runTestsForAllUrls(config);
    processAndWriteOutput(results, config);
    console.log("All measurements complete!");
  } catch (error) {
    console.error("Failed to complete measurements:", error);
    process.exit(1);
  }
}

/**
 * loadScriptConfig
 */
async function loadScriptConfig(): Promise<TScriptConfig> {
  const configFilePath = process.argv[2] || "./lighthouse-config.json";
  const DEFAULT_CONFIG: TScriptConfig = {
    description: "Google vs. Wikipedia",
    outputFilePath: "./lighthouse-results",
    testCount: 2,
    runCount: 3,
    urls: ["https://www.google.com/", "https://www.wikipedia.org/"],
  };
  let config: TScriptConfig;

  try {
    const content = await fs.readFile(configFilePath, "utf-8");
    const configFromFile = JSON.parse(content) as TScriptConfig;
    console.log(`Loaded config from ${configFilePath}.`);
    config = { ...DEFAULT_CONFIG, ...configFromFile };
  } catch {
    console.error(
      `Failed to load config from ${configFilePath}. Using default config.`,
    );
    config = DEFAULT_CONFIG;
  }

  console.log(JSON.stringify(config, null, 2));

  return config;
}

/**
 * runTestsForAllUrls
 */
async function runTestsForAllUrls(config: TScriptConfig) {
  const results: TResult[] = [];
  for (const testNumber of range(1, config.testCount + 1)) {
    for (const url of config.urls) {
      const newResults = await runTestsForSingleUrl(url, testNumber, config);
      results.push(...newResults);
    }
  }
  return results;
}

/**
 * runTestsForSingleUrl
 */
async function runTestsForSingleUrl(
  url: string,
  testNumber: number,
  config: TScriptConfig,
) {
  console.log(`\nTest ${testNumber}: ${url}`);

  const browser = await puppeteer.launch();
  const port = parseInt(new URL(browser.wsEndpoint()).port, 10);
  const results: TResult[] = [];

  for (const runNumber of range(1, config.runCount + 1)) {
    try {
      const result = await runLighthouse(url, port);
      if (result) {
        results.push(result);
      }
      console.log(` ✅ Run ${runNumber}: ${result?.performanceScore}`);
    } catch (error) {
      console.error(` ❌ Error measuring ${url}:`, error);
      results.push({
        type: "error",
        url,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  await browser.close();
  return results;
}

/**
 * runLighthouse
 */
async function runLighthouse(
  url: string,
  port: number,
): Promise<TDataResult | null> {
  const result = await lighthouse(
    url,
    // Lighthouse flags
    {
      port,
      output: "json",
      logLevel: "error",
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

  return {
    type: "data",
    url,
    timestamp: new Date().toISOString(),
    performanceScore: fix(performanceScore, 0),
    firstContentfulPaintSec: fix(firstContentfulPaintSec, 1),
    largestContentfulPaintSec: fix(largestContentfulPaintSec, 1),
    totalBlockingTimeMs: fix(totalBlockingTimeMs, 0),
    cumulativeLayoutShift: fix(cumulativeLayoutShift, 3),
    speedIndexSec: fix(speedIndexSec, 1),
  };
}

/**
 * processAndWriteOutput
 */
async function processAndWriteOutput(
  results: TResult[],
  config: TScriptConfig,
) {
  // Gather data
  const processedResults = [];
  for (const url of config.urls) {
    const metrics = aggregateResults(results, url);
    processedResults.push({
      url,
      startTimestamp: metrics.timestamps[0],
      endTimestamp: metrics.timestamps[metrics.timestamps.length - 1],
      tests: config.testCount,
      runs: config.runCount,
      metrics,
    });
  }

  // Write to console
  console.log(`\n📊 Lighthouse Metrics ${config.description}`);
  for (const processedResult of processedResults) {
    const { count, timestamps, errors, ...metrics } = processedResult.metrics;
    console.log(`\n${processedResult.url}`);
    console.log(
      `  Timestamps: ${processedResult.startTimestamp} - ${processedResult.endTimestamp}`,
    );
    console.log(
      `  Test count: ${processedResult.tests} tests x ${processedResult.runs} runs/test = ${count} total`,
    );
    console.table(metrics, ["mean", "stdDev", "min", "max"]);
  }
  console.log("");

  // Write to file
  const timestamp = new Date().toISOString();
  await fs.writeFile(
    `${config.outputFilePath}.${timestamp}.json`,
    JSON.stringify(
      {
        config,
        results: processedResults,
      },
      null,
      2,
    ),
  );
}

/**
 * aggregateResults
 */
function aggregateResults(allResults: TResult[], url: string) {
  const resultsWithErrors = allResults.filter((result) => result.url === url);
  const timestamps = resultsWithErrors.map((result) => result.timestamp);
  const errors = resultsWithErrors.map((result) =>
    result.type === "error" ? result.error : null,
  );
  const results = resultsWithErrors.filter((result) => result.type === "data");
  const performanceScores = results.map((x) => x.performanceScore);
  const firstContentfulPaintSecs = results.map(
    (x) => x.firstContentfulPaintSec,
  );
  const largestContentfulPaintSecs = results.map(
    (x) => x.largestContentfulPaintSec,
  );
  const totalBlockingTimeMsVals = results.map((x) => x.totalBlockingTimeMs);
  const cumulativeLayoutShifts = results.map((x) => x.cumulativeLayoutShift);
  const speedIndexSecs = results.map((x) => x.speedIndexSec);

  return {
    count: resultsWithErrors.length,
    performanceScore: {
      ...calculateStats(performanceScores, { digits: 0 }),
      values: performanceScores,
    },
    firstContentfulPaintSec: {
      ...calculateStats(firstContentfulPaintSecs, { digits: 1 }),
      values: firstContentfulPaintSecs,
    },
    largestContentfulPaintSec: {
      ...calculateStats(largestContentfulPaintSecs, { digits: 1 }),
      values: largestContentfulPaintSecs,
    },
    totalBlockingTimeMs: {
      ...calculateStats(totalBlockingTimeMsVals, { digits: 0 }),
      values: totalBlockingTimeMsVals,
    },
    cumulativeLayoutShift: {
      ...calculateStats(cumulativeLayoutShifts, { digits: 3 }),
      values: cumulativeLayoutShifts,
    },
    speedIndexSec: {
      ...calculateStats(speedIndexSecs, { digits: 1 }),
      values: speedIndexSecs,
    },
    timestamps,
    errors,
  };
}

/**
 * calculateStats
 */
function calculateStats(
  numbersWithNulls: Array<number | null>,
  { digits = 1 } = {},
) {
  const numbers = numbersWithNulls.filter((number) => number !== null);
  const sorted = [...numbers].sort((a, b) => a - b);
  const len = sorted.length;

  // Mean
  const mean = numbers.reduce((a, b) => a + b, 0) / len;

  // Median
  const median =
    len % 2 === 0
      ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2
      : sorted[Math.floor(len / 2)];
  median;

  // Standard Deviation
  const variance =
    numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / len;
  const stdDev = Math.sqrt(variance);

  // Min & Max
  const min = sorted[0];
  const max = sorted[len - 1];

  // 95th percentile
  const p95Index = Math.ceil(len * 0.95) - 1;
  const p95 = sorted[p95Index];
  p95;

  return {
    mean: fix(mean, digits),
    stdDev: fix(stdDev, digits + 1),
    min: fix(min, digits),
    max: fix(max, digits),
  };
}

/**
 * range - minimal `lodash.range`
 */
function range(start: number, end?: number) {
  return Array.from(
    { length: end === undefined ? start : end - start },
    (_, i) => (end === undefined ? i : start + i),
  );
}

/**
 * fix
 */
function fix(number: number | null, digits: number) {
  if (number === null) {
    return null;
  }
  return Number(number.toFixed(digits));
}
