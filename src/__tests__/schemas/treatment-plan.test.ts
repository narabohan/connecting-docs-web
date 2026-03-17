// ═══════════════════════════════════════════════════════════════
//  treatment-plan.test.ts — Phase 2 (G-2)
//  TreatmentPlan Zod 스키마 검증 테스트
// ═══════════════════════════════════════════════════════════════

import {
  TreatmentPlanSchema,
  PlanStatusSchema,
  ConcernSchema,
  PlanPhaseSchema,
  GeneratePlanRequestSchema,
  PatchPlanRequestSchema,
  parseTreatmentPlan,
  generatePlanId,
  PLAN_STATUS_ORDER,
  type TreatmentPlanData,
  type PlanStatus,
} from '@/schemas/treatment-plan';

// ─── Test Fixtures ───────────────────────────────────────────

function createMinimalPlan(): Record<string, unknown> {
  return {
    planId: 'tp_test_abc123',
    name: { ko: '', en: '', ja: '', zh: '' },
    mechanism: { ko: '', en: '', ja: '', zh: '' },
  };
}

function createFullPlan(): Record<string, unknown> {
  return {
    planId: 'tp_test_full001',
    reportId: 'rpt_12345',
    patientId: 'user_abc',
    doctorId: 'doc_xyz',
    status: 'draft',
    concerns: [
      { concern: '기미', severity: 'moderate', area: 'cheek', patientPriority: 1 },
      { concern: '주름', severity: 'mild', area: 'forehead', patientPriority: 2 },
    ],
    recommendations: {
      ebdDevices: [
        { rank: 1, deviceName: 'PicoPlus', deviceId: 'picoplus', confidence: 85, painLevel: 2, downtimeLevel: 1 },
      ],
      injectables: [
        { rank: 1, name: 'Botox', injectableId: 'botox', category: 'toxin', confidence: 90 },
      ],
      signatureSolutions: [
        { name: 'Glow Combo', devices: ['picoplus'], injectables: ['botox'] },
      ],
    },
    timeline: {
      planType: 'regular',
      planTypeLabel: '3개월 집중 플랜',
      duration: '3개월',
      phases: [
        {
          phaseNumber: 1,
          timing: 'Month 1',
          timingLabel: '기반 시술',
          procedures: [
            {
              deviceOrInjectable: 'PicoPlus',
              category: 'ebd',
              reasonWhy: '기미 제거의 핵심',
              clinicalBasis: 'Picosecond laser for melasma (Level II)',
              synergyNote: '',
              downtime: '0-1일',
              estimatedCost: '₩300,000',
            },
          ],
          phaseGoal: '기반 색소 제거',
          totalDowntime: '0-1일',
          estimatedCost: '₩300,000',
          lifestyleNote: '일상생활 가능',
        },
      ],
      planRationale: '기미 집중 치료 후 유지 관리',
      seasonalNote: '겨울철 시작 최적',
    },
    estimatedCost: {
      budgetTotal: '₩900,000',
      breakdown: {
        foundationPct: 30,
        foundationLabel: '기반 시술',
        mainPct: 50,
        mainLabel: '집중 치료',
        maintenancePct: 20,
        maintenanceLabel: '유지 관리',
        roiNote: '조합 시술 20% 효율 향상',
      },
    },
    doctorModifications: [],
    createdAt: '2026-03-17T10:00:00.000Z',
    updatedAt: '2026-03-17T10:00:00.000Z',
  };
}

// ─── Schema Tests ────────────────────────────────────────────

describe('TreatmentPlanSchema', () => {
  it('parses a full plan successfully', () => {
    const result = TreatmentPlanSchema.safeParse(createFullPlan());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.planId).toBe('tp_test_full001');
      expect(result.data.status).toBe('draft');
      expect(result.data.concerns).toHaveLength(2);
      expect(result.data.timeline.phases).toHaveLength(1);
      expect(result.data.recommendations.ebdDevices).toHaveLength(1);
    }
  });

  it('applies defaults for missing optional fields', () => {
    const result = TreatmentPlanSchema.safeParse(createMinimalPlan());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
      expect(result.data.concerns).toEqual([]);
      expect(result.data.timeline.phases).toEqual([]);
      expect(result.data.doctorModifications).toEqual([]);
      expect(result.data.reportId).toBe('');
    }
  });

  it('fails when planId is missing', () => {
    const result = TreatmentPlanSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = TreatmentPlanSchema.safeParse({
      ...createMinimalPlan(),
      status: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });
});

// ─── PlanStatus Tests ────────────────────────────────────────

