// ═══════════════════════════════════════════════════════════════
//  Report v7 — SafetyFlags (Depth 0)
//  Safety warning banners: CRITICAL / WARNING / INFO
//  Props ≤ 2: flags, lang
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang, ReportSafetyFlag } from '@/types/report-v7';

// ─── Severity config ──────────────────────────────────────────
interface SeverityConfig {
  icon: string;
  colorClass: string;
  borderColor: string;
  bgColor: string;
}

const SEVERITY_MAP: Record<ReportSafetyFlag['severity'], SeverityConfig> = {
  critical: {
    icon: '🚨',
    colorClass: 'rv7-red',
    borderColor: 'rgba(248,113,113,0.3)',
    bgColor: 'var(--red-dim)',
  },
  warning: {
    icon: '⚠️',
    colorClass: 'rv7-amber',
    borderColor: 'rgba(251,191,36,0.3)',
    bgColor: 'var(--amber-dim)',
  },
  info: {
    icon: 'ℹ️',
    colorClass: 'rv7-cyan',
    borderColor: 'rgba(34,211,238,0.2)',
    bgColor: 'var(--cyan-dim)',
  },
};

// ─── Sort order: critical → warning → info ────────────────────
const SEVERITY_ORDER: Record<ReportSafetyFlag['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// ─── Props ────────────────────────────────────────────────────
interface SafetyFlagsProps {
  flags: ReportSafetyFlag[];
  lang: SurveyLang;
}

// ─── Component ────────────────────────────────────────────────
export function SafetyFlags({ flags }: SafetyFlagsProps) {
  if (flags.length === 0) return null;

  const sorted = [...flags].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
      {sorted.map((flag) => {
        const cfg = SEVERITY_MAP[flag.severity];
        return (
          <div
            key={flag.code}
            className="rv7-glass"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderColor: cfg.borderColor,
              background: cfg.bgColor,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                  marginBottom: '2px',
                }}
              >
                <span className={`rv7-neon-tag ${cfg.colorClass}`}>
                  {flag.severity}
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text)',
                  lineHeight: 1.6,
                }}
              >
                {flag.message}
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--text-3)',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                }}
              >
                {flag.code}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
