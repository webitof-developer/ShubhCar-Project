/**
 * Escapes special regex characters to prevent ReDoS attacks.
 * Security: Prevents regex injection and catastrophic backtracking.
 */
function escapeRegex(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
