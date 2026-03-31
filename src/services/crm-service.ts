// ═══════════════════════════════════════════════════════════════
//  CRM Service Layer — Phase 1 (C-1)
//  Users 테이블 CRM 연동: findOrCreateUser, updateStage
//  참조: MASTER_PLAN_V4.md §6.1 (CRM 여정 DB), §6.2 (CRM 사이클 자동화)
//
//  설계 원칙:
//  - best-effort: CRM 실패가 핵심 기능(설문 저장, 리포트 열람)을 차단하지 않음
//  - 역행 방지: stage는 항상 전진만 허용 (survey_started → ... → treatment_done)
//  - Airtable REST API 직접 사용 (save-result.ts 패턴과 일관성 유지)
// ═══════════════════════════════════════════════════════════════

import type {
  CRMUser,
  UserStage,
  FindOrCreateUserParams,
} from '@/types/crm';
import { STAGE_ORDER } from '@/types/crm';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USERS_TABLE = 'Users';
const AIRTABLE_USERS_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USERS_TABLE)}`;

// ─── Helpers ─────────────────────────────────────────────────

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Validate Airtable env vars are present */
function ensureConfig(): void {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('[crm-service] Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  }
}

/**
 * Sanitize email for Airtable filterByFormula
 * Prevent formula injection by escaping single quotes
 */
function sanitizeForFormula(value: string): string {
  return value.replace(/'/g, "\\'");
}

// ─── Airtable Record → CRMUser Mapping ──────────────────────

interface AirtableUserFields {
  firebase_uid?: string;
  email?: string;
  stage?: string;
  first_survey_at?: string;
  last_activity_at?: string;
  country?: string;
  Language?: string;
  // legacy fields that may exist
  name?: string;
  role?: string;
}

interface AirtableRecord {
  id: string;
  fields: AirtableUserFields;
}

function isValidStage(value: string): value is UserStage {
  return value in STAGE_ORDER;
}

function mapRecordToCRMUser(record: AirtableRecord): CRMUser {
  const f = record.fields;
  const stage = f.stage && isValidStage(f.stage) ? f.stage : 'survey_started';
  const lang = f.Language as CRMUser['lang'] ?? 'EN';

  return {
    airtable_id: record.id,
    firebase_uid: f.firebase_uid ?? null,
    email: f.email ?? null,
    stage,
    first_survey_at: f.first_survey_at ?? new Date().toISOString(),
    last_activity_at: f.last_activity_at ?? new Date().toISOString(),
    country: f.country ?? '',
    lang,
  };
}

// ─── Core Functions ──────────────────────────────────────────

/**
 * Find existing user by email or firebase_uid, or create a new record.
 *
 * Search priority:
 * 1. firebase_uid (exact match)
 * 2. email (exact match, case-insensitive via LOWER())
 * 3. No match → create new record with stage='survey_started'
 */
export async function findOrCreateUser(
  params: FindOrCreateUserParams
): Promise<CRMUser> {
  ensureConfig();

  const { email, firebase_uid, country, lang } = params;

  // ── 1. Search by firebase_uid
  if (firebase_uid) {
    const formula = `{firebase_uid} = '${sanitizeForFormula(firebase_uid)}'`;
    const searchUrl = `${AIRTABLE_USERS_URL}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

    const searchRes = await fetch(searchUrl, { headers: airtableHeaders() });
    if (searchRes.ok) {
      const data = await searchRes.json() as { records: AirtableRecord[] };
      if (data.records.length > 0) {
        return mapRecordToCRMUser(data.records[0]);
      }
    }
  }

  // ── 2. Search by email
  if (email) {
    const formula = `LOWER({email}) = LOWER('${sanitizeForFormula(email)}')`;
    const searchUrl = `${AIRTABLE_USERS_URL}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

    const searchRes = await fetch(searchUrl, { headers: airtableHeaders() });
    if (searchRes.ok) {
      const data = await searchRes.json() as { records: AirtableRecord[] };
      if (data.records.length > 0) {
        const existing = data.records[0];

        // If we have a firebase_uid and the existing record doesn't, link them
        if (firebase_uid && !existing.fields.firebase_uid) {
          try {
            await fetch(`${AIRTABLE_USERS_URL}/${existing.id}`, {
              method: 'PATCH',
              headers: airtableHeaders(),
              body: JSON.stringify({
                fields: { firebase_uid },
              }),
            });
          } catch {
            // best-effort linking — don't block on failure
            console.warn('[crm-service] Failed to link firebase_uid to existing user');
          }
        }

        return mapRecordToCRMUser(existing);
      }
    }
  }

  // ── 3. Create new user record
  const now = new Date().toISOString();
  const createFields: Record<string, string> = {
    stage: 'survey_started',
    first_survey_at: now,
    last_activity_at: now,
    country,
    Language: lang,
    role: 'patient',
  };

  if (firebase_uid) createFields.firebase_uid = firebase_uid;
  if (email) {
    createFields.email = email;
    createFields.name = email.split('@')[0];  // basic display name
  } else {
    createFields.name = `Guest_${Date.now().toString(36)}`;
  }

  const createRes = await fetch(AIRTABLE_USERS_URL, {
    method: 'POST',
    headers: airtableHeaders(),
    body: JSON.stringify({ fields: createFields }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`[crm-service] Failed to create user: ${createRes.status} ${errText}`);
  }

  const created = await createRes.json() as AirtableRecord;
  return mapRecordToCRMUser(created);
}

/**
 * Update user stage with regression prevention.
 *
 * Rules:
 * - Only forward transitions allowed (e.g., survey_completed → report_viewed ✓)
 * - Backward transitions silently ignored (e.g., report_viewed → survey_completed ✗)
 * - Always updates last_activity_at regardless
 */
export async function updateStage(
  userId: string,
  newStage: UserStage
): Promise<void> {
  ensureConfig();

  // ── Fetch current record to check stage
  const getRes = await fetch(`${AIRTABLE_USERS_URL}/${userId}`, {
    headers: airtableHeaders(),
  });

  if (!getRes.ok) {
    throw new Error(`[crm-service] Failed to fetch user ${userId}: ${getRes.status}`);
  }

  const record = await getRes.json() as AirtableRecord;
  const currentStage = record.fields.stage;
  const currentOrder = currentStage && isValidStage(currentStage)
    ? STAGE_ORDER[currentStage]
    : -1;
  const newOrder = STAGE_ORDER[newStage];

  // ── Build update payload
  const updateFields: Record<string, string> = {
    last_activity_at: new Date().toISOString(),
  };

  // Only advance stage, never regress
  if (newOrder > currentOrder) {
    updateFields.stage = newStage;
  }

  // ── PATCH Airtable
  const patchRes = await fetch(`${AIRTABLE_USERS_URL}/${userId}`, {
    method: 'PATCH',
    headers: airtableHeaders(),
    body: JSON.stringify({ fields: updateFields }),
  });

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    throw new Error(`[crm-service] Failed to update stage for ${userId}: ${patchRes.status} ${errText}`);
  }
}

/**
 * Get stage order map (utility for external callers)
 */
export function getStageOrder(): Map<UserStage, number> {
  return new Map(Object.entries(STAGE_ORDER) as [UserStage, number][]);
}
