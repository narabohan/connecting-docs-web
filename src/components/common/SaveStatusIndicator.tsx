// ═══════════════════════════════════════════════════════════════
//  SaveStatusIndicator — Phase 1 (C-3, C-9 i18n refactor)
//  useAwaitConfirm의 status를 시각적으로 표시하는 컴포넌트
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Loader2, Check, AlertTriangle, XCircle } from 'lucide-react';
import type { AwaitConfirmStatus } from '@/hooks/useAwaitConfirm';
import { useTranslation } from '@/i18n';

// ─── Props ───────────────────────────────────────────────────

interface SaveStatusIndicatorProps {
  status: AwaitConfirmStatus;
  error?: string | null;
  onRetry?: () => void;
}

// ─── Component ───────────────────────────────────────────────

export function SaveStatusIndicator({
  status,
  error,
  onRetry,
}: SaveStatusIndicatorProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
    setVisible(true);
  }, [status]);

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
      {(status === 'sending' || status === 'confirming') && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === 'success' && <Check className="w-4 h-4" />}
      {status === 'queued' && <AlertTriangle className="w-4 h-4" />}
      {status === 'failed' && <XCircle className="w-4 h-4" />}

      <span>
        {status === 'sending' && t('save_status.sending')}
        {status === 'confirming' && t('save_status.confirming')}
        {status === 'success' && t('save_status.success')}
        {status === 'queued' && t('save_status.queued')}
        {status === 'failed' && (error || t('save_status.failed'))}
      </span>

      {status === 'failed' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-semibold transition-colors"
        >
          {t('save_status.retry_button')}
        </button>
      )}
    </div>
  );
}
