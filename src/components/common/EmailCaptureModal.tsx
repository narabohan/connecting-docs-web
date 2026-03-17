// ═══════════════════════════════════════════════════════════════
//  EmailCaptureModal — Phase 1 (C-4, C-9 i18n refactor)
//  비인증 유저에게 리포트 링크를 이메일로 전송하기 위한 모달
//  참조: MASTER_PLAN_V4.md §16.2 (비인증 유저 3-Layer 안전망)
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { X, Mail, Loader2, Check } from 'lucide-react';
import { saveReportId, markEmailCaptured } from '@/services/local-report-store';
import { useTranslation } from '@/i18n';
import type { AppLang } from '@/i18n';

// ─── Props ───────────────────────────────────────────────────

interface EmailCaptureModalProps {
  reportId: string;
  lang?: AppLang;
  onClose: () => void;
}

// ─── Zod Schema ──────────────────────────────────────────────

const emailSchema = z.string().email();

// ─── Component ───────────────────────────────────────────────

type ModalStatus = 'idle' | 'sending' | 'success' | 'error';

export function EmailCaptureModal({
  reportId,
  lang: langProp,
  onClose,
}: EmailCaptureModalProps) {
  const { t, lang: contextLang } = useTranslation();
  const activeLang = langProp || contextLang;
  const [email, setEmail] = useState('');
  const [modalStatus, setModalStatus] = useState<ModalStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = useCallback(async () => {
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setErrorMsg(t('email_capture.error_invalid'));
      return;
    }

    setModalStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/crm/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          report_id: reportId,
          lang: activeLang,
        }),
      });

      if (!res.ok) {
        setModalStatus('error');
        setErrorMsg(t('email_capture.error_server'));
        return;
      }

      saveReportId(reportId);
      markEmailCaptured(reportId);
      setModalStatus('success');
      setTimeout(() => onClose(), 2000);
    } catch {
      setModalStatus('error');
      setErrorMsg(t('email_capture.error_server'));
    }
  }, [email, reportId, activeLang, t, onClose]);

  const handleSkip = useCallback(() => {
    saveReportId(reportId);
    onClose();
  }, [reportId, onClose]);

  return (
    <div className="ec-overlay" onClick={onClose}>
      <div className="ec-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ec-close" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="ec-icon">
          {modalStatus === 'success' ? (
            <Check className="w-6 h-6 text-emerald-400" />
          ) : (
            <Mail className="w-6 h-6 text-cyan-400" />
          )}
        </div>

        <h2 className="ec-title">
          {modalStatus === 'success' ? t('email_capture.success') : t('email_capture.title')}
        </h2>

        {modalStatus !== 'success' && (
          <>
            <p className="ec-desc">{t('email_capture.description')}</p>

            <div className="ec-input-wrap">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder={t('email_capture.placeholder')}
                className={`ec-input ${errorMsg ? 'ec-input--error' : ''}`}
                disabled={modalStatus === 'sending'}
                autoFocus
              />
              {errorMsg && <p className="ec-error">{errorMsg}</p>}
            </div>

            <div className="ec-buttons">
              <button
                className="ec-btn-primary"
                onClick={handleSubmit}
                disabled={modalStatus === 'sending' || !email.trim()}
              >
                {modalStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : t('email_capture.send')}
              </button>
              <button className="ec-btn-skip" onClick={handleSkip}>
                {t('email_capture.skip')}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .ec-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; animation: ecFadeIn 0.2s ease; }
        .ec-modal { position: relative; background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px 28px; max-width: 400px; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; animation: ecSlideUp 0.3s ease; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .ec-close { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #71717a; cursor: pointer; padding: 4px; border-radius: 8px; transition: background 0.2s; }
        .ec-close:hover { background: rgba(255,255,255,0.05); }
        .ec-icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(34,211,238,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
        .ec-title { color: #e4e4e7; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.3; }
        .ec-desc { color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0; }
        .ec-input-wrap { width: 100%; margin-top: 4px; }
        .ec-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: #e4e4e7; font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit; box-sizing: border-box; }
        .ec-input:focus { border-color: #22d3ee; }
        .ec-input--error { border-color: #f87171; }
        .ec-input:disabled { opacity: 0.5; }
        .ec-error { color: #f87171; font-size: 12px; margin: 6px 0 0; text-align: left; }
        .ec-buttons { width: 100%; display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .ec-btn-primary { width: 100%; padding: 12px; background: #22d3ee; color: #09090b; border: none; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; }
        .ec-btn-primary:hover:not(:disabled) { background: #06b6d4; }
        .ec-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .ec-btn-skip { background: none; border: none; color: #71717a; font-size: 13px; cursor: pointer; padding: 8px; transition: color 0.2s; font-family: inherit; }
        .ec-btn-skip:hover { color: #a1a1aa; }
        @keyframes ecFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ecSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
