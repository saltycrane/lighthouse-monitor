import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { getDatabasePath } from "./env";
import * as log from "./log";
import {
  TAggregatedStatsRow,
  TFilterParams,
  THostRow,
  TLighthouseMetrics,
  TMetricsRow,
  TPathnameRow,
} from "./types";

/**
 * initializeDatabase
 */
async function _initializeDatabase() {
  const dbPath = getDatabasePath();
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create hosts table
  await db.exec(`
     CREATE TABLE IF NOT EXISTS hosts (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       host TEXT UNIQUE NOT NULL,
       is_active BOOLEAN DEFAULT TRUE,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )
   `);

  // Create pathnames table
  await db.exec(`
     CREATE TABLE IF NOT EXISTS pathnames (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       pathname TEXT UNIQUE NOT NULL,
       is_active BOOLEAN DEFAULT TRUE,
       tested_at DATETIME,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )
   `);

  // Create metrics table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL,
      pathname TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_cached BOOLEAN NOT NULL,
      performance_score REAL NOT NULL,
      first_contentful_paint REAL NOT NULL,
      largest_contentful_paint REAL NOT NULL,
      total_blocking_time REAL NOT NULL,
      cumulative_layout_shift REAL NOT NULL,
      speed_index REAL NOT NULL,
      interaction_to_next_paint REAL NOT NULL,
      browser_env TEXT,
      html_report_s3_key TEXT
    )
  `);

  // Create indexes for metrics table for query optimization
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_metrics_host_pathname_cached ON metrics(host, pathname, is_cached);
    CREATE INDEX IF NOT EXISTS idx_metrics_filters_timestamp ON metrics(host, pathname, is_cached, timestamp);
  `);

  return db;
}

export const initializeDatabase = withPerformanceLogging(
  _initializeDatabase,
  "initializeDatabase",
);

/**
 * createHost
 */
export async function createHost(host: string) {
  const db = await initializeDatabase();
  await db.run(`INSERT INTO hosts (host) VALUES (?)`, host);
}

/**
 * deleteHost
 */
export async function deleteHost(id: number) {
  const db = await initializeDatabase();
  await db.run(`DELETE FROM hosts WHERE id = ?`, id);
}

/**
 * updateHostIsActive
 */
export async function updateHostIsActive(id: number, isActive: boolean) {
  const db = await initializeDatabase();
  await db.run(`UPDATE hosts SET is_active = ? WHERE id = ?`, isActive, id);
}

/**
 * getAllHosts
 */
export async function getAllHosts(): Promise<THostRow[]> {
  log.debug("[getAllHosts] start");
  const db = await initializeDatabase();
  const rows = await db.all(
    `SELECT id, host, is_active FROM hosts ORDER BY host`,
  );
  return rows;
}

/**
 * createPathname
 */
export async function createPathname(pathname: string) {
  const db = await initializeDatabase();
  await db.run(`INSERT INTO pathnames (pathname) VALUES (?)`, pathname);
}

/**
 * deletePathname
 */
export async function deletePathname(id: number) {
  const db = await initializeDatabase();
  await db.run(`DELETE FROM pathnames WHERE id = ?`, id);
}

/**
 * updatePathnameIsActive
 */
export async function updatePathnameIsActive(id: number, isActive: boolean) {
  const db = await initializeDatabase();
  await db.run(`UPDATE pathnames SET is_active = ? WHERE id = ?`, isActive, id);
}

/**
 * updatePathnameTestedAt
 */
export async function updatePathnameTestedAt(
  id: number,
  testedAt: string | null = null,
) {
  const db = await initializeDatabase();
  const timestamp = testedAt ?? new Date().toISOString();
  await db.run(
    `UPDATE pathnames SET tested_at = ? WHERE id = ?`,
    timestamp,
    id,
  );
}

/**
 * getAllPathnames
 */
