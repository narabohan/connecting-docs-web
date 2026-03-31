// ═══════════════════════════════════════════════════════════════
//  BranchAdverse — Phase 3-B (S-2d)
//  꼬리질문: 부작용 상세 (유형, 시술명, 회복기간, 심각도)
//  참조: MASTER_PLAN_V4.md §3.5 BRANCH_ADVERSE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SurveyLang } from '@/types/survey-v2';
import type { AdverseBranch } from '@/hooks/useSurveyStateMachine';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

interface BranchAdverseProps {
  lang: SurveyLang;
  initialData?: AdverseBranch | null;
  onComplete: (data: AdverseBranch) => void;
  onBack: () => void;
}

type AdverseType = AdverseBranch['adverse_type'][number];
type Severity = AdverseBranch['severity'];

const ADVERSE_TYPES: { value: AdverseType; key: keyof typeof SURVEY_V2_I18N.KO.branch_adverse }[] = [
  { value: 'pih', key: 'type_pih' },
  { value: 'burn', key: 'type_burn' },
  { value: 'swelling', key: 'type_swelling' },
  { value: 'scarring', key: 'type_scarring' },
  { value: 'other', key: 'type_other' },
];

export default function BranchAdverse({ lang, initialData, onComplete, onBack }: BranchAdverseProps) {
  const t = SURVEY_V2_I18N[lang].branch_adverse;
  const tc = SURVEY_V2_I18N[lang].common;

  const [types, setTypes] = useState<AdverseType[]>(initialData?.adverse_type ?? []);
  const [device, setDevice] = useState(initialData?.adverse_device ?? '');
  const [recoveryWeeks, setRecoveryWeeks] = useState(initialData?.recovery_weeks ?? 2);
  const [severity, setSeverity] = useState<Severity>(initialData?.severity ?? 'moderate');

  const toggleType = (val: AdverseType) => {
    setTypes((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    );
  };

  const isComplete = types.length > 0 && device.trim().length > 0;

  const handleSubmit = () => {
    if (!isComplete) return;
    onComplete({
      adverse_type: types,
      adverse_device: device.trim(),
      recovery_weeks: recoveryWeeks,
      severity,
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

      {/* Adverse Types (multi-select) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">{t.type_label}</label>
        <div className="grid grid-cols-2 gap-2">
          {ADVERSE_TYPES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleType(opt.value)}
              className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                types.includes(opt.value)
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 border'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {t[opt.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Device */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{t.device_label}</label>
        <input
          type="text"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          placeholder="e.g., Pico Laser, IPL"
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
        />
      </div>

      {/* Recovery Weeks */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{t.recovery_label}</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={24}
            value={recoveryWeeks}
            onChange={(e) => setRecoveryWeeks(parseInt(e.target.value))}
            className="flex-1 accent-amber-500"
          />
          <span className="text-lg font-bold text-amber-400 min-w-[3rem] text-center">
            {recoveryWeeks}
          </span>
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">{t.severity_label}</label>
        <div className="grid grid-cols-3 gap-2">
          {(['mild', 'moderate', 'severe'] as const).map((val) => (
            <button
              key={val}
              onClick={() => setSeverity(val)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                severity === val
                  ? val === 'mild' ? 'bg-green-500/15 border-green-500/40 text-green-400 border'
                  : val === 'severe' ? 'bg-red-500/15 border-red-500/40 text-red-400 border'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400 border'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {t[`severity_${val}`]}
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
