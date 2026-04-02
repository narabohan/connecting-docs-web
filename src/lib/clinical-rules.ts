// ═══════════════════════════════════════════════════════════════
//  clinical-rules.ts — Phase 3-B (Task 7)
//  Structured clinical data derived from SURVEY_CLINICAL_SPEC.md §10-§11
//  Used by final-recommendation.ts prompt builder and other modules.
// ═══════════════════════════════════════════════════════════════

// ─── 1. DEVICE_CATEGORIES — §10 장비 카테고리 그룹핑 ─────────

export const DEVICE_CATEGORIES = {
  HIFU: ['ultherapy', 'shrink_universe', 'doublo'] as const,
  MONOPOLAR_RF: ['thermage_flx', 'volnewmer', 'oligio'] as const,
  BIPOLAR_RF: ['sofwave', 'emface'] as const,
  MN_RF: ['genius', 'potenza', 'sylfirm_x', 'secret_rf', 'virtue_rf', 'scarlet', 'morpheus8'] as const,
  PICO_LASER: ['picosure_pro', 'picoplus', 'hollywood_spectra'] as const,
  FRACTIONAL: ['reepot', 'lasemd_ultra', 'co2_fractional'] as const,
  IPL: ['bbl_hero', 'quadessy'] as const,
  VASCULAR: ['derma_v'] as const,
} as const;

export type DeviceCategory = keyof typeof DEVICE_CATEGORIES;
export type DeviceId = (typeof DEVICE_CATEGORIES)[DeviceCategory][number];

// ─── 2. CONCERN_TO_DEVICE_MAP — §10 concern_area → 추천 장비 ──

export interface ConcernDeviceMapping {
  primary: string[];
  vip?: string[];
  premium?: string[];
  budget?: string[];
  exclude?: string[];
  notes?: string;
}

export const CONCERN_TO_DEVICE_MAP: Record<string, ConcernDeviceMapping> = {
  jawline_lifting: {
    primary: ['ultherapy', 'shrink_universe', 'oligio', 'sofwave', 'volnewmer'],
    vip: ['ultherapy'],
    premium: ['shrink_universe'],
    budget: ['oligio'],
    notes: 'Pain 1~2 → Sofwave/Volnewmer only (exclude Ulthera/Thermage)',
  },
  skin_tightening: {
    primary: ['thermage_flx', 'volnewmer', 'genius', 'potenza', 'sylfirm_x'],
    vip: ['thermage_flx'],
    budget: ['volnewmer'],
    notes: 'Pain 1 → Volnewmer/Titanium only (exclude Thermage)',
  },
  volume_restoration: {
    primary: ['juvelook_vol', 'sculptra', 'sofwave'],
    exclude: ['ultherapy', 'shrink_universe', 'doublo'],
    notes: 'EXCLUDE all HIFU (볼패임 risk). Exception: Sofwave is safe (parallel ultrasound)',
  },
  melasma: {
    primary: ['hollywood_spectra', 'sylfirm_x'],
    notes: 'Q-switched 1064nm + Sylfirm X PW mode. PIH history → Sylfirm X PW, Potenza low-energy, VirtueRF only',
  },
  dark_spots: {
    primary: ['reepot', 'picosure_pro', 'picoplus'],
    vip: ['reepot'],
    budget: ['picoplus'],
    notes: 'Reepot VSLS = 1회 완치. Stay 1~3 days → Reepot on last day (듀오덤 exit)',
  },
  freckles: {
    primary: ['picosure_pro', 'picoplus', 'bbl_hero'],
    notes: 'Fitzpatrick IV+ → Pico 1064nm ONLY (no BBL/IPL — PIH risk)',
  },
  mole_removal: {
    primary: ['co2_fractional'],
  },
  dull_skin: {
    primary: ['lasemd_ultra'],
    notes: 'NCTF(샤넬주사) + LaseMD Ultra combination',
  },
  large_pores: {
    primary: ['quadessy', 'lasemd_ultra', 'secret_rf', 'potenza', 'genius'],
    vip: ['genius'],
    premium: ['potenza'],
    budget: ['secret_rf'],
  },
  acne_scars: {
    primary: ['genius', 'potenza', 'secret_rf', 'co2_fractional'],
    vip: ['genius'],
    budget: ['potenza'],
    notes: 'VIP + pain OK → Genius 1st (impedance feedback). BUDGET/pain low → Potenza (drug delivery tip)',
  },
  dryness_redness: {
    primary: ['derma_v', 'sofwave', 'lasemd_ultra'],
    notes: 'DermaV + Rejuran Healer(PN) + Exosome(ASCE+). Fitz I → DermaV lowest energy',
  },
} as const;

