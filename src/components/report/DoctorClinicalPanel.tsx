import { useState } from 'react';
import {
    Brain, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp,
    Zap, Clock, DollarSign, Activity, Shield, Target, Layers, 
    TrendingUp, AlertCircle, Star, Package, Settings, FileText, 
    ThumbsUp, ThumbsDown, Minus
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WizardData {
    country?: string;
    gender?: string;
    age?: string;
    primaryGoal?: string;
    secondaryGoal?: string;
    risks?: string[];
    acneStatus?: string;
    pigmentType?: string[];
    areas?: string[];
    poreType?: string;
    priorityArea?: string;
    skinType?: string;
    treatmentStyle?: string;
    volumePreference?: string;
    painTolerance?: string;
    downtimeTolerance?: string;
    budget?: string;
    frequency?: string;
    treatmentHistory?: string[];
    historySatisfaction?: string;
    careHabits?: string[];
    email?: string;
}

interface DoctorClinicalPanelProps {
    wizardData: WizardData | null;
    doctorDevices?: string[]; // from doctor's onboarding profile
    patientEmail?: string;
    score?: string | number;
    solutionId?: string;
}

// ─── Clinical Logic Helpers ──────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
    antiAging: 'Anti-Aging / Lifting',
    glassSkin: 'Glass Skin / Texture',
    pigmentation: 'Pigmentation Correction',
    acneScar: 'Acne & Scar Management',
    skinCare: 'Preventive Skin Care',
    bodyContouring: 'Body Contouring',
    hairLoss: 'Hair Loss Treatment',
    intimateCare: 'Intimate Care',
};

const AREA_LABELS: Record<string, string> = {
    forehead: 'Forehead',
    eyes: 'Eye Area',
    cheeks: 'Cheeks / Mid-face',
    jawline: 'Jawline / Lower Face',
    neck: 'Neck',
    fullFace: 'Full Face',
    decolletage: 'Décolletage',
    hands: 'Hands',
    abdomen: 'Abdomen',
    arms: 'Arms',
    thighs: 'Thighs',
};

const RISK_LABELS: Record<string, string> = {
    melasma: 'Melasma',
    activeAcne: 'Active Acne',
    rosacea: 'Rosacea',
    keloid: 'Keloid Tendency',
    pregnancy: 'Pregnancy',
    pacemaker: 'Pacemaker / Metal Implant',
    autoimmune: 'Autoimmune Condition',
    photosensitivity: 'Photosensitivity',
    darkSkin: 'Fitzpatrick IV–VI Skin',
};

// ─── Device Recommendation Logic ─────────────────────────────────────────────

