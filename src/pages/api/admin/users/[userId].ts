// ═══════════════════════════════════════════════════════════════
//  PATCH /api/admin/users/[userId]
//  Phase 2 (G-5): 사용자 역할 변경 (admin 전용)
//
//  Body: { role: 'patient' | 'doctor' | 'admin' }
//  Auth: admin only
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { NextApiResponse } from 'next';
import { z } from 'zod';
import { apiRoleGuard, type AuthenticatedRequest } from '@/lib/apiRoleGuard';

// ─── Airtable Config ─────────────────────────────────────────

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? '';
const USERS_TABLE = 'Users';

function usersUrl(): string {
  return `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(USERS_TABLE)}`;
}

function airtableHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── Validation ─────────────────────────────────────────────

const RoleUpdateSchema = z.object({
  role: z.enum(['patient', 'doctor', 'admin']),
});

// ─── Types ───────────────────────────────────────────────────

interface UpdateSuccessResponse {
  ok: true;
  userId: string;
  role: string;
}

interface UpdateErrorResponse {
  ok: false;
  error: string;
}

// ─── Handler ────────────────────────────────────────────────

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<UpdateSuccessResponse | UpdateErrorResponse>,
): Promise<void> {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const { userId } = req.query;
  if (typeof userId !== 'string' || !userId) {
    res.status(400).json({ ok: false, error: 'Missing userId parameter' });
    return;
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    res.status(500).json({ ok: false, error: 'Airtable not configured' });
    return;
  }

  // Validate body
  const parseResult = RoleUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`,
    );
    res.status(400).json({ ok: false, error: `Validation failed: ${issues.join('; ')}` });
    return;
  }

  const { role } = parseResult.data;

  try {
    // Update role in Airtable
    const patchRes = await fetch(`${usersUrl()}/${userId}`, {
      method: 'PATCH',
      headers: airtableHeaders(),
      body: JSON.stringify({
        fields: { role },
      }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => 'unknown');
      console.error(`[admin/users/${userId}] Airtable PATCH failed:`, patchRes.status, errText);
      res.status(502).json({ ok: false, error: `Failed to update user role: ${patchRes.status}` });
      return;
    }

    res.status(200).json({
      ok: true,
      userId,
      role,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[admin/users/${userId}] Error:`, msg);
    res.status(500).json({ ok: false, error: msg });
  }
}

export default apiRoleGuard(handler, ['admin']);
