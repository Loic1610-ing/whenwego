// src/lib/validate.ts
// Shared input validation used by every API route.
// Never trust client-supplied data.

export class ValidationError extends Error {
  constructor(message: string) { super(message); this.name = "ValidationError"; }
}

/** Strip control characters, limit length */
export function sanitizeText(val: unknown, maxLen = 200): string {
  if (typeof val !== "string") throw new ValidationError("Valeur texte attendue.");
  const s = val.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (s.length === 0) throw new ValidationError("Le champ ne peut pas être vide.");
  if (s.length > maxLen) throw new ValidationError(`Trop long (max ${maxLen} caractères).`);
  return s;
}

/** Validate a YYYY-MM-DD string */
export function sanitizeDate(val: unknown): string {
  if (typeof val !== "string") throw new ValidationError("Date attendue.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) throw new ValidationError("Format de date invalide.");
  const d = new Date(val + "T00:00:00");
  if (isNaN(d.getTime())) throw new ValidationError("Date invalide.");
  return val;
}

/** Validate a positive integer within a range */
export function sanitizeInt(val: unknown, min: number, max: number, label = "Valeur"): number {
  const n = Number(val);
  if (!Number.isInteger(n)) throw new ValidationError(`${label} doit être un entier.`);
  if (n < min || n > max) throw new ValidationError(`${label} doit être entre ${min} et ${max}.`);
  return n;
}

/** Validate budget value */
const VALID_BUDGETS = new Set(["low", "mid", "high", "luxury"]);
export function sanitizeBudget(val: unknown): string {
  if (!VALID_BUDGETS.has(val as string)) throw new ValidationError("Budget invalide.");
  return val as string;
}

/** Validate date ranges array from client */
export function sanitizeRanges(val: unknown): { start: string; end: string }[] {
  if (!Array.isArray(val)) return [];
  if (val.length > 50) throw new ValidationError("Trop de plages de dates.");
  return val.map((r: any) => ({
    start: sanitizeDate(r?.start),
    end:   sanitizeDate(r?.end),
  })).filter(r => r.start <= r.end);
}

/** Validate destinations array */
export function sanitizeDestinations(val: unknown): { country: string; flag: string; cities: string[] }[] {
  if (!Array.isArray(val)) return [];
  if (val.length > 20) throw new ValidationError("Trop de destinations.");
  return val.map((d: any) => ({
    country: sanitizeText(d?.country, 80),
    flag:    sanitizeText(d?.flag,    10),
    cities:  Array.isArray(d?.cities)
      ? d.cities.slice(0, 10).map((c: unknown) => sanitizeText(c, 80))
      : [],
  }));
}
