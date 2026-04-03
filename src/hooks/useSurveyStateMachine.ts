// ═══════════════════════════════════════════════════════════════
//  useSurveyStateMachine — Phase 3-B (S-1)
//  순수 TypeScript FSM 기반 설문 상태 머신
//  참조: MASTER_PLAN_V4.md §3.2 ~ §3.5
//
//  기존 useSurveyV2의 선형 흐름을 분기형으로 확장.
//  기존 SurveyStep과 호환성을 유지하면서 꼬리 질문 노드를 추가.
//
//  노드 흐름:
//    DEMOGRAPHIC → OPEN_TEXT → SMART_CHIPS
//      → [분기] BRANCH_SKIN_PROFILE / BRANCH_PAST_HISTORY / SAFETY_CHECKPOINT
//      → [분기] BRANCH_ADVERSE / BRANCH_VISIT_PLAN
//      → SAFETY_CHECKPOINT → ANALYZING → COMPLETE
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import type { Demographics, HaikuAnalysis, SurveyLang } from '@/types/survey-v2';

// ─── Survey Node (FSM States) ────────────────────────────────

export type SurveyNode =
  | 'DEMOGRAPHIC'
  | 'OPEN_TEXT'
  | 'SMART_CHIPS'
  | 'BRANCH_SKIN_PROFILE'
  | 'BRANCH_PAST_HISTORY'
  | 'BRANCH_VISIT_PLAN'
  | 'BRANCH_ADVERSE'
  | 'PREFERENCES'
  | 'SAFETY_CHECKPOINT'
  | 'ANALYZING'
  | 'COMPLETE';

// ─── Branch Responses (꼬리 질문 데이터) ─────────────────────

export interface SkinProfileBranch {
  fitzpatrick_type: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | null;
  skin_thickness: 'thin' | 'normal' | 'thick' | null;
  has_redness: boolean;
  sensitivity_level: 'low' | 'medium' | 'high' | null;
  recently_tanned?: boolean;  // RECENT_TANNING signal → conservative laser settings
}

export interface PastHistoryBranch {
  treatments: Array<{
    name: string;
    count: number;
    last_date: string;       // YYYY-MM or 'unknown'
    satisfaction: 'good' | 'neutral' | 'bad';
  }>;
  had_adverse: boolean;
  pih_history?: 'yes' | 'no' | 'unsure';  // PIH 경험 여부
}

export type RevisitCycle = 'first_time' | 'yearly' | 'biannual' | 'quarterly' | 'monthly' | 'occasional';

export interface VisitPlanBranch {
  stay_days: number;
  arrival_date: string;      // YYYY-MM-DD or ''
  departure_date: string;    // YYYY-MM-DD or ''
  accommodation_area: string;
  revisit_cycle?: RevisitCycle;
}

export interface AdverseBranch {
  adverse_type: ('pih' | 'burn' | 'swelling' | 'scarring' | 'allergy' | 'other')[];
  adverse_device: string;    // 부작용 발생 시술명
  recovery_weeks: number;
  severity: 'mild' | 'moderate' | 'severe';
  allergy_detail?: string;   // 알레르기 선택 시 상세 입력
}

// ─── PREFERENCES 노드 (CLINICAL_SPEC §8) ──────────────────────

export type PatientSegment = 'VIP' | 'PREMIUM' | 'BUDGET';

export interface PreferencesBranch {
  pain_tolerance: 1 | 2 | 3 | 4 | 5;
  downtime_preference: '0' | '1-3' | '3-7' | '7+';
  budget_segment: 'budget' | 'mid' | 'premium';
  patient_segment?: PatientSegment;  // auto-derived on PREFERENCES → SAFETY transition
}

export interface BranchResponses {
  skin_profile: SkinProfileBranch | null;
  past_history: PastHistoryBranch | null;
  visit_plan: VisitPlanBranch | null;
  adverse: AdverseBranch | null;
  preferences: PreferencesBranch | null;
}

// ─── Signal Map (전이 조건 판단용) ──────────────────────────

export interface SurveySignals {
  demographics: Demographics;
  haiku_analysis: HaikuAnalysis | null;
  chip_responses: Record<string, string>;
  branch_responses: BranchResponses;
}

// ─── Transition Table ───────────────────────────────────────

