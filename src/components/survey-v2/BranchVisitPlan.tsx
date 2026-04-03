// ═══════════════════════════════════════════════════════════════
//  BranchVisitPlan — Phase 3-B (S-2c)
//  꼬리질문: 해외 환자 방문 계획 (체류, 도착/출발, 지역)
//  참조: MASTER_PLAN_V4.md §3.5 BRANCH_VISIT_PLAN
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { SurveyLang } from '@/types/survey-v2';
import type { VisitPlanBranch, RevisitCycle } from '@/hooks/useSurveyStateMachine';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

// ─── Helpers: date ↔ slider auto-calculation ──────────────────
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number | null {
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  const diff = Math.round((db.getTime() - da.getTime()) / 86_400_000);
  return diff > 0 ? diff : null;
}

interface BranchVisitPlanProps {
  lang: SurveyLang;
  initialData?: VisitPlanBranch | null;
  onComplete: (data: VisitPlanBranch) => void;
  onBack: () => void;
}

export default function BranchVisitPlan({ lang, initialData, onComplete, onBack }: BranchVisitPlanProps) {
  const t = SURVEY_V2_I18N[lang].branch_visit;
  const tc = SURVEY_V2_I18N[lang].common;

  const [stayDays, setStayDays] = useState(initialData?.stay_days ?? 5);
  const [arrival, setArrival] = useState(initialData?.arrival_date ?? '');
  const [departure, setDeparture] = useState(initialData?.departure_date ?? '');
  const [area, setArea] = useState(initialData?.accommodation_area ?? '');
  const [revisitCycle, setRevisitCycle] = useState<RevisitCycle | undefined>(initialData?.revisit_cycle);

  // ── Auto-calc: arrival + departure → stayDays ──────────────
  useEffect(() => {
    const d = diffDays(arrival, departure);
    if (d !== null && d !== stayDays) setStayDays(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival, departure]);

  // ── Slider change → update departure if arrival is set ─────
  const handleSliderChange = useCallback((val: number) => {
    setStayDays(val);
    if (arrival) setDeparture(addDays(arrival, val));
  }, [arrival]);

  const isComplete = stayDays > 0;

  const handleSubmit = () => {
    if (!isComplete) return;
    onComplete({
      stay_days: stayDays,
      arrival_date: arrival,
      departure_date: departure,
      accommodation_area: area.trim(),
      revisit_cycle: revisitCycle,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-2">{t.subtitle}</p>
      </div>

      {/* Stay Days */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.stay_days}</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={30}
            value={stayDays}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className="flex-1 accent-cyan-500"
          />
          <span className="text-lg font-bold text-blue-600 min-w-[3rem] text-center">
            {stayDays}
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.arrival}</label>
          <input
            type="date"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.departure}</label>
          <input
            type="date"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.area}</label>
        <input
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder={t.area_placeholder}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Revisit Cycle (Q6-2) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{t.revisit_label}</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'first_time' as RevisitCycle, key: 'revisit_first_time' as const },
            { value: 'yearly' as RevisitCycle, key: 'revisit_yearly' as const },
            { value: 'biannual' as RevisitCycle, key: 'revisit_biannual' as const },
            { value: 'quarterly' as RevisitCycle, key: 'revisit_quarterly' as const },
            { value: 'monthly' as RevisitCycle, key: 'revisit_monthly' as const },
            { value: 'occasional' as RevisitCycle, key: 'revisit_occasional' as const },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRevisitCycle(opt.value)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                revisitCycle === opt.value
                  ? 'bg-blue-50 border-blue-500 text-blue-600 border'
                  : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t[opt.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-medium hover:bg-gray-200 transition-all"
        >
          {tc.back}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            isComplete
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {tc.next}
        </button>
      </div>
    </motion.div>
  );
}