// ─── 3. FITZPATRICK_RESTRICTIONS ────────────────────────────

export interface FitzpatrickRule {
  caution?: string[];
  contraindicated?: string[];
  setting?: string;
  note: string;
}

export const FITZPATRICK_RESTRICTIONS: Record<string, FitzpatrickRule> = {
  type_1_2: {
    caution: ['bbl_hero', 'quadessy'],
    setting: 'lowest_energy',
    note: 'Use lowest energy settings. Cooling protocol mandatory.',
  },
  type_3: {
    caution: ['bbl_hero'],
    setting: 'moderate_energy',
    note: 'PIH risk moderate. Q-switched preferred for pigment. Standard energy OK for most.',
  },
  type_4_5_6: {
    contraindicated: ['bbl_hero', 'quadessy'],
    caution: ['picosure_pro', 'picoplus', 'hollywood_spectra'],
    setting: 'conservative_energy',
    note: 'IPL/BBL CONTRAINDICATED. Pico→1064nm only. PIH risk very high. PW-mode MN-RF preferred.',
  },
} as const;

// ─── 4. SEGMENT_DEVICE_PRIORITY ─────────────────────────────

export type PatientSegment = 'VIP' | 'PREMIUM' | 'BUDGET';

export const SEGMENT_DEVICE_PRIORITY: Record<PatientSegment, string[]> = {
  VIP: ['ultherapy', 'thermage_flx', 'genius', 'reepot', 'picosure_pro', 'profhilo', 'nctf'],
  PREMIUM: ['volnewmer', 'shrink_universe', 'potenza', 'picoplus', 'sylfirm_x', 'juvelook', 'rejuran'],
  BUDGET: ['oligio', 'sofwave', 'bbl_hero', 'lasemd_ultra', 'quadessy'],
} as const;

// ─── 5. DOWNTIME_MAP — §10 장비별 다운타임 (일) ─────────────

export interface DowntimeInfo {
  min: number;
  max: number;
  typical: number;
  note?: string;
}

export const DOWNTIME_MAP: Record<string, DowntimeInfo> = {
  // HIFU
  ultherapy: { min: 1, max: 7, typical: 3, note: '붓기 1~3일, 간헐적 7일' },
  shrink_universe: { min: 0, max: 1, typical: 0 },
  doublo: { min: 0, max: 2, typical: 1 },
  // MONOPOLAR_RF
  thermage_flx: { min: 0, max: 3, typical: 1 },
  volnewmer: { min: 0, max: 1, typical: 0 },
  oligio: { min: 0, max: 1, typical: 0 },
  // BIPOLAR_RF
  sofwave: { min: 0, max: 1, typical: 0 },
  emface: { min: 0, max: 0, typical: 0 },
  // MN_RF
  genius: { min: 3, max: 7, typical: 5, note: '미세딱지 3~5일' },
  potenza: { min: 1, max: 5, typical: 3 },
  sylfirm_x: { min: 1, max: 3, typical: 2 },
  secret_rf: { min: 1, max: 5, typical: 3 },
  virtue_rf: { min: 1, max: 3, typical: 2 },
  scarlet: { min: 1, max: 3, typical: 2 },
  morpheus8: { min: 3, max: 7, typical: 5 },
  // PICO_LASER
  picosure_pro: { min: 0, max: 3, typical: 1 },
  picoplus: { min: 0, max: 3, typical: 1 },
  hollywood_spectra: { min: 0, max: 1, typical: 0, note: 'Toning mode 0 days' },
  // FRACTIONAL
  reepot: { min: 14, max: 21, typical: 14, note: '듀오덤 필수, 마지막날 시술 가능' },
  lasemd_ultra: { min: 1, max: 5, typical: 3 },
  co2_fractional: { min: 7, max: 14, typical: 10, note: '딱지 탈락 7~14일' },
  // IPL
  bbl_hero: { min: 0, max: 3, typical: 1 },
  quadessy: { min: 0, max: 1, typical: 0 },
  // VASCULAR
  derma_v: { min: 0, max: 3, typical: 1 },
} as const;

