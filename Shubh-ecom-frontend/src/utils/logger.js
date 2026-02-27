// src/utils/logger.js
/**
 * Structured frontend logger.
 *
 * behaviour:
 *  - development  → full console output with [PREFIX] tags
 *  - production   → console.log / .warn / .debug are suppressed
 *                   console.error is kept (critical failures only)
 *
 * Usage (optional explicit import):
 *   import { logger } from '@/utils/logger';
 *   logger.log('[AUTH]', 'user loaded');
 *   logger.error('[CART]', 'failed to fetch', err);
 *
 * The GlobalLoggerInit component (imported in root layout) automatically
 * installs this behaviour onto window.console so existing console.* calls
 * in every file are silenced in production without any per-file changes.
 */

const isDev = process.env.NODE_ENV !== 'production';

const noop = () => {};

export const logger = {
  /** Verbose debug — dev only */
  log: isDev ? (...args) => console.log(...args) : noop,

  /** Informational — dev only */
  info: isDev ? (...args) => console.info(...args) : noop,

  /** Warnings — dev only */
  warn: isDev ? (...args) => console.warn(...args) : noop,

  /**
   * Errors — always shown.
   * In production, swap this body to send errors to your tracker
   * e.g. Sentry.captureException(args[0])
   */
  error: (...args) => console.error(...args),

  /** Explicit group helpers (dev only) */
  group: isDev ? (...args) => console.group(...args) : noop,
  groupEnd: isDev ? () => console.groupEnd() : noop,
};

/**
 * Install logger behaviour onto the global window.console.
 * Call this ONCE in the root client component (GlobalLoggerInit).
 * After this, ALL existing console.log / .warn calls in the app
 * are automatically silenced in production — no per-file changes needed.
 */
export function installGlobalConsole() {
  if (typeof window === 'undefined') return; // SSR guard
  if (isDev) return; // nothing to do in development

  // Keep a reference to the real error so we can still log errors
  const realError = window.console.error.bind(window.console);

  window.console.log   = noop;
  window.console.info  = noop;
  window.console.warn  = noop;
  window.console.debug = noop;
  window.console.group = noop;
  window.console.groupEnd = noop;
  window.console.groupCollapsed = noop;

  // Keep error — add error tracker here in future (e.g. Sentry)
  window.console.error = (...args) => {
    // Filter out React's own noisy internal errors in prod if needed:
    // const msg = String(args[0] ?? '');
    // if (msg.includes('Warning:')) return;
    realError(...args);
  };
}
