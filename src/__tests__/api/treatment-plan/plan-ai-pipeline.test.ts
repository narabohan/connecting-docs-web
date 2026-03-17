// ═══════════════════════════════════════════════════════════════
//  plan-ai-pipeline.test.ts — Phase 2 (G-2)
//  AI 파이프라인 변환 로직 테스트
// ═══════════════════════════════════════════════════════════════

import {
  transformAIPlanToData,
  buildAIRequestBody,
} from '@/services/plan-ai-pipeline';
import type { TreatmentPlanV2 } from '@/pages/api/survey-v2/treatment-plan';
import type { GeneratePlanRequest } from '@/schemas/treatment-plan';

// ─── Fixtures ────────────────────────────────────────────────

function createMockAIPlan(): TreatmentPlanV2 {
  return {
    plan_type: 'regular',
    plan_type_label: '3개월 집중 플랜',
    duration: '3개월',
    budget_total: '₩1,200,000',
    budget_breakdown: {
      foundation_pct: 30,
      foundation_label: 'RF 타이트닝 기반',
      main_pct: 50,
      main_label: '피코 토닝 + 필러',
      maintenance_pct: 20,
      maintenance_label: '유지 관리',
      roi_note: '조합 시술 시 20% 효율 향상',
    },
    phases: [
      {
        phase_number: 1,
        timing: 'Month 1',
        timing_label: '기반 시술',
        procedures: [
          {
            device_or_injectable: 'PicoPlus',
            category: 'ebd',
            reason_why: '기미 색소 분쇄의 핵심',
            clinical_basis: 'Picosecond laser Level II evidence',
            synergy_note: 'RF 후 2주 뒤 시행 최적',
            downtime: '0-1일',
            estimated_cost: '₩300,000',
          },
          {
            device_or_injectable: 'Botox',
            category: 'injectable',
            reason_why: '이마 주름 개선',
            clinical_basis: 'FDA-approved for glabellar lines',
            synergy_note: '',
            downtime: '0일',
            estimated_cost: '₩200,000',
          },
        ],
        phase_goal: '기반 색소 제거 + 주름 이완',
        total_downtime: '0-1일',
        estimated_cost: '₩500,000',
        lifestyle_note: '일상생활 가능',
      },
      {
        phase_number: 2,
        timing: 'Month 2-3',
        timing_label: '집중 치료',
        procedures: [
          {
            device_or_injectable: 'PicoPlus',
            category: 'ebd',
            reason_why: '반복 토닝으로 색소 점진적 제거',
            clinical_basis: 'Multi-session protocol',
            synergy_note: '',
            downtime: '0-1일',
            estimated_cost: '₩600,000',
          },
        ],
        phase_goal: '색소 농도 감소 70%',
        total_downtime: '0-1일',
        estimated_cost: '₩600,000',
        lifestyle_note: '자외선 차단 필수',
      },
    ],
    plan_rationale: '기미 집중 치료 → 유지 관리 전환',
    seasonal_note: '겨울 시작 최적, UV 노출 최소화',
  };
}

function createMockRequest(): GeneratePlanRequest {
  return {
    reportId: 'rpt_test_001',
    patientId: 'user_patient_abc',
    phaseASummary: {
      ebdDevices: [
        { rank: 1, deviceName: 'PicoPlus', deviceId: 'picoplus', confidence: 85, painLevel: 2, downtimeLevel: 1 },
      ],
      injectables: [
        { rank: 1, name: 'Botox', injectableId: 'botox', category: 'toxin', confidence: 90 },
      ],
      signatureSolutions: [
        { name: 'Glow Combo', devices: ['picoplus'], injectables: ['botox'] },
      ],
      safetyFlags: {},
      patient: {
        age: '30-39',
        gender: 'F',
        country: 'KR',
        aestheticGoal: '맑고 균일한 피부톤',
        top3Concerns: ['기미', '주름', '모공'],
      },
    },
    budget: { range: 'standard', type: 'per_session' },
    lang: 'KO',
  };
}

// ─── transformAIPlanToData Tests ─────────────────────────────