// ─── 6. SAFETY_RULES — §9 + §11 안전 규칙 ──────────────────

export const SAFETY_RULES = {
  medication_flags: [
    'isotretinoin',
    'anticoagulant',
    'immunosuppressant',
    'photosensitive_drug',
    'retinol',
  ] as const,

  condition_flags: [
    'pregnancy',
    'keloid_history',
    'pih_history',
    'herpes_simplex',
    'autoimmune',
    'diabetes',
    'metal_implant',
  ] as const,

  /** §11 — 1일 최대 시술 안전 한계 (Max Cap) */
  max_daily_energy_devices: 3,
  max_daily_injectables: 2,

  /** §11 — 같은 층 이중 타격 금지 */
  same_layer_forbidden_combos: [
    ['ultherapy', 'shrink_universe'],   // both SMAS layer
    ['ultherapy', 'doublo'],            // both SMAS layer
    ['genius', 'ultherapy', 'thermage_flx'],  // thermal overload
    ['co2_fractional', 'reepot'],       // epidermal damage overlap
  ] as const,

  /** §11 원칙 3: 순서 규칙 */
  order_rules: {
    energy_before_injectable: true,     // EBD → injectable (never reverse)
    pigment_before_lifting: true,       // 색소 정리 → 1~2주 뒤 리프팅 (만족도 최고)
  },
} as const;

// ─── 7. STAY_DURATION_DEVICE_MATRIX — §6 체류 기간 매트릭스 ──

export type StayCategory = '1_3_days' | '4_7_days' | '1_2_weeks' | '2_plus_weeks';

export interface StayDeviceRule {
  freely_available: string[];
  marginal: string[];
  last_day_only: string[];
}

export const STAY_DURATION_MATRIX: Record<StayCategory, StayDeviceRule> = {
  '1_3_days': {
    freely_available: [
      'thermage_flx', 'volnewmer', 'sofwave', 'emface',
      'ultherapy', 'shrink_universe',
      'picosure_pro', 'picoplus', 'hollywood_spectra', 'bbl_hero', 'quadessy',
    ],
    marginal: ['potenza', 'sylfirm_x'],
    last_day_only: ['genius', 'lasemd_ultra', 'co2_fractional', 'reepot'],
  },
  '4_7_days': {
    freely_available: [
      'thermage_flx', 'volnewmer', 'sofwave', 'emface',
      'ultherapy', 'shrink_universe',
      'picosure_pro', 'picoplus', 'hollywood_spectra', 'bbl_hero', 'quadessy',
      'potenza', 'sylfirm_x',
    ],
    marginal: ['genius', 'lasemd_ultra'],
    last_day_only: ['co2_fractional', 'reepot'],
  },
  '1_2_weeks': {
    freely_available: [
      'thermage_flx', 'volnewmer', 'sofwave', 'emface',
      'ultherapy', 'shrink_universe',
      'picosure_pro', 'picoplus', 'hollywood_spectra', 'bbl_hero', 'quadessy',
      'potenza', 'sylfirm_x', 'genius', 'lasemd_ultra',
    ],
    marginal: ['co2_fractional', 'reepot'],
    last_day_only: [],
  },
  '2_plus_weeks': {
    freely_available: [
      'thermage_flx', 'volnewmer', 'sofwave', 'emface',
      'ultherapy', 'shrink_universe',
      'picosure_pro', 'picoplus', 'hollywood_spectra', 'bbl_hero', 'quadessy',
      'potenza', 'sylfirm_x', 'genius', 'lasemd_ultra',
      'co2_fractional', 'reepot',
    ],
    marginal: [],
    last_day_only: [],
  },
} as const;

// ─── 8. MEDICAL_TOURIST_PATTERNS — §11 의료관광객 행동 패턴 ──

export interface TouristPattern {
  id: 'A' | 'B' | 'C' | 'D';
  name: string;
  description: string;
  inference_conditions: string;
  strategy: string;
}

