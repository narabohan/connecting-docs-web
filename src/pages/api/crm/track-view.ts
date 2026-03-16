// ═══════════════════════════════════════════════════════════════
//  POST /api/crm/track-view
//  Best-effort CRM stage update when user views their report
//  Called from report-v2/[id].tsx on successful report load
//
//  Phase 1 (C-1): Updates stage → 'report_viewed'
//  Non-blocking: always returns 200 even if CRM update fails
// ═══════════════════════════════════════════════════════════════

import type { NextApiRequest, NextApiResponse } from 'next';
import type { SurveyLang } from '@/types/survey-v2';
import { findOrCreateUser, updateStage } from '@/services/crm-service';

interface TrackViewRequest {
  run_id: string;
  country: string;
  lang: SurveyLang;
  user_email?: string;
  firebase_uid?: string;
}

interface TrackViewResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrackViewResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body as TrackViewRequest;

  if (!body.run_id || !body.country || !body.lang) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: run_id, country, lang',
    });
  }

  try {
    const crmUser = await findOrCreateUser({
      email: body.user_email,
      firebase_uid: body.firebase_uid,
      country: body.country,
      lang: body.lang,
    });

    await updateStage(crmUser.airtable_id, 'report_viewed');

    console.log(`[track-view] CRM updated: user=${crmUser.airtable_id} stage=report_viewed run_id=${body.run_id}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    // Best-effort: log error but return 200 to not disrupt UX
    console.error('[track-view] CRM update failed (non-blocking):', err);
    return res.status(200).json({ success: true });
  }
}
