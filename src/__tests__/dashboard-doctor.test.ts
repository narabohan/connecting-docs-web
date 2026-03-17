// ═══════════════════════════════════════════════════════════════
//  Doctor Dashboard Unit Tests — Phase 2 (G-3)
//
//  Tests:
//  1. DoctorStats — isToday helper
//  2. PatientQueue — filter by status
//  3. PatientQueue — sort by date / status
//  4. PlanEditor — status transition validation (canTransition)
//  5. PlanEditor — getNextStatus flow
//  6. i18n — dashboard.doctor keys exist in all 4 locales
//  7. Treatment plan status order — no regression
//
//  Environment: node (no React rendering — logic-only tests)
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

export {};

import { PLAN_STATUS_ORDER, type PlanStatus } from '@/schemas/treatment-plan';

// ─── Import locale files directly ────────────────────────────
import koLocale from '@/i18n/locales/ko.json';
import enLocale from '@/i18n/locales/en.json';
import jaLocale from '@/i18n/locales/ja.json';
import zhCNLocale from '@/i18n/locales/zh-CN.json';

// ─── Types for queue filtering (mirrors usePatientQueue logic) ─

interface PlanSummary {
  planId: string;
  patientId: string;
  status: PlanStatus;
  createdAt: string;
  patientGoal: string;
  patientCountry: string;
  phasesCount: number;
}

type StatusFilter = 'all' | PlanStatus;
type SortField = 'date' | 'status';
type SortOrder = 'asc' | 'desc';

// ─── Pure filter/sort functions (extracted from usePatientQueue) ─

function filterPlans(plans: PlanSummary[], status: StatusFilter, search: string): PlanSummary[] {
  let filtered = plans;

  if (status !== 'all') {
    filtered = filtered.filter((p) => p.status === status);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.planId.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.patientGoal.toLowerCase().includes(q) ||
        p.patientCountry.toLowerCase().includes(q),
    );
  }

  return filtered;
}

