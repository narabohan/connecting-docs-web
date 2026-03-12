// ═══════════════════════════════════════════════════════════════
//  Netlify Background Function: run-analysis-background
//  The "-background" suffix tells Netlify to run this as a
//  background function (returns 202 immediately, runs up to 15 min).
//
//  Processes the AI analysis asynchronously by calling the existing
//  Edge Function endpoint, then saves results to Airtable and
//  sends notifications via the messenger contact.
// ═══════════════════════════════════════════════════════════════

import type { Handler } from "@netlify/functions";

interface BackgroundPayload {
  surveyData: Record<string, unknown>;
  messengerContact: { type: string; contact_id: string; name: string } | null;
  demographics: Record<string, unknown>;
  lang: string;
  safety_flags: string[];
  open_question_raw: string;
  chip_responses: Record<string, string>;
  siteUrl: string;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body: BackgroundPayload;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    console.error('[bg-analysis] Failed to parse request body');
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { surveyData, messengerContact, siteUrl } = body;
  const baseUrl = siteUrl || 'https://connectingdocs.ai';

  console.log('[bg-analysis] Starting background analysis...');
  console.log('[bg-analysis] Messenger contact:', messengerContact?.type, messengerContact?.contact_id ? '***' : 'none');

  // ─── 1. Call the existing Edge Function endpoint ───────────
  let result: {
    recommendation_json: Record<string, unknown>;
    model: string;
    usage: { input_tokens: number; output_tokens: number };
  } | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600_000); // 10 min timeout

    const analysisRes = await fetch(`${baseUrl}/api/survey-v2/final-recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(surveyData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!analysisRes.ok) {
      const errText = await analysisRes.text().catch(() => 'unknown');
      console.error('[bg-analysis] Edge Function error:', analysisRes.status, errText);
      return { statusCode: 500, body: 'Edge Function error' };
    }

    // ─── 2. Parse SSE stream ──────────────────────────────────
    const reader = analysisRes.body?.getReader();
    if (!reader) {
      console.error('[bg-analysis] No response body from Edge Function');
      return { statusCode: 500, body: 'No response body' };
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Process remaining buffer
        if (buffer.trim()) {
          const remaining = buffer.trim();
          if (remaining.startsWith('data: ')) {
            try {
              const evt = JSON.parse(remaining.slice(6));
              if (evt.type === 'done') {
                result = {
                  recommendation_json: evt.recommendation_json,
                  model: evt.model,
                  usage: evt.usage,
                };
              }
            } catch { /* skip unparseable */ }
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'done') {
            result = {
              recommendation_json: evt.recommendation_json,
              model: evt.model,
              usage: evt.usage,
            };
          } else if (evt.type === 'error') {
            console.error('[bg-analysis] Stream error:', evt.error);
            return { statusCode: 500, body: 'Stream error' };
          } else if (evt.type === 'progress') {
            if (evt.chars % 5000 < 500) {
              console.log(`[bg-analysis] Progress: ${evt.chars} chars generated`);
            }
          }
        } catch { /* skip */ }
      }
    }

    if (!result) {
      console.error('[bg-analysis] No final result received from analysis stream');
      return { statusCode: 500, body: 'No result' };
    }

    console.log('[bg-analysis] Analysis complete. Model:', result.model, 'Tokens:', result.usage);

  } catch (err) {
    console.error('[bg-analysis] Analysis fetch error:', err);
    return { statusCode: 500, body: 'Analysis error' };
  }

  // ─── 3. Save to Airtable via the existing save-result endpoint ───
  const reportId = `v2_bg_${Date.now()}`;

  try {
    const saveRes = await fetch(`${baseUrl}/api/survey-v2/save-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_id: reportId,
        demographics: body.demographics,
        lang: body.lang || 'KO',
        safety_flags: body.safety_flags || [],
        open_question_raw: body.open_question_raw || '',
        chip_responses: body.chip_responses || {},
        recommendation: result.recommendation_json,
        model: result.model,
        usage: result.usage,
        messenger_contact: messengerContact,
      }),
    });

    if (saveRes.ok) {
      const saveData = await saveRes.json();
      console.log(`[bg-analysis] Saved to Airtable: record=${saveData.airtable_record_id}`);
    } else {
      console.error('[bg-analysis] Save to Airtable failed:', saveRes.status);
    }
  } catch (err) {
    console.error('[bg-analysis] Save fetch error:', err);
  }

  // ─── 4. Send notification ──────────────────────────────────
  try {
    const rec = result.recommendation_json as Record<string, unknown>;
    const ebdRecs = rec.ebd_recommendations as Array<{ device_name?: string }> | undefined;
    const injRecs = rec.injectable_recommendations as Array<{ name?: string }> | undefined;
    const topDevice = ebdRecs?.[0]?.device_name || '';
    const topInjectable = injRecs?.[0]?.name || '';

    await fetch(`${baseUrl}/api/survey-v2/notify-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id: reportId,
        patient_country: (body.demographics as Record<string, string>)?.detected_country || 'KR',
        patient_age: (body.demographics as Record<string, string>)?.d_age || '',
        patient_gender: (body.demographics as Record<string, string>)?.d_gender || '',
        lang: body.lang || 'KO',
        primary_goal: (surveyData as Record<string, unknown>).q1_primary_goal || '',
        top_device: topDevice,
        top_injectable: topInjectable,
        model: result.model,
        cost_usd: 0,
        messenger_contact: messengerContact,
      }),
    });

    console.log('[bg-analysis] Notification sent');
  } catch (err) {
    console.error('[bg-analysis] Notification error:', err);
  }

  console.log('[bg-analysis] Background analysis complete:', reportId);

  return { statusCode: 200, body: JSON.stringify({ reportId }) };
};

export { handler };
