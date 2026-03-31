// ═══════════════════════════════════════════════════════════════
//  BranchPastHistory — Phase 3-B (S-2b)
//  꼬리질문: 과거 시술 경험 상세
//  참조: MASTER_PLAN_V4.md §3.5 BRANCH_PAST_HISTORY
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import type { SurveyLang } from '@/types/survey-v2';
import type { PastHistoryBranch } from '@/hooks/useSurveyStateMachine';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

interface BranchPastHistoryProps {
  lang: SurveyLang;
  initialData?: PastHistoryBranch | null;
  onComplete: (data: PastHistoryBranch) => void;
  onBack: () => void;
}

interface TreatmentEntry {
  name: string;
  count: number;
  last_date: string;
  satisfaction: 'good' | 'neutral' | 'bad';
}

const EMPTY_TREATMENT: TreatmentEntry = { name: '', count: 1, last_date: '', satisfaction: 'neutral' };

export default function BranchPastHistory({ lang, initialData, onComplete, onBack }: BranchPastHistoryProps) {
  const t = SURVEY_V2_I18N[lang].branch_history;
  const tc = SURVEY_V2_I18N[lang].common;

  const [treatments, setTreatments] = useState<TreatmentEntry[]>(
    initialData?.treatments?.length ? initialData.treatments : [{ ...EMPTY_TREATMENT }]
  );
  const [hadAdverse, setHadAdverse] = useState(initialData?.had_adverse ?? false);

  const updateTreatment = (index: number, field: keyof TreatmentEntry, value: string | number) => {
    setTreatments((prev) =>
      prev.map((tr, i) => (i === index ? { ...tr, [field]: value } : tr))
    );
  };

  const addTreatment = () => {
    if (treatments.length >= 5) return;
    setTreatments((prev) => [...prev, { ...EMPTY_TREATMENT }]);
  };

  const removeTreatment = (index: number) => {
    if (treatments.length <= 1) return;
    setTreatments((prev) => prev.filter((_, i) => i !== index));
  };

  const isComplete = treatments.every((tr) => tr.name.trim().length > 0);

  const handleSubmit = () => {
    if (!isComplete) return;
    onComplete({
      treatments: treatments.map((tr) => ({
        name: tr.name.trim(),
        count: tr.count,
        last_date: tr.last_date || 'unknown',
        satisfaction: tr.satisfaction,
      })),
      had_adverse: hadAdverse,
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
        <h2 className="text-xl font-bold text-white">{t.title}</h2>
        <p className="text-sm text-gray-400 mt-2">{t.subtitle}</p>
      </div>

      {/* Treatment Entries */}
      {treatments.map((tr, idx) => (
        <div key={idx} className="relative bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
          {treatments.length > 1 && (
            <button
              onClick={() => removeTreatment(idx)}
              className="absolute top-3 right-3 p-1 text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Treatment Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{t.treatment_name}</label>
            <input
              type="text"
              value={tr.name}
              onChange={(e) => updateTreatment(idx, 'name', e.target.value)}
              placeholder="e.g., Ulthera, Thermage, Botox"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Count */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t.treatment_count}</label>
              <input
                type="number"
                min={1}
                max={50}
                value={tr.count}
                onChange={(e) => updateTreatment(idx, 'count', parseInt(e.target.value) || 1)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            {/* Last Date */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">{t.treatment_last}</label>
              <input
                type="month"
                value={tr.last_date}
                onChange={(e) => updateTreatment(idx, 'last_date', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40"
              />
            </div>
          </div>

          {/* Satisfaction */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{t.treatment_satisfaction}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['good', 'neutral', 'bad'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => updateTreatment(idx, 'satisfaction', val)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    tr.satisfaction === val
                      ? val === 'good' ? 'bg-green-500/15 border-green-500/40 text-green-400 border'
                      : val === 'bad' ? 'bg-red-500/15 border-red-500/40 text-red-400 border'
                      : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 border'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {t[`sat_${val}`]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Add Treatment Button */}
      {treatments.length < 5 && (
        <button
          onClick={addTreatment}
          className="w-full py-2 rounded-xl bg-white/5 border border-dashed border-white/15 text-gray-400 text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          {t.add_more}
        </button>
      )}

      {/* Adverse Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">{t.had_adverse}</label>
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => setHadAdverse(val)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                hadAdverse === val
                  ? val ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 border'
                        : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 border'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {val ? t.adverse_yes : t.adverse_no}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-medium hover:bg-white/10 transition-all"
        >
          {tc.back}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            isComplete
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:opacity-90'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          {tc.next}
        </button>
      </div>
    </motion.div>
  );
}
