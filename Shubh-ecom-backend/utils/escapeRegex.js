/**
 * Escapes special regex characters to prevent ReDoS attacks.
 * Security: Prevents regex injection and catastrophic backtracking.
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