function getAreaDeviceLogic(areas: string[], painTolerance: string, budget: string) {
    const results: { area: string; devices: { name: string; note: string; suitability: 'ideal' | 'caution' | 'avoid' }[] }[] = [];

    const isMidFace = areas.some(a => ['cheeks', 'fullFace'].includes(a));
    const isLowerFace = areas.some(a => ['jawline'].includes(a));
    const isEyes = areas.includes('eyes');
    const isForehead = areas.includes('forehead');
    const isNeck = areas.includes('neck');

    const painOK = ['moderate', 'high', 'veryHigh'].includes(painTolerance);
    const highBudget = budget === 'premium';

    if (isMidFace) {
        results.push({
            area: 'Mid-Face (Cheeks)',
            devices: [
                {
                    name: 'MonopolarRF (Thermage)',
                    note: painOK
                        ? '즉각적 콜라겐 수축 + 6개월간 점진적 재생. 통증 내성 적합.'
                        : '중간 통증 수준 → 국소마취 강력 권장. 통증 내성이 낮아 주의 필요.',
                    suitability: painOK ? 'ideal' : 'caution',
                },
                {
                    name: 'Titanium Lifting (Titan)',
                    note: '저통증·무다운타임. 환자 통증 내성 낮을 때 1차 대안. 단, 효과는 Thermage 대비 점진적.',
                    suitability: 'ideal',
                },
                {
                    name: 'HIFU / Ulthera',
                    note: highBudget && painOK
                        ? '프리미엄 SMAS 리프팅. 고통증 + 프리미엄 예산 → 최적 조합.'
                        : '고통증 + 고비용. 현재 환자 예산/통증 프로파일과 불일치 가능성.',
                    suitability: highBudget && painOK ? 'ideal' : 'caution',
                },
            ],
        });
    }

    if (isLowerFace) {
        results.push({
            area: 'Lower Face / Jawline',
            devices: [
                {
                    name: 'HIFU / Ulthera',
                    note: highBudget && painOK
                        ? '하안면 SMAS 타겟팅 최적. 고통증 내성 + 프리미엄 예산 → 1순위 권장.'
                        : '고통증 수준 필요. 현재 프로파일로는 충분한 마취 프로토콜 필수.',
                    suitability: highBudget && painOK ? 'ideal' : 'caution',
                },
                {
                    name: 'Shurink / Ultraformer III',
                    note: '중저통증 HIFU 대안. 가성비 리프팅으로 예산 제약 환자에게 적합.',
                    suitability: 'ideal',
                },
                {
                    name: 'Inmode (FaceTite/Morpheus8)',
                    note: '저통증 + 서브멘탈 지방 타겟팅. 이중턱·하악선 개선에 특히 효과적.',
                    suitability: 'ideal',
                },
            ],
        });
    }

    if (isEyes) {
        results.push({
            area: 'Eye Area',
            devices: [
                {
                    name: 'Eye-specific RF (e.g., Tixel, microneedling RF)',
                    note: '눈 주변 섬세한 조직 → 저에너지·고정밀 디바이스 필수. 일반 HIFU 금기.',
                    suitability: 'ideal',
                },
                {
                    name: 'Standard HIFU (full-power)',
                    note: '안와 주변 적용 금기. 망막 부작용 위험.',
                    suitability: 'avoid',
                },
            ],
        });
    }

    if (isNeck) {
        results.push({
            area: 'Neck',
            devices: [
                {
                    name: 'HIFU / Shurink (neck protocol)',
                    note: '목 피부 얇음 → 에너지 레벨 70% 이하 설정 권장.',
                    suitability: 'caution',
                },
                {
                    name: 'MonopolarRF (neck mode)',
                    note: '점진적 탄력 개선. 목 주름·이완에 안정적.',
                    suitability: 'ideal',
                },
            ],
        });
    }

    return results;
}

function getStyleConflictAnalysis(treatmentStyle: string, painTolerance: string, volumePreference: string) {
    const wantsDramatic = treatmentStyle === 'dramatic';
    const wantsNatural = treatmentStyle === 'natural';
    const lowPain = ['none', 'low'].includes(painTolerance);
    const highPain = ['high', 'veryHigh'].includes(painTolerance);

    const conflicts: { type: 'conflict' | 'synergy' | 'info'; title: string; detail: string }[] = [];

    if (wantsDramatic && lowPain) {
        conflicts.push({
            type: 'conflict',
            title: '드라마틱 결과 vs 저통증 내성 충돌',
            detail: '환자는 극적인 변화를 원하지만 통증 내성이 낮습니다. → 충분한 국소마취(EMLA 크림, 신경차단술) 후 고에너지 프로토콜 적용을 권장합니다. 시술 전 마취 옵션에 대해 충분히 상담하세요.',
        });
    }

    if (wantsNatural && highPain) {
        conflicts.push({
            type: 'synergy',
            title: '내추럴 결과 + 고통증 내성 → 고효율 프로토콜',
            detail: '통증 내성이 높아 Thermage FLX / Ulthera와 같은 고에너지 단회 프로토콜을 적용할 수 있습니다. 자연스러운 결과를 위해 에너지 분산 모드를 권장합니다.',
        });
    }

    if (volumePreference === 'filler' && lowPain) {
        conflicts.push({
            type: 'info',
            title: '필러 선호 + 저통증 → 바이탈 마취 크림 필수',
            detail: '필러 시술 시 강한 국소마취 크림 도포 45-60분 전 적용을 표준화하세요. 리도카인 함유 필러(예: Restylane Lyft with Lidocaine) 사용을 우선 고려하세요.',
        });
    }

    if (conflicts.length === 0) {
        conflicts.push({
            type: 'info',
            title: '프로파일 일관성 양호',
            detail: '선호 시술 스타일과 통증 내성이 일치합니다. 표준 프로토콜로 진행 가능합니다.',
        });
    }

    return conflicts;
}

