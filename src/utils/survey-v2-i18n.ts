// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Survey v2 — i18n (KO / EN / JP / ZH-CN)
//  Based on HYBRID_SURVEY_LOGIC_v2.md §4-3 + FRONTEND_UI_COMPONENT_DESIGN_v2.md §10
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/survey-v2';

// ─── UI 텍스트 ──────────────────────────────────────────────
export interface SurveyV2Translations {
  step1: {
    title: string;
    subtitle: string;
    gender_label: string;
    age_label: string;
    country_label: string;
    language_label: string;
    gender_female: string;
    gender_male: string;
    gender_other: string;
    age_teen: string;
    age_20s: string;
    age_30s: string;
    age_40s: string;
    age_50s: string;
    age_60plus: string;
  };
  step2: {
    title: string;
    subtitle: string;
    placeholder: string;
    hint: string;
    min_chars: string;
  };
  step3: {
    title: string;
    subtitle: string;
  };
  step4: {
    title: string;
    subtitle: string;
    medications_label: string;
    conditions_label: string;
    none: string;
    select_all_hint: string;
    // Medication options
    med_isotretinoin: string;
    med_anticoagulant: string;
    med_antibiotic: string;
    med_hormonal: string;
    med_retinoid: string;
    // Condition options
    cond_pregnancy: string;
    cond_keloid: string;
    cond_adverse: string;
    // Follow-up
    followup_title: string;
    isotretinoin_q: string;
    isotretinoin_active: string;
    isotretinoin_recent: string;
    isotretinoin_cleared: string;
  };
  step5: {
    title: string;
    subtitle: string;
    phase1: string;
    phase2: string;
    phase3: string;
  };
  common: {
    next: string;
    back: string;
    submit: string;
    loading: string;
    error_generic: string;
    progress_step: string; // "{n}단계"
  };
  progress: {
    demographics: string;
    open: string;
    chips: string;
    safety: string;
    messenger: string;
    analyzing: string;
    complete: string;
  };
}

