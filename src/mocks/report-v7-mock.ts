// ═══════════════════════════════════════════════════════════════
//  Report v7 — Mock Data
//  Realistic medical aesthetics scenario for development/testing.
//
//  Patient: 35세 일본 여성, Fitzpatrick III
//  Chief concerns: 기미 + 리프팅
//  EBD: Sofwave, Sylfirm X, LaseMD Ultra
//  Injectable: Rejuran, Juvelook, Botox
//
//  NEXT_PUBLIC_AI_MOCK=true → useReportData returns this data
// ═══════════════════════════════════════════════════════════════

import type { ReportV7Data } from '@/types/report-v7';

export const MOCK_REPORT_V7: ReportV7Data = {
  lang: 'KO',
  generatedAt: '2025-06-15T09:30:00Z',
  model: 'claude-opus-4-20250514',

  // ─── Patient Profile ──────────────────────────────────────────
  patient: {
    name: 'Yuki Tanaka',
    age: '30-39',
    gender: 'Female',
    country: 'JP',
    aestheticGoal: '기미 개선 + 얼굴 리프팅으로 자연스럽고 젊어 보이는 인상',
    top3Concerns: ['기미/색소침착', '피부 탄력 저하', '턱선 처짐'],
    pastTreatments: ['레이저 토닝 (6개월 전)', '보톡스 (1년 전)'],
    fitzpatrick: 'III',
    painSensitivity: 2,
    stayDuration: '5일',
    contraindications: [],
  },

  // ─── Safety Flags ──────────────────────────────────────────────
  safetyFlags: [
    {
      code: 'HORMONAL_MELASMA',
      severity: 'info',
      message: '호르몬성 기미가 의심됩니다. 트리트먼트 시 주의가 필요합니다.',
    },
  ],

  // ─── Mirror Layer (서사 1단계: 감정 공감) ──────────────────────
  mirror: {
    headline: '거울 속 그 그림자, 저도 알고 있어요',
    empathyParagraphs:
      '아침 햇살에 비친 거울을 볼 때마다 양 볼에 퍼진 갈색 그림자가 눈에 들어오시죠. 파운데이션을 아무리 두껍게 발라도 오후가 되면 다시 비쳐 나오고, 예전보다 얼굴 윤곽이 흐릿해진 것 같은 느낌. 그 마음을 잘 알고 있습니다.\n\n30대 중반은 피부 변화가 눈에 띄게 시작되는 시기입니다. 특히 일본에서 오신 분들은 자연스러운 개선을 원하시면서도 확실한 변화를 기대하시죠. Yuki님의 고민은 매우 흔하고, 무엇보다 해결할 수 있는 고민입니다.',
    transition: '그리고 좋은 소식이 있습니다 — 정확한 방법이 있습니다.',
  },

  // ─── Confidence Layer (서사 2단계: 임상 확신) ──────────────────
  confidence: {
    reasonWhy:
      'Yuki님의 기미는 표피-진피 경계에 있는 혼합형 기미로 분석됩니다. Fitzpatrick III 피부는 적절한 에너지 레벨에서 매우 좋은 반응을 보입니다. 30대 콜라겐 합성 능력이 아직 활발하기 때문에, HIFU + 마이크로니들링 조합은 리프팅과 피부결 개선을 동시에 달성할 수 있습니다.\n\n핵심은 멜라노사이트를 자극하지 않으면서 콜라겐 리모델링을 유도하는 것입니다. 이를 위해 최신 디바이스들의 선택적 열 손상 원리를 활용합니다.',
    socialProof:
      '비슷한 조건(30대, 동아시아, 혼합형 기미 + 탄력)의 환자 87%가 3회 시술 후 만족스러운 개선을 보고했습니다.',
    commitment: '과학적으로 검증된 접근법으로, Yuki님에게 맞는 최적의 솔루션을 찾았습니다.',
  },

  // ─── EBD Recommendations (3개) ──────────────────────────────
  ebdRecommendations: [
    {
      rank: 1,
      deviceName: 'Sofwave',
      deviceId: 'sofwave-superb',
      moaCategory: 'HIFU',
      moaCategoryLabel: 'Synchronous Ultrasound Parallel Beam (SUPERB™)',
      evidenceLevel: 4,
      confidence: 92,
      skinLayer: 'Mid-dermis (1.5mm)',
      painLevel: 2,
      downtimeLevel: 1,
      safetyLevel: 5,
      badge: 'FDA Cleared',
      badgeColor: '#22d3ee',
      subtitle: '비침습 HIFU 리프팅의 새로운 기준',
      summaryHtml: '<p>Sofwave는 1.5mm 깊이에 집중 초음파 에너지를 전달하여 <strong>콜라겐 리모델링</strong>을 유도합니다. 기존 HIFU 대비 통증이 현저히 적으며, 1회 시술로 눈에 띄는 리프팅 효과를 제공합니다.</p>',
      whyFitHtml: '<p>Yuki님의 <strong>턱선 처짐</strong> 고민에 최적화된 디바이스입니다. Fitzpatrick III 피부에 안전하며, 다운타임이 거의 없어 <strong>5일 체류</strong> 일정에 완벽히 맞습니다. 일본 환자분들이 가장 선호하는 리프팅 시술 중 하나입니다.</p>',
      moaSummaryTitle: 'SUPERB™ 기술',
      moaSummaryShort: '동기화 초음파 병렬 빔으로 진피층 콜라겐 재생 유도',
      moaDescriptionHtml: '<p>SUPERB™ 기술은 7개의 트랜스듀서가 동시에 초음파 에너지를 전달하여 1.5mm 깊이에서 균일한 열 손상 존(Thermal Coagulation Zone)을 생성합니다. 이 과정에서 기존 콜라겐이 수축하고 새로운 콜라겐 합성이 촉진됩니다.</p>',
      targetTags: ['리프팅', '콜라겐', '턱선'],
      practical: {
        sessions: '1-2회',
        interval: '3-6개월',
        duration: '30-45분',
        onset: '1개월 후 점진적',
        maintain: '12-18개월',
      },
      scores: { tightening: 90, lifting: 95, volume: 30, brightening: 20, texture: 60 },
      aiDescriptionHtml: '<p>Sofwave SUPERB™는 차세대 HIFU 기술로, 기존 고강도 집속 초음파의 효과를 유지하면서 통증과 부작용을 크게 줄였습니다.</p>',
      slot: 'premium',
      categoryId: 'HIFU',
      categoryNameKo: 'HIFU 초음파 리프팅',
      categoryNameEn: 'Focused Ultrasound Lifting',
      categoryReason: 'SMAS층에 초음파 에너지를 집속시켜 처진 조직을 거상하는 가장 강력한 비침습 리프팅 카테고리입니다.',
      matchScore: 92,
      downtimeDisplay: '없음~1일',
      priceTier: 4 as const,
      alternativeDevices: [
        {
          name: 'Ultraformer MPT 3.0',
          oneLiner: '멀티 포인트 기술로 SMAS까지 안전하게 도달',
          matchScore: 85,
          downtimeDisplay: '1~3일',
          painLevel: 3 as const,
          priceTier: 3 as const,
        },
        {
          name: 'Shrink Universe',
          oneLiner: '컴팩트 HIFU로 세밀한 부위까지 시술 가능',
          matchScore: 78,
          downtimeDisplay: '없음',
          painLevel: 2 as const,
          priceTier: 2 as const,
        },
      ],
      doctorNote: {
        suggestedParameters: '1.5mm 깊이, 0.4-0.6J/cm², 300 shots (lower face)',
        fitzpatrickAdjustment: 'Type III: 표준 에너지 적용 가능',
        safetyFlags: [],
        minIntervalDays: 90,
      },
    },
    {
      rank: 2,
      deviceName: 'Sylfirm X',
      deviceId: 'sylfirm-x',
      moaCategory: 'RF Microneedling',
      moaCategoryLabel: 'Pulsed Wave & Continuous Wave Dual RF',
      evidenceLevel: 4,
      confidence: 89,
      skinLayer: 'Epidermis-Dermis (0.5-3.5mm)',
      painLevel: 3,
      downtimeLevel: 2,
      safetyLevel: 4,
      badge: 'Melasma Safe',
      badgeColor: '#a855f7',
      subtitle: '기미 치료를 위한 세계 최초 듀얼 웨이브 RF',
      summaryHtml: '<p>Sylfirm X는 기미 치료에 특화된 <strong>세계 최초 펄스웨이브 + 연속웨이브 듀얼 RF 마이크로니들링</strong> 시스템입니다. 비정상 혈관과 멜라노사이트 활성을 동시에 억제합니다.</p>',
      whyFitHtml: '<p>Yuki님의 <strong>혼합형 기미</strong>에 가장 효과적인 디바이스입니다. 펄스웨이브 모드가 기저막의 비정상 혈관을 선택적으로 파괴하여 멜라닌 생성을 근본적으로 억제합니다. Fitzpatrick III에서 PIH 리스크가 매우 낮습니다.</p>',
      moaSummaryTitle: '듀얼 웨이브 RF',
      moaSummaryShort: 'PW 모드로 비정상 혈관 억제 + CW 모드로 콜라겐 리모델링',
      moaDescriptionHtml: '<p>Sylfirm X의 PW(Pulsed Wave) 모드는 비침습적으로 기저막 영역의 비정상 혈관만을 선택적으로 응고시킵니다. CW(Continuous Wave) 모드는 진피층 전체에 열 에너지를 전달하여 콜라겐과 엘라스틴 합성을 촉진합니다.</p>',
      targetTags: ['기미', '피부결', '혈관'],
      practical: {
        sessions: '3-5회',
        interval: '3-4주',
        duration: '20-30분',
        onset: '2-3회 후',
        maintain: '6-12개월 (유지 시술)',
      },
      scores: { tightening: 65, lifting: 40, volume: 20, brightening: 85, texture: 80 },
      aiDescriptionHtml: '<p>Sylfirm X는 기미, 홍조, 피부 탄력 저하를 하나의 디바이스로 동시에 치료할 수 있는 혁신적인 RF 마이크로니들링 시스템입니다.</p>',
      slot: 'trending',
      categoryId: 'MN_RF',
      categoryNameKo: 'RF 마이크로니들링',
      categoryNameEn: 'RF Microneedling',
      categoryReason: '마이크로니들과 RF 에너지를 결합하여 기미와 피부 탄력을 동시에 개선합니다.',
      matchScore: 89,
      downtimeDisplay: '2~5일',
      priceTier: 3 as const,
      alternativeDevices: [
        {
          name: 'Genius RF',
          oneLiner: '실시간 임피던스 모니터링으로 정밀한 에너지 전달',
          matchScore: 82,
          downtimeDisplay: '3~5일',
          painLevel: 4 as const,
          priceTier: 3 as const,
        },
      ],
      doctorNote: {
        suggestedParameters: 'PW 모드 Level 4-5, 2.0mm depth, 2-pass (melasma zone)',
        fitzpatrickAdjustment: 'Type III: PW 모드 우선, CW는 Level 3 이하 권장',
        safetyFlags: ['HORMONAL_MELASMA'],
        minIntervalDays: 21,
      },
    },
    {
      rank: 3,
      deviceName: 'LaseMD Ultra',
      deviceId: 'lasemd-ultra',
      moaCategory: 'Thulium Laser',
      moaCategoryLabel: '1927nm Thulium Fractional Laser',
      evidenceLevel: 3,
      confidence: 85,
      skinLayer: 'Epidermis (0.1-0.2mm)',
      painLevel: 1,
      downtimeLevel: 1,
      safetyLevel: 5,
      badge: 'Low Downtime',
      badgeColor: '#22c55e',
      subtitle: '안전한 레이저 토닝의 진화',
      summaryHtml: '<p>LaseMD Ultra는 1927nm 툴리움 레이저로 <strong>표피층의 색소를 균일하게 제거</strong>하면서 피부 전체의 톤을 밝게 합니다. 매우 낮은 다운타임으로 일상생활에 거의 지장이 없습니다.</p>',
      whyFitHtml: '<p>Yuki님의 <strong>기미/색소침착</strong>에 대한 보조 치료로 이상적입니다. Sylfirm X로 근본 원인을 치료하고, LaseMD Ultra로 표피 색소를 정리하는 <strong>레이어링 전략</strong>이 가장 효과적입니다. 5일 체류 중 시술 가능합니다.</p>',
      moaSummaryTitle: '툴리움 레이저',
      moaSummaryShort: '1927nm 파장으로 표피 색소 선택적 제거',
      moaDescriptionHtml: '<p>1927nm 툴리움 레이저는 물에 대한 흡수율이 높아 표피층에서 정밀하게 작용합니다. Fractional 방식으로 미세한 열 손상 컬럼을 형성하여 빠른 회복과 균일한 색소 제거를 동시에 달성합니다.</p>',
      targetTags: ['색소', '톤 개선', '피부결'],
      practical: {
        sessions: '3-5회',
        interval: '2-4주',
        duration: '15-20분',
        onset: '1-2주 후',
        maintain: '3-6개월 (유지)',
      },
      scores: { tightening: 20, lifting: 10, volume: 10, brightening: 90, texture: 75 },
      aiDescriptionHtml: '<p>LaseMD Ultra는 안전하면서도 효과적인 색소 치료를 제공하는 차세대 툴리움 레이저입니다.</p>',
      slot: 'value',
      categoryId: 'THULIUM',
      categoryNameKo: '툴리움 레이저 토닝',
      categoryNameEn: 'Thulium Laser Toning',
      categoryReason: '표피 색소를 안전하게 제거하면서 다운타임이 거의 없는 효율적인 카테고리입니다.',
      matchScore: 85,
      downtimeDisplay: '없음~1일',
      priceTier: 2 as const,
      alternativeDevices: [],
      doctorNote: {
        suggestedParameters: 'Level 5-7, 2-pass, ampoule delivery',
        fitzpatrickAdjustment: 'Type III: Level 5-6 권장, Level 8 이상 주의',
        safetyFlags: [],
        minIntervalDays: 14,
      },
    },
  ],

  // ─── Injectable Recommendations (3개) ──────────────────────────
  injectableRecommendations: [
    {
      rank: 1,
      name: 'Rejuran Healer',
      injectableId: 'rejuran-healer',
      category: 'PN (Polynucleotide)',
      categoryLabel: '연어 유래 폴리뉴클레오타이드',
      evidenceLevel: 3,
      confidence: 88,
      skinLayer: 'Dermis',
      subtitle: '피부 재생의 근본 솔루션',
      summaryHtml: '<p>Rejuran Healer는 연어 DNA에서 추출한 <strong>PDRN(Polydeoxyribonucleotide)</strong>으로 손상된 피부 세포의 자가 재생을 촉진합니다. 피부 장벽 강화와 진피 재생에 탁월합니다.</p>',
      whyFitHtml: '<p>Yuki님의 <strong>피부 탄력 저하</strong>에 대한 근본적인 치료입니다. 레이저/RF 시술과 병행하면 시너지 효과가 뛰어나며, 일본에서도 높은 인지도와 만족도를 보이는 시술입니다.</p>',
      moaSummaryTitle: 'PDRN 기술',
      moaSummaryShort: '폴리뉴클레오타이드가 A2A 수용체를 활성화하여 세포 재생 촉진',
      moaDescriptionHtml: '<p>PDRN은 아데노신 A2A 수용체에 결합하여 세포 증식과 콜라겐 합성을 촉진합니다. 또한 항염 효과로 시술 후 회복을 가속화합니다.</p>',
      practical: {
        sessions: '3-4회',
        interval: '2-4주',
        duration: '',
        onset: '2회 시술 후',
        maintain: '6개월마다 유지',
      },
      scores: { tightening: 50, lifting: 20, volume: 30, brightening: 60, texture: 85 },
    },
    {
      rank: 2,
      name: 'Juvelook',
      injectableId: 'juvelook-volume',
      category: 'PDLLA (Poly-D,L-Lactic Acid)',
      categoryLabel: '폴리유산 콜라겐 부스터',
      evidenceLevel: 3,
      confidence: 86,
      skinLayer: 'Deep Dermis',
      subtitle: '자연스러운 볼륨 + 콜라겐 생성',
      summaryHtml: '<p>Juvelook는 PDLLA 미립자가 <strong>진피층에서 콜라겐 합성을 장기간 촉진</strong>하여 자연스러운 볼륨감과 탄력을 회복시킵니다. 히알루론산과 달리 자가 콜라겐이 형성됩니다.</p>',
      whyFitHtml: '<p>Yuki님의 <strong>턱선 처짐</strong>과 <strong>피부 탄력</strong>을 동시에 개선합니다. Sofwave의 HIFU 리프팅과 함께 사용하면 골격적 리프팅 + 볼륨 충전 시너지를 극대화할 수 있습니다.</p>',
      moaSummaryTitle: 'PDLLA 콜라겐 유도',
      moaSummaryShort: 'PDLLA 미립자가 진피에서 점진적으로 분해되며 콜라겐 합성 유도',
      moaDescriptionHtml: '<p>PDLLA 미립자가 주입 후 진피층에서 서서히 분해되면서 지속적인 이물 반응을 유도합니다. 이 과정에서 fibroblast가 활성화되어 자가 콜라겐 type I, III가 합성됩니다.</p>',
      practical: {
        sessions: '2-3회',
        interval: '4-6주',
        duration: '',
        onset: '1개월 후 점진적',
        maintain: '12-18개월',
      },
      scores: { tightening: 70, lifting: 55, volume: 75, brightening: 30, texture: 65 },
    },
    {
      rank: 3,
      name: 'Botox (Allergan)',
      injectableId: 'botox-allergan',
      category: 'Botulinum Toxin',
      categoryLabel: '보툴리눔 독소 A형',
      evidenceLevel: 5,
      confidence: 95,
      skinLayer: 'Muscle',
      subtitle: '턱선 슬리밍 + 미세 주름 개선',
      summaryHtml: '<p>Botox는 <strong>교근 축소</strong>를 통한 턱선 슬리밍과 <strong>미세 주름 억제</strong>에 가장 높은 근거 수준을 보유한 시술입니다. 30년 이상의 임상 데이터가 안전성을 입증합니다.</p>',
      whyFitHtml: '<p>Yuki님의 <strong>턱선 처짐</strong> 고민의 일부가 교근 비대에서 오는 것이라면, 교근 보톡스로 V라인 효과를 기대할 수 있습니다. Sofwave 리프팅과 병행하면 전체적인 안면 윤곽 개선이 가능합니다.</p>',
      moaSummaryTitle: '신경근 차단',
      moaSummaryShort: '아세틸콜린 분비 억제 → 근육 이완 → 윤곽 개선',
      moaDescriptionHtml: '<p>보툴리눔 독소 A형은 신경근 접합부에서 아세틸콜린의 분비를 차단하여 근육 수축을 일시적으로 억제합니다. 교근에 주입 시 근육량 감소로 얼굴 윤곽이 슬림해집니다.</p>',
      practical: {
        sessions: '1회',
        interval: '3-6개월',
        duration: '',
        onset: '3-7일',
        maintain: '3-6개월',
      },
      scores: { tightening: 30, lifting: 45, volume: 10, brightening: 5, texture: 15 },
    },
  ],

  // ─── Signature Solutions ────────────────────────────────────
  signatureSolutions: [
    {
      name: 'Melasma Lift Premium',
      description: 'Sofwave 리프팅 + Sylfirm X 기미 치료 + Rejuran Healer 재생의 3종 콤비네이션. 기미 개선과 리프팅을 동시에 달성하는 일본 환자 맞춤 패키지입니다.',
      devices: ['Sofwave', 'Sylfirm X'],
      injectables: ['Rejuran Healer'],
      totalSessions: '5-7회',
      totalDuration: '3개월',
      synergyScore: 94,
      synergyExplanation: 'HIFU로 SMAS층 콜라겐 리모델링을 유도한 뒤, RF 마이크로니들링으로 진피층 기미 원인을 억제하고, PDRN으로 재생 재료를 공급하는 3층 분리 시너지.',
      steps: [
        { order: 1, type: 'ebd' as const, deviceOrProduct: 'Sofwave', category: 'HIFU', action: 'SMAS층 초음파 집속 — 콜라겐 리모델링 + 리프팅', intervalAfter: '1주 후' },
        { order: 2, type: 'ebd' as const, deviceOrProduct: 'Sylfirm X', category: 'MN_RF', action: 'PW모드로 기저막 비정상 혈관 억제 + 진피 재생', intervalAfter: '당일 또는 1주 후' },
        { order: 3, type: 'injectable' as const, deviceOrProduct: 'Rejuran Healer', category: 'PN', action: 'PDRN으로 세포 재생 촉진 + 피부 장벽 강화', intervalAfter: null },
      ],
    },
    {
      name: 'Volume & Tone Restore',
      description: 'Sylfirm X + LaseMD Ultra + Juvelook 조합. 색소와 탄력을 동시에 개선하면서 자연스러운 볼륨감을 회복합니다.',
      devices: ['Sylfirm X', 'LaseMD Ultra'],
      injectables: ['Juvelook'],
      totalSessions: '4-6회',
      totalDuration: '2-3개월',
      synergyScore: 88,
      synergyExplanation: 'RF로 진피층 열 자극 후 툴리움 레이저로 표피 색소를 정리하고, PDLLA로 볼륨과 콜라겐을 동시에 보충하는 순차적 시너지.',
      steps: [
        { order: 1, type: 'ebd' as const, deviceOrProduct: 'Sylfirm X', category: 'MN_RF', action: 'CW모드 진피 콜라겐 리모델링 + 기미 억제', intervalAfter: '2주 후' },
        { order: 2, type: 'ebd' as const, deviceOrProduct: 'LaseMD Ultra', category: 'THULIUM', action: '표피 색소 균일 제거 + 톤 개선', intervalAfter: '1주 후' },
        { order: 3, type: 'injectable' as const, deviceOrProduct: 'Juvelook', category: 'PDLLA', action: 'PDLLA 미립자로 점진적 콜라겐 유도 + 볼륨 회복', intervalAfter: null },
      ],
    },
    {
      name: 'Gentle Brightening Basic',
      description: 'LaseMD Ultra + Rejuran Healer의 미니멀 조합. 다운타임 최소화하면서 색소 개선과 피부 재생을 달성하는 밸류 프로토콜.',
      devices: ['LaseMD Ultra'],
      injectables: ['Rejuran Healer'],
      totalSessions: '3-4회',
      totalDuration: '1.5-2개월',
      synergyScore: 78,
      synergyExplanation: '툴리움 레이저로 표피 채널을 열어준 뒤 PDRN을 전달하면 약물 흡수율이 2-3배 증가하여 재생 효과가 극대화됩니다.',
      steps: [
        { order: 1, type: 'ebd' as const, deviceOrProduct: 'LaseMD Ultra', category: 'THULIUM', action: '표피 미세 채널 형성 + 색소 제거', intervalAfter: '당일' },
        { order: 2, type: 'injectable' as const, deviceOrProduct: 'Rejuran Healer', category: 'PN', action: '열린 채널을 통한 PDRN 딥 딜리버리 + 재생', intervalAfter: null },
      ],
    },
  ],

  // ─── Treatment Plan ────────────────────────────────────────
  treatmentPlan: {
    title: '5일 체류 맞춤 시술 플랜',
    totalVisits: 4,
    totalDuration: '5일',
    phases: [
      {
        phase: 1,
        name: '기초 치료',
        period: 'Day 1-2 (체류 중)',
        treatments: ['Sylfirm X (PW 모드, 기미 집중)', 'Rejuran Healer'],
        goal: '기미 근본 원인 억제 + 피부 재생 기반 구축',
      },
      {
        phase: 2,
        name: '리프팅 + 색소',
        period: 'Day 3-4 (체류 중)',
        treatments: ['Sofwave HIFU', 'LaseMD Ultra'],
        goal: '콜라겐 리모델링 + 표피 색소 정리',
      },
      {
        phase: 3,
        name: '볼륨 + 슬리밍',
        period: 'Day 4-5 (체류 중)',
        treatments: ['Juvelook (선택)', 'Botox 교근 (선택)'],
        goal: '자연스러운 볼륨 회복 + V라인 윤곽',
      },
      {
        phase: 4,
        name: '유지 관리 (귀국 후)',
        period: '3개월마다',
        treatments: ['Sylfirm X 유지 (현지 의원)', 'Rejuran 부스터'],
        goal: '기미 재발 방지 + 콜라겐 유지',
      },
    ],
    schedule: [
      {
        day: 'Day 1 (도착일)',
        treatments: [
          { type: 'consultation' as const, deviceOrProduct: 'Consultation + Skin Analysis', category: '', durationMinutes: 30, note: '피부 상태 정밀 분석 + 시술 계획 확정' },
          { type: 'ebd' as const, deviceOrProduct: 'Sylfirm X', category: 'MN_RF', durationMinutes: 25, note: 'PW 모드 — 기미 집중 치료' },
          { type: 'injectable' as const, deviceOrProduct: 'Rejuran Healer', category: 'PN', durationMinutes: 20, note: 'PDRN 피부 재생 부스터' },
        ],
        postCare: '냉찜질 20분, 세안 4시간 후 가능',
      },
      {
        day: 'Day 3',
        treatments: [
          { type: 'ebd' as const, deviceOrProduct: 'Sofwave', category: 'HIFU', durationMinutes: 40, note: 'SMAS층 초음파 리프팅 — 턱선 + 중안면' },
        ],
        postCare: '약한 홍조 가능, 자외선 차단 필수',
      },
      {
        day: 'Day 4',
        treatments: [
          { type: 'ebd' as const, deviceOrProduct: 'LaseMD Ultra', category: 'THULIUM', durationMinutes: 20, note: '표피 색소 정리 + 톤 개선' },
          { type: 'injectable' as const, deviceOrProduct: 'Juvelook', category: 'PDLLA', durationMinutes: 15, note: '콜라겐 부스터 — 볼 탄력' },
        ],
        postCare: '보습 집중, 사우나/음주 3일간 금지',
      },
      {
        day: 'Day 5 (출국일)',
        treatments: [
          { type: 'injectable' as const, deviceOrProduct: 'Botox (교근)', category: 'BTX', durationMinutes: 10, note: 'V라인 슬리밍 — 출국 전 마지막 시술' },
        ],
        postCare: '4시간 누우면 안 됨, 기내에서 보습 마스크 추천',
      },
    ],
    precautions: [
      'Sylfirm X 시술 후 24시간 세안 자제',
      'Sofwave 시술 부위 3일간 뜨거운 물 금지',
      '모든 시술 후 SPF 50+ 자외선 차단제 필수 (2시간마다 재도포)',
      '귀국 후 1주일간 사우나, 찜질방, 격렬한 운동 금지',
    ],
  },

  // ─── Homecare Guide ────────────────────────────────────────
  homecare: {
    morning: [
      '순한 클렌저로 세안',
      'Vitamin C 세럼 (15% L-ascorbic acid)',
      '세라마이드 보습제',
      'SPF 50+ PA++++ 자외선 차단제 필수',
    ],
    evening: [
      '오일 클렌저 → 폼 클렌저 이중 세안',
      'Niacinamide 10% 세럼 (색소 억제)',
      'Retinol 0.25% (시술 2주 후부터)',
      '보습 크림',
    ],
    weekly: [
      'AHA/BHA 각질 제거 (1회, 시술 2주 후부터)',
      'CICA 시트 마스크 (2-3회)',
    ],
    avoid: [
      '시술 후 2주간 사우나/찜질방',
      '직사광선 노출 (모자 + 자외선 차단)',
      '시술 후 1주일 음주',
      '각질 제거 스크럽 (시술 후 1개월)',
    ],
  },

  // ─── Budget Estimate ────────────────────────────────────────
  budgetEstimate: {
    totalRange: '₩2,500,000 ~ ₩4,200,000',
    segments: [
      { label: 'Sylfirm X + LaseMD', category: 'foundation', percentage: 35, amount: '₩875,000~₩1,470,000' },
      { label: 'Sofwave + Injectable', category: 'main', percentage: 50, amount: '₩1,250,000~₩2,100,000' },
      { label: '유지 시술', category: 'maintenance', percentage: 15, amount: '₩375,000~₩630,000' },
    ],
    roiNote: '3개월 집중 치료 후 연간 유지 비용은 초기 비용의 약 20-30% 수준입니다.',
  },

  // ─── Doctor Tab ────────────────────────────────────────────
  doctorTab: {
    clinicalSummary:
      '35세 일본 여성, Fitzpatrick III, 혼합형 기미 + 피부 탄력 저하 + 턱선 처짐. 과거 레이저 토닝 및 보톡스 경험 있음. 통증 감수성 낮음(2/5). 5일 체류 일정. 금기 사항 없음.',
    triggeredProtocols: ['MELASMA_PROTOCOL_V2', 'LIFTING_COMBO_PROTOCOL'],
    countryNote:
      '일본 환자: 안전성과 자연스러움을 최우선시합니다. 저통증 시술 강하게 선호. 다운타임에 민감하므로 시술 스케줄 조정 필요. 시술 전 상세 설명을 기대합니다.',
    parameterGuidance: {
      'Sofwave': 'Energy Level 1.5-2.0J, 2 passes on jawline, 1 pass on cheeks',
      'Sylfirm X': 'PW mode for melasma, Depth 1.5mm, Power Level 4-5, 2-3 passes',
      'LaseMD Ultra': 'Energy Level 5-7mJ, 4 passes, Density medium',
      'Rejuran': '2cc, papule technique, 0.02cc per injection point',
    },
    contraindications: [],
    alternativeOptions: [
      'PicoSure Pro (색소 특화, Sylfirm X 대체 가능)',
      'Ultraformer MPT (Sofwave 대체, HIFU)',
      'Sculptra (Juvelook 대체, 콜라겐 부스터)',
    ],
    patientIntelligence: {
      expectationTag: 'REALISTIC',
      expectationNote: '과거 시술 경험이 있어 현실적인 기대치를 가지고 있습니다. 1회 드라마틱 변화보다 점진적 개선을 이해하고 있습니다.',
      budgetTimeline: {
        budgetTier: 'Premium',
        decisionSpeed: 'Normal',
        urgency: 'MEDIUM',
        stayDuration: '5일',
      },
      communicationStyle: 'LOGICAL',
      communicationNote: '논리적 설명을 선호합니다. MOA와 근거 데이터를 간결하게 제시하면 신뢰를 얻을 수 있습니다. 일본어 보조 자료가 있으면 더 좋습니다.',
    },
    consultationStrategy: {
      recommendedOrder: [
        '안전성 설명 (Fitzpatrick III, PIH 리스크 낮음)',
        '기미 메커니즘 설명 + Sylfirm X PW 모드 소개',
        'Before/After 사례 제시 (동일 피부타입)',
        '리프팅 옵션 비교 (Sofwave vs 대안)',
        '콤비네이션 패키지 제안 + 시술 스케줄',
        '홈케어 및 유지 관리 안내',
      ],
      expectedComplaints: [
        '통증이 얼마나 되나요? → Sofwave: VAS 2-3, Sylfirm X: 마취 크림 적용',
        '기미가 완전히 사라지나요? → 80-90% 개선, 완전 제거보다 관리 컨셉 설명',
        '귀국 후 관리는? → 현지 의원에서 유지 시술 가능, 프로토콜 제공',
      ],
      scenarioSummary:
        '첫 상담에서 안전성과 과학적 근거를 먼저 제시하고, 기미 치료의 메커니즘을 간결하게 설명한 뒤 Before/After 사례로 신뢰를 형성합니다. 5일 일정에 맞춘 구체적 시술 스케줄을 제안하고, 패키지 가격과 ROI를 논리적으로 설명합니다.',
    },
  },
};