function sortPlans(plans: PlanSummary[], field: SortField, order: SortOrder): PlanSummary[] {
  const sorted = [...plans];
  sorted.sort((a, b) => {
    let cmp: number;
    if (field === 'date') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = PLAN_STATUS_ORDER[a.status] - PLAN_STATUS_ORDER[b.status];
    }
    return order === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ─── canTransition / getNextStatus (mirrors usePlanEditor) ───

function canTransition(currentStatus: PlanStatus, targetStatus: PlanStatus): boolean {
  return PLAN_STATUS_ORDER[targetStatus] > PLAN_STATUS_ORDER[currentStatus];
}

function getNextStatus(currentStatus: PlanStatus): PlanStatus | null {
  switch (currentStatus) {
    case 'draft':
      return 'doctor_review';
    case 'doctor_review':
      return 'approved';
    case 'approved':
      return 'sent';
    case 'sent':
      return null;
    default:
      return null;
  }
}

// ─── isToday helper (mirrors doctor-stats API) ──────────────

function isToday(dateString: string): boolean {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// ─── Locale type helper ──────────────────────────────────────

interface DashboardDoctorKeys {
  dashboard?: {
    doctor?: Record<string, string>;
  };
}

// ═══════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════

const SAMPLE_PLANS: PlanSummary[] = [
  {
    planId: 'tp_001',
    patientId: 'patient_a',
    status: 'draft',
    createdAt: '2026-03-15T10:00:00.000Z',
    patientGoal: 'Skin tightening',
    patientCountry: 'KR',
    phasesCount: 2,
  },
  {
    planId: 'tp_002',
    patientId: 'patient_b',
    status: 'doctor_review',
    createdAt: '2026-03-16T08:00:00.000Z',
    patientGoal: 'Acne scar removal',
    patientCountry: 'US',
    phasesCount: 3,
  },
  {
    planId: 'tp_003',
    patientId: 'patient_c',
    status: 'approved',
    createdAt: '2026-03-14T12:00:00.000Z',
    patientGoal: 'Anti-aging',
    patientCountry: 'JP',
    phasesCount: 4,
  },
  {
    planId: 'tp_004',
    patientId: 'patient_d',
    status: 'sent',
    createdAt: '2026-03-17T06:00:00.000Z',
    patientGoal: 'Pigmentation treatment',
    patientCountry: 'CN',
    phasesCount: 1,
  },
];

// ─── Test 1: isToday helper ──────────────────────────────────

describe('isToday helper', () => {
  it('should return true for today date', () => {
    const now = new Date().toISOString();
    expect(isToday(now)).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday.toISOString())).toBe(false);
  });
});

// ─── Test 2: PatientQueue filter by status ───────────────────

describe('PatientQueue — filter by status', () => {
  it('should return all plans when filter is "all"', () => {
    const result = filterPlans(SAMPLE_PLANS, 'all', '');
    expect(result).toHaveLength(4);
  });

  it('should filter by draft status', () => {
    const result = filterPlans(SAMPLE_PLANS, 'draft', '');
    expect(result).toHaveLength(1);
    expect(result[0].planId).toBe('tp_001');
  });

  it('should filter by doctor_review status', () => {
    const result = filterPlans(SAMPLE_PLANS, 'doctor_review', '');
    expect(result).toHaveLength(1);
    expect(result[0].planId).toBe('tp_002');
  });

  it('should return empty array when no plans match', () => {
    const result = filterPlans([], 'draft', '');
    expect(result).toHaveLength(0);
  });

  it('should filter by search query on patientGoal', () => {
    const result = filterPlans(SAMPLE_PLANS, 'all', 'acne');
    expect(result).toHaveLength(1);
    expect(result[0].planId).toBe('tp_002');
  });

  it('should filter by search query on patientCountry', () => {
    const result = filterPlans(SAMPLE_PLANS, 'all', 'JP');
    expect(result).toHaveLength(1);
    expect(result[0].planId).toBe('tp_003');
  });

  it('should combine status filter and search', () => {
    const result = filterPlans(SAMPLE_PLANS, 'approved', 'anti');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('approved');
  });
});

// ─── Test 3: PatientQueue sort ───────────────────────────────

describe('PatientQueue — sort', () => {
  it('should sort by date ascending', () => {
    const result = sortPlans(SAMPLE_PLANS, 'date', 'asc');
    expect(result[0].planId).toBe('tp_003'); // Mar 14
    expect(result[3].planId).toBe('tp_004'); // Mar 17
  });

  it('should sort by date descending', () => {
    const result = sortPlans(SAMPLE_PLANS, 'date', 'desc');
    expect(result[0].planId).toBe('tp_004'); // Mar 17
    expect(result[3].planId).toBe('tp_003'); // Mar 14
  });

  it('should sort by status ascending (draft → sent)', () => {
    const result = sortPlans(SAMPLE_PLANS, 'status', 'asc');
    expect(result[0].status).toBe('draft');
    expect(result[3].status).toBe('sent');
  });

  it('should sort by status descending (sent → draft)', () => {
    const result = sortPlans(SAMPLE_PLANS, 'status', 'desc');
    expect(result[0].status).toBe('sent');
    expect(result[3].status).toBe('draft');
  });
});

// ─── Test 4: PlanEditor — canTransition ──────────────────────

describe('PlanEditor — canTransition (no regression)', () => {
  it('should allow draft → doctor_review', () => {
    expect(canTransition('draft', 'doctor_review')).toBe(true);
  });

  it('should allow doctor_review → approved', () => {
    expect(canTransition('doctor_review', 'approved')).toBe(true);
  });

  it('should allow approved → sent', () => {
    expect(canTransition('approved', 'sent')).toBe(true);
  });

  it('should NOT allow approved → draft (regression)', () => {
    expect(canTransition('approved', 'draft')).toBe(false);
  });

  it('should NOT allow sent → approved (regression)', () => {
    expect(canTransition('sent', 'approved')).toBe(false);
  });

  it('should NOT allow same status transition', () => {
    expect(canTransition('draft', 'draft')).toBe(false);
  });

  it('should allow draft → approved (skip)', () => {
    expect(canTransition('draft', 'approved')).toBe(true);
  });

  it('should allow draft → sent (skip)', () => {
    expect(canTransition('draft', 'sent')).toBe(true);
  });
});

// ─── Test 5: PlanEditor — getNextStatus ──────────────────────

describe('PlanEditor — getNextStatus', () => {
  it('draft → doctor_review', () => {
    expect(getNextStatus('draft')).toBe('doctor_review');
  });

  it('doctor_review → approved', () => {
    expect(getNextStatus('doctor_review')).toBe('approved');
  });

  it('approved → sent', () => {
    expect(getNextStatus('approved')).toBe('sent');
  });

  it('sent → null (terminal)', () => {
    expect(getNextStatus('sent')).toBeNull();
  });
});

// ─── Test 6: i18n — dashboard.doctor keys in all locales ────

describe('i18n — dashboard.doctor keys', () => {
  const REQUIRED_KEYS = [
    'title',
    'overview',
    'patients',
    'plans',
    'settings',
    'stat_today',
    'stat_pending',
    'stat_approved',
    'stat_total',
    'queue_title',
    'queue_empty',
    'approve_plan',
    'send_to_patient',
    'doctor_note',
    'update_success',
    'status_draft',
    'status_review',
    'status_approved',
    'status_sent',
  ];

  const locales: Record<string, DashboardDoctorKeys> = {
    ko: koLocale,
    en: enLocale,
    ja: jaLocale,
    'zh-CN': zhCNLocale,
  };

  for (const [langCode, locale] of Object.entries(locales)) {
    it(`should have dashboard.doctor keys in ${langCode} locale`, () => {
      const doctorKeys = locale.dashboard?.doctor;
      expect(doctorKeys).toBeDefined();
      for (const key of REQUIRED_KEYS) {
        expect(doctorKeys?.[key]).toBeDefined();
        expect(typeof doctorKeys?.[key]).toBe('string');
        expect((doctorKeys?.[key] ?? '').length).toBeGreaterThan(0);
      }
    });
  }
});

// ─── Test 7: PLAN_STATUS_ORDER — monotonic increasing ────────

describe('PLAN_STATUS_ORDER — monotonic', () => {
  it('should have strictly increasing order: draft < doctor_review < approved < sent', () => {
    expect(PLAN_STATUS_ORDER.draft).toBeLessThan(PLAN_STATUS_ORDER.doctor_review);
    expect(PLAN_STATUS_ORDER.doctor_review).toBeLessThan(PLAN_STATUS_ORDER.approved);
    expect(PLAN_STATUS_ORDER.approved).toBeLessThan(PLAN_STATUS_ORDER.sent);
  });
});