interface SurveyTransition {
  from: SurveyNode;
  to: SurveyNode;
  priority: number;          // lower = higher priority, fallback = 99
  condition: (signals: SurveySignals) => boolean;
}

const TRANSITIONS: SurveyTransition[] = [
  // ── 기본 선형 흐름
  { from: 'DEMOGRAPHIC', to: 'OPEN_TEXT', priority: 99, condition: () => true },
  { from: 'OPEN_TEXT', to: 'SMART_CHIPS', priority: 99, condition: () => true },

  // ══ SMART_CHIPS 이후 분기 ══════════════════════════════════
  // CLINICAL_SPEC §3: "처음이에요(first_time)"도 BRANCH_SKIN_PROFILE 통과 필수
  // → 모든 사용자가 Fitzpatrick 질문을 받도록 fallback을 BRANCH_SKIN_PROFILE로 변경

  // 조건부 분기: skin signal 또는 haiku hint에 의한 높은 우선순위 분기
  {
    from: 'SMART_CHIPS', to: 'BRANCH_SKIN_PROFILE', priority: 10,
    condition: (s) =>
      s.chip_responses.skin_profile === 'thin' ||
      s.chip_responses.skin_profile === 'sensitive' ||
      s.chip_responses.skin_profile === 'dry_sensitive' ||
      s.haiku_analysis?.concern_area_hint?.includes('wrinkle') === true ||
      s.haiku_analysis?.concern_area_hint?.includes('tightening') === true,
  },
  // 과거 시술 경험 → PAST_HISTORY (SKIN_PROFILE 건너뛰기 조건부)
  {
    from: 'SMART_CHIPS', to: 'BRANCH_PAST_HISTORY', priority: 20,
    condition: (s) =>
      s.chip_responses.past_experience === 'yes_multiple' ||
      s.chip_responses.past_experience === 'yes_recent' ||
      s.chip_responses.past_experience === 'yes_satisfied' ||
      s.chip_responses.past_experience === 'yes_unsatisfied',
  },
  // ★ CLINICAL_SPEC V2 교정: fallback → BRANCH_SKIN_PROFILE (not SAFETY)
  // 모든 사용자(first_time 포함)가 Fitzpatrick 질문을 받음
  { from: 'SMART_CHIPS', to: 'BRANCH_SKIN_PROFILE', priority: 99, condition: () => true },

  // ══ BRANCH_SKIN_PROFILE 이후 분기 ═══════════════════════════
  {
    from: 'BRANCH_SKIN_PROFILE', to: 'BRANCH_PAST_HISTORY', priority: 10,
    condition: (s) =>
      s.chip_responses.past_experience !== 'none' &&
      s.chip_responses.past_experience !== '' &&
      s.chip_responses.past_experience !== undefined,
  },
  {
    from: 'BRANCH_SKIN_PROFILE', to: 'BRANCH_VISIT_PLAN', priority: 20,
    condition: (s) => s.demographics.detected_country !== 'KR',
  },
  // fallback: → PREFERENCES (not SAFETY)
  { from: 'BRANCH_SKIN_PROFILE', to: 'PREFERENCES', priority: 99, condition: () => true },

  // ══ BRANCH_PAST_HISTORY 이후 분기 ═══════════════════════════
  {
    from: 'BRANCH_PAST_HISTORY', to: 'BRANCH_ADVERSE', priority: 10,
    condition: (s) => s.branch_responses.past_history?.had_adverse === true,
  },
  {
    from: 'BRANCH_PAST_HISTORY', to: 'BRANCH_VISIT_PLAN', priority: 20,
    condition: (s) => s.demographics.detected_country !== 'KR',
  },
  // fallback: → PREFERENCES (not SAFETY)
  { from: 'BRANCH_PAST_HISTORY', to: 'PREFERENCES', priority: 99, condition: () => true },

  // ══ BRANCH_ADVERSE → VISIT_PLAN or PREFERENCES ═════════════
  {
    from: 'BRANCH_ADVERSE', to: 'BRANCH_VISIT_PLAN', priority: 10,
    condition: (s) => s.demographics.detected_country !== 'KR',
  },
  // fallback: → PREFERENCES (not SAFETY)
  { from: 'BRANCH_ADVERSE', to: 'PREFERENCES', priority: 99, condition: () => true },

  // ══ BRANCH_VISIT_PLAN → PREFERENCES (not SAFETY) ═══════════
  { from: 'BRANCH_VISIT_PLAN', to: 'PREFERENCES', priority: 99, condition: () => true },

  // ══ PREFERENCES → SAFETY_CHECKPOINT ═════════════════════════
  // CLINICAL_SPEC §8: PREFERENCES가 수렴점, SAFETY 전에 통과
  { from: 'PREFERENCES', to: 'SAFETY_CHECKPOINT', priority: 99, condition: () => true },

  // ── SAFETY → ANALYZING (always)
  { from: 'SAFETY_CHECKPOINT', to: 'ANALYZING', priority: 99, condition: () => true },

  // ── ANALYZING → COMPLETE
  { from: 'ANALYZING', to: 'COMPLETE', priority: 99, condition: () => true },
];