export const SURVEY_V2_I18N: Record<SurveyLang, SurveyV2Translations> = {
  KO: {
    step1: {
      title: '맞춤 피부 상담을 시작합니다',
      subtitle: 'AI가 80개 이상의 임상 프로토콜을 분석합니다.',
      gender_label: '성별',
      age_label: '연령대',
      country_label: '국가',
      language_label: '언어',
      gender_female: '여성',
      gender_male: '남성',
      gender_other: '기타',
      age_teen: '10대',
      age_20s: '20대',
      age_30s: '30대',
      age_40s: '40대',
      age_50s: '50대',
      age_60plus: '60대+',
    },
    step2: {
      title: '피부에서 가장 신경 쓰이는\n순간이 있으신가요?',
      subtitle: '거울을 볼 때, 사진을 찍을 때, 사람들을 만날 때 —\n어떤 순간에 가장 고민이 되시나요?',
      placeholder: '피부에서 가장 신경 쓰이는 순간을 자유롭게 적어주세요...',
      hint: '예: "사진 찍을 때 팔자주름이 보여서 자신감이 없어요"',
      min_chars: '5자 이상 입력해 주세요',
    },
    step3: {
      title: '몇 가지만 더 확인할게요',
      subtitle: '맞춤 분석을 위해 간단히 응답해 주세요.',
    },
    step4: {
      title: '안전한 시술을 위해\n몇 가지 확인합니다',
      subtitle: '해당하는 것을 모두 선택해 주세요.',
      medications_label: '현재 복용 중인 약',
      conditions_label: '해당 사항',
      none: '해당 없음',
      select_all_hint: '해당하는 것 모두 선택',
      med_isotretinoin: '여드름 약 (이소트레티노인)',
      med_anticoagulant: '혈액 관련 약 (아스피린 등)',
      med_antibiotic: '항생제',
      med_hormonal: '호르몬제 (피임약, HRT)',
      med_retinoid: '레티놀/레티노이드 (바르는)',
      cond_pregnancy: '임신 중 또는 수유 중',
      cond_keloid: '켈로이드 체질',
      cond_adverse: '최근 피부 시술 후 부작용',
      followup_title: '⚠️ 확인이 필요합니다',
      isotretinoin_q: '현재 복용 중인가요, 중단하셨나요?',
      isotretinoin_active: '현재 복용 중',
      isotretinoin_recent: '중단 6개월 미만',
      isotretinoin_cleared: '중단 6개월 이상',
    },
    step5: {
      title: 'AI 피부 분석 중...',
      subtitle: '맞춤 시술 계획을 준비하고 있어요',
      phase1: '피부 고민 분석 중...',
      phase2: '최적 프로토콜 매칭 중...',
      phase3: '맞춤 리포트 생성 중...',
    },
    common: {
      next: '다음으로',
      back: '뒤로',
      submit: '분석 시작하기',
      loading: '분석 중...',
      error_generic: '오류가 발생했습니다. 다시 시도해 주세요.',
      progress_step: '단계',
    },
    progress: {
      demographics: '기본정보',
      open: '고민입력',
      chips: '맞춤질문',
      safety: '안전확인',
      messenger: '연락처',
      analyzing: '분석중',
      complete: '완료',
    },
  },

  EN: {
    step1: {
      title: 'Start Your Personalized\nSkin Consultation',
      subtitle: 'AI analyzes 80+ clinical protocols for you.',
      gender_label: 'Gender',
      age_label: 'Age Range',
      country_label: 'Country',
      language_label: 'Language',
      gender_female: 'Female',
      gender_male: 'Male',
      gender_other: 'Other',
      age_teen: 'Teen',
      age_20s: '20s',
      age_30s: '30s',
      age_40s: '40s',
      age_50s: '50s',
      age_60plus: '60+',
    },
    step2: {
      title: 'When do you notice your skin\nconcerns the most?',
      subtitle: 'For example, looking in the mirror, taking photos,\nmeeting people — when does it bother you most?',
      placeholder: 'Describe the moments when your skin concerns bother you...',
      hint: 'e.g. "I avoid photos because of my smile lines"',
      min_chars: 'Please enter at least 5 characters',
    },
    step3: {
      title: 'Just a few more questions',
      subtitle: 'Help us personalize your analysis.',
    },
    step4: {
      title: 'Safety Check',
      subtitle: 'Select all that apply.',
      medications_label: 'Current Medications',
      conditions_label: 'Conditions',
      none: 'None',
      select_all_hint: 'Select all that apply',
      med_isotretinoin: 'Acne medication (Isotretinoin)',
      med_anticoagulant: 'Blood thinners (Aspirin, etc.)',
      med_antibiotic: 'Antibiotics',
      med_hormonal: 'Hormonal (Birth control, HRT)',
      med_retinoid: 'Topical retinol/retinoid',
      cond_pregnancy: 'Pregnant or breastfeeding',
      cond_keloid: 'Keloid-prone skin',
      cond_adverse: 'Recent adverse reaction to treatment',
      followup_title: '⚠️ Additional info needed',
      isotretinoin_q: 'Are you currently taking it, or have you stopped?',
      isotretinoin_active: 'Currently taking',
      isotretinoin_recent: 'Stopped < 6 months ago',
      isotretinoin_cleared: 'Stopped ≥ 6 months ago',
    },
    step5: {
      title: 'Analyzing Your Skin Profile...',
      subtitle: 'Creating your personalized treatment plan',
      phase1: 'Analyzing skin concerns...',
      phase2: 'Matching optimal protocols...',
      phase3: 'Generating your report...',
    },
    common: {
      next: 'Next',
      back: 'Back',
      submit: 'Start Analysis',
      loading: 'Analyzing...',
      error_generic: 'Something went wrong. Please try again.',
      progress_step: 'Step',
    },
    progress: {
      demographics: 'Profile',
      open: 'Concerns',
      chips: 'Details',
      safety: 'Safety',
      messenger: 'Contact',
      analyzing: 'Analysis',
      complete: 'Complete',
    },
  },

  JP: {
    step1: {
      title: 'カスタマイズ肌診断を\n始めましょう',
      subtitle: 'AIが80以上の臨床プロトコルを分析します。',
      gender_label: '性別',
      age_label: '年代',
      country_label: '国',
      language_label: '言語',
      gender_female: '女性',
      gender_male: '男性',
      gender_other: 'その他',
      age_teen: '10代',
      age_20s: '20代',
      age_30s: '30代',
      age_40s: '40代',
      age_50s: '50代',
      age_60plus: '60代+',
    },
    step2: {
      title: 'お肌で一番気になる\n瞬間はありますか？',
      subtitle: '鏡を見る時、写真を撮る時、人に会う時 —\nどんな瞬間に一番気になりますか？',
      placeholder: 'お肌が一番気になる瞬間を自由にお書きください...',
      hint: '例：「写真を撮る時にほうれい線が気になって」',
      min_chars: '5文字以上入力してください',
    },
    step3: {
      title: 'もう少しだけ確認させてください',
      subtitle: 'カスタマイズ分析のためにお答えください。',
    },
    step4: {
      title: '安全な施術のために\n確認します',
      subtitle: '該当するものをすべて選択してください。',
      medications_label: '現在服用中のお薬',
      conditions_label: '該当事項',
      none: '該当なし',
      select_all_hint: '該当するものをすべて選択',
      med_isotretinoin: 'ニキビ薬（イソトレチノイン）',
      med_anticoagulant: '血液関連薬（アスピリン等）',
      med_antibiotic: '抗生物質',
      med_hormonal: 'ホルモン剤（ピル、HRT）',
      med_retinoid: 'レチノール/レチノイド（外用）',
      cond_pregnancy: '妊娠中または授乳中',
      cond_keloid: 'ケロイド体質',
      cond_adverse: '最近の施術後の副反応',
      followup_title: '⚠️ 確認が必要です',
      isotretinoin_q: '現在服用中ですか、中止されましたか？',
      isotretinoin_active: '現在服用中',
      isotretinoin_recent: '中止6ヶ月未満',
      isotretinoin_cleared: '中止6ヶ月以上',
    },
    step5: {
      title: 'AI肌分析中...',
      subtitle: 'カスタマイズ施術プランを準備しています',
      phase1: '肌の悩みを分析中...',
      phase2: '最適プロトコルをマッチング中...',
      phase3: 'レポートを生成中...',
    },
    common: {
      next: '次へ',
      back: '戻る',
      submit: '分析を開始',
      loading: '分析中...',
      error_generic: 'エラーが発生しました。もう一度お試しください。',
      progress_step: 'ステップ',
    },
    progress: {
      demographics: '基本情報',
      open: 'お悩み',
      chips: '詳細',
      safety: '安全確認',
      messenger: '連絡先',
      analyzing: '分析中',
      complete: '完了',
    },
  },

  'ZH-CN': {
    step1: {
      title: '开始您的\n定制皮肤咨询',
      subtitle: 'AI将为您分析80多种临床方案。',
      gender_label: '性别',
      age_label: '年龄段',
      country_label: '国家',
      language_label: '语言',
      gender_female: '女',
      gender_male: '男',
      gender_other: '其他',
      age_teen: '青少年',
      age_20s: '20多岁',
      age_30s: '30多岁',
      age_40s: '40多岁',
      age_50s: '50多岁',
      age_60plus: '60岁+',
    },
    step2: {
      title: '皮肤最让您在意的\n时刻是什么？',
      subtitle: '比如照镜子的时候、拍照的时候、见人的时候 —\n什么时刻最让您困扰？',
      placeholder: '请描述皮肤最让您在意的时刻...',
      hint: '例如："拍照的时候法令纹很明显，没有自信"',
      min_chars: '请至少输入5个字',
    },
    step3: {
      title: '再确认几个问题',
      subtitle: '帮助我们为您提供精准分析。',
    },
    step4: {
      title: '为了安全治疗\n请确认以下信息',
      subtitle: '请选择所有适用项。',
      medications_label: '目前在服用的药物',
      conditions_label: '相关情况',
      none: '无',
      select_all_hint: '选择所有适用项',
      med_isotretinoin: '痘痘药（异维A酸）',
      med_anticoagulant: '血液相关药物（阿司匹林等）',
      med_antibiotic: '抗生素',
      med_hormonal: '激素类（避孕药、HRT）',
      med_retinoid: '外用维A酸/视黄醇',
      cond_pregnancy: '怀孕中或哺乳中',
      cond_keloid: '疤痕体质',
      cond_adverse: '近期治疗后有不良反应',
      followup_title: '⚠️ 需要确认',
      isotretinoin_q: '您目前在服用还是已停药？',
      isotretinoin_active: '目前在服用',
      isotretinoin_recent: '停药不到6个月',
      isotretinoin_cleared: '停药6个月以上',
    },
    step5: {
      title: 'AI皮肤分析中...',
      subtitle: '正在为您准备定制治疗方案',
      phase1: '分析皮肤问题中...',
      phase2: '匹配最佳方案中...',
      phase3: '生成报告中...',
    },
    common: {
      next: '下一步',
      back: '返回',
      submit: '开始分析',
      loading: '分析中...',
      error_generic: '出现错误，请重试。',
      progress_step: '步骤',
    },
    progress: {
      demographics: '基本信息',
      open: '问题描述',
      chips: '详细信息',
      safety: '安全确认',
      messenger: '联系方式',
      analyzing: '分析中',
      complete: '完成',
    },
  },
};

