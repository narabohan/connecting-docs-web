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
  { value: 'allergy', key: 'type_allergy' },
  { value: 'other', key: 'type_other' },
];

export default function BranchAdverse({ lang, initialData, onComplete, onBack }: BranchAdverseProps) {
  const t = SURVEY_V2_I18N[lang].branch_adverse;
  const tc = SURVEY_V2_I18N[lang].common;

  const [types, setTypes] = useState<AdverseType[]>(initialData?.adverse_type ?? []);
  const [device, setDevice] = useState(initialData?.adverse_device ?? '');
  const [recoveryWeeks, setRecoveryWeeks] = useState(initialData?.recovery_weeks ?? 2);
  const [severity, setSeverity] = useState<Severity>(initialData?.severity ?? 'moderate');
  const [allergyDetail, setAllergyDetail] = useState(initialData?.allergy_detail ?? '');

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
      allergy_detail: types.includes('allergy') ? allergyDetail.trim() : undefined,
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

      {/* Adverse Types (multi-select) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{t.type_label}</label>
        <div className="grid grid-cols-2 gap-2">
          {ADVERSE_TYPES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleType(opt.value)}
              className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                types.includes(opt.value)
                  ? 'bg-amber-50 border-amber-500 text-amber-700 border'
                  : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t[opt.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Allergy Detail (conditional follow-up) */}
      {types.includes('allergy') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.allergy_detail_label}</label>
          <input
            type="text"
            value={allergyDetail}
            onChange={(e) => setAllergyDetail(e.target.value)}
            placeholder={t.allergy_detail_placeholder}
            className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* Device */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.device_label}</label>
        <input
          type="text"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          placeholder="e.g., Pico Laser, IPL"
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Recovery Weeks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.recovery_label}</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={24}
            value={recoveryWeeks}
            onChange={(e) => setRecoveryWeeks(parseInt(e.target.value))}
            className="flex-1 accent-amber-500"
          />
          <span className="text-lg font-bold text-amber-600 min-w-[3rem] text-center">
            {recoveryWeeks}
          </span>
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{t.severity_label}</label>
        <div className="grid grid-cols-3 gap-2">
          {(['mild', 'moderate', 'severe'] as const).map((val) => (
            <button
              key={val}
              onClick={() => setSeverity(val)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                severity === val
                  ? val === 'mild' ? 'bg-green-50 border-green-500 text-green-700 border'
                  : val === 'severe' ? 'bg-red-50 border-red-500 text-red-700 border'
                  : 'bg-amber-50 border-amber-500 text-amber-700 border'
                  : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
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
