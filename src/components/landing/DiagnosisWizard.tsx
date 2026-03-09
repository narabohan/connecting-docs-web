import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LanguageCode } from '@/utils/translations';

// --- Types ---
export type WizardData = {
    // Intro
    country: string;
    gender: 'Male' | 'Female' | 'Other';
    age: string;

    // Goals
    primaryGoal: string;
    secondaryGoal: string;

    // Risks
    risks: string[];
    acneStatus?: string; // Conditional
    pigmentType?: string[]; // Conditional

    // Areas
    areas: string[];
    poreType?: string; // Conditional
    priorityArea?: string;

    // Skin Profile
    skinType: string;
    treatmentStyle: string;
    volumePreference?: string; // Conditional

    // Preferences
    painTolerance: string;
    downtimeTolerance: string;
    budget: string;
    frequency: string;

    // History
    treatmentHistory: string[];
    historySatisfaction?: string; // Conditional

    // Habits & Contact
    careHabits: string[];
    email: string;
};

interface DiagnosisWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: WizardData) => void;
    language: LanguageCode;
}

// --- Constants (Mapped from Tally) ---
type MultiLingualText = Record<string, string>;

const STEPS: {
    id: string;
    title?: MultiLingualText;
    desc?: MultiLingualText;
    question?: MultiLingualText;
    multi?: boolean;
    condition?: (data: WizardData) => boolean;
}[] = [
        {
            id: 'intro',
            title: { EN: "Let's diagnose your skin.", KO: "피부 진단을 시작합니다.", JP: "肌診断を始めます。", CN: "开始皮肤诊断。" },
            desc: { EN: "AI will analyze 80+ clinical protocols for you.", KO: "AI가 80개 이상의 임상 프로토콜을 분석합니다.", JP: "AIが80以上の臨床プロトコルを分析します。", CN: "AI将为您分析80多种临床方案。" },
        },
        {
            id: 'basic',
            question: { EN: "Basic Information", KO: "기본 정보", JP: "基本情報", CN: "基本信息" }
        },
        {
            id: 'goals_1',
            question: { EN: "What is your #1 Goal?", KO: "가장 해결하고 싶은 고민은?", JP: "最も改善したい悩みは？", CN: "您最想改善的问题是？" }
        },
        {
            id: 'goals_2',
            question: { EN: "Any secondary concern?", KO: "추가로 해결하고 싶은 고민은?", JP: "他に気になる悩みはありますか？", CN: "还有其他想改善的问题吗？" }
        },
        {
            id: 'risks',
            question: { EN: "Safety Check (Select all that apply)", KO: "안전성 체크 (해당사항 선택)", JP: "安全性チェック（該当するものを選択）", CN: "安全性检查（可多选）" },
            multi: true
        },
        {
            id: 'risk_acne',
            question: { EN: "Acne Condition", KO: "현재 여드름 상태", JP: "現在のニキビの状態", CN: "目前的痤疮状况" },
            condition: (data) => data.risks.includes('acne')
        },
        {
            id: 'risk_pigment',
            question: { EN: "Pigmentation Pattern", KO: "색소 침착 유형", JP: "色素沈着のタイプ", CN: "色沉类型" },
            multi: true,
            condition: (data) => data.risks.includes('pigment')
        },
        {
            id: 'areas',
            question: { EN: "Problem Areas", KO: "고민 부위", JP: "気になる部位", CN: "烦恼部位" },
            multi: true
        },
        {
            id: 'area_pores',
            question: { EN: "Pore Type", KO: "모공 유형", JP: "毛穴のタイプ", CN: "毛孔类型" },
            condition: (data) => data.areas.includes('pores')
        },
        {
            id: 'area_priority',
            question: { EN: "Improvement Priority", KO: "개선 우선순위", JP: "改善の優先順位", CN: "改善优先顺序" }
        },
        {
            id: 'skin_profile',
            question: { EN: "Skin Profile", KO: "피부 타입", JP: "肌タイプ", CN: "皮肤类型" }
        },
        {
            id: 'style_preference',
            question: { EN: "Treatment Style", KO: "선호하는 시술 스타일", JP: "好みの施術スタイル", CN: "偏好的治疗风格" }
        },
        {
            id: 'volume_logic',
            question: { EN: "Volume Preference", KO: "볼륨 개선 방식", JP: "ボリューム改善の好み", CN: "容量改善偏好" },
            condition: (data) => data.primaryGoal === 'volume' || data.secondaryGoal === 'volume'
        },
        {
            id: 'preferences',
            question: { EN: "Treatment Preferences", KO: "시술 선호도", JP: "施術の好み", CN: "治疗偏好" }
        },
        {
            id: 'history',
            question: { EN: "Treatment History", KO: "시술 경험", JP: "施術経験", CN: "医美经历" },
            multi: true
        },
        {
            id: 'history_outcome',
            question: { EN: "Past Satisfaction", KO: "과거 시술 만족도", JP: "過去の施術への満足度", CN: "过去治疗满意度" },
            condition: (data) => data.treatmentHistory.length > 0 && !data.treatmentHistory.includes('none')
        },
        {
            id: 'habits',
            question: { EN: "Care Habits", KO: "관리 습관", JP: "ケアの習慣", CN: "护理习惯" },
            multi: true
        },
        {
            id: 'contact',
            question: { EN: "Final Step", KO: "마지막 단계", JP: "最後のステップ", CN: "最后一步" }
        },
        {
            id: 'analysis',
            title: { EN: "Analyzing...", KO: "분석 중...", JP: "分析中...", CN: "分析中..." }
        }
    ];