describe('transformAIPlanToData', () => {
  it('transforms AI plan to TreatmentPlanData correctly', () => {
    const aiPlan = createMockAIPlan();
    const request = createMockRequest();
    const result = transformAIPlanToData(aiPlan, request);

    // Identity
    expect(result.planId).toMatch(/^tp_/);
    expect(result.reportId).toBe('rpt_test_001');
    expect(result.patientId).toBe('user_patient_abc');
    expect(result.status).toBe('draft');

    // Timeline
    expect(result.timeline.planType).toBe('regular');
    expect(result.timeline.planTypeLabel).toBe('3개월 집중 플랜');
    expect(result.timeline.phases).toHaveLength(2);

    // Phase 1
    const phase1 = result.timeline.phases[0];
    expect(phase1.phaseNumber).toBe(1);
    expect(phase1.procedures).toHaveLength(2);
    expect(phase1.procedures[0].deviceOrInjectable).toBe('PicoPlus');
    expect(phase1.procedures[0].category).toBe('ebd');
    expect(phase1.procedures[1].deviceOrInjectable).toBe('Botox');

    // Cost
    expect(result.estimatedCost).toBeDefined();
    expect(result.estimatedCost?.budgetTotal).toBe('₩1,200,000');
    expect(result.estimatedCost?.breakdown.foundationPct).toBe(30);

    // Recommendations from request
    expect(result.recommendations.ebdDevices).toHaveLength(1);
    expect(result.recommendations.injectables).toHaveLength(1);
    expect(result.recommendations.signatureSolutions).toHaveLength(1);

    // Concerns from patient
    expect(result.concerns).toHaveLength(3);
    expect(result.concerns[0].concern).toBe('기미');
    expect(result.concerns[0].patientPriority).toBe(1);

    // Timestamps
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
    expect(result.doctorModifications).toEqual([]);
  });

  it('generates unique planIds for each call', () => {
    const aiPlan = createMockAIPlan();
    const request = createMockRequest();
    const plan1 = transformAIPlanToData(aiPlan, request);
    const plan2 = transformAIPlanToData(aiPlan, request);
    expect(plan1.planId).not.toBe(plan2.planId);
  });

  it('handles AI plan with empty phases', () => {
    const aiPlan = createMockAIPlan();
    aiPlan.phases = [];
    const request = createMockRequest();
    const result = transformAIPlanToData(aiPlan, request);
    expect(result.timeline.phases).toHaveLength(0);
  });

  it('preserves synergy notes and clinical basis', () => {
    const aiPlan = createMockAIPlan();
    const request = createMockRequest();
    const result = transformAIPlanToData(aiPlan, request);
    const proc = result.timeline.phases[0].procedures[0];
    expect(proc.clinicalBasis).toBe('Picosecond laser Level II evidence');
    expect(proc.synergyNote).toBe('RF 후 2주 뒤 시행 최적');
  });
});

// ─── buildAIRequestBody Tests ────────────────────────────────

describe('buildAIRequestBody', () => {
  it('converts GeneratePlanRequest to snake_case AI request', () => {
    const request = createMockRequest();
    const body = buildAIRequestBody(request);

    // Demographics
    expect(body.demographics).toEqual({ detected_language: 'KO' });

    // Budget
    const budget = body.budget as Record<string, string>;
    expect(budget.range).toBe('standard');

    // Phase A summary
    const summary = body.phase_a_summary as Record<string, unknown>;
    const devices = summary.ebd_devices as Array<Record<string, unknown>>;
    expect(devices).toHaveLength(1);
    expect(devices[0].device_name).toBe('PicoPlus');
    expect(devices[0].device_id).toBe('picoplus');

    // Patient
    const patient = summary.patient as Record<string, unknown>;
    expect(patient.aesthetic_goal).toBe('맑고 균일한 피부톤');
    expect(patient.top3_concerns).toEqual(['기미', '주름', '모공']);
  });

  it('handles optional fields as null', () => {
    const request: GeneratePlanRequest = {
      reportId: 'rpt_test',
      patientId: 'user_test',
      phaseASummary: {
        ebdDevices: [],
        injectables: [],
        signatureSolutions: [],
        safetyFlags: {},
        patient: { age: '20', gender: 'M', country: 'US', aestheticGoal: '', top3Concerns: [] },
      },
      lang: 'EN',
    };
    const body = buildAIRequestBody(request);
    expect(body.budget).toBeNull();
    expect(body.stay_duration).toBeNull();
    expect(body.management_frequency).toBeNull();
    expect(body.event_info).toBeNull();
  });

  it('includes event_info when present', () => {
    const request = createMockRequest();
    request.eventInfo = { type: 'wedding', date: '2026-06-15' };
    const body = buildAIRequestBody(request);
    const eventInfo = body.event_info as Record<string, string>;
    expect(eventInfo.type).toBe('wedding');
    expect(eventInfo.date).toBe('2026-06-15');
  });
});
