// ═══════════════════════════════════════════════════════════════
//  User Email Lookup — Phase 2 (G-4)
//  firebase_uid → email 조회 (Airtable Users 테이블)
//
//  Best-effort: never throws, returns null on failure.
//  Used by email trigger points to resolve recipient emails.
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? '';
const USERS_TABLE = 'Users';

// ─── Airtable Record Shape ──────────────────────────────────

interface AirtableUserRecord {
  id: string;
  fields: {
    email?: string;
    name?: string;
    firebase_uid?: string;
  };
}

interface AirtableListResponse {
  records: AirtableUserRecord[];
}

// ─── Helpers ────────────────────────────────────────────────

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function sanitize(value: string): string {
  return value.replace(/'/g, "\\'");
}

function getUsersUrl(): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USERS_TABLE)}`;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Look up a user's email by firebase_uid from Airtable Users table.
 * Returns null if not found or on any error (best-effort, never throws).
 */
export async function lookupEmailByUid(firebaseUid: string): Promise<string | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !firebaseUid) {
    return null;
  }

  try {
    const formula = `{firebase_uid} = '${sanitize(firebaseUid)}'`;
    const url = `${getUsersUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields%5B%5D=email&fields%5B%5D=name`;

    const res = await fetch(url, { headers: airtableHeaders() });
    if (!res.ok) {
      console.warn(`[user-email-lookup] Airtable query failed: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as AirtableListResponse;
    if (data.records.length === 0) {
      return null;
    }

    return data.records[0].fields.email ?? null;
  } catch (err) {
    console.warn(
      '[user-email-lookup] Error:',
      err instanceof Error ? err.message : 'unknown',
    );
    return null;
  }
}

/**
 * Look up a user's display name by firebase_uid.
 * Returns empty string if not found (best-effort, never throws).
 */
export async function lookupNameByUid(firebaseUid: string): Promise<string> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !firebaseUid) {
    return '';
  }

  try {
    const formula = `{firebase_uid} = '${sanitize(firebaseUid)}'`;
    const url = `${getUsersUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields%5B%5D=name`;

    const res = await fetch(url, { headers: airtableHeaders() });
    if (!res.ok) return '';

    const data = (await res.json()) as AirtableListResponse;
    if (data.records.length === 0) return '';

    return data.records[0].fields.name ?? '';
  } catch {
    return '';
  }
}

/**
 * Look up both email and name by firebase_uid in a single query.
 * Returns null if not found (best-effort, never throws).
 */
export async function lookupUserByUid(
  firebaseUid: string,
): Promise<{ email: string; name: string } | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !firebaseUid) {
    return null;
  }

  try {
    const formula = `{firebase_uid} = '${sanitize(firebaseUid)}'`;
    const url = `${getUsersUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&fields%5B%5D=email&fields%5B%5D=name`;

    const res = await fetch(url, { headers: airtableHeaders() });
    if (!res.ok) return null;

    const data = (await res.json()) as AirtableListResponse;
    if (data.records.length === 0) return null;

    const fields = data.records[0].fields;
    if (!fields.email) return null;

    return {
      email: fields.email,
      name: fields.name ?? '',
    };
  } catch {
    return null;
  }
}
