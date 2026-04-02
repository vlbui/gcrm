/** Normalize phone: remove spaces, dashes, dots. Keep leading 0 or +84 */
export function sanitizePhone(raw: string): string {
  return raw.replace(/[\s\-\.\(\)]/g, "").trim();
}

/** Normalize email: trim + lowercase */
export function sanitizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