function getRhythmGuidance(primaryGoal: string, frequency: string, treatmentHistory: string[]) {
    const rhythms: { phase: string; interval: string; device: string; note: string }[] = [];

    if (primaryGoal === 'antiAging') {
        rhythms.push(
            { phase: '초기 집중', interval: '4–6주 간격', device: 'Booster (엑소좀/리쥬란)', note: '3회 연속 → 피부 기반 강화' },
            { phase: '유지 리프팅', interval: '4–6개월 1회', device: 'MonopolarRF / HIFU', note: '연 2회 → 콜라겐 재생 사이클' },
            { phase: '연간 플랜', interval: '12개월 체크', device: '복합 프로토콜', note: '효과 평가 후 단계 업그레이드' },
        );
    } else if (primaryGoal === 'glassSkin') {
        rhythms.push(
            { phase: '초기 집중', interval: '2–3주 간격', device: 'Booster / 피부장벽 치료', note: '4회 → 텍스처·윤기 베이스 완성' },
            { phase: '유지', interval: '2–3개월 1회', device: 'Light Energy / 스킨부스터', note: '계절 변화 맞춤 유지' },
            { phase: '시즌 플랜', interval: '봄·가을 집중', device: '레이저 토닝', note: '환경적 손상 리셋' },
        );
    } else if (primaryGoal === 'pigmentation') {
        rhythms.push(
            { phase: '초기 집중', interval: '2–4주 간격', device: 'Low-fluence Q-Switch / PicoLaser', note: '4–6회 → 멜라닌 분해' },
            { phase: '안정화', interval: '4–6주', device: '성장인자 부스터', note: '장벽 회복 필수' },
            { phase: '유지', interval: '3–4개월 1회', device: '토닝/멜라닌 억제', note: '재발 방지' },
        );
    } else if (primaryGoal === 'acneScar') {
        rhythms.push(
            { phase: '초기', interval: '3–4주 간격', device: 'MNRF / Fractional CO2', note: '3–5회 → 흉터 리모델링' },
            { phase: '중간', interval: '4–6주', device: '재생 부스터 (리쥬란)', note: '흉터 경계 완화' },
            { phase: '마무리', interval: '2–3개월 간격', device: '피코 레이저', note: '색소 잔여분 제거' },
        );
    } else {
        rhythms.push(
            { phase: '표준 유지', interval: '3–4개월', device: '목표별 디바이스', note: '환자 피부 반응 모니터링 기반 조정' },
        );
    }

    // Frequency alignment
    const freqNote =
        frequency === 'monthly' ? '⚠ 환자가 월 1회 방문을 선호 → 집중 단계 동시 진행 적합' :
        frequency === 'quarterly' ? '✓ 3개월 주기 선호 → 유지 단계 리듬과 자연 일치' :
        frequency === 'yearly' ? '⚠ 연 1회 방문 → 복합 프로토콜 단회 집약 설계 필요' :
        '✓ 2주 간격 선호 → 집중 초기 치료 적합';

    return { rhythms, freqNote };
}

function getRiskDetails(risks: string[], acneStatus?: string, pigmentType?: string[]) {
    const details: { risk: string; severity: 'high' | 'medium' | 'low'; guidance: string }[] = [];

    if (risks.includes('melasma')) {
        const isMask = pigmentType?.includes('maskPattern');
        const isSunSpot = pigmentType?.includes('sunSpot');
        details.push({
            risk: '멜라스마',
            severity: isMask ? 'high' : 'medium',
            guidance: isMask
                ? '면 형태 멜라스마 확인 (마스크 패턴) → 고에너지 레이저 금기. 저플루언스 토닝 + 트라넥삼산 병행. CO2·IPL 회피.'
                : isSunSpot
                ? '일광성 색소침착 패턴 → 멜라스마와 구분 필수. 패치 테스트 후 피코 레이저 적용 가능.'
                : '멜라스마 위험 → 피부 조직검사 또는 우드램프 검사로 유형 확인 후 치료 설계.',
        });
    }

    if (risks.includes('activeAcne')) {
        const isActive = acneStatus === 'active';
        const isCystic = acneStatus === 'cystic';
        details.push({
            risk: '활성 여드름',
            severity: isCystic ? 'high' : isActive ? 'medium' : 'low',
            guidance: isCystic
                ? '낭포성 여드름 진행 중 → 에너지 시술 연기. 전신 항생제 또는 이소트레티노인 완료 후 6개월 경과 확인 필수.'
                : isActive
                ? '활성 여드름 → 에너지 레이저 적용 시 염증 확산 위험. 리포좀 클렌징 또는 PDT 우선 시행. 에너지 조사 범위 병변 외 설정.'
                : '경증/관리 중 여드름 → 저에너지 토닝 적용 가능. 피지 분비 모니터링.',
        });
    }

    if (risks.includes('rosacea')) {
        details.push({
            risk: '로사세아',
            severity: 'medium',
            guidance: '열 기반 시술 시 혈관 확장 악화 위험 → IPL 혈관 모드 저플루언스 사용. 냉각 핸드피스 필수. 시술 후 즉각 냉각 처치.',
        });
    }

    if (risks.includes('keloid')) {
        details.push({
            risk: '켈로이드 경향',
            severity: 'high',
            guidance: '침습적 시술(미세침, CO2) 금기에 가까움. 비침습적 RF/HIFU 선택 시 소면적 테스트 필수. 켈로이드 부위 직접 에너지 조사 절대 금지.',
        });
    }

    if (risks.includes('darkSkin')) {
        details.push({
            risk: 'Fitzpatrick IV–VI (어두운 피부)',
            severity: 'high',
            guidance: '고에너지 레이저 PIH 위험 극도로 높음 → Nd:YAG 1064nm 우선 선택. CO2·어블레이티브 레이저 최소화. 시술 전 하이드로퀴논/아젤라산 4주 전처치 권장.',
        });
    }

    return details;
}