// ─── Node → Legacy SurveyStep mapping ──────────────────────

const NODE_TO_STEP: Record<SurveyNode, string> = {
  DEMOGRAPHIC: 'demographics',
  OPEN_TEXT: 'open',
  SMART_CHIPS: 'chips',
  BRANCH_SKIN_PROFILE: 'branch_skin_profile',
  BRANCH_PAST_HISTORY: 'branch_past_history',
  BRANCH_VISIT_PLAN: 'branch_visit_plan',
  BRANCH_ADVERSE: 'branch_adverse',
  PREFERENCES: 'preferences',
  SAFETY_CHECKPOINT: 'safety',
  ANALYZING: 'analyzing',
  COMPLETE: 'complete',
};

// ─── Core FSM Logic ─────────────────────────────────────────

function getNextNode(current: SurveyNode, signals: SurveySignals): SurveyNode {
  const candidates = TRANSITIONS
    .filter((t) => t.from === current && t.condition(signals))
    .sort((a, b) => a.priority - b.priority);

  return candidates[0]?.to ?? 'SAFETY_CHECKPOINT';
}

// ─── Progress calculation ───────────────────────────────────

const MAIN_NODES: SurveyNode[] = [
  'DEMOGRAPHIC', 'OPEN_TEXT', 'SMART_CHIPS', 'SAFETY_CHECKPOINT', 'ANALYZING',
];
const BRANCH_NODES: SurveyNode[] = [
  'BRANCH_SKIN_PROFILE', 'BRANCH_PAST_HISTORY', 'BRANCH_VISIT_PLAN', 'BRANCH_ADVERSE', 'PREFERENCES',
];

function calculateProgress(currentNode: SurveyNode, visitedNodes: SurveyNode[]): number {
  if (currentNode === 'COMPLETE') return 100;
  if (currentNode === 'ANALYZING') return 95;

  // Main flow: 0% → 80%
  const mainIdx = MAIN_NODES.indexOf(currentNode);
  if (mainIdx >= 0) {
    return Math.round((mainIdx / MAIN_NODES.length) * 80);
  }

  // Branch nodes: 40% → 80% range (between SMART_CHIPS and SAFETY)
  const branchIdx = BRANCH_NODES.indexOf(currentNode);
  if (branchIdx >= 0) {
    const activeBranches = BRANCH_NODES.filter((n) => visitedNodes.includes(n) || n === currentNode);
    const branchProgress = (activeBranches.indexOf(currentNode) + 1) / activeBranches.length;
    return Math.round(40 + branchProgress * 40);
  }

  return 50; // fallback
}

// ─── Patient Segment Derivation (CLINICAL_SPEC §8) ─────────
// Called when PREFERENCES → SAFETY_CHECKPOINT transition occurs

export function derivePatientSegment(
  preferences: PreferencesBranch,
  visitPlan?: VisitPlanBranch | null,
): PatientSegment {
  const { budget_segment, pain_tolerance, downtime_preference } = preferences;

  // Downtime as numeric days for comparison
  const downtimeDays = downtime_preference === '7+' ? 7
    : downtime_preference === '3-7' ? 5
    : downtime_preference === '1-3' ? 2
    : 0;

  // VIP: premium + pain OK + downtime OK
  if (budget_segment === 'premium' && pain_tolerance >= 3 && downtimeDays >= 5) {
    return 'VIP';
  }

  // VIP: premium + yearly or less frequent visit (1회에 확실한 결과)
  if (budget_segment === 'premium' && visitPlan && visitPlan.stay_days > 0) {
    const cycle = visitPlan.revisit_cycle;
    if (!cycle || cycle === 'first_time' || cycle === 'yearly') {
      return 'VIP';
    }
  }

  // PREMIUM: frequent revisitors (biannual/quarterly) even with premium budget
  if (budget_segment === 'premium' && visitPlan?.revisit_cycle === 'quarterly') {
    return 'PREMIUM';
  }

  // Budget: 가성비 선택
  if (budget_segment === 'budget') {
    return 'BUDGET';
  }

  // Premium: 나머지
  return 'PREMIUM';
}

