// ═══════════════════════════════════════════════════════════════
//  DoctorTabSection — Depth 2 (lazy-loaded)
//  Phase 0: READ-ONLY view only.
//  - Patient profile summary, safety flags, recommended equipment list
//  - Patient intelligence, consultation strategy
//  - NO drag & drop (Phase 3)
//  - NO doctor memo/textarea (Phase 3)
//  - NO drop zones or drag handles
//  Props ≤ 7 | CSS rv7- prefix | NO any/unknown
// ═══════════════════════════════════════════════════════════════

import type {
  SurveyLang,
  DoctorTab,
  ReportPatientProfile,
  ReportSafetyFlag,
  EBDRecommendation,
  InjectableRecommendation,
} from '@/types/report-v7';

// ─── Status type ──────────────────────────────────────────────
type SectionStatus = 'idle' | 'loading' | 'done' | 'error';

// ─── Status messages ──────────────────────────────────────────
const STATUS_MSG: Record<string, Record<SurveyLang, string>> = {
  loading: {
    KO: '의사 브리핑을 준비하고 있습니다…',
    EN: 'Preparing doctor briefing…',
    JP: '医師ブリーフィングを準備中…',
    'ZH-CN': '正在准备医生简报…',
  },
  error: {
    KO: '의사 브리핑을 불러오지 못했습니다.',
    EN: 'Failed to load doctor briefing.',
    JP: '医師ブリーフィングの読み込みに失敗しました。',
    'ZH-CN': '加载医生简报失败。',
  },
  retry: {
    KO: '다시 시도',
    EN: 'Retry',
    JP: '再試行',
    'ZH-CN': '重试',
  },
  empty: {
    KO: '의사 브리핑이 아직 생성되지 않았습니다.',
    EN: 'Doctor briefing has not been generated yet.',
    JP: '医師ブリーフィングはまだ作成されていません。',
    'ZH-CN': '医生简报尚未生成。',
  },
};

function msg(key: string, lang: SurveyLang): string {
  return STATUS_MSG[key]?.[lang] ?? STATUS_MSG[key]?.KO ?? key;
}

// ─── Section title labels ─────────────────────────────────────
const SECTION_LABELS: Record<string, Record<SurveyLang, string>> = {
  clinicalSummary: {
    KO: '임상 요약',
    EN: 'Clinical Summary',
    JP: '臨床サマリー',
    'ZH-CN': '临床摘要',
  },
  safetyFlags: {
    KO: '안전 프로토콜',
    EN: 'Safety Protocols',
    JP: '安全プロトコル',
    'ZH-CN': '安全协议',
  },
  patientProfile: {
    KO: '환자 프로필',
    EN: 'Patient Profile',
    JP: '患者プロフィール',
    'ZH-CN': '患者档案',
  },
  equipmentList: {
    KO: '추천 장비',
    EN: 'Recommended Equipment',
    JP: '推奨機器',
    'ZH-CN': '推荐设备',
  },
  patientIntelligence: {
    KO: '환자 인텔리전스',
    EN: 'Patient Intelligence',
    JP: '患者インテリジェンス',
    'ZH-CN': '患者分析',
  },
  consultationStrategy: {
    KO: '상담 전략',
    EN: 'Consultation Strategy',
    JP: '相談戦略',
    'ZH-CN': '咨询策略',
  },
  contraindications: {
    KO: '금기 사항',
    EN: 'Contraindications',
    JP: '禁忌事項',
    'ZH-CN': '禁忌症',
  },
  alternatives: {
    KO: '대안 옵션',
    EN: 'Alternative Options',
    JP: '代替オプション',
    'ZH-CN': '替代方案',
  },
};

function label(key: string, lang: SurveyLang): string {
  return SECTION_LABELS[key]?.[lang] ?? SECTION_LABELS[key]?.KO ?? key;
}

// ─── Expectation tag colors ──────────────────────────────────
const EXPECTATION_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  REALISTIC: { bg: 'var(--green-dim)', color: 'var(--green)', border: 'rgba(74,222,128,0.15)' },
  AMBITIOUS: { bg: 'var(--amber-dim)', color: 'var(--amber)', border: 'rgba(251,191,36,0.15)' },
  CAUTION: { bg: 'var(--red-dim)', color: 'var(--red)', border: 'rgba(248,113,113,0.15)' },
};

// ─── Props ────────────────────────────────────────────────────
interface DoctorTabSectionProps {
  doctorData: DoctorTab | null;
  patient: ReportPatientProfile;
  safetyFlags: ReportSafetyFlag[];
  ebdList: EBDRecommendation[];
  injectableList: InjectableRecommendation[];
  status: SectionStatus;
  lang: SurveyLang;
}

// ─── Section title helper ─────────────────────────────────────
function SectionTitle({ text, variant }: { text: string; variant?: 'warn' | 'alt' | 'note' }) {
  return (
    <div className={`rv7-d-section-title${variant ? ` ${variant}` : ''}`}>
      {text}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────
function DoctorSkeleton({ lang }: { lang: SurveyLang }) {
  return (
    <div className="rv7-d-container">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rv7-d-section rv7-skeleton-loading"
          style={{ height: '80px', borderRadius: 'var(--radius)', marginBottom: '16px' }}
        />
      ))}
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-3)' }}>
        {msg('loading', lang)}
      </div>
    </div>
  );
}