function getPoreAnalysis(poreType: string, primaryGoal: string) {
    const analyses: { type: string; guidance: string; devices: string[] }[] = [];

    if (poreType === 'verticalAging') {
        analyses.push({
            type: '세로형 노화 모공 (처짐 관련)',
            guidance: '모공이 중력 방향으로 늘어진 형태 → 리프팅 기반 치료로 모공 형태 교정 가능. RF/MNRF 콜라겐 재생 우선.',
            devices: ['MonopolarRF (Thermage)', 'Microneedling RF (Morpheus8)', 'HIFU (부분 리프팅)'],
        });
    }

    if (poreType === 'roundOily') {
        analyses.push({
            type: '원형 피지성 모공 (과잉 피지)',
            guidance: '피지선 과활성으로 인한 확장 모공 → 피지 조절 + 콜라겐 리모델링 병행 필요.',
            devices: ['Fractional CO2', 'Salicylic Acid Peel', 'PDT (Photodynamic Therapy)', 'MNRF'],
        });
    }

    if (poreType === 'mixedAging') {
        analyses.push({
            type: '복합형 모공',
            guidance: '노화 + 피지 혼합 형태 → 단계별 접근: 피지 조절 먼저 후 리프팅 프로토콜.',
            devices: ['PDT → MonopolarRF 순차 적용', 'MNRF (복합 효과)'],
        });
    }

    return analyses;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, defaultOpen = true }: {
    title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="mb-4 rounded-xl border border-white/10 bg-[#0a0f1a] overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-sm text-white">{title}</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {open && <div className="px-5 pb-5">{children}</div>}
        </div>
    );
}

