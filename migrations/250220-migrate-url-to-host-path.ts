import "dotenv/config";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

async function migrate() {
  console.log("Starting migration...");

  const db = await open({
    filename: "./lighthouse.db",
    driver: sqlite3.Database,
  });

  // Add new columns
  await db.exec(`
    ALTER TABLE metrics ADD COLUMN host TEXT;
    ALTER TABLE metrics ADD COLUMN pathname TEXT;
  `);

  // Update the new columns from existing URL data
  const rows = await db.all("SELECT id, url FROM metrics");

  for (const row of rows) {
    try {
      const url = new URL(row.url);
      await db.run("UPDATE metrics SET host = ?, pathname = ? WHERE id = ?", [
        url.host,
        url.pathname,
        row.id,
      ]);
    } catch (error) {
      console.error(`Failed to parse URL for id ${row.id}:`, error);
    }
  }

  // Create new table with updated schema
  await db.exec(`
    CREATE TABLE metrics_new (
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
      speed_index REAL NOT NULL
    );

    INSERT INTO metrics_new (
      host,
      pathname,
      timestamp,
      is_cached,
      performance_score,
      first_contentful_paint,
      largest_contentful_paint,
      total_blocking_time,
      cumulative_layout_shift,
      speed_index
    )
    SELECT
      host,
      pathname,
      timestamp,
      is_cached,
      performance_score,
      first_contentful_paint,
      largest_contentful_paint,
      total_blocking_time,
      cumulative_layout_shift,
      speed_index
    FROM metrics;

    DROP TABLE metrics;
    ALTER TABLE metrics_new RENAME TO metrics;
  `);

  console.log("Migration completed successfully!");
}

migrate().catch(console.error);