// ─── Chip 질문 번역 (HYBRID_SURVEY_LOGIC_v2 §4-3) ──────────
export interface ChipTemplate {
  question: Record<SurveyLang, string>;
  options: { label: Record<SurveyLang, string>; value: string }[];
  priority: number;
}

export const CHIP_TEMPLATES: Record<string, ChipTemplate> = {
  concern_area: {
    question: {
      KO: '어느 부위가 가장 신경 쓰이세요?',
      EN: 'Which area concerns you the most?',
      JP: 'どの部位が最も気になりますか？',
      'ZH-CN': '哪个部位最让您困扰？',
    },
    options: [
      { label: { KO: '턱선/볼', EN: 'Jawline/Cheeks', JP: '顎ライン/頬', 'ZH-CN': '下颌线/脸颊' }, value: 'jawline_cheek' },
      { label: { KO: '눈밑/중안부', EN: 'Under-eye/Mid-face', JP: '目の下/中顔面', 'ZH-CN': '眼下/中面部' }, value: 'undereye_midface' },
      { label: { KO: '이마/상안부', EN: 'Forehead/Upper face', JP: '額/上顔面', 'ZH-CN': '额头/上面部' }, value: 'forehead_upper' },
      { label: { KO: '전체적으로', EN: 'Overall face', JP: '顔全体', 'ZH-CN': '整体' }, value: 'overall' },
    ],
    priority: 1,
  },
  skin_profile: {
    question: {
      KO: '본인 피부 타입은 어떤 편인가요?',
      EN: 'How would you describe your skin type?',
      JP: 'ご自身の肌タイプはどちらですか？',
      'ZH-CN': '您的皮肤类型是？',
    },
    options: [
      { label: { KO: '건성/민감', EN: 'Dry/Sensitive', JP: '乾燥/敏感肌', 'ZH-CN': '干性/敏感' }, value: 'dry_sensitive' },
      { label: { KO: '보통', EN: 'Normal', JP: '普通肌', 'ZH-CN': '中性' }, value: 'normal' },
      { label: { KO: '지성/모공', EN: 'Oily/Pores', JP: '脂性/毛穴', 'ZH-CN': '油性/毛孔' }, value: 'oily_pores' },
      { label: { KO: '복합', EN: 'Combination', JP: '混合肌', 'ZH-CN': '混合' }, value: 'combination' },
    ],
    priority: 2,
  },
  past_experience: {
    question: {
      KO: '이전에 피부 시술을 받아본 적이 있으신가요?',
      EN: 'Have you had any skin treatments before?',
      JP: '以前にスキンケア施術を受けたことはありますか？',
      'ZH-CN': '您之前做过皮肤治疗吗？',
    },
    options: [
      { label: { KO: '있음 — 만족', EN: 'Yes — Satisfied', JP: 'あり — 満足', 'ZH-CN': '有 — 满意' }, value: 'yes_satisfied' },
      { label: { KO: '있음 — 별로', EN: 'Yes — Not great', JP: 'あり — 不満', 'ZH-CN': '有 — 不太满意' }, value: 'yes_unsatisfied' },
      { label: { KO: '없음', EN: 'No experience', JP: 'なし', 'ZH-CN': '没有' }, value: 'none' },
    ],
    priority: 3,
  },
  volume_logic: {
    question: {
      KO: '볼륨 개선은 어떤 방식을 선호하세요?',
      EN: 'How would you prefer to restore volume?',
      JP: 'ボリューム改善はどの方法を希望しますか？',
      'ZH-CN': '您希望怎样改善面部容量？',
    },
    options: [
      { label: { KO: '자연스러운 탄력', EN: 'Natural firmness', JP: '自然なハリ', 'ZH-CN': '自然弹力' }, value: 'natural_firmness' },
      { label: { KO: '필러 볼륨업', EN: 'Filler volume', JP: 'フィラーボリューム', 'ZH-CN': '填充剂丰盈' }, value: 'filler_volume' },
      { label: { KO: '둘 다 상관없음', EN: 'Either is fine', JP: 'どちらでも', 'ZH-CN': '都可以' }, value: 'either' },
    ],
    priority: 4,
  },
  pigment_pattern: {
    question: {
      KO: '색소 고민이 어떤 유형인가요?',
      EN: 'What type of pigmentation do you have?',
      JP: '色素のお悩みはどのタイプですか？',
      'ZH-CN': '您的色素问题属于哪种类型？',
    },
    options: [
      { label: { KO: '기미 (넓게 퍼짐)', EN: 'Melasma (diffuse)', JP: '肝斑（広範囲）', 'ZH-CN': '黄褐斑（大面积）' }, value: 'melasma' },
      { label: { KO: '잡티/주근깨', EN: 'Spots/Freckles', JP: 'シミ/そばかす', 'ZH-CN': '色斑/雀斑' }, value: 'spots_freckles' },
      { label: { KO: '거무스름한 톤', EN: 'Dull/Uneven tone', JP: 'くすみ', 'ZH-CN': '暗沉/肤色不均' }, value: 'dull_tone' },
      { label: { KO: '잘 모르겠음', EN: 'Not sure', JP: 'よくわからない', 'ZH-CN': '不确定' }, value: 'unsure' },
    ],
    priority: 5,
  },
  style: {
    question: {
      KO: '선호하는 시술 스타일은?',
      EN: 'What treatment style do you prefer?',
      JP: '希望する施術スタイルは？',
      'ZH-CN': '您偏好什么治疗风格？',
    },
    options: [
      { label: { KO: '자연스럽게', EN: 'Natural', JP: 'ナチュラル', 'ZH-CN': '自然' }, value: 'natural' },
      { label: { KO: '확실한 변화', EN: 'Visible change', JP: 'はっきりした変化', 'ZH-CN': '明显变化' }, value: 'dramatic' },
      { label: { KO: '안전 우선', EN: 'Safety first', JP: '安全優先', 'ZH-CN': '安全第一' }, value: 'safe' },
    ],
    priority: 6,
  },
  pain_tolerance: {
    question: {
      KO: '시술 중 통증 민감도는?',
      EN: 'How sensitive are you to pain during treatment?',
      JP: '施術中の痛みへの敏感度は？',
      'ZH-CN': '您对治疗中的疼痛敏感吗？',
    },
    options: [
      { label: { KO: '매우 민감', EN: 'Very sensitive', JP: 'とても敏感', 'ZH-CN': '非常敏感' }, value: 'minimal' },
      { label: { KO: '보통', EN: 'Average', JP: '普通', 'ZH-CN': '一般' }, value: 'moderate' },
      { label: { KO: '괜찮음', EN: 'High tolerance', JP: '耐えられる', 'ZH-CN': '耐受力强' }, value: 'high' },
    ],
    priority: 7,
  },
  downtime_tolerance: {
    question: {
      KO: '다운타임(회복기간) 허용 범위는?',
      EN: 'How much downtime can you accept?',
      JP: 'ダウンタイムの許容範囲は？',
      'ZH-CN': '您可以接受多长的恢复期？',
    },
    options: [
      { label: { KO: '없어야 함', EN: 'None', JP: 'なし', 'ZH-CN': '不能有' }, value: 'none' },
      { label: { KO: '1~3일', EN: '1-3 days', JP: '1〜3日', 'ZH-CN': '1-3天' }, value: 'short' },
      { label: { KO: '1주 이내', EN: 'Up to 1 week', JP: '1週間以内', 'ZH-CN': '1周以内' }, value: 'medium' },
      { label: { KO: '상관없음', EN: 'Doesn\'t matter', JP: '気にしない', 'ZH-CN': '无所谓' }, value: 'any' },
    ],
    priority: 8,
  },
  treatment_rhythm: {
    question: {
      KO: '시술 주기는 어느 정도를 생각하세요?',
      EN: 'How often can you visit for treatments?',
      JP: '施術の頻度はどのくらいを考えていますか？',
      'ZH-CN': '您计划多久做一次治疗？',
    },
    options: [
      { label: { KO: '한 번으로 끝내고 싶음', EN: 'One-time only', JP: '一回で終わりたい', 'ZH-CN': '一次就好' }, value: 'one_time' },
      { label: { KO: '월 1~2회', EN: '1-2 times/month', JP: '月1〜2回', 'ZH-CN': '每月1-2次' }, value: 'monthly' },
      { label: { KO: '분기별 유지', EN: 'Quarterly', JP: '四半期ごと', 'ZH-CN': '每季度' }, value: 'quarterly' },
    ],
    priority: 9,
  },

  // ═══════════════════════════════════════════════════════════
  //  Clinical Depth Chips (Issue #1)
  //  Goal-specific questions that map directly to clinical
  //  decision parameters in the Opus recommendation engine.
  // ═══════════════════════════════════════════════════════════

  tightening_zone: {
    question: {
      KO: '가장 개선하고 싶은 리프팅 부위는?',
      EN: 'Which area do you most want to lift/tighten?',
      JP: '最もリフトアップしたい部位は？',
      'ZH-CN': '您最想提升紧致的部位是？',
    },
    options: [
      { label: { KO: '이마/눈가 (상안부)', EN: 'Forehead/eyes (upper)', JP: '額・目元（上顔面）', 'ZH-CN': '额头/眼周（上面部）' }, value: 'upper_face' },
      { label: { KO: '볼/광대 (중안부)', EN: 'Cheeks/midface', JP: '頬・中顔面', 'ZH-CN': '脸颊/中面部' }, value: 'mid_face' },
      { label: { KO: '턱선/이중턱 (하안부)', EN: 'Jawline/double chin (lower)', JP: '顎ライン・二重あご（下顔面）', 'ZH-CN': '下颌线/双下巴（下面部）' }, value: 'lower_face' },
      { label: { KO: '전체적으로', EN: 'Overall', JP: '全体的に', 'ZH-CN': '整体' }, value: 'full_face' },
    ],
    priority: 2,
  },

  scar_type: {
    question: {
      KO: '흉터 유형은 어떤 편인가요?',
      EN: 'What type of scarring do you have?',
      JP: '傷跡のタイプは？',
      'ZH-CN': '您的疤痕类型是？',
    },
    options: [
      { label: { KO: '여드름 흉터 (움푹/볼록)', EN: 'Acne scars (pitted/raised)', JP: 'ニキビ跡（凹凸）', 'ZH-CN': '痘疤（凹陷/凸起）' }, value: 'acne_scar' },
      { label: { KO: '외상/수술 흉터', EN: 'Trauma/surgical scars', JP: '外傷・手術の傷跡', 'ZH-CN': '外伤/手术疤痕' }, value: 'traumatic_scar' },
      { label: { KO: '넓은 모공 (흉터 유사)', EN: 'Enlarged pores (scar-like)', JP: '毛穴の開き（傷跡に近い）', 'ZH-CN': '毛孔粗大（类似疤痕）' }, value: 'pore_scar' },
    ],
    priority: 2,
  },

  pigment_detail: {
    question: {
      KO: '색소 고민의 구체적인 유형은?',
      EN: 'What specific type of pigmentation concerns you?',
      JP: '色素の悩みの具体的なタイプは？',
      'ZH-CN': '您的色素问题具体是哪种类型？',
    },
    options: [
      { label: { KO: '흑자/검버섯 (Lentigines)', EN: 'Dark spots / Lentigines', JP: '老人性色素斑', 'ZH-CN': '老年斑/雀斑样痣' }, value: 'lentigines' },
      { label: { KO: '기미 (Melasma)', EN: 'Melasma', JP: '肝斑（かんぱん）', 'ZH-CN': '黄褐斑' }, value: 'melasma' },
      { label: { KO: '여드름 자국 (PIH)', EN: 'Post-inflammatory marks (PIH)', JP: '炎症後色素沈着（PIH）', 'ZH-CN': '炎症后色素沉着（PIH）' }, value: 'pih' },
      { label: { KO: '전체적 칙칙함/톤 불균일', EN: 'Overall dullness/uneven tone', JP: '全体的なくすみ・色ムラ', 'ZH-CN': '整体暗沉/肤色不均' }, value: 'dullness' },
    ],
    priority: 2,
  },

  aging_priority: {
    question: {
      KO: '노화 고민 중 가장 우선적인 것은?',
      EN: 'What is your top anti-aging priority?',
      JP: 'エイジングケアで最も優先したいのは？',
      'ZH-CN': '您最优先想改善的衰老问题是？',
    },
    options: [
      { label: { KO: '주름 (이마/눈가/입가)', EN: 'Wrinkles (forehead/eyes/mouth)', JP: 'しわ（額・目元・口元）', 'ZH-CN': '皱纹（额头/眼周/嘴角）' }, value: 'wrinkles' },
      { label: { KO: '처짐/탄력 저하', EN: 'Sagging/loss of firmness', JP: 'たるみ・弾力低下', 'ZH-CN': '松弛/弹性下降' }, value: 'sagging' },
      { label: { KO: '볼륨 감소 (꺼짐)', EN: 'Volume loss (hollowing)', JP: 'ボリューム減少（くぼみ）', 'ZH-CN': '容量流失（凹陷）' }, value: 'volume_loss' },
      { label: { KO: '전반적 노화 예방', EN: 'Overall anti-aging prevention', JP: '全体的なアンチエイジング', 'ZH-CN': '整体抗衰老预防' }, value: 'prevention' },
    ],
    priority: 3,
  },

  texture_concern: {
    question: {
      KO: '피부결 고민은 어떤 유형인가요?',
      EN: 'What type of skin texture issue do you have?',
      JP: '肌質の悩みはどのタイプですか？',
      'ZH-CN': '您的皮肤质地问题是哪种类型？',
    },
    options: [
      { label: { KO: '모공 확대', EN: 'Enlarged pores', JP: '毛穴の開き', 'ZH-CN': '毛孔粗大' }, value: 'pores' },
      { label: { KO: '거칠고 울퉁불퉁', EN: 'Rough/bumpy texture', JP: 'ザラつき・凹凸', 'ZH-CN': '粗糙/不平整' }, value: 'roughness' },
      { label: { KO: '여드름 자국/흉터', EN: 'Acne marks/scars', JP: 'ニキビ跡・傷跡', 'ZH-CN': '痘印/疤痕' }, value: 'acne_marks' },
      { label: { KO: '전반적 피부결 개선', EN: 'Overall texture refinement', JP: '全体的な肌質改善', 'ZH-CN': '整体肤质改善' }, value: 'overall_texture' },
    ],
    priority: 3,
  },

  laxity_severity: {
    question: {
      KO: '처짐의 정도는 어느 수준인가요?',
      EN: 'How severe is your skin laxity?',
      JP: 'たるみの程度はどのくらいですか？',
      'ZH-CN': '您的皮肤松弛程度如何？',
    },
    options: [
      { label: { KO: '초기 (미세한 느슨함)', EN: 'Early (subtle looseness)', JP: '初期（微かなゆるみ）', 'ZH-CN': '初期（轻微松弛）' }, value: 'mild' },
      { label: { KO: '중등도 (눈에 띄는 처짐)', EN: 'Moderate (noticeable sagging)', JP: '中程度（目立つたるみ）', 'ZH-CN': '中度（明显下垂）' }, value: 'moderate' },
      { label: { KO: '심한 처짐 (윤곽 변화)', EN: 'Severe (contour change)', JP: '重度（輪郭の変化）', 'ZH-CN': '严重（轮廓变化）' }, value: 'severe' },
    ],
    priority: 3,
  },

  treatment_budget: {
    question: {
      KO: '시술 예산대는 어느 정도인가요?',
      EN: 'What is your treatment budget range?',
      JP: '施術のご予算は？',
      'ZH-CN': '您的治疗预算范围是？',
    },
    options: [
      { label: { KO: '가성비 우선', EN: 'Budget-friendly', JP: 'コスパ重視', 'ZH-CN': '性价比优先' }, value: 'budget' },
      { label: { KO: '중간', EN: 'Mid-range', JP: '中程度', 'ZH-CN': '中等' }, value: 'mid' },
      { label: { KO: '프리미엄 (최고 결과 우선)', EN: 'Premium (best results first)', JP: 'プレミアム（最高の結果優先）', 'ZH-CN': '高端（效果优先）' }, value: 'premium' },
    ],
    priority: 5,
  },
};