export async function getAllPathnames(): Promise<TPathnameRow[]> {
  log.debug("[getAllPathnames] start");
  const db = await initializeDatabase();
  const rows = await db.all(
    `SELECT id, is_active, pathname FROM pathnames ORDER BY pathname`,
  );
  return rows;
}

/**
 * getPathnamesToTest
 */
export async function getPathnamesToTest(): Promise<TPathnameRow[]> {
  log.debug("[getAllPathnames] start");
  const db = await initializeDatabase();
  const rows = await db.all(
    `SELECT id, pathname, is_active FROM pathnames where is_active = 1 ORDER BY tested_at, pathname`,
  );
  return rows;
}

/**
 * saveMetrics
 */
export async function createMetrics(metrics: TLighthouseMetrics) {
  log.debug("[createMetrics] start");
  const db = await initializeDatabase();
  await db.run(
    `
      INSERT INTO metrics (
        host, pathname, is_cached, performance_score, first_contentful_paint,
        largest_contentful_paint, total_blocking_time,
        cumulative_layout_shift, speed_index, interaction_to_next_paint, 
        browser_env, html_report_s3_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      metrics.host,
      metrics.pathname,
      metrics.isCached,
      metrics.performanceScore,
      metrics.firstContentfulPaintSec,
      metrics.largestContentfulPaintSec,
      metrics.totalBlockingTimeMs,
      metrics.cumulativeLayoutShift,
      metrics.speedIndexSec,
      metrics.interactionToNextPaintMs,
      metrics.browserEnv,
      metrics.htmlReportS3Key,
    ],
  );
}

/**
 * getLatestMetrics
 */
async function _getLatestMetrics(
  filters: TFilterParams = {},
): Promise<TMetricsRow[]> {
  const db = await initializeDatabase();
  const [whereClause, params] = _getWhereClause(filters);
  const metrics = await db.all(
    `
    SELECT
      host,
      pathname,
      is_cached,
      performance_score,
      first_contentful_paint,
      largest_contentful_paint,
      total_blocking_time,
      cumulative_layout_shift,
      speed_index,
      interaction_to_next_paint,
      browser_env,
      html_report_s3_key,
      timestamp
    FROM metrics
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT 2000
  `,
    params,
  );
  return metrics;
}

export const getLatestMetrics = withPerformanceLogging(
  _getLatestMetrics,
  "getLatestMetrics",
);

/**
 * getMovingAverages
 */
async function _getMovingAverages(
  filters: TFilterParams = {},
  windowHours = 4,
): Promise<TMetricsRow[]> {
  const db = await initializeDatabase();
  const [whereClause, params] = _getWhereClause(filters);

  const averages = await db.all(
    `
    WITH numbered_rows AS (
      SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY timestamp DESC) as row_num
      FROM metrics
      ${whereClause}
      LIMIT 2000
    )
    SELECT
      n1.host,
      n1.pathname,
      n1.is_cached,
      AVG(n2.performance_score) as performance_score,
      AVG(n2.first_contentful_paint) as first_contentful_paint,
      AVG(n2.largest_contentful_paint) as largest_contentful_paint,
      AVG(n2.total_blocking_time) as total_blocking_time,
      AVG(n2.cumulative_layout_shift) as cumulative_layout_shift,
      AVG(n2.speed_index) as speed_index,
      AVG(n2.interaction_to_next_paint) as interaction_to_next_paint,
      n2.browser_env,
      n1.timestamp
    FROM numbered_rows n1
    JOIN numbered_rows n2 ON n2.row_num BETWEEN 
      (n1.row_num - (SELECT COUNT(*) FROM numbered_rows) * ${windowHours} / 24 / 2) 
      AND 
      (n1.row_num + (SELECT COUNT(*) FROM numbered_rows) * ${windowHours} / 24 / 2)
    GROUP BY n1.timestamp
    ORDER BY n1.timestamp DESC
  `,
    params,
  );

  return averages;
}

export const getMovingAverages = withPerformanceLogging(
  _getMovingAverages,
  "getMovingAverages",
);

/**
 * getAggregatedStats
 */
async function _getAggregatedStats(
  filters: TFilterParams = {},
): Promise<TAggregatedStatsRow> {
  const db = await initializeDatabase();
  const [whereClause, params] = _getWhereClause(filters);

  const stats = await db.get(
    `
    SELECT
      host,
      pathname,
      is_cached,
      avg(performance_score) as mean_performance,
      avg(first_contentful_paint) as mean_fcp,
      avg(largest_contentful_paint) as mean_lcp,
      avg(total_blocking_time) as mean_tbt,
      avg(cumulative_layout_shift) as mean_cls,
      avg(speed_index) as mean_si,
      avg(interaction_to_next_paint) as mean_inp,
      SQRT(AVG(performance_score * performance_score) - AVG(performance_score) * AVG(performance_score)) as std_performance,
      SQRT(AVG(first_contentful_paint * first_contentful_paint) - AVG(first_contentful_paint) * AVG(first_contentful_paint)) as std_fcp,
      SQRT(AVG(largest_contentful_paint * largest_contentful_paint) - AVG(largest_contentful_paint) * AVG(largest_contentful_paint)) as std_lcp,
      SQRT(AVG(total_blocking_time * total_blocking_time) - AVG(total_blocking_time) * AVG(total_blocking_time)) as std_tbt,
      SQRT(AVG(cumulative_layout_shift * cumulative_layout_shift) - AVG(cumulative_layout_shift) * AVG(cumulative_layout_shift)) as std_cls,
      SQRT(AVG(speed_index * speed_index) - AVG(speed_index) * AVG(speed_index)) as std_si,
      SQRT(AVG(interaction_to_next_paint * interaction_to_next_paint) - AVG(interaction_to_next_paint) * AVG(interaction_to_next_paint)) as std_inp
    FROM metrics
    ${whereClause}
  `,
    params,
  );

  return stats;
}

export const getAggregatedStats = withPerformanceLogging(
  _getAggregatedStats,
  "getAggregatedStats",
);

/**
 * _getWhereClause
 */
function _getWhereClause({
  host,
  isCached = null,
  pathname,
  timespanHours = 24,
}: TFilterParams = {}) {
  let whereClause = `WHERE timestamp >= datetime('now', '-${timespanHours} hour')`;
  const params: string[] = [];

  if (isCached !== null) {
    whereClause += " AND is_cached = ?";
    params.push(isCached ? "1" : "0");
  }
  if (host) {
    whereClause += " AND host = ?";
    params.push(host);
  }
  if (pathname) {
    whereClause += " AND pathname = ?";
    params.push(pathname);
  }

  return [whereClause, params];
}

/**
 * getQaMetrics
 */
type TQaFilterParams = {
  host: string;
  pathname: string;
};

async function _getQaMetrics({
  host,
  pathname,
}: TQaFilterParams): Promise<TMetricsRow[]> {
  const db = await initializeDatabase();
  const metrics = await db.all(
    `
    SELECT
      host,
      pathname,
      is_cached,
      performance_score,
      first_contentful_paint,
      largest_contentful_paint,
      total_blocking_time,
      cumulative_layout_shift,
      speed_index,
      interaction_to_next_paint,
      browser_env,
      html_report_s3_key,
      timestamp
    FROM metrics
    WHERE host = ? AND pathname = ? AND is_cached = 1
    ORDER BY timestamp DESC
    LIMIT 20
  `,
    [host, pathname],
  );
  return metrics;
}

export const getQaMetrics = withPerformanceLogging(
  _getQaMetrics,
  "getQaMetrics",
);

/**
 * withPerformanceLogging
 */
function withPerformanceLogging<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  name: string,
) {
  return async (...args: TArgs) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    const delta = end - start;
    if (delta > 1000) {
      log.warn(`[${name}] done in ${(end - start).toFixed(0)} ms`);
    } else {
      log.info(`[${name}] done in ${(end - start).toFixed(0)} ms`);
    }
    return result;
  };
}
