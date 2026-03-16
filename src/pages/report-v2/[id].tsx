// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Report v2 Page — React Component Rendering
//
//  Phase 0: Replaced iframe + postMessage architecture with
//  direct React component rendering via ReportV7.
//
//  Data flow: sessionStorage → useReportData hook → ReportV7
//  (Phase 1: Airtable fallback will be added in useReportData)
//
//  Preserved: CTA bottom bar, consultation request, i18n
//  Removed: iframe, iframeRef, iframeStatus, postMessage,
//           opacity transitions, LANG_MAP, buildSafetyFlagsObject
//
//  report-v7-premium.html is NOT deleted (archived for Phase 0 reference).
// ═══════════════════════════════════════════════════════════════

import { useRouter } from 'next/router';
import { useState, useCallback } from 'react';
import Head from 'next/head';
import type { SurveyLang } from '@/types/survey-v2';
import { useReportData, type StoredReportPayload } from '@/hooks/useReportData';
import { ReportV7 } from '@/components/report-v7/ReportV7';
import { SkeletonReport } from '@/components/report-v7/SkeletonReport';

// ─── Consultation CTA i18n ─────────────────────────────────────
const CTA_TEXT: Record<string, { title: string; desc: string; btn: string; sent: string }> = {
  KO: {
    title: '맞춤 시술 상담을 원하시나요?',
    desc: 'AI 분석 결과를 바탕으로 전문 의사에게 1:1 상담을 신청하세요.',
    btn: '상담 신청하기',
    sent: '상담이 신청되었습니다! 의사가 확인 후 연락드립니다.',
  },
  EN: {
    title: 'Want a personalized consultation?',
    desc: 'Request a 1:1 consultation with a specialist based on your AI analysis.',
    btn: 'Request Consultation',
    sent: 'Consultation requested! A doctor will contact you soon.',
  },
  JP: {
    title: 'カスタマイズされた相談をご希望ですか？',
    desc: 'AI分析結果を基に専門医に1:1相談を申し込みましょう。',
    btn: '相談を申し込む',
    sent: '相談が申請されました！医師が確認後ご連絡します。',
  },
  'ZH-CN': {
    title: '想要个性化的咨询吗？',
    desc: '根据AI分析结果，向专业医生申请1对1咨询。',
    btn: '申请咨询',
    sent: '咨询已申请！医生确认后会联系您。',
  },
};

// ─── Error messages i18n ──────────────────────────────────────
const ERROR_BTN: Record<SurveyLang, string> = {
  KO: '설문 다시 시작',
  EN: 'Start Survey Again',
  JP: '調査をもう一度始める',
  'ZH-CN': '重新开始问卷',
};

// ─── Component ─────────────────────────────────────────────────

export default function ReportV2Page() {
  const router = useRouter();
  const { id } = router.query;
  const reportId = typeof id === 'string' ? id : undefined;

  const { data, status, error, lang } = useReportData(reportId);

  const [consultationSent, setConsultationSent] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);

  // ─── Consultation Request Handler ──────────────────────────
  const handleConsultationRequest = useCallback(async () => {
    if (!reportId || !data) return;
    setConsultationLoading(true);
    try {
      // Read raw payload for the consultation API
      const raw = typeof window !== 'undefined'
        ? sessionStorage.getItem('connectingdocs_v2_report')
        : null;

      if (raw) {
        const payload: StoredReportPayload = JSON.parse(raw);
        const res = await fetch('/api/consultation/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report_id: reportId,
            patient_profile: payload.recommendation.patient,
            demographics: payload.survey_state.demographics,
            safety_flags: payload.survey_state.safety_flags,
          }),
        });
        if (res.ok) {
          setConsultationSent(true);
        }
      }
    } catch (err) {
      console.error('[ReportV2] Consultation request failed:', err);
    } finally {
      setConsultationLoading(false);
    }
  }, [reportId, data]);

  // ─── Loading State (idle / loading) ─────────────────────────
  if (status === 'idle' || status === 'loading') {
    return (
      <>
        <Head>
          <title>ConnectingDocs Report</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div style={{
          minHeight: '100vh',
          background: '#09090b',
        }}>
          <SkeletonReport lang={lang} />
        </div>
      </>
    );
  }

  // ─── Error State ─────────────────────────────────────────────
  if (status === 'error' || !data) {
    return (
      <div className="report-v7-error">
        <Head>
          <title>ConnectingDocs Report — Error</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <p className="report-v7-error__msg">{error ?? 'Unknown error'}</p>
        <button
          onClick={() => router.push('/survey-v2')}
          className="report-v7-error__btn"
        >
          {ERROR_BTN[lang] ?? ERROR_BTN.EN}
        </button>
        <style jsx>{`
          .report-v7-error {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #09090b;
            color: #e4e4e7;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            gap: 16px;
          }
          .report-v7-error__msg {
            color: #f87171;
            font-size: 14px;
          }
          .report-v7-error__btn {
            padding: 10px 24px;
            background: #22d3ee;
            color: #09090b;
            border: none;
            border-radius: 24px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .report-v7-error__btn:hover {
            opacity: 0.85;
          }
        `}</style>
      </div>
    );
  }

  // ─── Derived values ──────────────────────────────────────────
  const ctaText = CTA_TEXT[lang] || CTA_TEXT['EN'];

  // ─── Main Report (direct React rendering) ────────────────────
  return (
    <>
      <Head>
        <title>
          ConnectingDocs Report | {data.patient.aestheticGoal || 'Premium Report'}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="report-v7-wrapper">
        {/* Direct React component — no iframe */}
        <div className="report-v7-content">
          <ReportV7 data={data} lang={lang} />
        </div>

        {/* ─── Consultation CTA (floating bottom bar) ─── */}
        <div className="report-v7-cta">
          {consultationSent ? (
            <p className="report-v7-cta__sent">{ctaText.sent}</p>
          ) : (
            <>
              <div className="report-v7-cta__text">
                <strong>{ctaText.title}</strong>
                <span>{ctaText.desc}</span>
              </div>
              <button
                className="report-v7-cta__btn"
                onClick={handleConsultationRequest}
                disabled={consultationLoading}
              >
                {consultationLoading ? '...' : ctaText.btn}
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .report-v7-wrapper {
          min-height: 100vh;
          background: #09090b;
          padding-bottom: 80px;
        }
        .report-v7-content {
          width: 100%;
          max-width: 100%;
        }
        .report-v7-cta {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 24px;
          background: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(34, 211, 238, 0.2);
          z-index: 50;
          animation: slideUp 0.4s ease;
        }
        .report-v7-cta__text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .report-v7-cta__text strong {
          color: #e4e4e7;
          font-size: 14px;
        }
        .report-v7-cta__text span {
          color: #71717a;
          font-size: 12px;
        }
        .report-v7-cta__btn {
          flex-shrink: 0;
          padding: 10px 28px;
          background: #22d3ee;
          color: #09090b;
          border: none;
          border-radius: 24px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .report-v7-cta__btn:hover {
          background: #06b6d4;
          transform: translateY(-1px);
        }
        .report-v7-cta__btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .report-v7-cta__sent {
          color: #22d3ee;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          width: 100%;
          font-family: 'Inter', system-ui, sans-serif;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