// ─── 국가 → 기본 언어 매핑 ─────────────────────────────────
export const COUNTRY_LANG_MAP: Record<string, SurveyLang> = {
  KR: 'KO',
  JP: 'JP',
  CN: 'ZH-CN',
  TW: 'ZH-CN',
  HK: 'ZH-CN',
  // 나머지 모두 EN
};

export function getDefaultLang(countryCode: string): SurveyLang {
  return COUNTRY_LANG_MAP[countryCode] || 'EN';
}

// ─── 국가 목록 (IP detect + 수동 선택) ─────────────────────
export const COUNTRY_OPTIONS = [
  { code: 'KR', flag: '🇰🇷', label: { KO: '한국', EN: 'Korea', JP: '韓国', 'ZH-CN': '韩国' } },
  { code: 'JP', flag: '🇯🇵', label: { KO: '일본', EN: 'Japan', JP: '日本', 'ZH-CN': '日本' } },
  { code: 'CN', flag: '🇨🇳', label: { KO: '중국', EN: 'China', JP: '中国', 'ZH-CN': '中国' } },
  { code: 'SG', flag: '🇸🇬', label: { KO: '싱가포르', EN: 'Singapore', JP: 'シンガポール', 'ZH-CN': '新加坡' } },
  { code: 'US', flag: '🇺🇸', label: { KO: '미국', EN: 'USA', JP: 'アメリカ', 'ZH-CN': '美国' } },
  { code: 'TH', flag: '🇹🇭', label: { KO: '태국', EN: 'Thailand', JP: 'タイ', 'ZH-CN': '泰国' } },
  { code: 'VN', flag: '🇻🇳', label: { KO: '베트남', EN: 'Vietnam', JP: 'ベトナム', 'ZH-CN': '越南' } },
  { code: 'OTHER', flag: '🌏', label: { KO: '기타', EN: 'Other', JP: 'その他', 'ZH-CN': '其他' } },
];

export const LANGUAGE_OPTIONS: { code: SurveyLang; flag: string; label: string }[] = [
  { code: 'KO', flag: '🇰🇷', label: '한국어' },
  { code: 'EN', flag: '🇺🇸', label: 'English' },
  { code: 'JP', flag: '🇯🇵', label: '日本語' },
  { code: 'ZH-CN', flag: '🇨🇳', label: '中文' },
];
