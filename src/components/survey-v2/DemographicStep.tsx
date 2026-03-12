import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Demographics, Gender, AgeRange, SurveyLang } from '@/types/survey-v2';
import {
  SURVEY_V2_I18N,
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  getDefaultLang,
} from '@/utils/survey-v2-i18n';

interface DemographicStepProps {
  demographics: Demographics;
  onChange: (d: Demographics) => void;
  onNext: () => void;
  lang: SurveyLang;
}

const GENDERS: { id: Gender; key: 'gender_female' | 'gender_male' | 'gender_other' }[] = [
  { id: 'female', key: 'gender_female' },
  { id: 'male', key: 'gender_male' },
  { id: 'other', key: 'gender_other' },
];

const AGE_RANGES: { id: AgeRange; key: keyof typeof SURVEY_V2_I18N.KO.step1 }[] = [
  { id: 'teen', key: 'age_teen' },
  { id: '20s', key: 'age_20s' },
  { id: '30s', key: 'age_30s' },
  { id: '40s', key: 'age_40s' },
  { id: '50s', key: 'age_50s' },
  { id: '60+', key: 'age_60plus' },
];

export default function DemographicStep({ demographics, onChange, onNext, lang }: DemographicStepProps) {
  const t = SURVEY_V2_I18N[lang].step1;
  const tc = SURVEY_V2_I18N[lang].common;
  const [countryOpen, setCountryOpen] = useState(false);

  // IP-based country detection
  useEffect(() => {
    if (demographics.detected_country) return; // already set
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const code = data.country_code || 'OTHER';
        const detectedLang = getDefaultLang(code);
        onChange({
          ...demographics,
          detected_country: code,
          detected_language: detectedLang,
        });
      })
      .catch(() => {
        // fallback to EN
        onChange({ ...demographics, detected_country: 'OTHER', detected_language: 'EN' });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isComplete = demographics.d_gender && demographics.d_age && demographics.detected_country;

  const handleGender = (g: Gender) => onChange({ ...demographics, d_gender: g });
  const handleAge = (a: AgeRange) => onChange({ ...demographics, d_age: a });
  const handleCountry = (code: string) => {
    const newLang = getDefaultLang(code);
    onChange({ ...demographics, detected_country: code, detected_language: newLang });
    setCountryOpen(false);
  };
  const handleLang = (l: SurveyLang) => onChange({ ...demographics, detected_language: l });

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 px-1"
    >
      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-gray-900 whitespace-pre-line">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">{t.gender_label}</label>
        <div className="flex gap-3">
          {GENDERS.map(g => (
            <button
              key={g.id}
              onClick={() => handleGender(g.id)}
              className={cn(
                'flex-1 py-3 rounded-lg text-sm font-medium transition-all',
                'min-h-[44px]',
                demographics.d_gender === g.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {t[g.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">{t.age_label}</label>
        <div className="grid grid-cols-3 gap-2">
          {AGE_RANGES.map(a => (
            <button
              key={a.id}
              onClick={() => handleAge(a.id)}
              className={cn(
                'py-3 rounded-lg text-sm font-medium transition-all',
                'min-h-[44px]',
                demographics.d_age === a.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {t[a.key] as string}
            </button>
          ))}
        </div>
      </div>

      {/* Country Selector */}
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 mb-2 block">{t.country_label}</label>
        <button
          onClick={() => setCountryOpen(!countryOpen)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all min-h-[44px]"
        >
          <span>
            {COUNTRY_OPTIONS.find(c => c.code === demographics.detected_country)?.flag || '🌏'}{' '}
            {COUNTRY_OPTIONS.find(c => c.code === demographics.detected_country)?.label[lang] || demographics.detected_country}
          </span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', countryOpen && 'rotate-180')} />
        </button>
        {countryOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {COUNTRY_OPTIONS.map(c => (
              <button
                key={c.code}
                onClick={() => handleCountry(c.code)}
                className={cn(
                  'w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm',
                  demographics.detected_country === c.code && 'bg-blue-50 text-blue-600 font-medium'
                )}
              >
                {c.flag} {c.label[lang]}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Language Selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">{t.language_label}</label>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map(l => (
            <button
              key={l.code}
              onClick={() => handleLang(l.code)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                'min-h-[44px]',
                demographics.detected_language === l.code
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!isComplete}
        className={cn(
          'w-full py-3.5 rounded-xl text-base font-semibold transition-all min-h-[48px]',
          isComplete
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        {tc.next}
      </button>
    </motion.div>
  );
}
