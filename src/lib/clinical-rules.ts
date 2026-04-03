// ═══════════════════════════════════════════════════════════════
//  Clinical Rules — Category-based Concern → Treatment Mapping
//  Phase 3-C: Device-level mapping replaced with category-first logic
// ═══════════════════════════════════════════════════════════════

// ─── Device Categories (EBD_Category IDs from Airtable) ──────

export const DEVICE_CATEGORIES: Record<string, { label: string; description: string }> = {
  HIFU: { label: '고강도집속초음파 (HIFU)', description: 'SMAS층 집속 초음파 열 응고' },
  MONO_RF: { label: '모노폴라 RF', description: '진피 전층 체적 가열' },
  BI_MULTI_RF: { label: '바이/멀티폴라 RF', description: '표층 다극성 고주파' },
  MN_RF: { label: '마이크로니들 RF', description: '진피 내 침습적 고주파' },
  PICO: { label: '피코초 레이저', description: '광음향 색소 파괴' },
  Q_SWITCH: { label: '큐스위치 레이저', description: '나노초 색소 토닝' },
  IPL: { label: 'IPL/BBL', description: '광대역 광선 색소/혈관 치료' },
  CO2: { label: 'CO2 레이저', description: '박피성 프락셔널' },
  ERYAG: { label: 'Er:YAG 레이저', description: '미세 박피 레이저' },
  FRAC_1550: { label: '프락셔널 1550nm', description: '비박피성 프락셔널 리모델링' },
  FRAC_1927: { label: '프락셔널 1927nm (툴륨)', description: '표피 미세 박피 + 턴오버' },
  PDL: { label: 'PDL (595nm)', description: '혈관 선택적 레이저' },
  LP_532_1064: { label: '롱펄스 532/1064nm', description: '듀얼 파장 혈관 치료' },
  LP_755_1064: { label: '롱펄스 755/1064nm', description: '알렉산드라이트/Nd:YAG' },
  LED: { label: 'LED/LLLT', description: '광생체조절 (Photobiomodulation)' },
  SKIN_BOOSTER: { label: '스킨부스터', description: 'HA/PN/콜라겐 부스터 인젝터블' },
  HIFES: { label: 'HIFES (고강도집속전자기장)', description: '안면 근육 강화/지지인대 복원' },
  BODY_CONTOUR: { label: '바디 컨투어링', description: '바디 전용 지방 감소 장비' },
  VDH: { label: '용적형 유전 가열 (VDH)', description: 'Dielectric Heating 전층 균일 가열' },
  SAR: { label: '피하층 세포자멸 재생 (SAR)', description: 'TRPV1 활성화 피하지방 재건' },
  VSLS: { label: '혈관 과냉각 선택적 광열용해 (VSLS)', description: '혈관 과냉각 + 단회 색소 제거' },
  THREAD: { label: '실리프팅', description: 'PDO/PCL 실 삽입 물리적 거상' },
};

// ─── Concern → Category Mapping (15 concerns, 22 categories) ─

