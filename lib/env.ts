import path from "path";
import { fileURLToPath } from "url";

import * as log from "./log";

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

/**
 * Gets the database path from the environment variable or uses a default
 * If the path is relative, it's resolved from the project root
 */
export function getDatabasePath(): string {
  const dbPath = process.env.DB_PATH;
  log.debug("[getDatabasePath]", dbPath);

  if (!dbPath) {
    throw Error("DB_PATH environment variable is not set");
  }

  // If it's an absolute path, use it as is
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }

  // Otherwise resolve it relative to project root
  return path.resolve(rootDir, dbPath);
}
