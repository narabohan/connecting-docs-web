// ═══════════════════════════════════════════════════════════════
//  Netlify Background Function: run-analysis-background
//  Processes the AI analysis asynchronously (up to 15 min timeout)
//  by calling the existing Edge Function endpoint, then saves
//  results to Airtable via the save-result API.
//
//  Background functions automatically return 202 to the client
//  and run in the background until completion.
// ═══════════════════════════════════════════════════════════════

import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return; // Background functions don't return responses, but exit early
  }

  let body: {
    surveyData: Record<string, unknown>;
    messengerContact: { type: string; contact_id: string; name: string } | null;
    demographics: Record<string, unknown>;
    lang: string;
    safety_flags: string[];
    open_question_raw: string;
    chip_responses: Record<string, string>;
    siteUrl: string;
  };

  try {
    body = await req.json();
  } catch {
    console.error('[bg-analysis] Failed to parse request body');
    return;
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
      return;
    }

    // ─── 2. Parse SSE stream ──────────────────────────────────
    const reader = analysisRes.body?.getReader();
    if (!reader) {
      console.error('[bg-analysis] No response body from Edge Function');
      return;
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
              const event = JSON.parse(remaining.slice(6));
              if (event.type === 'done') {
                result = {
                  recommendation_json: event.recommendation_json,
                  model: event.model,
                  usage: event.usage,
                };
              }
            } catch {}
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
          const event = JSON.parse(line.slice(6));
          if (event.type === 'done') {
            result = {
              recommendation_json: event.recommendation_json,
              model: event.model,
              usage: event.usage,
            };
          } else if (event.type === 'error') {
            console.error('[bg-analysis] Stream error:', event.error);
            return;
          } else if (event.type === 'progress') {
            // Log progress periodically
            if (event.chars % 5000 < 500) {
              console.log(`[bg-analysis] Progress: ${event.chars} chars generated`);
            }
          }
        } catch {}
      }
    }

    if (!result) {
      console.error('[bg-analysis] No final result received from analysis stream');
      return;
    }

    console.log('[bg-analysis] Analysis complete. Model:', result.model, 'Tokens:', result.usage);

  } catch (err) {
    console.error('[bg-analysis] Analysis fetch error:', err);
    return;
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
      console.log(`[bg-analysis] ✅ Saved to Airtable: record=${saveData.airtable_record_id}`);
    } else {
      console.error('[bg-analysis] Save to Airtable failed:', saveRes.status);
    }
  } catch (err) {
    console.error('[bg-analysis] Save fetch error:', err);
  }

  // ─── 4. Send notification emails ──────────────────────────
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
        patient_country: body.demographics?.detected_country || 'KR',
        patient_age: body.demographics?.d_age || '',
        patient_gender: body.demographics?.d_gender || '',
        lang: body.lang || 'KO',
        primary_goal: (surveyData as Record<string, unknown>).q1_primary_goal || '',
        top_device: topDevice,
        top_injectable: topInjectable,
        model: result.model,
        cost_usd: 0,
        messenger_contact: messengerContact,
      }),
    });

    console.log('[bg-analysis] ✅ Notification sent');
  } catch (err) {
    console.error('[bg-analysis] Notification error:', err);
  }

  console.log('[bg-analysis] ✅ Background analysis complete:', reportId);
};

export const config: Config = {
  path: "/.netlify/functions/run-analysis-background",
  method: "POST",
};