export const CONCERN_TO_CATEGORY_MAP: Record<string, {
  priority1: { categoryId: string; reason: string };
  priority2: { categoryId: string; reason: string };
  priority3: { categoryId: string; reason: string };
  recommendedCombo: { ebd: string; injectable: string; synergyReason: string };
}> = {
  // --- 기존 12개 concern ---
  jawline_lifting: {
    priority1: { categoryId: 'HIFU', reason: 'SMAS층에 초음파 열을 집속시켜 처진 조직을 강력하게 거상' },
    priority2: { categoryId: 'BI_MULTI_RF', reason: '진피 중상층에 고주파를 집중, 고전압(FX)으로 불필요한 지방 분해' },
    priority3: { categoryId: 'VDH', reason: '용적형 유전 가열로 피하조직부터 심부 진피까지 전층을 부드럽게 타이트닝' },
    recommendedCombo: { ebd: 'HIFU', injectable: '지방분해 주사', synergyReason: 'SMAS 거상(HIFU) + 하안부 지방 제거(인젝터블)로 V라인 고정' },
  },
  skin_tightening: {
    priority1: { categoryId: 'MONO_RF', reason: '진피 전층에 강력한 체적 가열로 콜라겐 수축 및 재생 유도' },
    priority2: { categoryId: 'VDH', reason: '유전 가열로 에너지 감쇠 없이 피부 전층을 무통증으로 균일 타이트닝' },
    priority3: { categoryId: 'BI_MULTI_RF', reason: '얕은 진피 표면에 다극성 고주파를 집중해 즉각적인 잔주름 개선' },
    recommendedCombo: { ebd: 'MONO_RF', injectable: '리쥬란/쥬베룩', synergyReason: '고주파 열로 콜라겐 합성을 깨운 직후 부스터로 재료 공급하여 콜라겐 증식률 극대화' },
  },
  volume_restoration: {
    priority1: { categoryId: 'HIFES', reason: '전자기장으로 안면 근육 강화 및 지지인대 복원으로 구조적 볼륨 재건' },
    priority2: { categoryId: 'SKIN_BOOSTER', reason: '콜라겐 생성 촉진제(PLLA/PDLLA) 주입으로 자가 콜라겐 증식' },
    priority3: { categoryId: 'MONO_RF', reason: '진피층 콜라겐 밀도 증가로 얕은 피부 꺼짐을 간접적으로 보완' },
    recommendedCombo: { ebd: 'HIFES', injectable: '쥬베룩 볼륨/스컬트라', synergyReason: 'HIFES로 근육(기둥)을 세우고 인젝터블로 피하 빈 공간을 채워 3D 볼륨 완성' },
  },
  melasma: {
    priority1: { categoryId: 'PICO', reason: '피코초 파장으로 열 자극 최소화하며 기미 멜라닌만 선택적 파괴' },
    priority2: { categoryId: 'MN_RF', reason: '펄스파(PW) 고주파로 기저막 복원 및 비정상 혈관 억제하여 재발 차단' },
    priority3: { categoryId: 'Q_SWITCH', reason: '나노초 토닝으로 표피 및 진피에 퍼진 색소를 점진적으로 완화' },
    recommendedCombo: { ebd: 'MN_RF', injectable: '엑소좀', synergyReason: 'MN_RF로 기저막 복원 후 엑소좀 항염 성분을 주입하여 멜라닌 과활성 차단 및 리바운드 방지' },
  },
  dark_spots: {
    priority1: { categoryId: 'VSLS', reason: '혈관 과냉각 기술로 진피 손상 없이 흑자 병변만 1회성 탈락' },
    priority2: { categoryId: 'PICO', reason: '강력한 피코초 파워로 경계 명확한 색소를 정상 조직 손상 없이 파괴' },
    priority3: { categoryId: 'IPL', reason: '광대역 빛 에너지로 얼굴 전반의 짙은 잡티와 흑자를 딱지화 탈락' },
    recommendedCombo: { ebd: 'VSLS', injectable: 'PDRN 재생 주사', synergyReason: 'VSLS로 흑자 제거 후 PDRN을 국소 도포하고 듀오덤 밀착하여 PIH 없이 평탄한 재생 유도' },
  },
  freckles: {
    priority1: { categoryId: 'IPL', reason: '다양한 얕은 색소를 넓게 타겟팅하여 흩어진 주근깨를 즉각 딱지화 제거' },
    priority2: { categoryId: 'LP_755_1064', reason: '755nm 롱펄스 알렉산드라이트로 멜라닌 흡수 극대화하여 뚜렷한 주근깨 파괴' },
    priority3: { categoryId: 'PICO', reason: '다파장 피코 레이저로 표피 상층 주근깨를 정밀 타격하고 톤 정돈' },
    recommendedCombo: { ebd: 'IPL', injectable: '미백 칵테일(글루타치온/비타민C)', synergyReason: 'IPL로 표피 멜라닌을 물리적 제거 후 미백 부스터로 잔여 멜라닌 합성을 억제하여 브라이트닝 시너지' },
  },
  dull_skin: {
    priority1: { categoryId: 'FRAC_1927', reason: '툴륨 파장으로 칙칙한 각질층을 미세 박피하고 턴오버 촉진하여 안색 정화' },
    priority2: { categoryId: 'PICO', reason: '피코 토닝으로 진피 내 미세 멜라닌 색소를 자극 없이 점진적으로 톤업' },
    priority3: { categoryId: 'IPL', reason: '다양한 필터로 얕은 색소와 미세 홍조를 동시에 잡아 전체 톤 균일화' },
    recommendedCombo: { ebd: 'FRAC_1927', injectable: '샤넬주사/NCTF', synergyReason: '프락셔널로 표피 채널을 열고 프리미엄 부스터를 인큐베이팅 침투시켜 윤광 극대화' },
  },
  large_pores: {
    priority1: { categoryId: 'MN_RF', reason: '니들을 진피에 삽입하여 피지 분비 억제 및 모공 주변 콜라겐 강력 수축' },
    priority2: { categoryId: 'FRAC_1550', reason: '비박피성 프락셔널 열기둥으로 모공 주변 조직을 새 콜라겐으로 리모델링' },
    priority3: { categoryId: 'PICO', reason: '특수 렌즈(MLA/DOE) 피코 프락셔널로 표피 보호하며 진피 내 LIOB 생성 수축' },
    recommendedCombo: { ebd: 'MN_RF', injectable: '쥬베룩 스킨', synergyReason: 'MN_RF로 피지선 파괴 후 채널로 콜라겐 부스터를 펌핑 주입하여 빈 모공 주변을 새살로 채움' },
  },
  acne_scars: {
    priority1: { categoryId: 'MN_RF', reason: '진피 하부까지 강한 고주파 열 응고로 흉터 밑 섬유 밴드를 수직으로 끊음' },
    priority2: { categoryId: 'CO2', reason: '박피성 10600nm 파장으로 흉터 경계면을 물리적으로 깎아내어 평탄화' },
    priority3: { categoryId: 'ERYAG', reason: 'CO2 대비 열 손상 최소화하면서 흉터 조직을 마이크로 단위로 정밀 박피' },
    recommendedCombo: { ebd: 'MN_RF', injectable: '쥬베룩 볼륨/PDRN', synergyReason: '니들링 서브시전으로 흉터 밴드를 끊은 직후 빈 공간에 재생 부스터를 채워 바닥부터 융기' },
  },
  dryness: {
    priority1: { categoryId: 'SKIN_BOOSTER', reason: '교차결합 없는 HA를 진피층에 직접 주입하여 즉각적 내부 수분 끌어당김' },
    priority2: { categoryId: 'FRAC_1927', reason: '비박피성 툴륨 레이저로 각질층에 미세 채널을 열어 보습 앰플 침투력 극대화' },
    priority3: { categoryId: 'LED', reason: 'LLLT 광에너지로 미토콘드리아 대사 촉진하여 세포 자체 장벽 회복 및 수분 보유력 강화' },
    recommendedCombo: { ebd: 'FRAC_1927', injectable: '물광 HA 주사', synergyReason: '레이저로 표피 투과성을 극대화한 뒤 HA 앰플을 도포하여 겉과 속 동시 수분 코팅막 형성' },
  },
  redness: {
    priority1: { categoryId: 'LP_532_1064', reason: '듀얼 롱펄스 파장으로 비정상 확장 모세혈관 속 혈색소를 선택적 응고 파괴' },
    priority2: { categoryId: 'PDL', reason: '혈관 흡수도 최고인 595nm 파장으로 붉은 혈관 병변만 정밀 타겟팅' },
    priority3: { categoryId: 'MN_RF', reason: '펄스파 모드로 진피 기저막 재건 및 만성 염증성 혈관 증식 억제' },
    recommendedCombo: { ebd: 'LP_532_1064', injectable: '엑소좀/리쥬란', synergyReason: '혈관 레이저로 비정상 혈관을 제거하고 항염/장벽 강화 인자를 주입하여 체질 개선' },
  },
  mole_removal: {
    priority1: { categoryId: 'CO2', reason: '수분 흡수력 높은 파장으로 점의 깊이와 면적에 맞춰 물리적으로 정교하게 태워 제거' },
    priority2: { categoryId: 'ERYAG', reason: '열 손상과 홍반을 최소화하면서 얕은 점을 미세하게 깎아냄' },
    priority3: { categoryId: 'Q_SWITCH', reason: '깎은 후 진피 깊숙이 남은 미세 멜라닌 뿌리를 나노초 레이저로 정밀 제거' },
    recommendedCombo: { ebd: 'CO2', injectable: 'PDRN 연고 + 듀오덤', synergyReason: '점을 파낸 자리에 재생 특화 연고를 도포하고 재생 테이프를 밀착하여 흉터 없이 평탄한 새살 유도' },
  },

  // --- SAR 전용 3개 concern ---
  post_weight_loss_laxity: {
    priority1: { categoryId: 'SAR', reason: '43~45°C로 줄기세포를 자극해 피하층 Fibrous Septa를 재건하며 꺼진 볼륨과 탄력을 동시 복원' },
    priority2: { categoryId: 'SKIN_BOOSTER', reason: '스컬트라 등 콜라겐 스티뮬레이터로 빈 공간 사이를 자가 조직으로 채움' },
    priority3: { categoryId: 'VDH', reason: '지방을 파괴하지 않으면서 느슨해진 진피와 피하조직 전체를 안전하게 압축 타이트닝' },
    recommendedCombo: { ebd: 'SAR', injectable: '쥬베룩 볼륨/스컬트라', synergyReason: 'SAR로 피하 콜라겐 뼈대(Fibrous Septa)를 재건하고 인젝터블로 빈 공간을 채워 3D 볼륨 복원' },
  },
  lower_face_heavy_fat: {
    priority1: { categoryId: 'SAR', reason: '45°C 열로 노화된 변성 지방을 선택적 세포자멸시켜 25% 감소 + 2.5배 콜라겐으로 피부 밀착' },
    priority2: { categoryId: 'HIFU', reason: 'SMAS 하방 거상으로 이중턱 구조적 리프팅 보완' },
    priority3: { categoryId: 'BI_MULTI_RF', reason: '인모드 FX 등 고전압 전류로 국소 지방 세포막 2차 파괴' },
    recommendedCombo: { ebd: 'SAR + BI_MULTI_RF', injectable: '윤곽주사', synergyReason: 'SAR로 전반적 변성 지방 사멸 + BI_MULTI_RF로 국소 지방 2차 파괴하는 극강 윤곽 콤보' },
  },
  body_contouring_laxity: {
    priority1: { categoryId: 'SAR', reason: 'EMS 자극과 피하층 재생을 결합해 바디 지방 융해와 늘어진 피부 밀착을 동시 유도' },
    priority2: { categoryId: 'BODY_CONTOUR', reason: 'Onda 등 바디 전용 장비로 국소 부위 지방 감소' },
    priority3: { categoryId: 'VDH', reason: '전층 유전 가열로 바디 피하조직의 전반적 타이트닝 보완' },
    recommendedCombo: { ebd: 'SAR', injectable: '바디 전용 지방 분해 인젝터블', synergyReason: 'SAR로 피하 지방층 세포자멸 유도 후 지방 분해 효소 인젝터를 국소 주입해 사이즈 감소 가속' },
  },
};

