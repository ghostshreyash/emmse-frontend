/**
 * Shared vocabularies, copied from occ-frontend's `src/data/master-data.ts`.
 * Only what EMMS-E uses so far lives here; add entries from that file (keeping
 * the wording identical) as screens need them.
 */

/* ---------- Contact ---------- */

/** Dialling codes for the countries the platform operates in */
export const dialCodes = [
  { code: "+91", country: "India" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+44", country: "United Kingdom" },
  { code: "+49", country: "Germany" },
  { code: "+31", country: "Netherlands" },
  { code: "+1", country: "United States" },
  { code: "+55", country: "Brazil" },
  { code: "+27", country: "South Africa" },
  { code: "+61", country: "Australia" },
] as const
