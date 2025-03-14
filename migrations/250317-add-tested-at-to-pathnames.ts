import "dotenv/config";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { getDatabasePath } from "../lib/env";

async function migrate() {
  console.log(
    "Starting migration to add tested_at column to pathnames table...",
  );

  const db = await open({
    filename: getDatabasePath(),
    driver: sqlite3.Database,
  });

  // Check if the column exists first to prevent errors
  const tableInfo = await db.all("PRAGMA table_info(pathnames)");
  const columnExists = tableInfo.some((column) => column.name === "tested_at");

  if (!columnExists) {
    // Add new column to pathnames table as nullable DATETIME
    await db.exec(`
      ALTER TABLE pathnames ADD COLUMN tested_at DATETIME;
    `);
    console.log("Added tested_at column to pathnames table");
  } else {
    console.log("Column tested_at already exists in pathnames table");
  }

  console.log("Migration completed successfully!");
}

migrate().catch(console.error);