// ─── Component (default export for lazy loading) ──────────────
export default function DoctorTabSection({
  doctorData,
  patient,
  safetyFlags,
  ebdList,
  injectableList,
  status,
  lang,
}: DoctorTabSectionProps) {
  // idle / loading
  if (status === 'idle' || status === 'loading') {
    return <DoctorSkeleton lang={lang} />;
  }

  // error
  if (status === 'error') {
    return (
      <div className="rv7-d-container" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.6 }}>⚠️</div>
        <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>
          {msg('error', lang)}
        </div>
      </div>
    );
  }

  // done but no data
  if (!doctorData) {
    return (
      <div className="rv7-d-container" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>👨‍⚕️</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
          {msg('empty', lang)}
        </div>
      </div>
    );
  }

  const intel = doctorData.patientIntelligence;
  const strategy = doctorData.consultationStrategy;
  const expectColor = EXPECTATION_COLORS[intel.expectationTag] ?? EXPECTATION_COLORS.REALISTIC;

  return (
    <div className="rv7-d-container">
      {/* ── Patient Profile Summary ── */}
      <div className="rv7-d-section">
        <div className="rv7-d-hero">
          <div className="rv7-d-hero-name">{patient.name || 'Patient'}</div>
          <div className="rv7-d-hero-meta">
            <span className="rv7-d-hero-demos">
              {patient.age} · {patient.gender} · Fitzpatrick {patient.fitzpatrick}
            </span>
          </div>
          {patient.top3Concerns.length > 0 && (
            <div className="rv7-d-hero-chips">
              {patient.top3Concerns.map((concern) => (
                <span key={concern} className="rv7-d-hchip">
                  {concern}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Clinical Summary ── */}
      {doctorData.clinicalSummary && (
        <div className="rv7-d-section">
          <SectionTitle text={label('clinicalSummary', lang)} />
          <div className="rv7-glass" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.7 }}>
              {doctorData.clinicalSummary}
            </div>
          </div>
        </div>
      )}

      {/* ── Safety Flags / Protocols ── */}
      {(safetyFlags.length > 0 || doctorData.triggeredProtocols.length > 0) && (
        <div className="rv7-d-section">
          <SectionTitle text={label('safetyFlags', lang)} variant="warn" />
          <div className="rv7-d-checklist">
            {safetyFlags.map((flag) => (
              <div key={flag.code} className="rv7-d-check-item">
                <div className={`rv7-d-check-icon ${flag.severity === 'critical' ? 'risk' : flag.severity === 'warning' ? 'caution' : 'ok'}`}>
                  {flag.severity === 'critical' ? '!' : flag.severity === 'warning' ? '⚠' : '✓'}
                </div>
                <div className="rv7-d-check-body">
                  <div className="rv7-d-check-title">{flag.code}</div>
                  <div className="rv7-d-check-desc">{flag.message}</div>
                </div>
              </div>
            ))}
            {doctorData.triggeredProtocols.map((proto) => (
              <div key={proto} className="rv7-d-check-item">
                <div className="rv7-d-check-icon caution">📋</div>
                <div className="rv7-d-check-body">
                  <div className="rv7-d-check-title">{proto}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Contraindications ── */}
      {doctorData.contraindications.length > 0 && (
        <div className="rv7-d-section">
          <SectionTitle text={label('contraindications', lang)} variant="warn" />
          <div className="rv7-d-checklist">
            {doctorData.contraindications.map((item) => (
              <div key={item} className="rv7-d-check-item">
                <div className="rv7-d-check-icon risk">✕</div>
                <div className="rv7-d-check-body">
                  <div className="rv7-d-check-title">{item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommended Equipment ── */}
      {(ebdList.length > 0 || injectableList.length > 0) && (
        <div className="rv7-d-section">
          <SectionTitle text={label('equipmentList', lang)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ebdList.map((ebd) => (
              <div key={ebd.deviceId} className="rv7-d-proto-card">
                <div className="rv7-d-proto-head">
                  <div className="rv7-d-proto-num">{ebd.rank}</div>
                  <div className="rv7-d-proto-info">
                    <div className="rv7-d-proto-name">{ebd.deviceName}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '2px' }}>
                      {ebd.moaCategoryLabel} · Evidence Lv.{ebd.evidenceLevel}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '8px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'var(--cyan-dim)',
                    color: 'var(--cyan)',
                    border: '1px solid var(--cyan-border)',
                    fontWeight: 600,
                  }}>
                    EBD
                  </span>
                </div>
              </div>
            ))}
            {injectableList.map((inj) => (
              <div key={inj.injectableId} className="rv7-d-proto-card">
                <div className="rv7-d-proto-head">
                  <div className="rv7-d-proto-num" style={{
                    background: 'rgba(251,113,133,0.08)',
                    borderColor: 'rgba(251,113,133,0.2)',
                    color: 'var(--rose)',
                  }}>
                    {inj.rank}
                  </div>
                  <div className="rv7-d-proto-info">
                    <div className="rv7-d-proto-name">{inj.name}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '2px' }}>
                      {inj.categoryLabel} · Evidence Lv.{inj.evidenceLevel}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '8px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(251,113,133,0.08)',
                    color: 'var(--rose)',
                    border: '1px solid rgba(251,113,133,0.15)',
                    fontWeight: 600,
                  }}>
                    Injectable
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Patient Intelligence ── */}
      <div className="rv7-d-section">
        <SectionTitle text={label('patientIntelligence', lang)} variant="note" />
        <div className="rv7-d-survey-grid">
          {/* Expectation */}
          <div className="rv7-d-survey-card">
            <div className="rv7-d-survey-q">Expectation</div>
            <div className="rv7-d-survey-a">{intel.expectationTag}</div>
            {intel.expectationNote && (
              <div className="rv7-d-survey-note">{intel.expectationNote}</div>
            )}
            <span
              className="rv7-d-survey-tag"
              style={{
                background: expectColor.bg,
                color: expectColor.color,
                border: `1px solid ${expectColor.border}`,
              }}
            >
              {intel.expectationTag}
            </span>
          </div>

          {/* Communication Style */}
          <div className="rv7-d-survey-card">
            <div className="rv7-d-survey-q">Communication</div>
            <div className="rv7-d-survey-a">{intel.communicationStyle}</div>
            {intel.communicationNote && (
              <div className="rv7-d-survey-note">{intel.communicationNote}</div>
            )}
          </div>

          {/* Budget Tier */}
          <div className="rv7-d-survey-card">
            <div className="rv7-d-survey-q">Budget Tier</div>
            <div className="rv7-d-survey-a">{intel.budgetTimeline.budgetTier}</div>
            <div className="rv7-d-survey-note">
              Decision: {intel.budgetTimeline.decisionSpeed} · Urgency: {intel.budgetTimeline.urgency}
            </div>
          </div>

          {/* Stay Duration */}
          {intel.budgetTimeline.stayDuration && (
            <div className="rv7-d-survey-card">
              <div className="rv7-d-survey-q">Stay Duration</div>
              <div className="rv7-d-survey-a">{intel.budgetTimeline.stayDuration}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Consultation Strategy ── */}
      {(strategy.recommendedOrder.length > 0 || strategy.scenarioSummary) && (
        <div className="rv7-d-section">
          <SectionTitle text={label('consultationStrategy', lang)} variant="alt" />

          {/* Recommended Order */}
          {strategy.recommendedOrder.length > 0 && (
            <div className="rv7-d-order-flow">
              {strategy.recommendedOrder.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div className="rv7-d-order-step">
                    <div className="rv7-dos-day">Step {idx + 1}</div>
                    <div className="rv7-dos-name">{step}</div>
                  </div>
                  {idx < strategy.recommendedOrder.length - 1 && (
                    <div className="rv7-d-order-arrow">
                      <div className="rv7-doa-line" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Expected Complaints */}
          {strategy.expectedComplaints.length > 0 && (
            <div className="rv7-d-checklist" style={{ marginTop: '12px' }}>
              {strategy.expectedComplaints.map((complaint) => (
                <div key={complaint} className="rv7-d-check-item">
                  <div className="rv7-d-check-icon caution">💬</div>
                  <div className="rv7-d-check-body">
                    <div className="rv7-d-check-desc">{complaint}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scenario Summary */}
          {strategy.scenarioSummary && (
            <div className="rv7-glass" style={{ padding: '14px 18px', marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                {strategy.scenarioSummary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Alternative Options ── */}
      {doctorData.alternativeOptions.length > 0 && (
        <div className="rv7-d-section">
          <SectionTitle text={label('alternatives', lang)} variant="alt" />
          <div className="rv7-d-alt-grid">
            {doctorData.alternativeOptions.map((alt, idx) => (
              <div key={idx} className="rv7-d-alt-card">
                <div className="rv7-d-alt-label">Alternative {idx + 1}</div>
                <div className="rv7-d-alt-name">{alt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Country Note ── */}
      {doctorData.countryNote && (
        <div className="rv7-d-section">
          <div className="rv7-d-country-insight">
            <div className="rv7-d-ci-header">
              <span className="rv7-d-ci-flag">🌍</span>
              <span className="rv7-d-ci-country">Country Note</span>
            </div>
            <div className="rv7-d-ci-note">{doctorData.countryNote}</div>
          </div>
        </div>
      )}

      {/* ── Parameter Guidance ── */}
      {Object.keys(doctorData.parameterGuidance).length > 0 && (
        <div className="rv7-d-section">
          <SectionTitle text="Parameter Guidance" />
          <div className="rv7-d-checklist">
            {Object.entries(doctorData.parameterGuidance).map(([param, guidance]) => (
              <div key={param} className="rv7-d-check-item">
                <div className="rv7-d-check-icon ok">⚙</div>
                <div className="rv7-d-check-body">
                  <div className="rv7-d-check-title">{param}</div>
                  <div className="rv7-d-check-desc">{guidance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