export const MEDICAL_TOURIST_PATTERNS: TouristPattern[] = [
  {
    id: 'A',
    name: 'Last Day Treatment',
    description: '관광 후 출국 직전 다운타임 시술',
    inference_conditions: 'Low downtime tolerance + 3~7 day stay + results-focused',
    strategy: 'Zero-downtime during stay → strong treatment on last day. Post-care guide required.',
  },
  {
    id: 'B',
    name: 'Zero Downtime Compromise',
    description: '회복 없는 시술만 선호',
    inference_conditions: '0 days downtime + 1~3 day stay',
    strategy: 'Zero-downtime premium package: Sofwave + Volnewmer + SkinVive + LED.',
  },
  {
    id: 'C',
    name: 'Pack Everything In One Day',
    description: '1일 복합 극대화',
    inference_conditions: '1~3 day stay + pain OK + premium',
    strategy: 'Maximum safe combo within daily limits (EBD ≤3 + Injectable ≤2). IV sedation advised.',
  },
  {
    id: 'D',
    name: 'Day 1 Blitz',
    description: '예약/프로모션에 맞춰 Day 1 강행',
    inference_conditions: '4~7 day stay + premium + pain OK',
    strategy: 'Day 1 intensive + Day 3~5 recovery check revisit.',
  },
] as const;

// ─── 9. Helper: Build prompt snippet from clinical rules ────

/**
 * Generates a compact clinical rules block for injection into AI prompts.
 * This replaces hardcoded rules in STATIC_SYSTEM_PROMPT.
 */
export function buildClinicalRulesPromptBlock(): string {
  const lines: string[] = [];

  // Device categories
  lines.push('═══ DEVICE CATEGORIES ═══');
  for (const [cat, devices] of Object.entries(DEVICE_CATEGORIES)) {
    lines.push(`${cat}: ${devices.join(', ')}`);
  }

  // Concern → device mapping
  lines.push('\n═══ CONCERN → DEVICE MAPPING ═══');
  for (const [concern, mapping] of Object.entries(CONCERN_TO_DEVICE_MAP)) {
    let line = `${concern}: ${mapping.primary.join(', ')}`;
    if (mapping.vip) line += ` | VIP→${mapping.vip.join(',')}`;
    if (mapping.budget) line += ` | BUDGET→${mapping.budget.join(',')}`;
    if (mapping.exclude) line += ` | EXCLUDE: ${mapping.exclude.join(',')}`;
    if (mapping.notes) line += ` [${mapping.notes}]`;
    lines.push(line);
  }

  // Fitzpatrick
  lines.push('\n═══ FITZPATRICK RESTRICTIONS ═══');
  for (const [type, rule] of Object.entries(FITZPATRICK_RESTRICTIONS)) {
    let line = `${type}: ${rule.note}`;
    if (rule.contraindicated) line += ` CONTRAINDICATED: ${rule.contraindicated.join(',')}`;
    if (rule.caution) line += ` CAUTION: ${rule.caution.join(',')}`;
    lines.push(line);
  }

  // Segment priority
  lines.push('\n═══ SEGMENT DEVICE PRIORITY ═══');
  for (const [seg, devices] of Object.entries(SEGMENT_DEVICE_PRIORITY)) {
    lines.push(`${seg}: ${devices.join(', ')}`);
  }

  // Safety
  lines.push('\n═══ DAILY SAFETY CAP ═══');
  lines.push(`Max EBD/day: ${SAFETY_RULES.max_daily_energy_devices}`);
  lines.push(`Max Injectables/day: ${SAFETY_RULES.max_daily_injectables}`);
  lines.push('Same-layer double hit FORBIDDEN. Energy before injectable ALWAYS.');

  // Tourist patterns
  lines.push('\n═══ MEDICAL TOURIST PATTERNS ═══');
  for (const p of MEDICAL_TOURIST_PATTERNS) {
    lines.push(`Pattern ${p.id} "${p.name}": ${p.inference_conditions} → ${p.strategy}`);
  }

  return lines.join('\n');
}

/**
 * Get stay category from number of days.
 */
export function getStayCategory(days: number): StayCategory {
  if (days <= 3) return '1_3_days';
  if (days <= 7) return '4_7_days';
  if (days <= 14) return '1_2_weeks';
  return '2_plus_weeks';
}
