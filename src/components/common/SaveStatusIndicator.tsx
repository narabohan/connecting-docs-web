// ═══════════════════════════════════════════════════════════════
//  SaveStatusIndicator — Phase 1 (C-3)
//  useAwaitConfirm의 status를 시각적으로 표시하는 컴포넌트
//  4개국어 (KO, EN, JP, ZH-CN)
//
//  사용법:
//    const { execute, status, error } = useAwaitConfirm();
//    <SaveStatusIndicator status={status} error={error} onRetry={...} lang="KO" />
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Loader2, Check, AlertTriangle, XCircle } from 'lucide-react';
import type { AwaitConfirmStatus } from '@/hooks/useAwaitConfirm';
import type { SurveyLang } from '@/types/survey-v2';

// ─── Props ───────────────────────────────────────────────────

interface SaveStatusIndicatorProps {
  status: AwaitConfirmStatus;
  error?: string | null;
  onRetry?: () => void;
  lang?: SurveyLang;
}

// ─── i18n ────────────────────────────────────────────────────

interface StatusMessages {
  sending: string;
  confirming: string;
  success: string;
  queued: string;
  failed: string;
  retryButton: string;
}

const MESSAGES: Record<string, StatusMessages> = {
  KO: {
    sending: '결과 저장 중...',
    confirming: '저장 확인 중...',
    success: '저장 완료',
    queued: '오프라인 저장됨. 나중에 자동 전송됩니다.',
    failed: '저장 실패. 다시 시도해주세요.',
    retryButton: '다시 시도',
  },
  EN: {
    sending: 'Saving results...',
    confirming: 'Confirming save...',
    success: 'Saved successfully',
    queued: 'Saved offline. Will auto-send later.',
    failed: 'Save failed. Please try again.',
    retryButton: 'Retry',
  },
  JP: {
    sending: '結果を保存中...',
    confirming: '保存を確認中...',
    success: '保存完了',
    queued: 'オフラインで保存しました。後で自動送信されます。',
    failed: '保存に失敗しました。もう一度お試しください。',
    retryButton: '再試行',
  },
  'ZH-CN': {
    sending: '正在保存结果...',
    confirming: '确认保存中...',
    success: '保存成功',
    queued: '已离线保存，稍后将自动发送。',
    failed: '保存失败，请重试。',
    retryButton: '重试',
  },
};

// ─── Component ───────────────────────────────────────────────

export function SaveStatusIndicator({
  status,
  error,
  onRetry,
  lang = 'KO',
}: SaveStatusIndicatorProps) {
  const [visible, setVisible] = useState(true);
  const messages = MESSAGES[lang] || MESSAGES.EN;

  // Auto-fade success after 3 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
    setVisible(true);
  }, [status]);

  // Don't render when idle or faded
  if (status === 'idle' || !visible) return null;

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        transition-all duration-300
        ${status === 'sending' || status === 'confirming'
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          : status === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : status === 'queued'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }
      `}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {(status === 'sending' || status === 'confirming') && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {status === 'success' && (
        <Check className="w-4 h-4" />
      )}
      {status === 'queued' && (
        <AlertTriangle className="w-4 h-4" />
      )}
      {status === 'failed' && (
        <XCircle className="w-4 h-4" />
      )}

      {/* Message */}
      <span>
        {status === 'sending' && messages.sending}
        {status === 'confirming' && messages.confirming}
        {status === 'success' && messages.success}
        {status === 'queued' && messages.queued}
        {status === 'failed' && (error || messages.failed)}
      </span>

      {/* Retry button */}
      {status === 'failed' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-semibold transition-colors"
        >
          {messages.retryButton}
        </button>
      )}
    </div>
  );
}
