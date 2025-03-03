/**
 *
 */
export function debug(...params: any[]) {
  if (["debug"].includes(process.env.LOG_LEVEL)) {
    _logWithTimestamp("debug", ...params);
  }
}

/**
 *
 */
export function info(...params: any[]) {
  if (["debug", "info"].includes(process.env.LOG_LEVEL)) {
    _logWithTimestamp("info", ...params);
  }
}

/**
 *
 */
export function warn(...params: any[]) {
  if (["debug", "info", "warn"].includes(process.env.LOG_LEVEL)) {
    _logWithTimestamp("warn", ...params);
  }
}

/**
 *
 */
export function error(...params: any[]) {
  _logWithTimestamp("error", ...params);
}

/**
 *
 */
function _logWithTimestamp(logLevel: string, ...params: any[]) {
  console.log(`[${logLevel}]`, new Date().toLocaleString(), ...params);
}
