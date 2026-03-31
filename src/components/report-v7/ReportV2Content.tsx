// ═══════════════════════════════════════════════════════════════
//  ReportV2Content — Client-only report renderer
//
//  Extracted from [id].tsx to be loaded via next/dynamic ssr:false.
//  This component is NEVER server-rendered, avoiding React 19
//  hydration mismatch issues entirely.
//
//  Contains: data loading, CTA bar, CRM tracking, email capture
// ═══════════════════════════════════════════════════════════════

import { useRouter } from 'next/router';
import { useState, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import type { SurveyLang } from '@/types/survey-v2';
import { useReportData, type StoredReportPayload } from '@/hooks/useReportData';
import { ReportV7 } from '@/components/report-v7/ReportV7';
import { SkeletonReport } from '@/components/report-v7/SkeletonReport';
import { useAuth } from '@/context/AuthContext';
import { EmailCaptureModal } from '@/components/common/EmailCaptureModal';
import { saveReportId, isEmailCaptured } from '@/services/local-report-store';

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

// ─── Styles (inline objects to avoid styled-jsx hydration issues) ─
const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#09090b',
    paddingBottom: '80px',
  } as React.CSSProperties,
  content: {
    width: '100%',
    maxWidth: '100%',
  } as React.CSSProperties,
  cta: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 24px',
    background: 'rgba(9, 9, 11, 0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(34, 211, 238, 0.2)',
    zIndex: 50,
  } as React.CSSProperties,
  ctaText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,
  ctaTitle: {
    color: '#e4e4e7',
    fontSize: '14px',
  } as React.CSSProperties,
  ctaDesc: {
    color: '#71717a',
    fontSize: '12px',
  } as React.CSSProperties,
  ctaBtn: {
    flexShrink: 0,
    padding: '10px 28px',
    background: '#22d3ee',
    color: '#09090b',
    border: 'none',
    borderRadius: '24px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,
  ctaSent: {
    color: '#22d3ee',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center' as const,
    width: '100%',
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#09090b',
    color: '#e4e4e7',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    gap: '16px',
  } as React.CSSProperties,
  errorMsg: {
    color: '#f87171',
    fontSize: '14px',
  } as React.CSSProperties,
  errorBtn: {
    padding: '10px 24px',
    background: '#22d3ee',
    color: '#09090b',
    border: 'none',
    borderRadius: '24px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  } as React.CSSProperties,
};

// ─── Component ─────────────────────────────────────────────────

export default function ReportV2Content() {
  const router = useRouter();
  const { id } = router.query;
  const reportId = typeof id === 'string' ? id : undefined;

  const { data, status, error, lang } = useReportData(reportId);

  const { user, loading: authLoading } = useAuth();
  const [consultationSent, setConsultationSent] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const crmTracked = useRef(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // ─── Email Capture Modal: show for unauthenticated users ──
  useEffect(() => {
    if (status !== 'success' || !reportId || authLoading) return;

    // Save report ID to localStorage (Layer 1)
    saveReportId(reportId);

    // Show modal if: not logged in AND email not already captured for this report
    if (!user && !isEmailCaptured(reportId)) {
      // Delay slightly so the report renders first
      const timer = setTimeout(() => setShowEmailModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [status, reportId, user, authLoading]);

  // ─── CRM: Track report view (best-effort, fire once) ──────
  useEffect(() => {
    if (status !== 'success' || !data || !reportId || crmTracked.current) return;
    crmTracked.current = true;

    const raw = sessionStorage.getItem('connectingdocs_v2_report');
    if (!raw) return;

    try {
      const payload: StoredReportPayload = JSON.parse(raw);
      const demographics = payload.survey_state?.demographics;
      if (!demographics) return;

      fetch('/api/crm/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: reportId,
          country: demographics.detected_country,
          lang: demographics.detected_language,
        }),
      }).catch((err) => {
        console.error('[ReportV2] CRM track-view failed (non-blocking):', err);
      });
    } catch {
      // Silent fail — CRM tracking must never break report viewing
    }
  }, [status, data, reportId]);

  // ─── Consultation Request Handler ──────────────────────────
  const handleConsultationRequest = useCallback(async () => {
    if (!reportId || !data) return;
    setConsultationLoading(true);
    try {
      const raw = sessionStorage.getItem('connectingdocs_v2_report');

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
      <div style={{ minHeight: '100vh', background: '#09090b' }}>
        <SkeletonReport lang={lang} />
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────
  if (status === 'error' || !data) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorMsg}>{error ?? 'Unknown error'}</p>
        <button
          onClick={() => router.push('/survey-v2')}
          style={styles.errorBtn}
        >
          {ERROR_BTN[lang] ?? ERROR_BTN.EN}
        </button>
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

      <div style={styles.wrapper}>
        {/* Direct React component — no iframe */}
        <div style={styles.content}>
          <ReportV7 data={data} lang={lang} />
        </div>

        {/* ─── Consultation CTA (floating bottom bar) ─── */}
        <div style={styles.cta}>
          {consultationSent ? (
            <p style={styles.ctaSent}>{ctaText.sent}</p>
          ) : (
            <>
              <div style={styles.ctaText}>
                <strong style={styles.ctaTitle}>{ctaText.title}</strong>
                <span style={styles.ctaDesc}>{ctaText.desc}</span>
              </div>
              <button
                style={{
                  ...styles.ctaBtn,
                  ...(consultationLoading ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                }}
                onClick={handleConsultationRequest}
                disabled={consultationLoading}
              >
                {consultationLoading ? '...' : ctaText.btn}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Email Capture Modal (unauthenticated users) ─── */}
      {showEmailModal && reportId && (
        <EmailCaptureModal
          reportId={reportId}
          lang={lang}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
}