const OPTIONS = {
    // 1. Basic
    age: [
        { id: 'under20', label: { EN: 'Under 20s', KO: '20대 미만', JP: '20歳未満', CN: '20岁以下' } },
        { id: '20s', label: { EN: '20s', KO: '20대', JP: '20代', CN: '20多岁' } },
        { id: '30s', label: { EN: '30s', KO: '30대', JP: '30代', CN: '30多岁' } },
        { id: '40s', label: { EN: '40s', KO: '40대', JP: '40代', CN: '40多岁' } },
        { id: '50s', label: { EN: '50s', KO: '50대', JP: '50代', CN: '50多岁' } },
        { id: '60s', label: { EN: '60s+', KO: '60대 이상', JP: '60代以上', CN: '60岁以上' } },
    ],
    countries: [
        { id: 'Korea', label: { EN: 'Korea', KO: '한국', JP: '韓国', CN: '韩国' } },
        { id: 'Japan', label: { EN: 'Japan', KO: '일본', JP: '日本', CN: '日本' } },
        { id: 'China', label: { EN: 'China', KO: '중국', JP: '中国', CN: '中国' } },
        { id: 'USA', label: { EN: 'USA', KO: '미국', JP: 'アメリカ', CN: '美国' } },
        { id: 'Singapore', label: { EN: 'Singapore', KO: '싱가포르', JP: 'シンガポール', CN: '新加坡' } },
        { id: 'Other', label: { EN: 'Other', KO: '기타', JP: 'その他', CN: '其他' } },
    ],
    gender: [
        { id: 'Female', label: { EN: 'Female', KO: '여성', JP: '女性', CN: '女性' } },
        { id: 'Male', label: { EN: 'Male', KO: '남성', JP: '男性', CN: '男性' } },
        { id: 'Other', label: { EN: 'Other / Prefer not to say', KO: '기타/비공개', JP: 'その他/回答しない', CN: '其他/不公开' } },
    ],

    // 2. Goals
    goals: [
        { id: 'hydration', label: { EN: 'Hydrated & Dewy', KO: '촉촉하고 윤기나는 피부', JP: 'みずみずしい肌', CN: '水润光泽' } },
        { id: 'texture', label: { EN: 'Smooth Texture', KO: '매끈한 피부결', JP: 'なめらかな肌', CN: '平滑肤质' } },
        { id: 'volume', label: { EN: 'Volume & Bounce', KO: '볼륨과 탄력', JP: 'ハリとボリューム', CN: '饱满弹性' } },
        { id: 'contour', label: { EN: 'Defined Contour / Lifting', KO: '날렵한 윤곽/리프팅', JP: '引き締まった輪郭/リフトアップ', CN: '清晰轮廓/提升' } },
        { id: 'tone', label: { EN: 'Bright & Even Tone', KO: '환한 피부톤/미백', JP: '明るく均一な肌', CN: '明亮均匀肤色' } },
        { id: 'guidance', label: { EN: 'Not Sure – Need Consultation', KO: '잘 모르겠음/상담 필요', JP: 'わからない/相談したい', CN: '不确定/需要咨询' } }
    ],

    // 3. Risks
    risks: [
        { id: 'sensitive', label: { EN: 'Sensitive Skin / Redness', KO: '민감성/홍조', JP: '敏感肌・赤み', CN: '敏感肌/泛红' } },
        { id: 'pigment', label: { EN: 'Melasma / Pigmentation', KO: '기미/색소침착', JP: '肝斑・色素沈着', CN: '黄褐斑/色沉' } },
        { id: 'acne', label: { EN: 'Acne / Inflammation', KO: '여드름/트러블', JP: 'ニキビ・炎症', CN: '痤疮/炎症' } },
        { id: 'thin', label: { EN: 'Thin or Fragile Skin', KO: '얇은/약한 피부', JP: '薄い・弱い肌', CN: '皮肤偏薄/脆弱' } },
        { id: 'none', label: { EN: 'None of the above', KO: '해당 없음', JP: '該当なし', CN: '以上均无' } }
    ],
    acneStatus: [
        { id: 'inflammatory', label: { EN: 'Inflammatory (Active, red)', KO: '염증성 (활성 여드름)', JP: '炎症性（活動中、赤み）', CN: '炎症性（活跃、红肿）' } },
        { id: 'scars', label: { EN: 'Scars / Dark Marks', KO: '흉터/색소침착', JP: '瘢痕・色素沈着', CN: '痘坑/痘印' } },
        { id: 'occasional', label: { EN: 'Occasional Breakouts', KO: '가끔 나는 여드름', JP: 'たまにニキビができる', CN: '偶发痤疮' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],
    pigmentPattern: [
        { id: 'symmetrical', label: { EN: 'Symmetrical (Typical Melasma)', KO: '대칭형 (일반 기미)', JP: '対称性（典型的な肝斑）', CN: '对称型（典型黄褐斑）' } },
        { id: 'sun', label: { EN: 'Sun-worsened spots', KO: '햇빛에 악화되는 기미', JP: '日光で悪化するシミ', CN: '日晒加重型' } },
        { id: 'laser', label: { EN: 'Laser-darkened (rebound)', KO: '레이저 후 리바운드', JP: 'レーザー後悪化', CN: '激光后反弹加深' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],

    // 4. Areas
    areas: [
        { id: 'forehead', label: { EN: 'Forehead / Glabella', KO: '이마/미간', JP: 'おでこ・眉間', CN: '额头/眉间' } },
        { id: 'eyes', label: { EN: 'Eye Area (crow\'s feet, under-eye)', KO: '눈가 (잔주름, 다크서클)', JP: '目元（小じわ・クマ）', CN: '眼周（鱼尾纹/黑眼圈）' } },
        { id: 'midface', label: { EN: 'Cheeks / Mid-face', KO: '앞볼/중안부', JP: '頬・中顔面', CN: '两颊/面中部' } },
        { id: 'pores', label: { EN: 'Pores / Texture', KO: '모공/피부결', JP: '毛穴・キメ', CN: '毛孔/肤质' } },
        { id: 'jawline', label: { EN: 'Jawline / Lower Face', KO: '턱선/하안부', JP: 'フェイスライン・下顔面', CN: '下颌线/下脸部' } },
        { id: 'neck', label: { EN: 'Neck / Décolleté', KO: '목/데콜테', JP: '首・デコルテ', CN: '颈部/胸前' } }
    ],
    poreType: [
        { id: 'vertical', label: { EN: 'Elongated / Vertical (Aging)', KO: '세로형 (노화)', JP: '縦長・縦型（老化）', CN: '竖向扩张型（老化）' } },
        { id: 'round', label: { EN: 'Round / Open (Oily)', KO: '원형/열린 모공 (지성)', JP: '丸型・開き毛穴（脂性）', CN: '圆形/开放型（油性）' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],
    priority: [
        { id: 'volume', label: { EN: 'Volume (Restore youth)', KO: '볼륨 (동안 회복)', JP: 'ボリューム（若々しさ回復）', CN: '饱满感（恢复年轻）' } },
        { id: 'lifting', label: { EN: 'Lifting (Contour & firm)', KO: '리프팅 (윤곽 & 탄력)', JP: 'リフティング（輪郭・引き締め）', CN: '提升（轮廓&紧致）' } },
        { id: 'both', label: { EN: 'Both equally', KO: '둘 다 중요', JP: 'どちらも同じくらい', CN: '两者都重要' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],

    // 5. Skin & Style
    skinType: [
        { id: 'thin', label: { EN: 'Thin & Sensitive', KO: '얇고 민감한 피부', JP: '薄め・敏感', CN: '薄且敏感' } },
        { id: 'normal', label: { EN: 'Normal / Combination', KO: '보통/복합성', JP: '普通・混合肌', CN: '普通/混合型' } },
        { id: 'thick', label: { EN: 'Thick & Resilient', KO: '두껍고 탄탄한 피부', JP: '厚め・弾力あり', CN: '厚且有弹性' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],
    style: [
        { id: 'natural', label: { EN: 'Natural & Gradual', KO: '자연스럽게 천천히', JP: 'ナチュラル・じっくり', CN: '自然渐进' } },
        { id: 'balanced', label: { EN: 'Balanced (some instant, some gradual)', KO: '균형 (즉각+점진)', JP: 'バランス型', CN: '均衡（即效+渐进）' } },
        { id: 'dramatic', label: { EN: 'Fast & Dramatic', KO: '빠르고 확실한 효과', JP: '早く・ドラマチック', CN: '快速显著' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],
    volumeLogic: [
        { id: 'natural', label: { EN: 'Natural Regeneration (gradual, collagen)', KO: '자연 재생 (서서히, 콜라겐)', JP: '自然再生（徐々に・コラーゲン）', CN: '自然再生（渐进式/胶原蛋白）' } },
        { id: 'instant', label: { EN: 'Instant Filling (immediate result)', KO: '즉각적 볼륨 (즉시 결과)', JP: '即効フィリング（即座に効果）', CN: '立即填充（即刻见效）' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],

    // 6. Preferences
    pain: [
        { id: 'minimal', label: { EN: 'Minimal – I have low tolerance', KO: '최소화 – 통증에 약해요', JP: '最小限 – 痛みに弱い', CN: '最小化 – 我对疼痛敏感' } },
        { id: 'moderate', label: { EN: 'Moderate – OK with some pain', KO: '보통 – 어느 정도는 괜찮아요', JP: '中程度 – ある程度は大丈夫', CN: '适度 – 可以接受一些疼痛' } },
        { id: 'high', label: { EN: 'High Tolerance – Pain is fine', KO: '높음 – 통증은 상관없어요', JP: '高い – 痛みは気にしない', CN: '高耐受 – 不在乎痛' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],
    downtime: [
        { id: 'none', label: { EN: 'None – Need to be presentable daily', KO: '없음 – 매일 일상생활 가능해야 함', JP: 'なし – 毎日人前に出られる必要あり', CN: '无停工期 – 每天需要见人' } },
        { id: 'short', label: { EN: 'Short (3–5 days OK)', KO: '짧게 (3~5일 정도)', JP: '短め（3〜5日程度）', CN: '短（3~5天可接受）' } },
        { id: 'long', label: { EN: 'Long (1 week+ is fine)', KO: '길어도 OK (1주일 이상)', JP: '長め（1週間以上でも大丈夫）', CN: '长（1周以上都可以）' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],
    budget: [
        { id: 'premium', label: { EN: 'Premium – Best results, cost secondary', KO: '프리미엄 – 최고 결과 우선, 비용은 나중', JP: 'プレミアム – 最高結果優先', CN: '高端 – 效果优先，价格其次' } },
        { id: 'balanced', label: { EN: 'Balanced – Good value for money', KO: '균형 – 가성비 좋게', JP: 'バランス – コスパ重視', CN: '均衡 – 性价比优先' } },
        { id: 'economy', label: { EN: 'Economy – Minimize cost', KO: '절약 – 비용 최소화', JP: 'エコノミー – コスト最小化', CN: '经济 – 尽量节省' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],
    frequency: [
        { id: 'occasional', label: { EN: 'Occasional – Stronger treatments, less often', KO: '가끔 – 강한 시술을 드물게', JP: 'たまに – 強い施術を少ない頻度で', CN: '偶尔 – 强力治疗，频率低' } },
        { id: 'regular', label: { EN: 'Regular Maintenance – Consistent routine', KO: '정기 관리 – 꾸준한 루틴', JP: '定期メンテナンス – 継続的なルーティン', CN: '定期维护 – 规律保养' } },
        { id: 'flexible', label: { EN: 'Flexible – Whatever is recommended', KO: '유연하게 – 의사 추천에 따라', JP: 'フレキシブル – 推奨に従う', CN: '灵活 – 按医生推荐' } },
        { id: 'notsure', label: { EN: 'Not Sure', KO: '잘 모르겠음', JP: 'わからない', CN: '不确定' } },
    ],

    // 7. History
    history: [
        { id: 'rf', label: { EN: 'RF Tightening (Thermage, Oligio...)', KO: 'RF 타이트닝 (써마지, 올리지오...)', JP: 'RF引き締め（サーマージュ等）', CN: 'RF紧致（热玛吉等）' } },
        { id: 'hifu', label: { EN: 'HIFU Lifting (Ulthera, Shurink...)', KO: 'HIFU 리프팅 (울쎄라, 슈링크...)', JP: 'HIFUリフティング（ウルセラ等）', CN: 'HIFU提升（Ulthera等）' } },
        { id: 'laser', label: { EN: 'Laser (Pico, Toning, CO2...)', KO: '레이저 (피코, 토닝, CO2...)', JP: 'レーザー（ピコ・トーニング等）', CN: '激光（皮秒/调Q等）' } },
        { id: 'injectable', label: { EN: 'Injectables (Botox, Filler)', KO: '보톡스/필러', JP: '注射（ボトックス・フィラー）', CN: '注射（肉毒素/填充）' } },
        { id: 'microneedle', label: { EN: 'Microneedle RF (Potenza, Genius...)', KO: '미세침 RF (포텐자, 지니어스...)', JP: 'マイクロニードルRF', CN: '微针RF（Potenza等）' } },
        { id: 'none', label: { EN: 'No prior treatments', KO: '시술 경험 없음', JP: '施術経験なし', CN: '无医美经历' } },
    ],
    satisfaction: [
        { id: 'satisfied', label: { EN: 'Satisfied – Met my expectations', KO: '만족 – 기대 충족', JP: '満足 – 期待通り', CN: '满意 – 达到预期' } },
        { id: 'partial', label: { EN: 'Partially – Could have been better', KO: '부분적 – 더 좋을 수 있었음', JP: '部分的 – もっとよくできた', CN: '部分满意 – 还可以更好' } },
        { id: 'dissatisfied', label: { EN: 'Dissatisfied – Did not help', KO: '불만족 – 효과 없었음', JP: '不満 – 効果なし', CN: '不满意 – 没有效果' } },
        { id: 'notsure', label: { EN: 'Not Sure / Mixed', KO: '잘 모르겠음/복합적', JP: 'わからない/複合的', CN: '不确定/复杂感受' } },
    ],

    // 8. Habits
    habits: [
        { id: 'skincare', label: { EN: 'Diligent Skincare Routine', KO: '꼼꼼한 스킨케어 루틴', JP: '丁寧なスキンケアルーティン', CN: '认真护肤例程' } },
        { id: 'devices', label: { EN: 'Home Devices (LED, RF...)', KO: '홈케어 디바이스 (LED, RF...)', JP: 'ホームデバイス（LED・RF等）', CN: '家用仪器（LED/RF等）' } },
        { id: 'supplements', label: { EN: 'Supplements / Functional Foods', KO: '영양제/기능성 식품', JP: 'サプリ・機能性食品', CN: '营养补充剂/功能性食品' } },
        { id: 'massage', label: { EN: 'Facial Massage / Gua Sha', KO: '얼굴 마사지/괄사', JP: 'フェイスマッサージ・かっさ', CN: '面部按摩/刮痧' } },
        { id: 'none', label: { EN: 'Minimal – Basic care only', KO: '최소한 – 기본 케어만', JP: '最小限 – 基本ケアのみ', CN: '极简 – 只做基础护肤' } },
    ]
};


export default function DiagnosisWizard({ isOpen, onClose, onComplete, language = 'EN' }: DiagnosisWizardProps) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<WizardData>({
        country: 'Korea', gender: 'Female', age: '',
        primaryGoal: '', secondaryGoal: '',
        risks: [], areas: [], skinType: '', treatmentStyle: '',
        painTolerance: '', downtimeTolerance: '', budget: '', frequency: '',
        treatmentHistory: [], careHabits: [], email: ''
    });

    // Reset step when opened
    useEffect(() => {
        if (isOpen) setStep(0);
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter steps based on conditions
    const activeSteps = STEPS.filter(s => !s.condition || s.condition(data));
    const currentStep = activeSteps[step];
    // Safety check in case step index goes out of bounds due to filtering updates
    if (!currentStep) return null; // Or handle error

    const isLastStep = step === activeSteps.length - 2; // Before 'analysis'

    const handleNext = () => {
        if (isLastStep) {
            setStep(step + 1); // Go to 'analysis'
            setTimeout(() => {
                onComplete(data);
                onClose();
            }, 2500);
        } else {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const updateData = (key: keyof WizardData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const toggleMulti = (key: keyof WizardData, item: string) => {
        const current = (data[key] as string[]) || [];
        const isNone = item.toLowerCase() === 'none';

        let updated: string[];
        if (isNone) {
            updated = ['none'];
        } else {
            const clean = current.filter(i => i.toLowerCase() !== 'none');
            updated = clean.includes(item)
                ? clean.filter(i => i !== item)
                : [...clean, item];
        }
        updateData(key, updated);
    };

    // --- Component Helper for Options ---
    const OptionButton = ({
        label,
        selected,
        onClick,
        multi = false
    }: { label: string | React.ReactNode, selected: boolean, onClick: () => void, multi?: boolean }) => (
        <button
            onClick={onClick}
            className={cn(
                "p-4 rounded-xl border transition-all text-left flex items-center justify-between group",
                selected
                    ? "bg-blue-500/20 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            )}
        >
            <span className="text-sm md:text-base font-medium">{label}</span>
            {selected && <Check className="w-4 h-4 text-blue-400" />}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
                key={currentStep.id}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Progress Bar */}
                <div className="h-1 bg-white/5 w-full">
                    <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / activeSteps.length) * 100}%` }}
                    />
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col relative overflow-y-auto">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">✕</button>

                    {/* --- INTRO STEP --- */}
                    {currentStep.id === 'intro' && (
                        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 py-10">
                            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center relative">
                                <Sparkles className="w-10 h-10 text-blue-400" />
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">{currentStep.title?.[language]}</h2>
                                <p className="text-gray-400 text-lg max-w-md mx-auto">{currentStep.desc?.[language]}</p>
                            </div>
                            <button
                                onClick={handleNext}
                                className="px-10 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                Start Diagnosis <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* --- ANALYSIS LOADING STEP --- */}
                    {currentStep.id === 'analysis' && (
                        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 py-20">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                            </div>
                            <h2 className="text-2xl font-bold text-white animate-pulse">{currentStep.title?.[language]}</h2>
                            <p className="text-gray-500 text-sm">{{ EN: 'Consulting 80+ Protocols...', KO: '80개 이상의 프로토콜 분석 중...', JP: '80以上のプロトコルを照合中...', CN: '正在匹配80+个临床方案...' }[language]}</p>
                        </div>
                    )}

                    {/* --- QUESTION STEPS --- */}
                    {step > 0 && currentStep.id !== 'analysis' && (
                        <div className="flex flex-col flex-1 max-w-xl mx-auto w-full">
                            <h3 className="text-2xl font-bold text-white mb-2">{currentStep.question?.[language]}</h3>
                            {currentStep.multi && <p className="text-sm text-gray-500 mb-6">{{ EN: 'Select all that apply', KO: '해당하는 것을 모두 선택하세요', JP: '当てはまるものをすべて選択', CN: '请选择所有适用项' }[language]}</p>}
                            {!currentStep.multi && <div className="mb-6" />}

                            <div className="flex-1 space-y-3">
                                {/* 1. BASIC INFO */}
                                {currentStep.id === 'basic' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-3 gap-2">
                                            {OPTIONS.gender.map((g) => (
                                                <OptionButton key={g.id} label={(g.label as Record<string, string>)[language]} selected={data.gender === g.id} onClick={() => updateData('gender', g.id)} />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {OPTIONS.age.map((a) => (
                                                <button key={a.id} onClick={() => updateData('age', a.id)}
                                                    className={cn("p-3 rounded-xl border text-sm transition-all", data.age === a.id ? "bg-blue-500/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400")}
                                                >{(a.label as Record<string, string>)[language]}</button>
                                            ))}
                                        </div>
                                        <select
                                            value={data.country} onChange={(e) => updateData('country', e.target.value)}
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white"
                                        >
                                            {OPTIONS.countries.map(c => <option key={c.id} value={c.id}>{(c.label as Record<string, string>)[language]}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* 2. GOALS */}
                                {currentStep.id === 'goals_1' && OPTIONS.goals.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.primaryGoal === o.id} onClick={() => updateData('primaryGoal', o.id)} />
                                ))}
                                {currentStep.id === 'goals_2' && OPTIONS.goals.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.secondaryGoal === o.id} onClick={() => updateData('secondaryGoal', o.id)} />
                                ))}

                                {/* 3. RISKS */}
                                {currentStep.id === 'risks' && OPTIONS.risks.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.risks.includes(o.id)} onClick={() => toggleMulti('risks', o.id)} multi />
                                ))}
                                {currentStep.id === 'risk_acne' && OPTIONS.acneStatus.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.acneStatus === o.id} onClick={() => updateData('acneStatus', o.id)} />
                                ))}
                                {currentStep.id === 'risk_pigment' && OPTIONS.pigmentPattern.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.pigmentType?.includes(o.id) || false} onClick={() => toggleMulti('pigmentType', o.id)} multi />
                                ))}

                                {/* 4. AREAS */}
                                {currentStep.id === 'areas' && OPTIONS.areas.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.areas.includes(o.id)} onClick={() => toggleMulti('areas', o.id)} multi />
                                ))}
                                {currentStep.id === 'area_pores' && OPTIONS.poreType.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.poreType === o.id} onClick={() => updateData('poreType', o.id)} />
                                ))}
                                {currentStep.id === 'area_priority' && OPTIONS.priority.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.priorityArea === o.id} onClick={() => updateData('priorityArea', o.id)} />
                                ))}

                                {/* 5. SKIN PROFILE */}
                                {currentStep.id === 'skin_profile' && OPTIONS.skinType.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.skinType === o.id} onClick={() => updateData('skinType', o.id)} />
                                ))}
                                {currentStep.id === 'style_preference' && OPTIONS.style.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.treatmentStyle === o.id} onClick={() => updateData('treatmentStyle', o.id)} />
                                ))}
                                {currentStep.id === 'volume_logic' && OPTIONS.volumeLogic.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.volumePreference === o.id} onClick={() => updateData('volumePreference', o.id)} />
                                ))}

                                {/* 6. PREFERENCES */}
                                {currentStep.id === 'preferences' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">
                                                {{ EN: 'Pain Tolerance', KO: '통증 내성', JP: '痛み耐性', CN: '疼痛耐受' }[language]}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {OPTIONS.pain.map(o => (
                                                    <button key={o.id} onClick={() => updateData('painTolerance', o.id)} className={cn("p-3 rounded-lg border text-xs text-left", data.painTolerance === o.id ? "bg-blue-500/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400")}>{(o.label as Record<string, string>)[language]}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">
                                                {{ EN: 'Downtime', KO: '회복 기간', JP: 'ダウンタイム', CN: '恢复期' }[language]}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {OPTIONS.downtime.map(o => (
                                                    <button key={o.id} onClick={() => updateData('downtimeTolerance', o.id)} className={cn("p-3 rounded-lg border text-xs text-left", data.downtimeTolerance === o.id ? "bg-blue-500/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400")}>{(o.label as Record<string, string>)[language]}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">
                                                {{ EN: 'Budget Preference', KO: '예산 선호도', JP: '予算の優先度', CN: '预算偏好' }[language]}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {OPTIONS.budget.map(o => (
                                                    <button key={o.id} onClick={() => updateData('budget', o.id)} className={cn("p-3 rounded-lg border text-xs text-left", data.budget === o.id ? "bg-blue-500/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400")}>{(o.label as Record<string, string>)[language]}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">
                                                {{ EN: 'Treatment Frequency', KO: '시술 빈도', JP: '施術頻度', CN: '治疗频率' }[language]}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {OPTIONS.frequency.map(o => (
                                                    <button key={o.id} onClick={() => updateData('frequency', o.id)} className={cn("p-3 rounded-lg border text-xs text-left", data.frequency === o.id ? "bg-blue-500/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-400")}>{(o.label as Record<string, string>)[language]}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 7. HISTORY */}
                                {currentStep.id === 'history' && OPTIONS.history.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.treatmentHistory.includes(o.id)} onClick={() => toggleMulti('treatmentHistory', o.id)} multi />
                                ))}
                                {currentStep.id === 'history_outcome' && OPTIONS.satisfaction.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.historySatisfaction === o.id} onClick={() => updateData('historySatisfaction', o.id)} />
                                ))}

                                {/* 8. HABITS */}
                                {currentStep.id === 'habits' && OPTIONS.habits.map(o => (
                                    <OptionButton key={o.id} label={(o.label as Record<string, string>)[language]} selected={data.careHabits.includes(o.id)} onClick={() => toggleMulti('careHabits', o.id)} multi />
                                ))}

                                {/* 9. CONTACT */}
                                {currentStep.id === 'contact' && (
                                    <div className="space-y-4">
                                        <input
                                            type="email"
                                            placeholder={{ EN: 'Enter your email to receive the report', KO: '리포트를 받을 이메일 주소', JP: 'レポートを受け取るメールアドレス', CN: '输入邮箱以接收报告' }[language] || 'Enter your email'}
                                            value={data.email}
                                            onChange={(e) => updateData('email', e.target.value)}
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
                                        />
                                        <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                            <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
                                            <p className="text-sm text-gray-300">
                                                {{ EN: 'By continuing, you agree to our processing of your personal health data for the purpose of generating this clinical report.', KO: '계속 진행하면 임상 리포트 생성을 위한 개인 건강 정보 처리에 동의하는 것으로 간주됩니다.', JP: '続行することで、臨床レポート生成のための個人健康情報の処理に同意したものとみなされます。', CN: '继续即表示您同意我们处理您的个人健康数据以生成本临床报告。' }[language]}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div className="mt-8 flex justify-between pt-4 border-t border-white/5">
                                <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4" /> {{ EN: 'Back', KO: '이전', JP: '前へ', CN: '上一步' }[language]}
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={currentStep.id === 'contact' && !data.email.includes('@')}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    {isLastStep ? { EN: 'Analyze Now', KO: '지금 분석하기', JP: '今すぐ分析', CN: '立即分析' }[language] : { EN: 'Next', KO: '다음', JP: '次へ', CN: '下一步' }[language]}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
