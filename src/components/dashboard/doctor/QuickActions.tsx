// ═══════════════════════════════════════════════════════════════
//  QuickActions — Phase 2 (G-3, updated G-4)
//  의사 대시보드 빠른 액션: 상태 변경 + 이메일 전송
//
//  - Status dropdown: shows current + next valid transitions
//  - Email send button: triggers PATCH status→sent → server-side email (G-4)
//  - Approve button: shortcut for doctor_review → approved
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import {
  CheckCircle2,
  Send,
  ChevronDown,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { PlanStatus } from '@/schemas/treatment-plan';

// ─── Types ───────────────────────────────────────────────────

interface QuickActionsProps {
  currentStatus: PlanStatus;
  onStatusChange: (newStatus: PlanStatus) => void;
  onSendEmail: () => void;
  updating: boolean;
  canTransition: (from: PlanStatus, to: PlanStatus) => boolean;
}

// ─── Status Display ──────────────────────────────────────────

const STATUS_DISPLAY: Record<PlanStatus, { label: string; shortLabel: string; color: string; bg: string }> = {
  draft: { label: 'Draft', shortLabel: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/15' },
  doctor_review: { label: 'Doctor Review', shortLabel: 'Review', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  approved: { label: 'Approved', shortLabel: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  sent: { label: 'Sent to Patient', shortLabel: 'Sent', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
};

const ALL_STATUSES: PlanStatus[] = ['draft', 'doctor_review', 'approved', 'sent'];

// ─── Component ───────────────────────────────────────────────

export function QuickActions({
  currentStatus,
  onStatusChange,
  onSendEmail,
  updating,
  canTransition,
}: QuickActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentDisplay = STATUS_DISPLAY[currentStatus];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [dropdownOpen]);

  // Available transitions from current status
  const availableTransitions = ALL_STATUSES.filter(
    (s) => canTransition(currentStatus, s),
  );

  // Is the plan ready for the primary "Approve" action?
  const showApproveButton = currentStatus === 'doctor_review';
  // Is the plan ready to be sent?
  const showSendButton = currentStatus === 'approved';

  return (
    <div className="bg-[#12121f] border border-white/10 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>

      <div className="space-y-3">
        {/* ── Status Dropdown ── */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-1.5">
            Current Status
          </label>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={updating || availableTransitions.length === 0}
            className={`
              w-full flex items-center justify-between px-3 py-2.5 rounded-lg border
              ${currentDisplay.bg} ${currentDisplay.color} border-white/10
              hover:border-white/20 transition-colors text-sm font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span>{currentDisplay.label}</span>
            {availableTransitions.length > 0 && (
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && availableTransitions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl overflow-hidden">
              {availableTransitions.map((status) => {
                const display = STATUS_DISPLAY[status];
                return (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusChange(status);
                      setDropdownOpen(false);
                    }}
                    disabled={updating}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className={`w-3.5 h-3.5 ${display.color}`} />
                    <span className={display.color}>{display.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Primary: Approve Button ── */}
        {showApproveButton && (
          <button
            onClick={() => onStatusChange('approved')}
            disabled={updating}
            className="
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-emerald-500/15 text-emerald-400 border border-emerald-500/30
              hover:bg-emerald-500/25 transition-colors text-sm font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {updating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{updating ? 'Approving...' : 'Approve Plan'}</span>
          </button>
        )}

        {/* ── Primary: Send to Patient ── */}
        {showSendButton && (
          <button
            onClick={onSendEmail}
            disabled={updating}
            className="
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-cyan-500/15 text-cyan-400 border border-cyan-500/30
              hover:bg-cyan-500/25 transition-colors text-sm font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {updating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{updating ? 'Sending...' : 'Send to Patient'}</span>
          </button>
        )}

        {/* ── Terminal State ── */}
        {currentStatus === 'sent' && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400">Plan sent to patient</span>
          </div>
        )}
      </div>
    </div>
  );
}