function SuitabilityBadge({ level }: { level: 'ideal' | 'caution' | 'avoid' }) {
    const config = {
        ideal: { label: '적합', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
        caution: { label: '주의', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AlertTriangle },
        avoid: { label: '금기', cls: 'bg-red-500/10 text-red-400 border-red-500/30', icon: AlertCircle },
    };
    const { label, cls, icon: Icon } = config[level];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${cls}`}>
            <Icon className="w-3 h-3" /> {label}
        </span>
    );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function DoctorClinicalPanel({ wizardData, doctorDevices = [], patientEmail, score, solutionId }: DoctorClinicalPanelProps) {
    const [activeTab, setActiveTab] = useState<'clinical' | 'devices' | 'notes'>('clinical');
    const [notes, setNotes] = useState('');
    const [savedNotes, setSavedNotes] = useState(false);

    if (!wizardData) {
        return (
            <div className="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                <Brain className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">No survey data available for clinical analysis.</p>
            </div>
        );
    }

    const {
        primaryGoal = '', secondaryGoal = '', risks = [], acneStatus, pigmentType = [],
        areas = [], poreType, priorityArea, skinType = '', treatmentStyle = '',
        volumePreference, painTolerance = '', downtimeTolerance = '', budget = '',
        frequency = '', treatmentHistory = [], historySatisfaction, careHabits = [],
        age, gender,
    } = wizardData;

    // ── Derived values ────────────────────────────────────────────────────────
    const primaryLabel = GOAL_LABELS[primaryGoal] || primaryGoal;
    const secondaryLabel = GOAL_LABELS[secondaryGoal] || secondaryGoal;
    const riskDetails = getRiskDetails(risks, acneStatus, pigmentType);
    const areaDeviceLogic = getAreaDeviceLogic(areas, painTolerance, budget);
    const styleConflicts = getStyleConflictAnalysis(treatmentStyle, painTolerance, volumePreference || '');
    const { rhythms, freqNote } = getRhythmGuidance(primaryGoal, frequency, treatmentHistory);
    const poreAnalysis = poreType ? getPoreAnalysis(poreType, primaryGoal) : [];

    // ── Budget + Pain summary ─────────────────────────────────────────────────
    const budgetEmoji = budget === 'premium' ? '💎 프리미엄' : budget === 'mid' ? '💳 중간' : '💰 가성비';
    const painEmoji = ['high', 'veryHigh'].includes(painTolerance) ? '🟢 고통증 허용' : painTolerance === 'moderate' ? '🟡 중간' : '🔴 저통증';
    const downtimeEmoji = ['high', 'veryHigh'].includes(downtimeTolerance) ? '🟢 다운타임 OK' : downtimeTolerance === 'moderate' ? '🟡 중간' : '🔴 다운타임 최소';

    const tabs = [
        { id: 'clinical' as const, label: '임상 인텔리전스', icon: Brain },
        { id: 'devices' as const, label: '기기 로직', icon: Settings },
        { id: 'notes' as const, label: '메모 & 팔로업', icon: FileText },
    ];

    return (
        <div className="font-sans">
            {/* ── Doctor Mode Banner ── */}
            <div className="mb-5 px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider">DOCTOR CLINICAL VIEW</span>
                <span className="ml-auto text-xs text-gray-500 font-mono">{patientEmail}</span>
                {score && <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/5 text-white">{score}% Match</span>}
            </div>

            {/* ── Patient Quick Profile ── */}
            <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                    { label: '나이', value: age || '—' },
                    { label: '성별', value: gender || '—' },
                    { label: '예산', value: budgetEmoji },
                    { label: '통증', value: painEmoji },
                    { label: '다운타임', value: downtimeEmoji },
                    { label: '피부타입', value: skinType || '—' },
                ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-[#0a0f1a] border border-white/8 text-center">
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{item.label}</div>
                        <div className="text-xs font-bold text-white truncate">{item.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 mb-5 p-1 bg-[#0a0f1a] rounded-xl border border-white/8">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === id
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* ═══════════════ TAB: CLINICAL INTELLIGENCE ═══════════════ */}
            {activeTab === 'clinical' && (
                <div>
                    {/* ① Indication Priority Matrix */}
                    <SectionCard title="1. 적응증 우선순위 (Indication Matrix)" icon={Target}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {/* Primary */}
                            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">Primary Indication</span>
                                    <span className="text-lg font-black text-cyan-400">70%</span>
                                </div>
                                <div className="text-white font-bold text-base mb-2">{primaryLabel || '미설정'}</div>
                                {/* Weight bar */}
                                <div className="h-1.5 rounded-full bg-white/10">
                                    <div className="h-full rounded-full bg-cyan-400" style={{ width: '70%' }} />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    시술 설계의 핵심 방향. 전체 프로토콜의 70% 리소스 배분.
                                </p>
                            </div>
                            {/* Secondary */}
                            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">Secondary Indication</span>
                                    <span className="text-lg font-black text-purple-400">30%</span>
                                </div>
                                <div className="text-white font-bold text-base mb-2">{secondaryLabel || '미설정'}</div>
                                <div className="h-1.5 rounded-full bg-white/10">
                                    <div className="h-full rounded-full bg-purple-400" style={{ width: '30%' }} />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    보조 목표. Primary 시술과 시너지 가능한 병행 프로토콜 추가.
                                </p>
                            </div>
                        </div>
                        {/* Combo suggestion */}
                        {primaryGoal && secondaryGoal && (
                            <div className="px-4 py-3 rounded-lg bg-white/3 border border-white/8 text-xs text-gray-300">
                                <span className="text-amber-400 font-bold">💡 조합 제안: </span>
                                {primaryGoal === 'antiAging' && secondaryGoal === 'glassSkin' && '리프팅 세션 종료 후 엑소좀/스킨부스터 병행 → 효율적인 이중 효과 달성'}
                                {primaryGoal === 'glassSkin' && secondaryGoal === 'pigmentation' && '레이저 토닝 후 멜라닌 억제제 도포 패키지 → 단일 방문 최대화'}
                                {primaryGoal === 'acneScar' && secondaryGoal === 'glassSkin' && 'MNRF 흉터 치료 후 리쥬란 부스터 → 흉터 + 피부결 동시 관리'}
                                {primaryGoal === 'antiAging' && secondaryGoal === 'pigmentation' && 'Thermage + 저플루언스 토닝 콤보 → 리프팅과 색소 동시 타겟'}
                                {!(['antiAging+glassSkin', 'glassSkin+pigmentation', 'acneScar+glassSkin', 'antiAging+pigmentation'].includes(`${primaryGoal}+${secondaryGoal}`)) && 
                                    `${primaryLabel} 중심 시술 완료 후 별도 세션에서 ${secondaryLabel} 프로토콜 추가 권장`}
                            </div>
                        )}
                    </SectionCard>

                    {/* ② Risk Flag Panel */}
                    {riskDetails.length > 0 && (
                        <SectionCard title="2. 위험 인자 분석 (Risk Flag Panel)" icon={Shield}>
                            <div className="space-y-3">
                                {riskDetails.map((r) => (
                                    <div key={r.risk} className={`p-4 rounded-xl border ${
                                        r.severity === 'high' ? 'border-red-500/30 bg-red-500/5' :
                                        r.severity === 'medium' ? 'border-amber-500/30 bg-amber-500/5' :
                                        'border-emerald-500/30 bg-emerald-500/5'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className={`w-4 h-4 ${
                                                r.severity === 'high' ? 'text-red-400' :
                                                r.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                                            }`} />
                                            <span className="font-bold text-sm text-white">{r.risk}</span>
                                            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                r.severity === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                                r.severity === 'medium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                                'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                            }`}>
                                                {r.severity === 'high' ? '고위험' : r.severity === 'medium' ? '주의' : '관리중'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 leading-relaxed">{r.guidance}</p>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* ③ Concern Area + Package Suggestions */}
                    {areas.length > 0 && (
                        <SectionCard title="3. 관심 부위 분석 & 추가 패키지" icon={Layers}>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {areas.map((a) => (
                                    <span key={a} className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        a === priorityArea
                                            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                                            : 'border-white/15 bg-white/5 text-gray-300'
                                    }`}>
                                        {a === priorityArea && <Star className="w-3 h-3 inline mr-1" />}
                                        {AREA_LABELS[a] || a}
                                    </span>
                                ))}
                            </div>
                            {/* Package suggestions */}
                            <div className="space-y-2">
                                {areas.includes('eyes') && areas.includes('cheeks') && (
                                    <div className="px-4 py-3 rounded-lg bg-white/3 border border-white/8 flex items-start gap-2 text-xs">
                                        <Package className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div><span className="text-amber-400 font-bold">안면 풀리프팅 패키지 제안:</span><span className="text-gray-300"> 눈 + 볼 동시 관리 → Full Face 리프팅 프로토콜 패키지로 업셀 가능. 단위 시술보다 20–30% 비용 효율.</span></div>
                                    </div>
                                )}
                                {areas.includes('neck') && areas.some(a => ['cheeks', 'jawline'].includes(a)) && (
                                    <div className="px-4 py-3 rounded-lg bg-white/3 border border-white/8 flex items-start gap-2 text-xs">
                                        <Package className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div><span className="text-amber-400 font-bold">안면+목 풀패키지 제안:</span><span className="text-gray-300"> 하안면 + 목 동시 HIFU/RF → 자연스러운 연결 라인. 목 단독보다 결과 만족도 높음.</span></div>
                                    </div>
                                )}
                                {areas.includes('decolletage') && (
                                    <div className="px-4 py-3 rounded-lg bg-white/3 border border-white/8 flex items-start gap-2 text-xs">
                                        <Package className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div><span className="text-amber-400 font-bold">데콜테 추가 세션:</span><span className="text-gray-300"> 얼굴 시술 연장선으로 목+데콜테 콤보 제안 → 여름 전 집중 케어 패키지.</span></div>
                                    </div>
                                )}
                                {areas.some(a => ['abdomen', 'thighs', 'arms'].includes(a)) && (
                                    <div className="px-4 py-3 rounded-lg bg-white/3 border border-white/8 flex items-start gap-2 text-xs">
                                        <Package className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div><span className="text-amber-400 font-bold">바디 컨투어링 패키지:</span><span className="text-gray-300"> Inmode/CoolSculpting 연계 → 안면 시술과 분리 or 동일 방문 바디 세션 병행.</span></div>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    )}

                    {/* ④ Pore Type Analysis */}
                    {poreAnalysis.length > 0 && (
                        <SectionCard title="4. 모공 타입 분석" icon={Activity} defaultOpen={false}>
                            {poreAnalysis.map((p) => (
                                <div key={p.type} className="mb-3 p-4 rounded-xl bg-white/3 border border-white/8">
                                    <div className="font-bold text-sm text-white mb-1">{p.type}</div>
                                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">{p.guidance}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.devices.map((d) => (
                                            <span key={d} className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">{d}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </SectionCard>
                    )}

                    {/* ⑤ Result Style Conflict */}
                    <SectionCard title="5. 결과 스타일 vs 통증 내성 분석" icon={TrendingUp} defaultOpen={false}>
                        <div className="space-y-3">
                            {styleConflicts.map((c, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${
                                    c.type === 'conflict' ? 'border-red-500/30 bg-red-500/5' :
                                    c.type === 'synergy' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                    'border-blue-500/20 bg-blue-500/5'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {c.type === 'conflict' ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                                         c.type === 'synergy' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                                         <Info className="w-4 h-4 text-blue-400" />}
                                        <span className="font-bold text-sm text-white">{c.title}</span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed">{c.detail}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* ⑥ Treatment Rhythm */}
                    <SectionCard title="6. 치료 리듬 & 주기 가이드" icon={Clock} defaultOpen={false}>
                        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                            {freqNote}
                        </div>
                        <div className="space-y-2">
                            {rhythms.map((r, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-white/3 border border-white/8">
                                    <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-white">{r.phase}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">{r.interval}</span>
                                        </div>
                                        <div className="text-[11px] text-indigo-300 font-medium mb-0.5">{r.device}</div>
                                        <div className="text-[11px] text-gray-400">{r.note}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Treatment History Insight */}
                    {treatmentHistory.length > 0 && (
                        <SectionCard title="7. 시술 이력 인사이트" icon={Star} defaultOpen={false}>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {treatmentHistory.map((h) => (
                                    <span key={h} className="px-2.5 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-gray-300">{h}</span>
                                ))}
                            </div>
                            {historySatisfaction && (
                                <div className={`px-4 py-3 rounded-lg text-xs border ${
                                    historySatisfaction === 'satisfied' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' :
                                    historySatisfaction === 'dissatisfied' ? 'bg-red-500/5 border-red-500/20 text-red-300' :
                                    'bg-white/3 border-white/8 text-gray-300'
                                }`}>
                                    이전 시술 만족도: <span className="font-bold">
                                        {historySatisfaction === 'satisfied' ? '✅ 만족' : 
                                         historySatisfaction === 'dissatisfied' ? '❌ 불만족 → 원인 파악 상담 필요' : 
                                         '➖ 보통'}
                                    </span>
                                    {historySatisfaction === 'dissatisfied' && (
                                        <p className="mt-1 text-gray-400">이전 시술 불만족 이력 → 기대치 재설정 및 다른 접근법 검토 권장.</p>
                                    )}
                                </div>
                            )}
                        </SectionCard>
                    )}
                </div>
            )}

            {/* ═══════════════ TAB: DEVICE LOGIC ═══════════════ */}
            {activeTab === 'devices' && (
                <div>
                    {areaDeviceLogic.length > 0 ? (
                        <>
                            <div className="mb-4 text-xs text-gray-400 px-1">
                                환자 관심 부위 기반 디바이스 로직. 환자의 통증 내성({painEmoji}) 및 예산({budgetEmoji}) 프로파일이 반영되었습니다.
                            </div>
                            {areaDeviceLogic.map((areaGroup) => (
                                <div key={areaGroup.area} className="mb-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target className="w-4 h-4 text-cyan-400" />
                                        <h3 className="font-bold text-sm text-white">{areaGroup.area}</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {areaGroup.devices.map((d) => (
                                            <div key={d.name} className="p-4 rounded-xl bg-[#0a0f1a] border border-white/10">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="font-bold text-sm text-white">{d.name}</span>
                                                    <SuitabilityBadge level={d.suitability} />
                                                </div>
                                                <p className="text-xs text-gray-300 leading-relaxed">{d.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            관심 부위 정보가 없어 기기 로직을 생성할 수 없습니다.
                        </div>
                    )}

                    {/* Doctor's Device Compatibility Matrix */}
                    {doctorDevices.length > 0 && (
                        <div className="mt-6 p-5 rounded-xl border border-white/10 bg-[#0a0f1a]">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings className="w-4 h-4 text-cyan-400" />
                                <h3 className="font-bold text-sm text-white">내 보유 장비 적합성 매트릭스</h3>
                            </div>
                            <div className="space-y-2">
                                {doctorDevices.map((device) => {
                                    // Simplified compatibility logic
                                    const hasHighRisk = risks.includes('keloid') || risks.includes('darkSkin');
                                    const isCO2 = device.toLowerCase().includes('co2') || device.toLowerCase().includes('ablative');
                                    const isHIFU = device.toLowerCase().includes('hifu') || device.toLowerCase().includes('ulthera') || device.toLowerCase().includes('shurink');
                                    const isRF = device.toLowerCase().includes('rf') || device.toLowerCase().includes('thermage') || device.toLowerCase().includes('morpheus');
                                    const areaMatch = areaDeviceLogic.some(a => a.devices.some(d => d.name.toLowerCase().includes(device.toLowerCase().substring(0, 5))));

                                    const painOK = ['moderate', 'high', 'veryHigh'].includes(painTolerance);
                                    let compat: 'suitable' | 'caution' | 'contraindicated' = 'suitable';
                                    let reason = '현재 환자 프로파일과 기본 적합';

                                    if (hasHighRisk && isCO2) {
                                        compat = 'contraindicated';
                                        reason = '켈로이드/다크스킨 위험으로 CO2 어블레이티브 금기';
                                    } else if (risks.includes('melasma') && isCO2) {
                                        compat = 'contraindicated';
                                        reason = '멜라스마 위험으로 고에너지 레이저 금기';
                                    } else if (!painOK && isHIFU) {
                                        compat = 'caution';
                                        reason = '저통증 내성 → HIFU 적용 시 충분한 마취 프로토콜 필수';
                                    } else if (areaMatch) {
                                        compat = 'suitable';
                                        reason = '환자 관심 부위와 직접 매칭';
                                    }

                                    return (
                                        <div key={device} className={`flex items-center justify-between p-3 rounded-lg border ${
                                            compat === 'suitable' ? 'border-emerald-500/20 bg-emerald-500/5' :
                                            compat === 'caution' ? 'border-amber-500/20 bg-amber-500/5' :
                                            'border-red-500/20 bg-red-500/5'
                                        }`}>
                                            <div>
                                                <div className="text-sm font-medium text-white">{device}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{reason}</div>
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-full border ${
                                                compat === 'suitable' ? 'border-emerald-500/30 text-emerald-400' :
                                                compat === 'caution' ? 'border-amber-500/30 text-amber-400' :
                                                'border-red-500/30 text-red-400'
                                            }`}>
                                                {compat === 'suitable' ? '✓ 적합' : compat === 'caution' ? '⚠ 주의' : '✗ 금기'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {doctorDevices.length === 0 && (
                        <div className="mt-6 p-5 rounded-xl border border-dashed border-white/10 text-center text-xs text-gray-500">
                            온보딩에서 보유 장비를 등록하면 환자별 적합성 매트릭스가 자동 생성됩니다.
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════ TAB: NOTES & FOLLOW-UP ═══════════════ */}
            {activeTab === 'notes' && (
                <div>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">상담 메모 (내부용)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => { setNotes(e.target.value); setSavedNotes(false); }}
                            rows={6}
                            placeholder="환자 상담 메모, 다음 방문 계획, 특이 사항 등..."
                            className="w-full bg-[#0a0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/40 transition-colors"
                        />
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-600">{notes.length} / 2000</span>
                            <button
                                onClick={() => setSavedNotes(true)}
                                className="px-4 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/25 transition-colors"
                            >
                                {savedNotes ? '✓ 저장됨' : '저장'}
                            </button>
                        </div>
                    </div>

                    {/* Next Visit Checklist */}
                    <div className="p-4 rounded-xl bg-[#0a0f1a] border border-white/10">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">다음 방문 체크리스트</h3>
                        <div className="space-y-2">
                            {[
                                { item: '이전 시술 반응 확인 (홍반, 부기, 색소 변화)', done: false },
                                { item: `${primaryLabel} 효과 사진 비교 촬영`, done: false },
                                { item: '다음 단계 프로토콜 안내', done: false },
                                { item: '홈케어 루틴 점검', done: false },
                                riskDetails.length > 0 && { item: '위험 인자 재평가 (' + riskDetails.map(r => r.risk).join(', ') + ')', done: false },
                            ].filter(Boolean).map((item: any, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                    <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0 mt-0.5" />
                                    <span>{item.item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Treatment rhythm reminder */}
                    <div className="mt-4 p-4 rounded-xl bg-[#0a0f1a] border border-white/10">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">권장 다음 방문 시기</h3>
                        <div className="text-sm text-white font-bold">
                            {rhythms[0] ? `${rhythms[0].interval}` : '3–4개월 후'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {rhythms[0]?.device || '목표별 유지 프로토콜'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
