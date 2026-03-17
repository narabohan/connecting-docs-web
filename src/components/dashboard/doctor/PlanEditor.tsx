// ═══════════════════════════════════════════════════════════════
//  PlanEditor — Phase 2 (G-3)
//  Treatment Plan 편집기: 의사 노트 + 상태 변경 + 승인 플로우
//
//  Layout:
//  - Left column (2/3): Plan detail (concerns, recs, timeline) — read-only
//  - Right column (1/3): QuickActions + Doctor Notes
//
//  Uses usePlanEditor hook for PATCH API calls
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import type { TreatmentPlanData, PlanStatus } from '@/schemas/treatment-plan';
import { usePlanEditor } from '@/hooks/usePlanEditor';
import { QuickActions } from './QuickActions';

// ─── Types ───────────────────────────────────────────────────

interface PlanEditorProps {
  plan: TreatmentPlanData;
  onPlanUpdate: (updated: TreatmentPlanData) => void;
}

// ─── Component ───────────────────────────────────────────────

export function PlanEditor({ plan, onPlanUpdate }: PlanEditorProps) {
  const {
    updating,
    updateError,
    updateSuccess,
    updateStatus,
    clearUpdateState,
    canTransition,
    getNextStatus,
  } = usePlanEditor();

  const [doctorNote, setDoctorNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PlanStatus | null>(null);
  const [emailSentUI, setEmailSentUI] = useState(false);

  // ─── Status Change Handler ──────────────────────────────────
  const handleStatusChange = useCallback(
    (newStatus: PlanStatus) => {
      // For approve action, show note input first
      if (newStatus === 'approved' || newStatus === 'sent') {
        setPendingStatus(newStatus);
        setShowNoteInput(true);
        return;
      }
      // For other transitions, execute immediately
      performStatusUpdate(newStatus, '');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan.planId],
  );

  // ─── Execute PATCH ──────────────────────────────────────────
  const performStatusUpdate = useCallback(
    async (status: PlanStatus, note: string) => {
      const result = await updateStatus(plan.planId, status, note || undefined);
      if (result) {
        onPlanUpdate(result);
        setDoctorNote('');
        setShowNoteInput(false);
        setPendingStatus(null);
      }
    },
    [plan.planId, updateStatus, onPlanUpdate],
  );

  // ─── Confirm with Note ─────────────────────────────────────
  const handleConfirmWithNote = useCallback(() => {
    if (!pendingStatus) return;
    performStatusUpdate(pendingStatus, doctorNote);
  }, [pendingStatus, doctorNote, performStatusUpdate]);

  // ─── Cancel Note Input ─────────────────────────────────────
  const handleCancelNote = useCallback(() => {
    setShowNoteInput(false);
    setPendingStatus(null);
    setDoctorNote('');
    clearUpdateState();
  }, [clearUpdateState]);

  // ─── Email Send (UI-only) ─────────────────────────────────
  const handleSendEmail = useCallback(() => {
    // Phase 3에서 실제 이메일 전송 구현
    // 현재는 상태만 'sent'로 변경
    setPendingStatus('sent');
    setShowNoteInput(true);
  }, []);

  // ─── Next Action Label ─────────────────────────────────────
  const nextStatus = getNextStatus(plan.status);
  const nextActionLabel = pendingStatus
    ? pendingStatus === 'approved'
      ? 'Approve Plan'
      : pendingStatus === 'sent'
        ? 'Send to Patient'
        : `Change to ${pendingStatus}`
    : '';

  return (
    <div className="space-y-4">
      {/* ── Quick Actions ── */}
      <QuickActions
        currentStatus={plan.status}
        onStatusChange={handleStatusChange}
        onSendEmail={handleSendEmail}
        updating={updating}
        canTransition={canTransition}
      />

      {/* ── Doctor Note Input (when confirming status change) ── */}
      {showNoteInput && pendingStatus && (
        <div className="bg-[#12121f] border border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Doctor Note
              <span className="text-[11px] text-gray-500 font-normal">(optional)</span>
            </h4>
            <button
              onClick={handleCancelNote}
              className="p-1 rounded hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <textarea
            value={doctorNote}
            onChange={(e) => setDoctorNote(e.target.value)}
            placeholder="Add a note about this status change..."
            rows={3}
            className="
              w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5
              text-sm text-white placeholder-gray-600
              focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20
              resize-none transition-colors
            "
          />

          <div className="flex items-center justify-between">
            <button
              onClick={handleCancelNote}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmWithNote}
              disabled={updating}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                bg-emerald-500/15 text-emerald-400 border border-emerald-500/30
                hover:bg-emerald-500/25 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {updating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{updating ? 'Updating...' : nextActionLabel}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Success Banner ── */}
      {updateSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-400">
            Plan updated successfully
          </span>
          <button
            onClick={clearUpdateState}
            className="ml-auto p-1 rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      )}

      {/* ── Error Banner ── */}
      {updateError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-400">{updateError}</span>
          <button
            onClick={clearUpdateState}
            className="ml-auto p-1 rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* ── Email Sent UI Placeholder ── */}
      {emailSentUI && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-sm text-cyan-400">
            Email functionality will be available in Phase 3
          </span>
          <button
            onClick={() => setEmailSentUI(false)}
            className="ml-auto p-1 rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      )}
    </div>
  );
}
