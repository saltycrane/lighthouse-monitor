import "dotenv/config";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { getDatabasePath } from "../lib/env";

async function migrate() {
  console.log(
    "Starting migration to add html_report_s3_key column to metrics table...",
  );

  const db = await open({
    filename: getDatabasePath(),
    driver: sqlite3.Database,
  });

  // Check if the column exists first to prevent errors
  const tableInfo = await db.all("PRAGMA table_info(metrics)");
  const columnExists = tableInfo.some((column) => column.name === "html_report_s3_key");

  if (!columnExists) {
    // Add html_report_s3_key column to metrics table (nullable)
    await db.exec(`
      ALTER TABLE metrics ADD COLUMN html_report_s3_key TEXT;
    `);
    console.log("Added html_report_s3_key column to metrics table");
  } else {
    console.log("Column html_report_s3_key already exists in metrics table");
  }

  console.log("Migration completed successfully!");
}

migrate().catch(console.error);
