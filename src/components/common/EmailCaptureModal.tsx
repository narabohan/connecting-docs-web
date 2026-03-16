// ═══════════════════════════════════════════════════════════════
//  EmailCaptureModal — Phase 1 (C-4)
//  비인증 유저에게 리포트 링크를 이메일로 전송하기 위한 모달
//  참조: MASTER_PLAN_V4.md §16.2 (비인증 유저 3-Layer 안전망)
//
//  표시 조건:
//    1. Firebase Auth 미로그인 상태
//    2. 해당 리포트에 대해 이메일 미입력 (localStorage 확인)
//  동작:
//    - 이메일 입력 → POST /api/crm/email-capture
//    - "나중에" → localStorage에만 report_id 저장
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { X, Mail, Loader2, Check } from 'lucide-react';
import type { SurveyLang } from '@/types/survey-v2';
import { saveReportId, markEmailCaptured } from '@/services/local-report-store';

// ─── Props ───────────────────────────────────────────────────

interface EmailCaptureModalProps {
  reportId: string;
  lang: SurveyLang;
  onClose: () => void;
}

// ─── Zod Schema ──────────────────────────────────────────────

const emailSchema = z.string().email();

// ─── i18n ────────────────────────────────────────────────────

interface ModalMessages {
  title: string;
  description: string;
  placeholder: string;
  submit: string;
  skip: string;
  success: string;
  errorInvalid: string;
  errorServer: string;
}

const MESSAGES: Record<string, ModalMessages> = {
  KO: {
    title: '리포트를 이메일로 받으세요',
    description: '이메일을 입력하시면 리포트 링크를 보내드립니다. 언제든 다시 열어볼 수 있어요.',
    placeholder: 'your@email.com',
    submit: '보내기',
    skip: '나중에',
    success: '저장되었습니다! 이메일로 리포트 링크가 전송됩니다.',
    errorInvalid: '올바른 이메일 주소를 입력해주세요.',
    errorServer: '잠시 후 다시 시도해주세요.',
  },
  EN: {
    title: 'Get your report via email',
    description: 'Enter your email and we\'ll send you the report link. You can revisit it anytime.',
    placeholder: 'your@email.com',
    submit: 'Send',
    skip: 'Maybe later',
    success: 'Saved! The report link will be sent to your email.',
    errorInvalid: 'Please enter a valid email address.',
    errorServer: 'Something went wrong. Please try again.',
  },
  JP: {
    title: 'レポートをメールで受け取る',
    description: 'メールアドレスを入力していただければ、レポートリンクをお送りします。いつでも再確認できます。',
    placeholder: 'your@email.com',
    submit: '送信',
    skip: '後で',
    success: '保存しました！レポートリンクがメールで送信されます。',
    errorInvalid: '有効なメールアドレスを入力してください。',
    errorServer: 'エラーが発生しました。もう一度お試しください。',
  },
  'ZH-CN': {
    title: '通过邮箱接收报告',
    description: '输入您的邮箱，我们将发送报告链接。您可以随时查看。',
    placeholder: 'your@email.com',
    submit: '发送',
    skip: '以后再说',
    success: '已保存！报告链接将发送到您的邮箱。',
    errorInvalid: '请输入有效的邮箱地址。',
    errorServer: '出错了，请稍后再试。',
  },
};

// ─── Component ───────────────────────────────────────────────

type ModalStatus = 'idle' | 'sending' | 'success' | 'error';

export function EmailCaptureModal({
  reportId,
  lang,
  onClose,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [modalStatus, setModalStatus] = useState<ModalStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const messages = MESSAGES[lang] || MESSAGES.EN;

  const handleSubmit = useCallback(async () => {
    // ── Validate email
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setErrorMsg(messages.errorInvalid);
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
          lang,
        }),
      });

      if (!res.ok) {
        setModalStatus('error');
        setErrorMsg(messages.errorServer);
        return;
      }

      // ── Success
      saveReportId(reportId);
      markEmailCaptured(reportId);
      setModalStatus('success');

      // Auto-close after 2 seconds
      setTimeout(() => onClose(), 2000);
    } catch {
      setModalStatus('error');
      setErrorMsg(messages.errorServer);
    }
  }, [email, reportId, lang, messages, onClose]);

  const handleSkip = useCallback(() => {
    // Layer 1: localStorage에만 저장
    saveReportId(reportId);
    onClose();
  }, [reportId, onClose]);

  return (
    <div className="ec-overlay" onClick={onClose}>
      <div className="ec-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="ec-close" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="ec-icon">
          {modalStatus === 'success' ? (
            <Check className="w-6 h-6 text-emerald-400" />
          ) : (
            <Mail className="w-6 h-6 text-cyan-400" />
          )}
        </div>

        {/* Title & Description */}
        <h2 className="ec-title">
          {modalStatus === 'success' ? messages.success : messages.title}
        </h2>

        {modalStatus !== 'success' && (
          <>
            <p className="ec-desc">{messages.description}</p>

            {/* Email Input */}
            <div className="ec-input-wrap">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder={messages.placeholder}
                className={`ec-input ${errorMsg ? 'ec-input--error' : ''}`}
                disabled={modalStatus === 'sending'}
                autoFocus
              />
              {errorMsg && <p className="ec-error">{errorMsg}</p>}
            </div>

            {/* Buttons */}
            <div className="ec-buttons">
              <button
                className="ec-btn-primary"
                onClick={handleSubmit}
                disabled={modalStatus === 'sending' || !email.trim()}
              >
                {modalStatus === 'sending' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  messages.submit
                )}
              </button>
              <button className="ec-btn-skip" onClick={handleSkip}>
                {messages.skip}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .ec-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
          animation: ecFadeIn 0.2s ease;
        }
        .ec-modal {
          position: relative;
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px 28px;
          max-width: 400px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          animation: ecSlideUp 0.3s ease;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .ec-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .ec-close:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .ec-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(34, 211, 238, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .ec-title {
          color: #e4e4e7;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          line-height: 1.3;
        }
        .ec-desc {
          color: #a1a1aa;
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }
        .ec-input-wrap {
          width: 100%;
          margin-top: 4px;
        }
        .ec-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: #e4e4e7;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
          box-sizing: border-box;
        }
        .ec-input:focus {
          border-color: #22d3ee;
        }
        .ec-input--error {
          border-color: #f87171;
        }
        .ec-input:disabled {
          opacity: 0.5;
        }
        .ec-error {
          color: #f87171;
          font-size: 12px;
          margin: 6px 0 0;
          text-align: left;
        }
        .ec-buttons {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .ec-btn-primary {
          width: 100%;
          padding: 12px;
          background: #22d3ee;
          color: #09090b;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
        }
        .ec-btn-primary:hover:not(:disabled) {
          background: #06b6d4;
        }
        .ec-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ec-btn-skip {
          background: none;
          border: none;
          color: #71717a;
          font-size: 13px;
          cursor: pointer;
          padding: 8px;
          transition: color 0.2s;
          font-family: inherit;
        }
        .ec-btn-skip:hover {
          color: #a1a1aa;
        }
        @keyframes ecFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ecSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
