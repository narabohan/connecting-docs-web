// ═══════════════════════════════════════════════════════════════
//  BranchSkinProfile — Phase 3-B (S-2a)
//  꼬리질문: 피부 타입 상세 (Fitzpatrick, 두께, 홍조, 민감도)
//  참조: MASTER_PLAN_V4.md §3.5 BRANCH_SKIN_PROFILE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SurveyLang } from '@/types/survey-v2';
import type { SkinProfileBranch } from '@/hooks/useSurveyStateMachine';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

interface BranchSkinProfileProps {
  lang: SurveyLang;
  initialData?: SkinProfileBranch | null;
  onComplete: (data: SkinProfileBranch) => void;
  onBack: () => void;
}

type FitzType = SkinProfileBranch['fitzpatrick_type'];
type ThicknessType = SkinProfileBranch['skin_thickness'];
type SensitivityType = SkinProfileBranch['sensitivity_level'];

const FITZ_OPTIONS: { value: NonNullable<FitzType>; key: keyof typeof SURVEY_V2_I18N.KO.branch_skin }[] = [
  { value: 'I', key: 'fitz_1' },
  { value: 'II', key: 'fitz_2' },
  { value: 'III', key: 'fitz_3' },
  { value: 'IV', key: 'fitz_4' },
  { value: 'V', key: 'fitz_5' },
  { value: 'VI', key: 'fitz_6' },
];

export default function BranchSkinProfile({ lang, initialData, onComplete, onBack }: BranchSkinProfileProps) {
  const t = SURVEY_V2_I18N[lang].branch_skin;
  const tc = SURVEY_V2_I18N[lang].common;

  const [fitzpatrick, setFitzpatrick] = useState<FitzType>(initialData?.fitzpatrick_type ?? null);
  const [thickness, setThickness] = useState<ThicknessType>(initialData?.skin_thickness ?? null);
  const [hasRedness, setHasRedness] = useState(initialData?.has_redness ?? false);
  const [sensitivity, setSensitivity] = useState<SensitivityType>(initialData?.sensitivity_level ?? null);

  const isComplete = fitzpatrick !== null && thickness !== null && sensitivity !== null;

  const handleSubmit = () => {
    if (!isComplete) return;
    onComplete({
      fitzpatrick_type: fitzpatrick,
      skin_thickness: thickness,
      has_redness: hasRedness,
      sensitivity_level: sensitivity,
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

      {/* Fitzpatrick Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">{t.fitzpatrick_label}</label>
        <div className="grid grid-cols-1 gap-2">
          {FITZ_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFitzpatrick(opt.value)}
              className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                fitzpatrick === opt.value
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 border'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {t[opt.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Thickness */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">{t.thickness_label}</label>
        <div className="grid grid-cols-3 gap-2">
          {(['thin', 'normal', 'thick'] as const).map((val) => (
            <button
              key={val}
              onClick={() => setThickness(val)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                thickness === val
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 border'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {t[`thickness_${val}`]}
            </button>
          ))}
        </div>
      </div>

      {/* Redness */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">{t.redness_label}</label>
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => setHasRedness(val)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                hasRedness === val
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 border'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {val ? t.redness_yes : t.redness_no}
            </button>
          ))}
        </div>
      </div>

      {/* Sensitivity */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">{t.sensitivity_label}</label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as const).map((val) => (
            <button
              key={val}
              onClick={() => setSensitivity(val)}
              className={`px-4 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                sensitivity === val
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 border'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {t[`sensitivity_${val}`]}
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
