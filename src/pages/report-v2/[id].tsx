// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Report v2 Page
//  Reads Opus recommendation from sessionStorage (set by useSurveyV2)
//  Renders report-v7-premium.html with i18n + safety flags
// ═══════════════════════════════════════════════════════════════

import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { Loader2, Download, Share2, Stethoscope, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { OpusRecommendationOutput } from '@/pages/api/survey-v2/final-recommendation';
import type { SafetyFlag, SurveyLang } from '@/types/survey-v2';
import { generateReportDataBindings } from '@/utils/report-v7-render';
import SkinLayerDiagram from '@/components/report-v2/SkinLayerDiagram';

// Dynamic import — recharts uses window/document internally
const RadarChart = dynamic(() => import('@/components/report-v2/RadarChart'), { ssr: false });

// ─── Types ─────────────────────────────────────────────────────

interface ReportPayload {
  recommendation: OpusRecommendationOutput;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  survey_state: {
    demographics: { detected_language: SurveyLang; detected_country: string; d_gender: string; d_age: string };
    safety_flags: SafetyFlag[];
    open_question_raw: string;
  };
  created_at: string;
}

type ReportTab = 'patient' | 'doctor';

// ─── Component ─────────────────────────────────────────────────

export default function ReportV2Page() {
  const router = useRouter();
  const { id } = router.query;

  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('patient');

  // Doctor access check
  const isDoctor = router.query.role === 'doctor';

  // ─── Load report data from sessionStorage ──────────────────
  useEffect(() => {
    if (!id) return;

    try {
      const raw = typeof window !== 'undefined'
        ? sessionStorage.getItem('connectingdocs_v2_report')
        : null;

      if (!raw) {
        setError('Report data not found. Please complete the survey first.');
        setLoading(false);
        return;
      }

      const data: ReportPayload = JSON.parse(raw);
      setPayload(data);

      // If accessed with doctor role, default to doctor tab
      if (isDoctor) setActiveTab('doctor');
    } catch (err) {
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [id, isDoctor]);

  // ─── Derived values ────────────────────────────────────────
  const lang = payload?.survey_state.demographics.detected_language ?? 'EN';
  const rec = payload?.recommendation;

  const patientName = rec
    ? `${rec.patient.age} ${rec.patient.gender}, ${rec.patient.country}`
    : '';

  const tabLabel = {
    patient: { KO: '환자 리포트', EN: 'Patient Report', JP: '患者レポート', 'ZH-CN': '患者报告' },
    doctor: { KO: '의사 전용', EN: 'Doctor Panel', JP: '医師パネル', 'ZH-CN': '医生面板' },
  };

  // ─── Export handler (placeholder) ──────────────────────────
  const handleExport = useCallback(async () => {
    // TODO: Implement PDF export via report-v7-premium.html + Puppeteer or client-side print
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  // ─── Share handler (placeholder) ───────────────────────────
  const handleShare = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'ConnectingDocs Report',
        url: window.location.href,
      }).catch(() => { /* user cancelled */ });
    }
  }, []);

  // ─── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">
            {lang === 'KO' ? '리포트를 불러오는 중...' :
             lang === 'JP' ? 'レポートを読み込み中...' :
             lang === 'ZH-CN' ? '正在加载报告...' :
             'Loading your report...'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────
  if (error || !rec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-500 mb-4">{error || 'Report not available'}</p>
          <button
            onClick={() => router.push('/survey-v2')}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            {lang === 'KO' ? '설문 다시 시작' : 'Start Survey Again'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Report ───────────────────────────────────────────
  return (
    <>
      <Head>
        <title>ConnectingDocs Report | {rec.patient.aesthetic_goal}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-800">ConnectingDocs</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                v2 Premium
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-1.5 bg-slate-800 text-white text-sm rounded-full hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
            {(['patient', 'doctor'] as ReportTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'doctor' && !isDoctor) return;
                  setActiveTab(tab);
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : tab === 'doctor' && !isDoctor
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                disabled={tab === 'doctor' && !isDoctor}
              >
                {tab === 'patient' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                {tabLabel[tab][lang] || tabLabel[tab]['EN']}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          {activeTab === 'patient' ? (
            <PatientReportContent recommendation={rec} lang={lang} safetyFlags={payload.survey_state.safety_flags} />
          ) : (
            <DoctorReportContent recommendation={rec} lang={lang} safetyFlags={payload.survey_state.safety_flags} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/60 backdrop-blur-sm py-6 text-center text-xs text-slate-400">
          <p>Generated by ConnectingDocs AI • {rec.model} • {payload.created_at.split('T')[0]}</p>
          <p className="mt-1">This report is for pre-consultation reference only. Final treatment decisions should be made with your physician.</p>
        </footer>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Patient Tab Content
// ═══════════════════════════════════════════════════════════════

interface TabContentProps {
  recommendation: OpusRecommendationOutput;
  lang: SurveyLang;
  safetyFlags: SafetyFlag[];
}

function PatientReportContent({ recommendation, lang, safetyFlags }: TabContentProps) {
  const rec = recommendation;
  const t = (ko: string, en: string) => lang === 'KO' ? ko : en;

  return (
    <div className="space-y-8">
      {/* Patient Profile Summary */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          {t('환자 프로필', 'Patient Profile')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <ProfileItem label={t('연령', 'Age')} value={rec.patient.age} />
          <ProfileItem label={t('성별', 'Gender')} value={rec.patient.gender} />
          <ProfileItem label={t('국가', 'Country')} value={rec.patient.country} />
          <ProfileItem label={t('목표', 'Goal')} value={rec.patient.aesthetic_goal} />
        </div>
        {rec.patient.top3_concerns.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {rec.patient.top3_concerns.map((c, i) => (
              <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                {c}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Safety Alerts */}
      {safetyFlags.length > 0 && (
        <SafetyAlertBanner flags={safetyFlags} lang={lang} />
      )}

      {/* EBD Device Recommendations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {t('추천 EBD 장비', 'Recommended EBD Devices')}
        </h2>
        {rec.ebd_recommendations.map((device, i) => (
          <DeviceCard key={device.device_id} device={device} rank={i + 1} lang={lang} />
        ))}
      </section>

      {/* Injectable Recommendations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {t('추천 주사제', 'Recommended Injectables')}
        </h2>
        {rec.injectable_recommendations.map((inj, i) => (
          <InjectableCard key={inj.injectable_id} injectable={inj} rank={i + 1} lang={lang} />
        ))}
      </section>

      {/* Signature Solutions */}
      {rec.signature_solutions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {t('시그니처 솔루션', 'Signature Solutions')}
          </h2>
          {rec.signature_solutions.map((sig, i) => (
            <SignatureCard key={i} solution={sig} lang={lang} />
          ))}
        </section>
      )}

      {/* Treatment Plan */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {t('치료 플랜', 'Treatment Plan')}
        </h2>
        <div className="space-y-4">
          {rec.treatment_plan.phases.map((phase, i) => (
            <div key={i} className="border-l-4 border-blue-400 pl-4">
              <h3 className="font-medium text-slate-700">Phase {phase.phase}: {phase.name}</h3>
              <p className="text-sm text-slate-500 mb-1">{phase.period}</p>
              <p className="text-sm text-slate-500 mb-2">{phase.goal}</p>
              <ul className="space-y-1">
                {phase.treatments.map((tx, j) => (
                  <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                    {tx}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Homecare */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {t('홈케어 가이드', 'Homecare Guide')}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <HomecareBlock title={t('모닝 루틴', 'Morning Routine')} items={rec.homecare.morning} emoji="🌅" />
          <HomecareBlock title={t('이브닝 루틴', 'Evening Routine')} items={rec.homecare.evening} emoji="🌙" />
          {rec.homecare.weekly.length > 0 && (
            <HomecareBlock title={t('주간 케어', 'Weekly Care')} items={rec.homecare.weekly} emoji="📅" />
          )}
          {rec.homecare.avoid.length > 0 && (
            <HomecareBlock title={t('금지 사항', 'Avoid')} items={rec.homecare.avoid} emoji="⛔" />
          )}
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Doctor Tab Content
// ═══════════════════════════════════════════════════════════════

function DoctorReportContent({ recommendation, lang, safetyFlags }: TabContentProps) {
  const doc = recommendation.doctor_tab;

  return (
    <div className="space-y-6">
      {/* Clinical Summary */}
      <section className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-indigo-500">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Clinical Summary</h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{doc.clinical_summary}</p>
      </section>

      {/* Triggered Protocols */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Triggered Protocols</h2>
        <div className="flex flex-wrap gap-2">
          {doc.triggered_protocols.map((p) => (
            <span key={p} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-lg font-mono">
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* Country Context Note */}
      {doc.country_note && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-1">Country Context</h3>
          <p className="text-sm text-amber-700">{doc.country_note}</p>
        </section>
      )}

      {/* Safety Flags (Clinical) */}
      {safetyFlags.length > 0 && doc.contraindications && doc.contraindications.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Contraindications</h2>
          <div className="space-y-2">
            {doc.contraindications.map((note, i) => (
              <div key={i} className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                {note}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Parameter Guidance */}
      {doc.parameter_guidance && Object.keys(doc.parameter_guidance).length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Parameter Guidance</h2>
          <div className="space-y-3">
            {Object.entries(doc.parameter_guidance).map(([device, note], i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-700 text-sm">{device}</p>
                <p className="text-xs text-slate-500 mt-1">{note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alternative Options */}
      {doc.alternative_options && doc.alternative_options.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Alternative Options</h2>
          <div className="space-y-2">
            {doc.alternative_options.map((alt, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                {alt}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Sub-Components
// ═══════════════════════════════════════════════════════════════

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-slate-400 block">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}

function SafetyAlertBanner({ flags, lang }: { flags: SafetyFlag[]; lang: SurveyLang }) {
  const dangerFlags: SafetyFlag[] = ['SAFETY_ISOTRETINOIN', 'SAFETY_ANTICOAGULANT', 'SAFETY_PREGNANCY'];
  const hasDanger = flags.some(f => dangerFlags.includes(f));

  return (
    <div className={`rounded-2xl p-4 ${hasDanger ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
      <p className={`text-sm font-medium ${hasDanger ? 'text-red-800' : 'text-amber-800'}`}>
        {lang === 'KO' ? '안전 알림' : 'Safety Alert'}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {flags.map((f) => (
          <span
            key={f}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              dangerFlags.includes(f) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {f.replace('SAFETY_', '')}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DeviceCardProps {
  device: OpusRecommendationOutput['ebd_recommendations'][number];
  rank: number;
  lang: SurveyLang;
}

function DeviceCard({ device, rank, lang }: DeviceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {rank}
              </span>
              <h3 className="text-base font-semibold text-slate-800">{device.device_name}</h3>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{device.subtitle}</p>
          </div>
          {device.badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              {device.badge}
            </span>
          )}
        </div>
        <div className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: device.summary_html }} />

        {/* Metrics row */}
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span>Evidence: {device.evidence_level}/10</span>
          <span>Confidence: {device.confidence}%</span>
          <span>Pain: {device.pain_level}/5</span>
          <span>Downtime: {device.downtime_level}/5</span>
        </div>

        {/* Target tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {device.target_tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">{tag}</span>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-blue-600 text-xs hover:text-blue-700"
        >
          {expanded ? (lang === 'KO' ? '접기' : 'Show less') : (lang === 'KO' ? '자세히' : 'Details')}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-4">
            {/* Radar Chart + Skin Layer side by side */}
            <div className="grid md:grid-cols-2 gap-4">
              {device.scores && Object.keys(device.scores).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    {lang === 'KO' ? '스코어 레이더' : 'Score Radar'}
                  </p>
                  <RadarChart scores={device.scores} deviceName={device.device_name} lang={lang} />
                </div>
              )}
              {device.skin_layer && (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">
                    {lang === 'KO' ? '타겟 피부층' : 'Target Skin Layer'}
                  </p>
                  <SkinLayerDiagram
                    targetLayers={[device.skin_layer]}
                    lang={lang}
                    deviceNames={[device.device_name]}
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">
                {lang === 'KO' ? '왜 나에게 맞는가' : 'Why This Fits You'}
              </p>
              <div className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: device.why_fit_html }} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">MOA</p>
              <p className="text-sm text-slate-600">{device.moa_summary_short}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
              <div><span className="block text-slate-400">Sessions</span>{device.practical.sessions}</div>
              <div><span className="block text-slate-400">Interval</span>{device.practical.interval}</div>
              <div><span className="block text-slate-400">Duration</span>{device.practical.duration}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface InjectableCardProps {
  injectable: OpusRecommendationOutput['injectable_recommendations'][number];
  rank: number;
  lang: SurveyLang;
}

function InjectableCard({ injectable, rank, lang }: InjectableCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-start gap-3">
        <span className="w-6 h-6 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
          {rank}
        </span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-800">{injectable.name}</h3>
          <p className="text-sm text-slate-500">{injectable.category}</p>
          <div className="text-sm text-slate-600 mt-2" dangerouslySetInnerHTML={{ __html: injectable.summary_html }} />
          {injectable.skin_layer && (
            <p className="text-xs text-slate-400 mt-2">Target: {injectable.skin_layer}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SignatureCardProps {
  solution: OpusRecommendationOutput['signature_solutions'][number];
  lang: SurveyLang;
}

function SignatureCard({ solution, lang }: SignatureCardProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5">
      <h3 className="font-semibold text-indigo-800">{solution.name}</h3>
      <p className="text-sm text-indigo-600 mt-1">{solution.description}</p>
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-indigo-500">
        {solution.devices.length > 0 && <span>EBD: {solution.devices.join(', ')}</span>}
        {solution.injectables.length > 0 && <span>Injectable: {solution.injectables.join(', ')}</span>}
        <span>Synergy: {solution.synergy_score}/10</span>
        {solution.total_sessions && <span>Sessions: {solution.total_sessions}</span>}
      </div>
    </div>
  );
}

function HomecareBlock({ title, items, emoji }: { title: string; items: string[]; emoji: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-700 mb-2">{emoji} {title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="w-1 h-1 bg-slate-300 rounded-full mt-2 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
