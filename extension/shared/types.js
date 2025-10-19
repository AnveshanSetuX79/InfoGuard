/**
 * @typedef {"verified" | "misleading" | "false" | "needs_review"} VerdictLabel
 */

/**
 * @typedef {Object} ClaimSource
 * @property {string} title - Display title for the source link.
 * @property {string} url - Public URL pointing to the supporting evidence.
 */

/**
 * @typedef {Object} ClaimVerdict
 * @property {VerdictLabel} label - Classification of the claim.
 * @property {string} summary - Short sentence describing the verdict.
 * @property {number} confidence - Confidence value between 0 and 1.
 * @property {string} explanation - Human-readable explanation referencing evidence.
 * @property {ClaimSource[]} sources - List of supporting sources.
 * @property {string} replyTemplate - Pre-composed polite reply users can share.
 * @property {string} [demoId] - Optional backend demo identifier used for translations.
 * @property {string} [claimText] - Optional raw claim text used when requesting translations.
 */

export {};