describe('PlanStatusSchema', () => {
  it('accepts all valid statuses', () => {
    const statuses: PlanStatus[] = ['draft', 'doctor_review', 'approved', 'sent'];
    for (const s of statuses) {
      expect(PlanStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(PlanStatusSchema.safeParse('pending').success).toBe(false);
    expect(PlanStatusSchema.safeParse('').success).toBe(false);
  });

  it('has correct status order', () => {
    expect(PLAN_STATUS_ORDER.draft).toBeLessThan(PLAN_STATUS_ORDER.doctor_review);
    expect(PLAN_STATUS_ORDER.doctor_review).toBeLessThan(PLAN_STATUS_ORDER.approved);
    expect(PLAN_STATUS_ORDER.approved).toBeLessThan(PLAN_STATUS_ORDER.sent);
  });
});

// ─── ConcernSchema Tests ─────────────────────────────────────

describe('ConcernSchema', () => {
  it('applies defaults', () => {
    const result = ConcernSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBe('moderate');
      expect(result.data.patientPriority).toBe(3);
    }
  });

  it('validates severity enum', () => {
    expect(ConcernSchema.safeParse({ severity: 'mild' }).success).toBe(true);
    expect(ConcernSchema.safeParse({ severity: 'invalid' }).success).toBe(false);
  });
});

// ─── PlanPhaseSchema Tests ───────────────────────────────────

describe('PlanPhaseSchema', () => {
  it('applies defaults for empty phase', () => {
    const result = PlanPhaseSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phaseNumber).toBe(1);
      expect(result.data.procedures).toEqual([]);
    }
  });
});

// ─── parseTreatmentPlan Tests ────────────────────────────────

describe('parseTreatmentPlan', () => {
  it('returns success with warnings for minimal plan', () => {
    const result = parseTreatmentPlan(createMinimalPlan());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.warnings).toContain('no concerns specified');
      expect(result.warnings).toContain('no treatment phases in timeline');
      expect(result.warnings).toContain('no reportId linked');
    }
  });

  it('returns success with no warnings for full plan', () => {
    const result = parseTreatmentPlan(createFullPlan());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.warnings).toHaveLength(0);
    }
  });

  it('returns error for invalid data', () => {
    const result = parseTreatmentPlan({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('validation failed');
    }
  });

  it('NEVER throws', () => {
    expect(() => parseTreatmentPlan({} as Record<string, unknown>)).not.toThrow();
    expect(() => parseTreatmentPlan({ planId: 123 } as Record<string, unknown>)).not.toThrow();
    expect(() => parseTreatmentPlan({ planId: '' })).not.toThrow();
  });
});

// ─── generatePlanId Tests ────────────────────────────────────

describe('generatePlanId', () => {
  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generatePlanId());
    }
    expect(ids.size).toBe(100);
  });

  it('starts with tp_ prefix', () => {
    const id = generatePlanId();
    expect(id.startsWith('tp_')).toBe(true);
  });

  it('has expected format', () => {
    const id = generatePlanId();
    const parts = id.split('_');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('tp');
  });
});

// ─── GeneratePlanRequestSchema Tests ─────────────────────────

describe('GeneratePlanRequestSchema', () => {
  it('validates a complete request', () => {
    const result = GeneratePlanRequestSchema.safeParse({
      reportId: 'rpt_123',
      patientId: 'user_abc',
      phaseASummary: {
        ebdDevices: [
          { rank: 1, deviceName: 'PicoPlus', deviceId: 'picoplus', confidence: 85, painLevel: 2, downtimeLevel: 1 },
        ],
        injectables: [],
        signatureSolutions: [],
        patient: {
          age: '30-39',
          gender: 'F',
          country: 'KR',
          aestheticGoal: '기미 제거',
          top3Concerns: ['기미', '주름'],
        },
      },
      lang: 'KO',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing reportId', () => {
    const result = GeneratePlanRequestSchema.safeParse({
      patientId: 'user_abc',
      phaseASummary: {
        ebdDevices: [],
        injectables: [],
        signatureSolutions: [],
        patient: { age: '30', gender: 'F', country: 'KR', aestheticGoal: '', top3Concerns: [] },
      },
    });
    expect(result.success).toBe(false);
  });

  it('defaults lang to KO', () => {
    const result = GeneratePlanRequestSchema.safeParse({
      reportId: 'rpt_123',
      patientId: 'user_abc',
      phaseASummary: {
        ebdDevices: [],
        injectables: [],
        signatureSolutions: [],
        patient: { age: '30', gender: 'F', country: 'KR', aestheticGoal: '', top3Concerns: [] },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lang).toBe('KO');
    }
  });
});

// ─── PatchPlanRequestSchema Tests ────────────────────────────

describe('PatchPlanRequestSchema', () => {
  it('accepts status-only patch', () => {
    const result = PatchPlanRequestSchema.safeParse({
      status: 'approved',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty patch', () => {
    const result = PatchPlanRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid status in patch', () => {
    const result = PatchPlanRequestSchema.safeParse({
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});
