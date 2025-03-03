import "dotenv/config";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { getDatabasePath } from "../lib/env";

async function migrate() {
  console.log(
    "Starting migration to add interaction_to_next_paint and browser_env columns to metrics table...",
  );

  const db = await open({
    filename: getDatabasePath(),
    driver: sqlite3.Database,
  });

  // Check if the columns exist first to prevent errors
  const tableInfo = await db.all("PRAGMA table_info(metrics)");
  const inpColumnExists = tableInfo.some((column) => column.name === "interaction_to_next_paint");
  const browserEnvColumnExists = tableInfo.some((column) => column.name === "browser_env");

  if (!inpColumnExists) {
    // Add interaction_to_next_paint column to metrics table with default value of 0
    await db.exec(`
      ALTER TABLE metrics ADD COLUMN interaction_to_next_paint REAL NOT NULL DEFAULT 0;
    `);
    console.log("Added interaction_to_next_paint column to metrics table");
  } else {
    console.log("Column interaction_to_next_paint already exists in metrics table");
  }

  if (!browserEnvColumnExists) {
    // Add browser_env column to metrics table (nullable)
    await db.exec(`
      ALTER TABLE metrics ADD COLUMN browser_env TEXT;
    `);
    console.log("Added browser_env column to metrics table");
  } else {
    console.log("Column browser_env already exists in metrics table");
  }

  console.log("Migration completed successfully!");
}

migrate().catch(console.error);