// ─── Hook ───────────────────────────────────────────────────

export interface UseSurveyStateMachineReturn {
  /** Current FSM node */
  currentNode: SurveyNode;
  /** Legacy step name for UI compatibility */
  currentStep: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** History of visited nodes */
  history: SurveyNode[];
  /** Branch responses data */
  branchResponses: BranchResponses;
  /** Advance to next node based on current signals */
  advance: (signals: SurveySignals) => SurveyNode;
  /** Go back to previous node */
  goBack: () => void;
  /** Check if a branch node will be visited given current signals */
  willVisitBranch: (branchNode: SurveyNode, signals: SurveySignals) => boolean;
  /** Update branch response for a specific branch */
  setBranchResponse: <K extends keyof BranchResponses>(key: K, value: BranchResponses[K]) => void;
  /** Reset FSM to initial state */
  reset: () => void;
  /** Whether user can go back */
  canGoBack: boolean;
  /** Whether current node is a branch node */
  isBranchNode: boolean;
}

export function useSurveyStateMachine(
  initialNode: SurveyNode = 'DEMOGRAPHIC'
): UseSurveyStateMachineReturn {
  const [currentNode, setCurrentNode] = useState<SurveyNode>(initialNode);
  const [history, setHistory] = useState<SurveyNode[]>([initialNode]);
  const [branchResponses, setBranchResponses] = useState<BranchResponses>({
    skin_profile: null,
    past_history: null,
    visit_plan: null,
    adverse: null,
    preferences: null,
  });

  const advance = useCallback(
    (signals: SurveySignals): SurveyNode => {
      const next = getNextNode(currentNode, signals);
      setCurrentNode(next);
      setHistory((prev) => [...prev, next]);
      return next;
    },
    [currentNode]
  );

  const goBack = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const prevNode = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setCurrentNode(prevNode);
  }, [history]);

  const willVisitBranch = useCallback(
    (branchNode: SurveyNode, signals: SurveySignals): boolean => {
      // Simulate traversal from SMART_CHIPS to find if branchNode is reachable
      let simNode: SurveyNode = 'SMART_CHIPS';
      const visited = new Set<SurveyNode>();
      let maxSteps = 10;

      while (simNode !== 'SAFETY_CHECKPOINT' && simNode !== 'ANALYZING' && maxSteps-- > 0) {
        if (simNode === branchNode) return true;
        if (visited.has(simNode)) break;
        visited.add(simNode);
        simNode = getNextNode(simNode, signals);
      }
      return false;
    },
    []
  );

  const setBranchResponse = useCallback(
    <K extends keyof BranchResponses>(key: K, value: BranchResponses[K]) => {
      setBranchResponses((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    setCurrentNode(initialNode);
    setHistory([initialNode]);
    setBranchResponses({
      skin_profile: null,
      past_history: null,
      visit_plan: null,
      adverse: null,
      preferences: null,
    });
  }, [initialNode]);

  const currentStep = NODE_TO_STEP[currentNode];
  const progress = useMemo(
    () => calculateProgress(currentNode, history),
    [currentNode, history]
  );
  const canGoBack = history.length > 1 && currentNode !== 'ANALYZING' && currentNode !== 'COMPLETE';
  const isBranchNode = BRANCH_NODES.includes(currentNode);

  return {
    currentNode,
    currentStep,
    progress,
    history,
    branchResponses,
    advance,
    goBack,
    willVisitBranch,
    setBranchResponse,
    reset,
    canGoBack,
    isBranchNode,
  };
}

// ─── Exports for testing ────────────────────────────────────
export { getNextNode, calculateProgress, TRANSITIONS, NODE_TO_STEP };
