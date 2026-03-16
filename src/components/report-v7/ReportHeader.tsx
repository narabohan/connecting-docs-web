// ═══════════════════════════════════════════════════════════════
//  Report v7 — ReportHeader (Depth 0)
//  Patient profile: name, age, gender, country, aesthetic goal, chips
//  Props ≤ 2: patient, lang
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, ReportPatientProfile } from '@/types/report-v7';
import { useReportI18n } from './ReportI18nContext';

// ─── Country flag emoji lookup ────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
  KR: '🇰🇷', JP: '🇯🇵', CN: '🇨🇳', TW: '🇹🇼', TH: '🇹🇭',
  VN: '🇻🇳', SG: '🇸🇬', MY: '🇲🇾', ID: '🇮🇩', PH: '🇵🇭',
  US: '🇺🇸', GB: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', DE: '🇩🇪',
};

function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🌏';
}

// ─── Pain sensitivity label ───────────────────────────────────
const PAIN_LABELS: Record<SurveyLang, string[]> = {
  KO: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'],
  EN: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
  JP: ['非常に低い', '低い', '普通', '高い', '非常に高い'],
  'ZH-CN': ['非常低', '低', '中等', '高', '非常高'],
};

// ─── Props ────────────────────────────────────────────────────
interface ReportHeaderProps {
  patient: ReportPatientProfile;
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function ReportHeader({ patient, lang }: ReportHeaderProps) {
  const { t } = useReportI18n();
  const flag = getCountryFlag(patient.country);
  const painLabel = PAIN_LABELS[lang]?.[patient.painSensitivity - 1] ?? '';

  return (
    <>
      {/* Profile row */}
      <section className="rv7-p-header">
        <div className="rv7-p-avatar">
          {(patient.name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="rv7-p-name">{patient.name || 'Patient'}</div>
          <div className="rv7-p-meta">
            {patient.age} · {patient.gender} · {flag} {patient.country}
          </div>
        </div>
      </section>

      {/* Chips */}
      <div className="rv7-p-chips">
        {/* Aesthetic goal — highlight chip */}
        {patient.aestheticGoal && (
          <span className="rv7-p-chip rv7-highlight">
            <span className="rv7-pc-label">{t('label.fitScore')}</span>
            <span className="rv7-pc-val">{patient.aestheticGoal}</span>
          </span>
        )}

        {/* Top 3 concerns */}
        {patient.top3Concerns.map((concern) => (
          <span key={concern} className="rv7-p-chip">
            <span className="rv7-pc-val">{concern}</span>
          </span>
        ))}

        {/* Fitzpatrick */}
        {patient.fitzpatrick && (
          <span className="rv7-p-chip">
            <span className="rv7-pc-label">Fitz</span>
            <span className="rv7-pc-val">{patient.fitzpatrick}</span>
          </span>
        )}

        {/* Pain sensitivity */}
        {patient.painSensitivity > 0 && (
          <span className={`rv7-p-chip${patient.painSensitivity >= 4 ? ' rv7-warn' : ''}`}>
            <span className="rv7-pc-label">{t('label.pain')}</span>
            <span className="rv7-pc-val">{painLabel}</span>
          </span>
        )}

        {/* Stay duration (medical tourism) */}
        {patient.stayDuration && (
          <span className="rv7-p-chip">
            <span className="rv7-pc-label">Stay</span>
            <span className="rv7-pc-val">{patient.stayDuration}</span>
          </span>
        )}
      </div>
    </>
  );
}