// ─── Build prompt block for AI recommendation engine ─────────

export function buildClinicalRulesPromptBlock(primaryConcern: string | null): string {
  if (!primaryConcern) return '';

  const mapping = CONCERN_TO_CATEGORY_MAP[primaryConcern];
  if (!mapping) return '';

  const cat1 = DEVICE_CATEGORIES[mapping.priority1.categoryId];
  const cat2 = DEVICE_CATEGORIES[mapping.priority2.categoryId];
  const cat3 = DEVICE_CATEGORIES[mapping.priority3.categoryId];

  return `═══ CATEGORY-BASED CLINICAL MAPPING ═══
Primary Concern: ${primaryConcern}

[Priority 1 Category] ${mapping.priority1.categoryId} — ${cat1?.label || mapping.priority1.categoryId}
  Reason: ${mapping.priority1.reason}
  → 프로토콜 1 (Best Premium): 이 카테고리 내 프리미엄 장비 선택

[Priority 2 Category] ${mapping.priority2.categoryId} — ${cat2?.label || mapping.priority2.categoryId}
  Reason: ${mapping.priority2.reason}
  → 프로토콜 2 (Trending): 1~2순위 카테고리에서 트렌드 장비 선택

[Priority 3 Category] ${mapping.priority3.categoryId} — ${cat3?.label || mapping.priority3.categoryId}
  Reason: ${mapping.priority3.reason}
  → 프로토콜 3 (Smart Value): 2~3순위 카테고리에서 가성비 장비 선택

[Recommended Combo]
  EBD: ${mapping.recommendedCombo.ebd}
  Injectable: ${mapping.recommendedCombo.injectable}
  Synergy: ${mapping.recommendedCombo.synergyReason}

카테고리 내 장비 선택 기준:
- budget=luxury → 해당 카테고리의 프리미엄 장비
- budget=budget → 해당 카테고리의 가성비 장비
- pain_tolerance 낮음 → 통증 낮은 장비 우선
- downtime 짧음 → 다운타임 짧은 장비 우선
- fitzpatrick IV+ → IPL/BBL 주의 플래그`;
}
