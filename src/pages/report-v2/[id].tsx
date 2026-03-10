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

  // Doctor access check
  const isDoctor = router.query.role === 'doctor';

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
    // Includes 3-layer sections (mirror, confidence) + enhanced doctor intelligence
    const reportData = {
      ...payload.recommendation,
      lang,
      safety_flags: buildSafetyFlagsObject(payload.survey_state.safety_flags),
      // Pass open_question for mirror section context in HTML renderer
      _open_question_raw: payload.survey_state.open_question_raw,
    };

    iframeRef.current.contentWindow.postMessage(
      { type: 'INIT_REPORT', payload: reportData },
      '*'
    );

    // Switch to doctor tab if accessed with doctor role
    if (isDoctor) {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'SWITCH_TAB', tab: 'doctor' },
          '*'
        );
      }, 300);
    }
  }, [iframeStatus, payload, isDoctor]);

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
