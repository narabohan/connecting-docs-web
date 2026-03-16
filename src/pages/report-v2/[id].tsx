// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Report v2 Page — Dark Premium Design (v7)
//  Loads report-v7-premium.html in an iframe and injects Opus
//  recommendation data via postMessage bridge.
// ═══════════════════════════════════════════════════════════════

import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import type { OpusRecommendationOutput } from '@/pages/api/survey-v2/final-recommendation';
import type { SafetyFlag, SurveyLang } from '@/types/survey-v2';

// ─── Types ─────────────────────────────────────────────────────

interface ReportPayload {
  recommendation: OpusRecommendationOutput;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  survey_state: {
    demographics: {
      detected_language: SurveyLang;
      detected_country: string;
      d_gender: string;
      d_age: string;
    };
    safety_flags: SafetyFlag[];
    open_question_raw: string;
  };
  created_at: string;
}

type IframeStatus = 'loading' | 'ready' | 'rendered' | 'error';

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

// ─── Lang Mapping ──────────────────────────────────────────────
// v7-premium.html uses lowercase lang codes
const LANG_MAP: Record<SurveyLang, string> = {
  KO: 'ko',
  EN: 'en',
  JP: 'ja',
  'ZH-CN': 'zh-CN',
};

// ─── Component ─────────────────────────────────────────────────

export default function ReportV2Page() {
  const router = useRouter();
  const { id } = router.query;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [iframeStatus, setIframeStatus] = useState<IframeStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [consultationSent, setConsultationSent] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);

  // ─── Load report data from sessionStorage ──────────────────
  useEffect(() => {
    if (!id) return;

    try {
      const raw =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('connectingdocs_v2_report')
          : null;

      if (!raw) {
        setError('Report data not found. Please complete the survey first.');
        return;
      }

      const data: ReportPayload = JSON.parse(raw);
      setPayload(data);
    } catch (err) {
      setError('Failed to load report data.');
    }
  }, [id]);

  // ─── Listen for iframe messages ────────────────────────────
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== 'object') return;

      switch (event.data.type) {
        case 'IFRAME_READY':
          setIframeStatus('ready');
          break;
        case 'REPORT_READY':
          if (event.data.success) {
            setIframeStatus('rendered');
          } else {
            console.error('[ReportV2] Render error:', event.data.error);
            setIframeStatus('error');
          }
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ─── Send data to iframe when both ready ───────────────────
  useEffect(() => {
    if (iframeStatus !== 'ready' || !payload || !iframeRef.current?.contentWindow) return;

    const lang = LANG_MAP[payload.survey_state.demographics.detected_language] || 'en';

    // Build the data object that initReport() expects
    const reportData = {
      ...payload.recommendation,
      lang,
      safety_flags: buildSafetyFlagsObject(payload.survey_state.safety_flags),
    };

    iframeRef.current.contentWindow.postMessage(
      { type: 'INIT_REPORT', payload: reportData },
      '*'
    );

    // Force patient-only view (hide doctor tab)
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'SWITCH_TAB', tab: 'patient' },
        '*'
      );
    }, 300);
  }, [iframeStatus, payload]);

  // ─── Derived values ────────────────────────────────────────
  const lang = payload?.survey_state.demographics.detected_language ?? 'EN';

  // ─── Loading State ─────────────────────────────────────────
  if (!payload && !error) {
    return (
      <div className="report-v7-loading">
        <Head>
          <title>ConnectingDocs Report</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="report-v7-loading__spinner" />
        <p className="report-v7-loading__text">
          {lang === 'KO'
            ? '리포트를 불러오는 중...'
            : lang === 'JP'
            ? 'レポートを読み込み中...'
            : lang === 'ZH-CN'
            ? '正在加载报告...'
            : 'Loading your report...'}
        </p>
        <style jsx>{`
          .report-v7-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #09090b;
            color: #a1a1aa;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          .report-v7-loading__spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(34, 211, 238, 0.15);
            border-top-color: #22d3ee;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
          }
          .report-v7-loading__text {
            font-size: 14px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────
  if (error) {
    return (
      <div className="report-v7-error">
        <Head>
          <title>ConnectingDocs Report — Error</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <p className="report-v7-error__msg">{error}</p>
        <button
          onClick={() => router.push('/survey-v2')}
          className="report-v7-error__btn"
        >
          {lang === 'KO' ? '설문 다시 시작' : 'Start Survey Again'}
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

  // ─── Consultation Request Handler ──────────────────────────
  const handleConsultationRequest = async () => {
    if (!id || !payload) return;
    setConsultationLoading(true);
    try {
      const res = await fetch('/api/consultation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: id,
          patient_profile: payload.recommendation.patient,
          demographics: payload.survey_state.demographics,
          safety_flags: payload.survey_state.safety_flags,
        }),
      });
      if (res.ok) {
        setConsultationSent(true);
      }
    } catch (err) {
      console.error('[ReportV2] Consultation request failed:', err);
    } finally {
      setConsultationLoading(false);
    }
  };

  const ctaText = CTA_TEXT[lang] || CTA_TEXT['EN'];

  // ─── Main Report (iframe) ──────────────────────────────────
  return (
    <>
      <Head>
        <title>
          ConnectingDocs Report | {payload?.recommendation.patient.aesthetic_goal}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="report-v7-wrapper">
        {/* Loading overlay while iframe initializes */}
        {iframeStatus === 'loading' && (
          <div className="report-v7-overlay">
            <div className="report-v7-overlay__spinner" />
            <p>Initializing report...</p>
          </div>
        )}

        {/* The iframe loads the full v7-premium HTML */}
        <iframe
          ref={iframeRef}
          src="/report-v7-premium.html"
          className="report-v7-iframe"
          title="ConnectingDocs Premium Report"
          sandbox="allow-scripts allow-same-origin"
          style={{
            opacity: iframeStatus === 'rendered' ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
        {/* ─── Consultation CTA (floating bottom bar) ─── */}
        {iframeStatus === 'rendered' && (
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
        )}
      </div>

      <style jsx>{`
        .report-v7-wrapper {
          position: fixed;
          inset: 0;
          background: #09090b;
          overflow: hidden;
        }
        .report-v7-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: #09090b;
        }
        .report-v7-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #09090b;
          color: #a1a1aa;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 14px;
          z-index: 10;
        }
        .report-v7-overlay__spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(34, 211, 238, 0.15);
          border-top-color: #22d3ee;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Safety Flags Converter
//  Converts SafetyFlag[] array to the object format
//  that report-v7-premium.html's injectSafetyFlags() expects.
// ═══════════════════════════════════════════════════════════════

function buildSafetyFlagsObject(flags: SafetyFlag[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const flag of flags) {
    switch (flag) {
      case 'SAFETY_ISOTRETINOIN':
        result.isotretinoin = { status: 'active' };
        break;
      case 'SAFETY_ANTICOAGULANT':
        result.anticoagulant = { status: 'active' };
        break;
      case 'SAFETY_PREGNANCY':
        result.pregnancy = true;
        break;
      case 'SAFETY_KELOID':
        result.keloid_history = true;
        break;
      case 'SAFETY_PHOTOSENSITIVITY':
        result.photosensitive_drug = true;
        break;
      case 'SAFETY_ADVERSE_HISTORY':
        result.adverse_history = true;
        break;
      default:
        // Handle HORMONAL_MELASMA, RETINOID_PAUSE
        if (flag === 'HORMONAL_MELASMA') result.hormonal_melasma = true;
        if (flag === 'RETINOID_PAUSE') result.retinoid_pause = true;
        break;
    }
  }

  return result;
}
