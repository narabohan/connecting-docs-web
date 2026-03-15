# SURVEY_CLINICAL_SPEC.md — ConnectingDocs 설문 임상 사양서

> 상태: **초안 — Narabo 임상 검수 필요**
> 용도: V4 §3 State Machine의 각 FSM 노드에서 표시할 질문, 선택지, 임상 매핑 규칙 정의
> 연결: MASTER_PLAN_V4.md §3.2(FSM), §5.1(DoctorTab), §8.2(DeviceWiki)
> 언어: 본 문서는 KO 원본. EN/JP/ZH-CN 번역은 Phase 1에서 별도 진행.

---

## 목차

| FSM 노드 | 본 문서 섹션 | 질문 수 | 성격 |
|----------|------------|--------|------|
| DEMOGRAPHIC | §1 | 4개 | 기본 인구통계 |
| OPEN_TEXT | §2 | 1개 | 자유 서술 |
| SMART_CHIPS | §3 | AI 생성 | AI 기반 동적 칩 |
| BRANCH_SKIN_PROFILE | §4 | 3개 | Fitzpatrick + 피부 두께 + 태닝 |
| BRANCH_PAST_HISTORY | §5 | 3개 | 과거 시술 + PIH + 만족도 |
| BRANCH_VISIT_PLAN | §6 | 2개 | 체류 기간 + 재방문 주기 |
| BRANCH_ADVERSE | §7 | 2개 | 부작용 상세 + 회복 |
| 🆕 PREFERENCES | §8 | 3개 | 통증 + 다운타임(동적) + 예산/세그먼트 |
| SAFETY_CHECKPOINT | §9 | 1개 | 약물/임신/금기 (Hard Filter) |
| — (횡단) | §10 | — | 장비 매핑 마스터 테이블 + 세그먼트 필터 |
| — (횡단) | §11 | — | 시술 시퀀스 생성 규칙 |

---

# §1. DEMOGRAPHIC 노드

> FSM 위치: 첫 번째 노드 (모든 사용자 통과)
> 전이: 항상 → OPEN_TEXT
> 입력 방식: 클릭 기반 (choice chips / dropdown)

## Q1-1. 성별 (Gender)

```
선택지:
[ ] 여성 (Female)
[ ] 남성 (Male)
[ ] 기타 / 밝히고 싶지 않음 (Other / Prefer not to say)

매핑 목적:
- 시술 추천 시 성별 특화 프로토콜 적용
  (예: 남성은 피부가 두껍고 피지 분비 많음 → 에너지 세팅 조정)
- DoctorTab에서 의사에게 성별 기반 파라미터 가이드 제공
```

## Q1-2. 연령대 (Age Range)

```
선택지:
[ ] 20대 (20-29)
[ ] 30대 (30-39)
[ ] 40대 (40-49)
[ ] 50대 (50-59)
[ ] 60대 이상 (60+)

매핑 목적:
- 연령대별 주요 관심사 프리셋:
  20대 → 모공, 여드름 흉터, 피부 톤
  30대 → 초기 노화, 탄력, 색소
  40대 → 리프팅, 볼륨 소실, 기미
  50대+ → 전반적 리프팅, 깊은 주름, 피부 이완
- AI 프롬프트에서 연령 맥락 주입
```

## Q1-3. 국가 (Country)

```
입력 방식: IP 자동 감지 + 수동 선택 (드롭다운)

주요 국가:
[ ] 🇰🇷 한국 (Korea) → visit_type = 'local'
[ ] 🇯🇵 일본 (Japan) → visit_type = 'medical_tourist'
[ ] 🇹🇼 대만 (Taiwan) → visit_type = 'medical_tourist'
[ ] 🇺🇸 미국 (USA) → visit_type = 'medical_tourist'
[ ] 🇨🇳 중국 (China) → visit_type = 'medical_tourist'
[ ] 🇹🇭 태국 (Thailand) → visit_type = 'medical_tourist'
[ ] 기타 (Other) → visit_type = 'medical_tourist'

매핑 목적:
- visit_type 결정 (local vs medical_tourist)
  → medical_tourist: BRANCH_VISIT_PLAN 분기 활성화
  → local: BRANCH_VISIT_PLAN 스킵
- 국가별 피부 특성 컨텍스트:
  동아시아(KR/JP/CN/TW): Fitzpatrick III-IV 우세, PIH 위험 높음
  동남아(TH): Fitzpatrick IV-V 우세
  서양(US/EU): Fitzpatrick I-III 다양
- 소셜 로그인 UI 우선순위 결정 (V4 §7.3)
```

## Q1-4. 설문 언어 (Survey Language)

```
선택지:
[ ] 한국어 (KO)
[ ] English (EN)
[ ] 日本語 (JP)
[ ] 中文 (ZH-CN)

매핑: 전체 설문 + 리포트 + DoctorTab 언어 결정

🆕 Phase 3 언어 확장 후보: 태국어(TH), 베트남어(VI)
  → 현재 4개 언어로 시작, 국가별 접속 데이터 확인 후 Phase 3에서 추가 검토
  → 태국/베트남 환자는 EN으로 우선 커버
```

---

# §2. OPEN_TEXT 노드

> FSM 위치: DEMOGRAPHIC 다음
> 전이: 항상 → HAIKU_ANALYSIS (AI 분석) → SMART_CHIPS
> 입력 방식: 자유 텍스트 (textarea)

## Q2-1. 자유 서술 (Open Question)

```
질문 텍스트:
  KO: "피부에 대한 고민이나 이번 방문에서 기대하는 바를 
       자유롭게 알려주세요. 무엇이든 괜찮습니다."
  EN: "Please tell us about your skin concerns or what you 
       hope to achieve from this visit. Anything is welcome."

입력 가이드 (placeholder — 🔄 문화적 감수성 반영):
  KO: "예: 최근 볼살이 빠지면서 나이 들어 보여요. 
       기미도 점점 짙어지고, 모공도 넓어진 것 같아요."
  EN: "e.g., I want to look refreshed and more youthful. 
       My dark spots are getting worse and pores are more visible."
  JP: "例：最近、お肌のハリが気になっています。
       シミも目立つようになり、毛穴の開きも気になります。"
  ZH-CN: "例：我的法令纹越来越深了，皮肤也变得暗沉，
          想要整体提亮和紧致。"

매핑 목적:
- Claude Haiku가 자유 텍스트를 분석하여 HaikuAnalysis 생성:
  - concern_area_hint: ['wrinkle', 'volume_loss', 'pigment', ...]
  - emotional_tone: 'anxious' | 'curious' | 'decisive'
  - suggested_chips: AI가 다음 SMART_CHIPS 노드의 칩 목록을 동적 생성
```

### ⚠️ Narabo 검수 포인트
```
[ ] placeholder 예시가 환자가 실제로 쓸 법한 자연스러운 문장인가?
[ ] 4개국어 placeholder가 문화적으로 적절한가?
    (일본어는 더 정중한 표현? 중국어는 간체자?)
[ ] AI가 분석할 수 있을 만큼 충분한 입력을 유도하는가?
    (너무 짧은 답변 방지를 위한 최소 글자 수 필요?)
```

---

# §3. SMART_CHIPS 노드

> FSM 위치: HAIKU_ANALYSIS 결과를 받은 후
> 전이: 칩 응답에 따라 → BRANCH_SKIN_PROFILE / BRANCH_PAST_HISTORY / SAFETY_CHECKPOINT
> 입력 방식: 멀티 셀렉트 칩 (복수 선택 가능)

## 칩 카테고리 구조

```
AI가 HaikuAnalysis를 기반으로 관련 칩을 동적 생성하되,
아래 마스터 칩 풀에서 선택한다.

=== 카테고리 A: 관심 시술 영역 (concern_area) ===

리프팅/탄력:
  [ ] 턱선 리프팅 (Jawline lifting)          → Part 2 Q3-A 매핑
  [ ] 전체 피부 탄력 (Skin tightening)       → Part 2 Q3-B 매핑
  [ ] 볼륨 채움 (Volume restoration)         → Part 2 Q3-C 매핑

색소/톤:
  [ ] 기미/넓게 퍼진 색소 (Melasma)          → Part 3 Q4-A 매핑
  [ ] 뚜렷한 갈색 반점 (Dark spots)          → Part 3 Q4-B 매핑
  [ ] 주근깨/잡티 (Freckles)                 → Part 3 Q4-C 매핑
  [ ] 점 제거 (Mole removal)                 → Part 3 Q4-D 매핑
  [ ] 전반적 칙칙함 (Dull skin tone)         → Part 3 Q4-E 매핑

피부결:
  [ ] 넓은 모공 (Large pores)                → Part 4 Q5-A 매핑
  [ ] 여드름/수술 흉터 (Acne scars)          → Part 4 Q5-B 매핑
  [ ] 건조함/홍조 (Dryness/Redness)          → Part 4 Q5-C 매핑


=== 카테고리 B: 피부 상태 시그널 (skin_signal) ===

  [ ] 피부가 얇은 편 (Thin skin)             → BRANCH_SKIN_PROFILE 트리거
  [ ] 피부가 민감한 편 (Sensitive skin)       → BRANCH_SKIN_PROFILE 트리거
  [ ] 최근 피부가 많이 탔음 (Recently tanned) → 태닝 Safety Flag


=== 카테고리 C: 과거 경험 (past_experience) ===

  [ ] 이전에 피부 시술 여러 번 받아봄 (Multiple past treatments)
      → BRANCH_PAST_HISTORY 트리거
  [ ] 최근 시술 받음 (Recent treatment)
      → BRANCH_PAST_HISTORY 트리거
  [ ] 처음이에요 (First time)
      → 분기 없음, SAFETY_CHECKPOINT로 직행
```

### 분기 트리거 로직

```typescript
// 🔄 V2 교정: "처음이에요"도 필수 꼬리질문(CORE_PROFILE) 통과 필수
// Demographic 데이터(성별/연령/국가)를 활용하여 질문을 동적 구성

function evaluateBranch(chips: SelectedChips, haiku: HaikuAnalysis, demo: Demographics): SurveyNode {

  // ===== 모든 사용자가 반드시 통과하는 필수 질문 =====
  // Fitzpatrick + 관심 영역 구체화는 경험 유무와 무관하게 필수
  // → BRANCH_SKIN_PROFILE에서 처리 (Fitzpatrick + 피부 두께는 조건부)

  // 1순위: 피부 프로필 분기 (모든 사용자 — "처음이에요" 포함)
  // 단, Demographic 기반으로 질문을 동적 구성:
  //   - 40대+ 여성 → 하안부 리프팅 관심 질문 자동 추가
  //   - 50대+ 전체 → 색소(흑자) 질문 자동 추가 (본인 미인지라도)
  //   - 피부 두께 질문 → 리프팅/타이트닝 관심 환자에게만
  //   - 태닝 여부 → 색소/레이저 관심 환자에게만 (필수 아님)
  return 'BRANCH_SKIN_PROFILE';

  // ※ "처음이에요" 선택 시 기존 로직(SAFETY 직행)은 폐기됨
  // ※ 모든 경로가 BRANCH_SKIN_PROFILE을 통과한 후 
  //    조건부로 PAST_HISTORY / VISIT_PLAN / ADVERSE 분기
}

// BRANCH_SKIN_PROFILE 이후 조건부 분기:
function evaluatePostProfile(chips, haiku, demo): SurveyNode {

  // 과거 시술 경험이 있으면 → PAST_HISTORY
  if (chips.past_experience === 'multiple' || chips.past_experience === 'recent') {
    return 'BRANCH_PAST_HISTORY';
  }

  // 해외 환자면 → VISIT_PLAN
  if (demo.country !== 'KR') {
    return 'BRANCH_VISIT_PLAN';
  }

  // 나머지 (국내 + 처음) → PREFERENCES로 직행
  return 'PREFERENCES';
}
```

### 🔄 Demographic 기반 동적 질문 구성 규칙

```
SMART_CHIPS 단계에서 AI가 칩을 생성할 때,
Demographic 데이터를 활용하여 관련 칩을 우선 노출한다:

연령 + 성별 기반 칩 우선순위:
  20대 → 모공/여드름흉터/피부톤 칩 우선
  30대 → 초기 노화/탄력/색소 칩 우선
  40대 여성 → 하안부 리프팅/기미/볼륨 칩 우선
  40대 남성 → 턱선/모공/피지 칩 우선
  50대+ 전체 → 리프팅 + 색소(흑자) 칩 자동 포함 (본인 미선택이라도)

BRANCH_SKIN_PROFILE에서 질문 동적 구성:
  리프팅/타이트닝 관심 → 피부 두께 질문 표시
  색소/레이저 관심 → Fitzpatrick + 태닝 여부 표시
  모공/텍스처 관심 → 여드름 기저질환 여부 표시
  전체 → Fitzpatrick 간접 질문은 항상 표시 (안전 기준)
```

### ⚠️ Narabo 검수 포인트
```
[ ] 칩 텍스트가 환자 입장에서 이해 가능한 일상 언어인가?
[ ] 칩 카테고리가 빠짐없이 Part 2~4 질문과 매핑되는가?
[ ] AI가 자유 텍스트에서 "주름"을 감지했을 때 리프팅 칩 우선 표시 맞는가?
[✅] "처음이에요" 선택 시에도 BRANCH_SKIN_PROFILE 통과 (V2 교정 완료)
[ ] Demographic 기반 동적 칩 우선순위가 현실적인가?
    (40대 여성 → 하안부 리프팅, 50대+ → 흑자 자동 포함)
[ ] 여드름 기저질환 질문이 텍스처 관심 환자에게만 나오면 충분한가?
```

---

# §4. BRANCH_SKIN_PROFILE 노드

> FSM 위치: SMART_CHIPS에서 skin_signal=thin/sensitive일 때 분기
> 전이: → BRANCH_PAST_HISTORY (과거 시술 있으면) / BRANCH_VISIT_PLAN (해외) / SAFETY_CHECKPOINT
> 입력 방식: 클릭 기반 (선택지)

## Q4-1. Fitzpatrick 피부 타입 (간접 질문)

```
질문 텍스트:
  KO: "햇빛(자외선)에 오래 노출되었을 때, 피부가 주로 어떻게 반응하나요?"
  EN: "When exposed to sunlight for a long time, how does your skin usually react?"

선택지 + Fitzpatrick 매핑:
  [ ] A. 항상 붉어지고 따갑고, 절대 까맣게 타지 않는다
       → Fitzpatrick Type I
       → 임상: 에너지 시술 시 최저 세팅, 냉각 프로토콜 강화

  [ ] B. 주로 붉어지며, 까맣게 타기 어렵다
       → Fitzpatrick Type II
       → 임상: 낮은~중간 에너지, PIH 위험 낮음

  [ ] C. 가끔 가볍게 붉어지지만, 시간이 지나면 점차 까맣게 탄다
       → Fitzpatrick Type III (한국/동아시아인 가장 흔함)
       → 임상: 중간 에너지, PIH 주의 필요, 색소 치료 시 Q-switched 우선

  [ ] D. 거의 붉어지지 않고, 아주 쉽게 까맣게 탄다
       → Fitzpatrick Type IV~VI
       → 임상: 높은 에너지 금지, PIH 위험 매우 높음, 
              IPL/BBL 사용 주의, Nd:YAG 1064nm 우선

DoctorTab 반영:
  - clinical_profile.fitzpatrick에 Type I~VI 기록
  - AI 프롬프트에서 레이저 파라미터 안전 범위 결정에 사용

🆕 자가 보고 정확도 보완 (NotebookLM Block 2 검증):
  - 자가 보고 vs 의사 평가 일치율: 약 60~70%
  - 아시아인 오분류 경향: "잘 타지 않는다(Type I~II)"로 과소 또는 "무조건 어둡다(Type V~VI)"로 과대 평가
  - 정확도를 높이기 위한 보조 질문 2개 (Q4-1에 이어서 표시):

보조 Q4-1b: "원래 눈동자와 자연 모발 색상이 어떠신가요?"
  [ ] 밝은 갈색 / 밝은 색 → Type I~II 보정
  [ ] 어두운 갈색~흑갈색 → Type III~IV 보정

보조 Q4-1c: "가장 최근 강한 햇빛을 받았을 때, 물집/심한 껍질이 있었나요?"
  [ ] 예 (물집/심한 껍질) → Type I~II 강화
  [ ] 아니오 (단순히 까맣게 됨) → Type III+ 보정

🆕 국가별 Fitzpatrick 분포 (AI 프롬프트 컨텍스트용):
  | 국가    | Type I~II | Type III  | Type IV   | Type V~VI |
  | 한국    | 5~10%     | 50~60%    | 30~40%    | 매우 드묾  |
  | 일본    | 10~15%    | 40~50%    | 30~40%    | 매우 드묾  |
  | 중국/대만| 5%        | 40%       | 45~50%    | 5%         |
  | 태국    | 드묾      | 10~20%    | 40~50%    | 30~40%    |
  | 미국    | 40~50%    | 15~20%    | 15~20%    | 15~20%    |
```

## Q4-2. 피부 두께 자가 평가

```
질문 텍스트:
  KO: "본인의 피부가 어떤 편이라고 느끼시나요?"
  EN: "How would you describe your skin thickness?"

선택지:
  [ ] 얇은 편 (혈관이 비침, 쉽게 멍듦)
       → skin_thickness = 'thin'
       → 임상: MN-RF 깊이 제한 (1.5mm 이하), 강한 HIFU 주의

  [ ] 보통
       → skin_thickness = 'normal'
       → 임상: 표준 프로토콜

  [ ] 두꺼운 편 (모공이 크고 유분기 많음)
       → skin_thickness = 'thick'
       → 임상: 에너지 높여도 안전, 모공/피지 타겟 시술 추가 고려

DoctorTab 반영:
  - clinical_profile.skin_thickness_self
```

## Q4-3. 최근 태닝 여부

```
질문 텍스트:
  KO: "최근 2개월 내에 휴양지에서 일광욕을 하거나, 
       태닝 기계를 사용한 적이 있으신가요?"
  EN: "Have you sunbathed or used a tanning bed in the past 2 months?"

선택지:
  [ ] 예 (Yes)
       → Safety Flag 생성: 'RECENT_TANNING'
       → 임상 조치: 에너지 기반 시술(프락셔널, 피코, IPL) 2~4주 연기 권장
         수포, 심한 홍반, PIH 위험 증가
         미백 크림 + 자외선 차단제로 본래 피부색 회복 후 시술
       → DoctorTab: safety_summary에 "최근 태닝 이력 — 에너지 시술 연기 권장" 표기

  [ ] 아니오 (No)
       → 정상 진행

매핑 근거:
  태닝으로 멜라닌 활성도가 높아진 상태에서 에너지 시술 시
  → 표피 멜라닌이 레이저 에너지를 과흡수 → 수포/화상/PIH
```

### ⚠️ Narabo 검수 포인트
```
[ ] Fitzpatrick 간접 질문이 임상 가이드라인에 부합하는가?
[ ] Type III가 한국/동아시아인에게 가장 흔하다는 설명이 정확한가?
[ ] "얇은 피부" 자가 평가의 정확도가 임상적으로 유의미한가?
    (의사 판단 vs 환자 자가 평가 gap이 크지 않은가?)
[ ] 태닝 후 2~4주 연기 기준이 적절한가? (더 길어야 하나?)
[ ] Type IV~VI에서 IPL/BBL "주의"가 아니라 "금기"여야 하나?
```

---

# §5. BRANCH_PAST_HISTORY 노드

> FSM 위치: SMART_CHIPS에서 past_experience=multiple/recent일 때
> 전이: → BRANCH_ADVERSE (부작용 있으면) / BRANCH_VISIT_PLAN (해외) / SAFETY_CHECKPOINT
> 입력 방식: 클릭 + 텍스트 혼합

## Q5-1. 과거 시술 이력

```
질문 텍스트:
  KO: "이전에 받아보신 피부 시술이 있다면, 해당되는 카테고리를 모두 선택해 주세요."
  EN: "If you've had skin treatments before, please select all categories that apply."

🔄 선택지 (카테고리 + 대표 예시로 재구성):

  리프팅/타이트닝:
  [ ] HIFU 계열 리프팅 (울쎄라, 슈링크, 더블로 등)
  [ ] 단극성 RF 타이트닝 (써마지, 볼뉴머, 올리지오 등)
  [ ] 마이크로니들 RF (지니어스, 포텐자, 실펌, 스카렛, 버츄 등)

  레이저:
  [ ] 피코/나노초 레이저 (피코슈어, 피코플러스, 할리우드 스펙트라 등)
  [ ] IPL/BBL (BBL HERO, 루메니스 등)
  [ ] 프락셔널 레이저 (CO2, LaseMD 등)
  [ ] 혈관 레이저 (더마브이, 엑셀브이 등)

  인젝터블:
  [ ] 스킨부스터/주사 (리쥬란, 쥬베룩, NCTF, 물광 등)
  [ ] 바이오스티뮬레이터 (스컬트라, 엘란쎄 등)
  [ ] 보톡스/필러

  기타:
  [ ] 실 리프팅 (Thread lift)
  [ ] 필링/스케일링
  [ ] 기타 (직접 입력)

🔄 과거 시술이 추천에 도움되는 4가지 측면 (로직 연결 명시):
  1. 시술 간 최소 간격 판단:
     예) HIFU 6개월 내 재시술 → 효과 미미 → 다른 계열 장비 추천
  2. 필러 이동 위험 판단:
     예) 3개월 내 필러 주입 → HIFU/RF 조사 시 필러 녹거나 이동
  3. 시너지 활용:
     예) 이전 RF 경험 → 그 위에 바이오스티뮬레이터 추가로 시너지
  4. PIH/부작용 예측:
     예) 이전 피코 후 PIH → 같은 계열 에너지 세팅 하향
```

## Q5-2. 가장 최근 시술 시기

```
질문 텍스트:
  KO: "가장 최근에 받으신 시술은 언제쯤인가요?"
  EN: "When was your most recent treatment?"

선택지:
  [ ] 1개월 이내
  [ ] 1~3개월 전
  [ ] 3~6개월 전
  [ ] 6개월~1년 전
  [ ] 1년 이상 전

🔄 매핑 목적 (V2 교정 — "불가" → "주의"로 완화):
  1개월 이내: ⚠️ 주의 — 의사 판단 필요 (대부분 에너지 시술 가능하나 신중하게)
  3개월 미만: ⚠️ MN-RF, 강한 레이저 주의
  6개월+: 대부분의 시술 가능

  ※ 중요: 기준은 "설문 응답 시점"이 아닌 "실제 시술 예정 시점"
  → DoctorTab에 "환자가 N월에 응답, 실제 방문 예정: M월 — 간격 재계산 필요" 표기
  → 최종 판단은 의사가 내리도록 가이드
```

## Q5-3. PIH(시술 후 과색소침착) 경험

```
질문 텍스트:
  KO: "이전에 레이저 치료를 받은 후, 색소가 오히려 더 진해진 적이 있으신가요?"
  EN: "After previous laser treatments, did you experience 
       darkening of the skin (post-inflammatory hyperpigmentation)?"

선택지:
  [ ] 예 (Yes)
       → Safety Flag: 'PIH_HISTORY'
       → 임상 조치:
         피코 레이저 강한 세팅 제외
         하이브리드 Q-switched 또는 기저막 보호 치료로 대체
         엑소좀/트라넥삼산 병행 필수 권장
         DoctorTab에 "PIH 이력 — 보수적 에너지 세팅 필수" 표기
       → BRANCH_ADVERSE 분기 트리거

  [ ] 아니오 (No)
       → 정상 진행

  [ ] 잘 모르겠다 (Not sure)
       → DoctorTab에 "PIH 이력 불명 — 첫 시술 시 테스트 샷 권장" 표기
```

### ⚠️ Narabo 검수 포인트
```
[ ] 시술 목록이 ConnectingDocs 타겟 환자가 흔히 받는 시술을 커버하는가?
[ ] 빠진 주요 시술이 있는가? (예: 엠스컬프트, 쿨스컬프팅?)
[ ] "필러 후 HIFU → 필러 이동 위험"이 임상적으로 정확한가?
[ ] PIH "잘 모르겠다" 응답의 처리 방식이 적절한가?
[ ] 시술 간 최소 간격 기준(1개월/3개월/6개월)이 정확한가?
```

---

# §6. BRANCH_VISIT_PLAN 노드

> FSM 위치: 해외 환자(country ≠ KR)일 때만 활성화
> 전이: 항상 → SAFETY_CHECKPOINT
> 입력 방식: 클릭 기반

## Q6-1. 한국 체류 기간

```
질문 텍스트:
  KO: "이번 한국 방문 시 체류 기간은 며칠인가요?"
  EN: "How long is your stay in Korea?"

선택지 + 시술 배치 전략:

  [ ] 1~3일 (초단기)
       → 체류 중(Day 1~2): 다운타임 0 시술만 배치
         볼뉴머, 소프웨이브, 티타늄, 엠페이스, 피코 토닝
         가벼운 스킨부스터 (스킨바이브 등)
       → 🆕 마지막날 전략: 다운타임이 길지만 효과가 확실한 시술을
         체류 마지막날에 시행 후 듀오덤/딱지를 동반한 채 출국 가능
         예: Reepot(듀오덤 14일) — 마지막날 시술 → 듀오덤 붙인 채 출국
         예: Genius(미세딱지 3~5일) — 마지막날 시술 → 딱지 상태로 출국
         ※ 단, 본국에서의 사후 관리 안내(듀오덤 교체법, 주의사항) 필수 제공
         ※ DoctorTab에 "출국 후 원격 경과 확인 권장" 표기

  [ ] 4~7일 (단기)
       → 체류 중(Day 1~5): 중간 다운타임 허용
         울쎄라(붓기 1~2일 → 4~7일 체류면 적극 추천 가능)
         써마지(다운타임 0일), 슈링크(다운타임 0~1일)
         일반 스킨부스터(리쥬란 — 엠보싱 1~3일)
         피코 토닝, BBL HERO
       → 🆕 마지막날 전략: 체류 중 시행 어려웠던 강한 시술 배치
         예: Genius — Day 6 시술 → Day 7 출국 (미세딱지 동반)
         예: LaseMD Ultra — Day 5 시술 → 3~5일 회복은 본국에서
         예: Reepot — 마지막날 시술 → 듀오덤 붙인 채 출국
       → 출국 전날 경과 확인 + 재생 LED/엑소좀 가능

  [ ] 1주~2주 (중기)
       → 대부분의 시술 가능 (체류 중 2차 방문 시퀀스 설계)
         Day 1: 강한 시술 (울쎄라+써마지, 지니어스, Reepot 등)
         Day N-1: 경과 확인 + 재생 시술 (LED, 엑소좀)
         Reepot도 체류 중 듀오덤 제거 + 경과 확인 가능
       → CO2 프락셔널: ⚠️ 마지노선 (딱지 탈락 7~14일 필요)

  [ ] 2주 이상 (장기)
       → 모든 시술 가능 (복합 시퀀스 Day 1 + Day 7 + Day 14)
       → CO2 프락셔널, Reepot 듀오덤 14일 모두 체류 중 관리 가능

🆕 체류 기간별 가능/불가 장비 매트릭스 (NotebookLM 검증):

  시술명                    │ 1~3일  │ 4~7일  │ 1~2주  │ 2주+
  ─────────────────────────┼────────┼────────┼────────┼───────
  Thermage, Volnewmer       │ ✅     │ ✅     │ ✅     │ ✅
  Sofwave, Titanium, Emface │ ✅     │ ✅     │ ✅     │ ✅
  Ulthera, Shrink           │ ✅     │ ✅     │ ✅     │ ✅
  Pico/Qsw Toning, BBL     │ ✅     │ ✅     │ ✅     │ ✅
  Juvelook, Rejuran(주사)   │ ⚠️*    │ ✅     │ ✅     │ ✅
  Potenza, Sylfirm X       │ ⚠️*    │ ✅     │ ✅     │ ✅
  Genius, LaseMD Ultra     │ 🔚**   │ ⚠️*    │ ✅     │ ✅
  CO2 Fractional            │ 🔚**   │ 🔚**   │ ⚠️*    │ ✅
  Reepot VSLS (14일 듀오덤) │ 🔚**   │ 🔚**   │ ⚠️*    │ ✅

  ✅ = 체류 중 자유롭게 배치 가능
  ⚠️* = 마지노선 (체류 초반 시행 시 회복 가능하나 빠듯)
  🔚** = 🆕 마지막날 전략 (체류 마지막날 시행 → 다운타임을 동반한 채 출국)
         ※ "불가"가 아님. 본국 사후관리 안내 + 원격 경과 확인 조건 하에 추천 가능

매핑 목적:
  - Treatment Plan의 visit mode에서 Day별 시퀀스 자동 생성
  - 🆕 마지막날 전략은 AI 프롬프트에 별도 컨텍스트로 주입:
    "이 환자는 N일 체류합니다. 체류 중 다운타임이 짧은 시술을 우선 배치하되,
     효과가 확실한 다운타임 긴 시술은 마지막날에 배치할 수 있습니다.
     마지막날 시술 시 본국 사후관리 가이드를 반드시 제공하세요."
  - DoctorTab에서 "체류 N일 — Day별 시술 배치 + 마지막날 전략" 가이드 표시
```

## Q6-2. 향후 재방문 주기

```
질문 텍스트:
  KO: "향후 한국 피부과에 방문할 수 있는 예상 주기는 어떻게 되시나요?"
  EN: "How often can you visit Korea for treatments?"

선택지 + 장비 유지 기간 매핑:
  [ ] 1년에 1번 (프리미엄 집중 관리)
       → 유지 기간 1년+ 장비 우선 추천:
         써마지 FLX (효과 ~1년)
         울쎄라 (효과 1~1.5년)
         엘란쎄 (효과 1~2년)
         리팟 1회성 흑자 완치
       → AI 프롬프트: "이 환자는 1년에 1번 방문합니다. 
         1회 시술로 최대 효과+최대 유지 기간을 가진 장비를 우선하세요."

  [ ] 3~6개월에 1번 (계절별 유지)
       → 주기적 관리 가능 장비:
         슈링크 유니버스 (3~6개월 주기)
         인모드 (월 1회 최적, 3개월 OK)
         쥬베룩 (3~4회 시리즈)
         피코/Q-switched 토닝 패키지

  [ ] 이번 방문이 당분간 유일 (1회성 확실한 개선)
       → "1년 1번"과 동일하되, 더 공격적인 1회 세팅 가능
       → AI 프롬프트: "이 환자는 당분간 재방문이 어렵습니다. 
         1회로 가장 확실한 변화를 줄 수 있는 옵션을 최우선하세요."
```

### ⚠️ Narabo 검수 포인트
```
[ ] 체류 기간별 시술 제약이 임상적으로 정확한가?
    (4~7일에 울쎄라가 정말 불가능한가? 붓기 기간 고려)
[ ] "1~3일 → 볼뉴머, 소프웨이브" 추천이 실제 병원 현장과 맞는가?
[ ] 재방문 주기별 장비 유지 기간 매핑이 정확한가?
    (써마지 FLX 효과가 실제로 1년 가는가?)
[ ] 2차 방문 시퀀스(Day 1 시술 → 출국 전 경과 확인)가 현실적인가?
```

---

# §7. BRANCH_ADVERSE 노드

> FSM 위치: BRANCH_PAST_HISTORY에서 PIH 경험 또는 부작용 있을 때
> 전이: 항상 → SAFETY_CHECKPOINT
> 입력 방식: 클릭 + 선택

## Q7-1. 부작용 유형

```
질문 텍스트:
  KO: "이전 시술 후 겪으신 부작용이 있다면, 해당되는 것을 모두 선택해 주세요."
  EN: "If you experienced any side effects after previous treatments, 
       please select all that apply."

선택지 (멀티 셀렉트):
  [ ] 색소침착 (시술 부위가 더 까매짐) — PIH
       → Safety Flag: PIH_HISTORY
       → 장비 제한: 강한 피코 제외, Q-switched 1064nm 우선

  [ ] 화상 / 수포 (물집이 생김) — Burn/Blister
       → Safety Flag: BURN_HISTORY
       → 장비 제한: 에너지 시술 전체 보수적 세팅, Fitzpatrick 재확인 필수

  [ ] 장기 부종 / 붓기 (2주 이상 지속) — Prolonged Edema
       → Safety Flag: EDEMA_HISTORY
       → 장비 제한: HIFU 강도 하향, MN-RF 깊이 제한

  [ ] 흉터 악화 (시술 후 흉터가 더 심해짐) — Scar Worsening
       → Safety Flag: SCAR_WORSENING
       → 장비 제한: 프락셔널 레이저 제외, 비침습 우선

  [ ] 알레르기 반응 (두드러기, 발진) — Allergic Reaction
       → Safety Flag: ALLERGY_HISTORY
       → 인젝터블 주의: 필러/스킨부스터 성분 확인 필수

  [ ] 기타 (직접 입력)
       → DoctorTab의 safety_summary에 원문 기록

매핑: DoctorTab의 clinical_profile.active_conditions에 전체 기록
```

## Q7-2. 부작용 발생 시술 + 회복 기간

```
질문 텍스트:
  KO: "해당 부작용이 발생한 시술명과 대략적인 회복 기간을 알려주세요."
  EN: "Please tell us which treatment caused the side effect 
       and approximately how long it took to recover."

입력 방식: 텍스트 (선택적)

매핑: DoctorTab의 safety_summary에 원문 전달
  → 의사가 직접 판단할 수 있는 임상 정보
```

### ⚠️ Narabo 검수 포인트
```
[ ] 부작용 유형이 실제 임상에서 흔히 보고되는 것을 커버하는가?
[ ] "흉터 악화 → 프락셔널 제외"가 정확한가?
[ ] 알레르기 반응에서 구체적으로 어떤 성분을 확인해야 하는가?
    (HA? PDRN? 마취 성분?)
[ ] 부작용 유형별 장비 제한 규칙이 너무 보수적인가? 
    (의사 판단 여지를 남겨야 하나?)
```

---

# §8. 🆕 PREFERENCES 노드 (V2 보강 — 기존 SAFETY_CHECKPOINT에서 분리)

> FSM 위치: 모든 분기(VISIT_PLAN, ADVERSE, 또는 SMART_CHIPS 직행)가 수렴하는 선호도 수집 단계
> 전이: 항상 → SAFETY_CHECKPOINT (§9)
> 입력 방식: 클릭 기반
> 🆕 특수 로직: VISIT_PLAN에서 수집한 체류 기간이 다운타임 선택지를 동적으로 제한
> 🆕 산출물: patient_segment (VIP / PREMIUM / BUDGET) 자동 할당

### VISIT_PLAN → 다운타임 동적 비활성화 규칙

```
체류 1~3일 → 다운타임 "3~5일" 및 "7일+" 선택지 비활성화 (disabled + 회색 처리)
체류 4~7일 → 다운타임 "7일+" 선택지 비활성화
체류 1~2주 → 모든 선택지 활성
체류 2주+ → 모든 선택지 활성
국내 환자(local) → 모든 선택지 활성 (VISIT_PLAN 미통과)

비활성화된 선택지 안내 문구:
  KO: "(체류 기간 N일 기준, 이 다운타임은 권장되지 않습니다)"
  EN: "(Based on your N-day stay, this downtime is not recommended)"
```

## Q8-1. 통증 허용도 (Pain Tolerance)

```
질문 텍스트:
  KO: "시술 시 통증에 대해 어떻게 생각하시나요?"
  EN: "How do you feel about pain during treatments?"

선택지 (5단계 — V4 §5.1 DoctorTab 반영):
  [ ] 1. 전혀 아프지 않은 시술만 (Zero pain)
       → pain_sensitivity = 1
       → 허용 장비: 볼뉴머, 티타늄, 엠페이스, 소프웨이브
       → 제외: 써마지, 울쎄라, 지니어스, 포텐자

  [ ] 2. 약간의 따끔함은 괜찮아요 (Mild discomfort OK)
       → pain_sensitivity = 2
       → 허용: 위 + 가벼운 스킨부스터, LaseMD

  [ ] 3. 마취크림 바르고 참을 수 있어요 (Topical anesthesia OK)
       → pain_sensitivity = 3
       → 허용: 대부분의 시술 (표준)

  [ ] 4. 마취 주사도 괜찮아요 (Local anesthesia OK)
       → pain_sensitivity = 4
       → 허용: 전체

  [ ] 5. 확실한 효과를 위해 수면마취도 고려 (IV sedation OK)
       → pain_sensitivity = 5
       → 허용: 전체 (가장 공격적 세팅 가능)

DoctorTab 반영: clinical_profile.pain_sensitivity (1~5)
```

## Q8-2. 다운타임 허용도 (Downtime Tolerance)

```
질문 텍스트:
  KO: "시술 후 회복 기간(다운타임)은 어느 정도까지 허용되시나요?"
  EN: "How much downtime can you accept after treatment?"

선택지 (일수 기반 — V4 §5.1 반영):
  [ ] 0일: 당일 화장 + 일상 복귀 (Zero downtime)
       → downtime_days = 0
       → 금지: 쥬베룩 볼륨(바늘자국), 리팟(듀오덤), CO2 프락셔널
       → 허용: 볼뉴머, 소프웨이브, 엠페이스, 티타늄, 가벼운 토닝

  [ ] 1~2일: 가벼운 붉은기, 잔붓기 OK
       → downtime_days = 2
       → 허용: 위 + 일반 스킨부스터, 약한 MN-RF, 피코 토닝

  [ ] 3~5일: 붓기, 엠보싱(주사자국) OK
       → downtime_days = 5
       → 허용: 위 + 써마지, 슈링크, 일반 MN-RF, 피코 강세팅

  [ ] 7일+: 딱지, 듀오덤(재생테이프) OK
       → downtime_days = 7
       → 허용: 전체 (울쎄라, 지니어스, 리팟, CO2 프락셔널)

DoctorTab 반영: clinical_profile.downtime_days
```

## Q8-3. 피부 관리 스타일 + 🆕 세그먼트 할당 (Budget & Segment)

```
질문 텍스트:
  KO: "어떤 방식의 피부 관리를 선호하시나요?"
  EN: "What is your preferred approach to skin care?"

선택지 (3단계로 확장):
  [ ] A. 합리적인 비용으로 자주 관리 (가성비)
       → price_sensitivity = 'budget'
       → 장비 우선순위: 올리지오, 일반 슈링크, IPL, 가성비 토닝

  [ ] B. 적당한 비용에 확실한 효과의 밸런스 (밸런스)
       → price_sensitivity = 'mid'
       → 장비 우선순위: 볼뉴머, 슈링크 유니버스, 피코플러스, 쥬베룩, 리쥬란

  [ ] C. 비용보다 효과, 최고의 프리미엄 장비 선호 (럭셔리)
       → price_sensitivity = 'premium'
       → 장비 우선순위: 울쎄라, 써마지 FLX, 리팟, 프로파일로, NCTF

매핑:
  - AI 프롬프트에서 가격대 필터링
  - 환자-의사 매칭(V4 §5.3)의 price_match 스코어에 반영
```

### 🆕 환자 세그먼트 자동 할당 (patient_segment)

```
PREFERENCES 응답 완료 시, 아래 규칙으로 세그먼트를 자동 결정한다.

function deriveSegment(preferences, visitPlan?): PatientSegment {
  const { price_sensitivity, pain_tolerance, downtime_days } = preferences;
  const revisit = visitPlan?.revisit_cycle;

  // VIP/Luxury: 프리미엄 + 통증 OK + 다운타임 OK
  if (price_sensitivity === 'premium' && pain_tolerance >= 3 && downtime_days >= 5) {
    return 'VIP';
  }

  // VIP: 프리미엄 + 1년 1회 방문 (1회에 확실한 결과 원함)
  if (price_sensitivity === 'premium' && revisit === 'yearly') {
    return 'VIP';
  }

  // Budget: 가성비 선택
  if (price_sensitivity === 'budget') {
    return 'BUDGET';
  }

  // Premium: 나머지 (mid + 대부분의 조합)
  return 'PREMIUM';
}

세그먼트별 AI 추천 조정:

  VIP/Luxury:
    장비: Thermage FLX, Ulthera, Sofwave, Reepot, Profhilo, NCTF
    톤: "최상의 만족도", "오리지널 장비의 검증된 효과"
    가격: 프리미엄 가격대 중심

  Premium/Mid:
    장비: Volnewmer, Shrink Universe, PicoPlus, Juvelook, Rejuran
    톤: "효과와 비용의 최적 밸런스"
    가격: 중간 가격대

  Budget:
    장비: Oligio, 일반 Shrink, 가성비 토닝, IPL
    톤: "합리적인 가격으로 꾸준한 관리"
    가격: 가성비 강조, 패키지/다회권 언급

세그먼트는 최종 시그널 맵에 patient_segment 필드로 포함되어
AI final-recommendation 프롬프트에 주입된다.
```

---

# §9. SAFETY_CHECKPOINT 노드 (기존 §8에서 약물/금기만 분리)

> FSM 위치: PREFERENCES 이후 → 최종 안전 필터링 (Hard Filter)
> 전이: 항상 → ANALYZING (AI 최종 분석)
> 입력 방식: 멀티 셀렉트 토글
> 성격: 여기서 걸리면 특정 시술이 완전 차단됨

## Q9-1. 약물 및 기저질환 (Medication & Conditions)

```
질문 텍스트:
  KO: "현재 복용 중인 약물이나 해당되는 상태가 있으면 선택해 주세요."
  EN: "Please select if any of the following apply to you."

선택지 (멀티 셀렉트 토글 — 🔄 6종 → 11종으로 확장):

  === 기존 6종 (V3) ===

  [ ] 이소트레티노인(로아큐탄) 복용 중 또는 최근 6개월 내 복용
       → Safety Flag: 'ISOTRETINOIN' | 심각도: HIGH
       → 임상: 스킨부스터/필러 6개월 대기, CO2/MN-RF 금기, 비침습 LED만 예외
       → 근거: 이소트레티노인은 wound healing을 저해하여 비정상적 흉터 유발

  [ ] 혈전 용해제(아스피린, 와파린, 클로피도그렐 등) 복용 중
       → Safety Flag: 'BLOOD_THINNER' | 심각도: HIGH
       → 임상: 주사/MN-RF 출혈+혈종 위험. 시술 전 최소 2주 중단 필요 (주치의 동의)
       → 비침습(HIFU, RF, LED)은 안전. 캐뉼라도 근본적 출혈 리스크로 금기.

  [ ] 레티놀 성분 화장품/연고 매일 사용
       → Safety Flag: 'RETINOL_USE' | 심각도: MEDIUM
       → 임상: 프락셔널/필링/피코 시술 전 3~5일 중단, 시술 후 최소 48시간 중단

  [ ] 현재 임신 중 또는 임신 가능성
       → Safety Flag: 'PREGNANCY' | 심각도: CRITICAL
       → 임상: 모든 인젝터블 + 강한 에너지 EBD 절대 금기. LED/순수 보습만 가능.

  [ ] 켈로이드 체질 (상처가 볼록하게 올라오는 체질)
       → Safety Flag: 'KELOID' | 심각도: HIGH
       → 임상: CO2 절대 금기, MN-RF(Genius/Potenza) 금기, 인젝터블 금기
       → 참고: 켈로이드와 비후성 반흔 구분 불필요 — 동일 리스크로 처리

  [ ] 자가면역 질환 (루푸스, 건선, 경피증 등)
       → Safety Flag: 'AUTOIMMUNE' | 심각도: HIGH
       → 임상: 예측 불가 면역 반응/치유 지연. 설문에서 Hard Warning 후 의사 판단 위임.

  === 🆕 5종 추가 (NotebookLM Block 5 검증) ===

  [ ] 당뇨병 (Diabetes Mellitus)
       → Safety Flag: 'DIABETES' | 심각도: HIGH
       → 임상: 상처 치유 능력 저하. 딱지 레이저(Reepot, CO2), 침습 MN-RF 시
         회복 지연 + 감염 위험 증가. 세심한 주의 필요.

  [ ] 인공 심박동기 또는 체내 금속 이식물
       → Safety Flag: 'METAL_IMPLANT' | 심각도: CRITICAL
       → 임상: 단극성 RF(써마지, 볼뉴머, 올리지오) 및 전자기장(Emface) 절대 금기
         기기 오작동 및 심각한 화상 위험. HIFU/레이저/LED는 안전.

  [ ] 면역 억제제 복용 중 (장기이식, 항암 등)
       → Safety Flag: 'IMMUNOSUPPRESSED' | 심각도: HIGH
       → 임상: 정상 재생 반응(콜라겐 합성) 불가. 감염 위험 높음.
         대부분의 침습 + 에너지 시술 제약.

  [ ] 광과민성 약물/보조제 (세인트존스워트, 은행잎 등)
       → Safety Flag: 'PHOTOSENSITIVE' | 심각도: MEDIUM
       → 임상: 레이저/IPL 시술 시 과민 반응 위험.
         시술 2주 전 복용 중단 필요. 은행잎/인삼/마늘은 출혈 위험도 증가.

  [ ] 단순 포진(헤르페스) 재발 이력
       → Safety Flag: 'HSV_HISTORY' | 심각도: MEDIUM
       → 임상: 열 에너지 시술이 바이러스 재활성화 유발 가능.
         활성 병변 시 시술 불가. 잦은 재발 이력 시 시술 전 항바이러스제 예방 복용 필수.

  [ ] 해당 없음 (None of the above)

DoctorTab 반영: 
  - clinical_profile.concurrent_medications (전체 플래그 배열)
  - safety_summary (Safety Flag + 심각도 + 임상 조치)
  - CRITICAL 플래그 존재 시: 리포트 상단에 빨간 경고 배너 표시
```

### ⚠️ Narabo 검수 포인트
```
[ ] 통증 5단계가 V4 §5.1의 DoctorTabData와 일치하는가?
[ ] 다운타임 일수 기반이 V4 §5.1의 downtime_days와 일치하는가?
[ ] 체류 기간 → 다운타임 동적 비활성화가 적절한가?
    (1~3일 체류에서 "3~5일" 비활성화가 너무 보수적인가?)
[ ] 예산 3단계(가성비/밸런스/럭셔리)가 환자 입장에서 구분 가능한가?
[ ] 세그먼트 자동 할당 로직이 현실적인가?
    (VIP 조건: premium + 통증3+ + 다운타임5+ 가 맞는가?)
[ ] 약물 목록이 한국 피부과에서 실제로 확인하는 항목을 커버하는가?
[ ] 빠진 약물/상태가 있는가? (항생제? 면역 억제제? 당뇨?)
[ ] "임신 → CRITICAL"이 적절한 심각도인가?
[ ] 켈로이드 체질에서 CO2 금기가 맞는가?
```

---

# §10. 장비 매핑 마스터 테이블 (기존 §9 → 번호 변경 + 세그먼트 열 추가)

> 이 테이블은 FSM 노드를 횡단하여, 환자의 응답 조합이 어떤 장비로 매핑되는지를 정의한다.
> AI 프롬프트의 시스템 프롬프트에 주입되어 final-recommendation 생성 시 참조.

## 리프팅/탄력 장비 매핑

```
응답 조합                            → 추천 장비              → 제외 장비       → 세그먼트
─────────────────────────────────────────────────────────────────────────────────────────
Q3-A (하안부 처짐)                   → Ulthera, Shrink, InMode                → VIP: Ulthera
                                                                               → PREMIUM: Shrink
                                                                               → BUDGET: Oligio
Q3-A + 통증 1~2                      → Sofwave, Volnewmer    → Ulthera, Thermage
Q3-B (진피 타이트닝)                 → Thermage FLX, Volnewmer               → VIP: Thermage
                                                                               → BUDGET: Volnewmer
Q3-B + 통증 1                        → Volnewmer, Titanium   → Thermage
Q3-C (볼륨 재건)                     → Juvelook Vol, Sculptra → HIFU 전체 (단, Sofwave 예외)
Q3-C + 다운타임 0                    → Sofwave + Re2O        → Juvelook Vol (바늘자국)
Q3-A + 체류 1~3일                    → Sofwave, Volnewmer    → 🔚 Ulthera 마지막날 가능
Q3-A + 체류 1~2주                    → Ulthera + Thermage 콤보 가능
```

## 색소 장비 매핑

```
응답 조합                            → 추천 장비              → 제외/주의       → 세그먼트
─────────────────────────────────────────────────────────────────────────────────────────
Q4-A (기미/멜라즈마)                 → Q-switched 1064nm (할리우드 스펙트라)
                                      → Sylfirm X (PW모드, 기저막 치료)
🔄 Q4-A + PIH 이력                  → Sylfirm X(PW), Potenza(저에너지),      → 모든 피코/Qsw 강세팅 제외
                                      VirtueRF
Q4-B (흑자/렌티고)                   → Reepot VSLS (1회 완치), 강한 Pico     → VIP: Reepot
                                                                               → BUDGET: 강한 Pico
🔄 Q4-B + 체류 1~3일                → 🔚 Reepot 마지막날 가능               → 본국 듀오덤 사후관리 조건
                                      (환자가 1회 흑자 완치를 원할 경우 추천)
Q4-B + 체류 1~2주                    → Reepot OK (체류 중 듀오덤 제거 가능)
Q4-C (주근깨/잡티)                   → Pico 1064/755nm, BBL HERO
Q4-C + Fitzpatrick IV+              → Pico 1064nm만          → BBL/IPL (PIH 위험)
Q4-D (단순 점)                       → CO2 레이저
Q4-E (칙칙함)                        → NCTF(샤넬주사) + LaseMD Ultra
```

## 피부결 장비 매핑

```
응답 조합                            → 추천 장비              → 제외/주의       → 세그먼트
─────────────────────────────────────────────────────────────────────────────────────────
🔄 Q5-A (모공/피지)                  → Quadessy, LaseMD Ultra,               → VIP: Genius
                                      SecretRF, Potenza, (Genius)             → PREMIUM: Potenza
                                                                               → BUDGET: SecretRF
🔄 Q5-B (패인 흉터)                  → Genius, Potenza + Juvelook 펌핑팁
  Q5-B + VIP + 통증 OK              → Genius 1순위 (프리미엄, 강력, 비쌈, 임피던스 피드백)
  Q5-B + BUDGET 또는 통증 낮음       → Potenza 1순위 (가성비, 덜 아픔, 펌핑팁 약물전달)
  Q5-B + 다운타임 0                  → ⚠️ 주의 (MN-RF는 최소 1~2일 다운타임)
Q5-C (건조/홍조)                     → DermaV + Rejuran Healer(PN)
                                      → Exosome (ASCE+)
Q5-C + Fitzpatrick I                → DermaV 저에너지        → 강한 혈관 레이저
```

### ⚠️ Narabo 검수 포인트
```
[ ] 매핑 테이블의 장비가 모두 DeviceWiki에 등록 예정인 장비와 일치하는가?
[ ] "볼륨 재건 → HIFU 제외"가 모든 HIFU에 해당하는가?
    (소프웨이브는 HIFU가 아니라 병렬 초음파라 볼패임 위험 낮지 않나?)
[ ] 색소 매핑에서 Fitzpatrick 타입별 에너지 제한이 정확한가?
[ ] 패인 흉터에 Genius vs Potenza 선택 기준이 임피던스 피드백인가, 통증인가?
[ ] 빠진 주요 장비가 있는가? 
    (예: 엑셀브이, 스카렛, 제네시스, 엑셀브이빔 등?)
```

---

# §11. 시술 시퀀스 생성 규칙 (기존 §10 → 번호 변경)

> 이 섹션은 AI가 Treatment Plan(V4 §2 Phase B)을 생성할 때 참조하는 규칙.
> 체류 기간 × 관심 영역 × 통증/다운타임 제약의 조합으로 Day별 시퀀스를 결정.

## 해외 환자 시퀀스 원칙

```
원칙 1: 타겟 층이 다른 시술은 같은 날 시행 가능 ✅
  OK: Ulthera(SMAS층) + Thermage(진피층) 같은 날
  OK: 리프팅(깊은 층) + 토닝(표피층) 같은 날
  NG: Ulthera + Shrink 같은 날 (같은 SMAS층 이중 타격)
  ⚠️ 예외: 피하 지방 극도로 적은 환자 → 1일 열 누적 주의

원칙 2: 다운타임이 긴 시술은 체류 초반에 배치 ✅
  Day 1: 에너지 시술 (다운타임 시작)
  Day N-1 (출국 전날): 경과 확인 + 재생 시술 (LED, 엑소좀)
  🔄 단, 환자 행동 패턴에 따라 마지막날 배치도 가능 (원칙 5 참조)

원칙 3: 인젝터블은 에너지 시술과 같은 날 또는 직후 시행 ✅
  무조건 [에너지 먼저 → 인젝터블 나중] 순서
  반대 시 필러 변성/이동, 유효 성분 파괴 위험

🔄 원칙 4: 색소 치료와 리프팅의 간격 (V2 교정)
  변경 전: "최소 3~5일 간격"
  변경 후: 시술 유형에 따라 다름
    - 피코 토닝 (딱지 없음) + 비침습 리프팅 → 당일 병행 가능 ✅
    - Reepot/CO2 (딱지/듀오덤) + 리프팅 → 최소 1~2주 간격 필수
    - 임상적 권장: 흑자 치료(Reepot)를 리프팅보다 먼저 진행 →
      색소 정리 후 1~2주 뒤 리프팅이 만족도 가장 높음

🆕 원칙 5: 마지막날 전략 (Narabo 피드백 반영)
  다운타임이 길지만 효과가 확실한 시술을 체류 마지막날에 배치 가능
  조건: 본국 사후관리 가이드 제공 + 원격 경과 확인 권장
  예: Reepot → 마지막날 시술 → 듀오덤 붙인 채 출국
  예: Genius → 마지막날 시술 → 딱지 상태로 출국
```

### 🆕 의료관광객 4가지 행동 패턴 (AI 시퀀스 생성 시 인식)

```
AI가 Treatment Plan을 생성할 때 아래 행동 패턴을 인식하고 대응한다.
환자의 PREFERENCES + VISIT_PLAN 응답 조합으로 패턴을 추론:

패턴 A: "마지막날 시술" — 관광 후 출국 직전 다운타임 시술
  추론 조건: 다운타임 허용 낮음 + 체류 3~7일 + 효과 중시
  AI 대응: 체류 중 다운타임 0 시술 → 마지막날 강한 시술 배치
  안전 조치: 본국 사후관리 가이드 + DoctorTab에 원격 경과 확인 표기

패턴 B: "다운타임 0 타협" — 회복 없는 시술만 선호
  추론 조건: 다운타임 0일 선택 + 체류 1~3일
  AI 대응: Zero-downtime 프리미엄 패키지 설계
  예: Sofwave + Volnewmer + 스킨바이브 + LED

패턴 C: "하루 몰아서" — 1일 복합 극대화
  추론 조건: 체류 1~3일 + 통증 OK + 프리미엄
  AI 대응: 1일 최대 안전 한계 내에서 최대 조합 설계 (아래 Max Cap 참조)
  안전 조치: 수면마취 동반 안내, 3D 레이어링 원칙 준수

패턴 D: "초반 강행" — 예약/프로모션에 맞춰 Day 1 강행
  추론 조건: 체류 4~7일 + 프리미엄 + 통증 OK
  AI 대응: Day 1 집중 시술 + Day 3~5 경과 확인 재방문 제안
  안전 조치: "Day 3 재방문하여 경과 확인 권장" DoctorTab에 표기
```

### 🆕 1일 최대 시술 안전 한계 (Max Cap) — NotebookLM 검증

```
1일 최대 안전 상한선: EBD 3종 + 인젝터블 2종

결정 기준 3가지:
  1. 타겟 층 분리 (3D Layering):
     SMAS(HIFU) + 심부 진피(RF) + 표피(피코/LaseMD) = 3종 OK
     ※ 같은 층 이중 타격 금지 (예: 울쎄라 + 슈링크 동일층)

  2. 총 열에너지 누적량 (Thermal Load):
     강한 열 시술 2~3개 초과 시 화상/부종/볼패임 위험
     ※ Genius(침습 MN-RF)는 울쎄라+써마지와 같은 날 금지 (열 임계점 초과)
     ※ CO2 프락셔널도 동일 (표피 손상 + 열 중첩)

  3. 수면마취 시간 한계:
     안전한 수면마취 유지: 1시간~1시간 30분
     국소마취제(리도카인) 인체 허용 한계 존재
     → 이 시간 내에 물리적으로 완료 가능한 한계 = EBD 2~3종 + 인젝터블 1~2종

실제 한국 현장 Full Package 구성:
  Core 1 (SMAS): HIFU 리프팅 (울쎄라 600샷)
  Core 2 (Dermis): RF 타이트닝 (써마지 FLX 600샷)
  Surface (Epidermis): 가벼운 피코 토닝 또는 LaseMD
  Injection 1: 스킨부스터 (리쥬란 또는 쥬베룩)
  Injection 2: 보톡스/소량 필러
  Aftercare: LDM + 진정 마스크

⚠️ 이 한계를 초과하여 날짜 분리가 필요한 경우:
  - 위 세팅 + Reepot(흑자) → 날짜 분리 (듀오덤 + 열 중첩)
  - 위 세팅 + Genius(침습 MN-RF) → 최소 2~4주 분리 (진피 하부 과도한 열상)
  - 위 세팅 + CO2 프락셔널 → 날짜 분리 (표피 손상 중첩)
```

## 예시 시퀀스 (AI 참조용)

```
[사례 1] 장기 10일 + 하안부 처짐 + 흑자 + 프리미엄

  Day 1 (복합 시술일):
    ① Ulthera (SMAS 리프팅) — 하안부 집중
    ② Thermage FLX (진피 타이트닝) — 전체 얼굴
    ③ Reepot VSLS (흑자 제거) — 듀오덤 부착 시작

  Day 10 (출국 전날):
    ④ 듀오덤 제거 + 상태 확인
    ⑤ Healite II (LED 재생)
    ⑥ 엑소좀 도포 (진정)

  예상 비용: ₩4,000,000~6,000,000


[사례 2] 초단기 3일 + 중안부 볼륨 + 건조 + 무통 선호

  Day 1 (단일 시술일):
    ① Sofwave (볼패임 위험 없는 리프팅)
    ② Volnewmer (무통 RF 타이트닝)
    ③ Juvelook Volume (캐뉼라, 볼륨 복원)
    ④ Skinvive (수분 부스터)
    ※ 딱지/듀오덤 필요한 시술 전부 제외

  예상 비용: ₩2,000,000~3,000,000


[사례 3] 중기 7일 + 기미 + 모공 + 가성비 + Fitz III

  Day 1:
    ① Sylfirm X PW모드 (기미 기저막 치료)
    ② LaseMD Ultra (모공/톤 개선)

  Day 5 (2차 방문):
    ③ Q-switched 1064nm 토닝 (기미 유지)
    ④ NCTF 스킨부스터 (수분/영양)

  예상 비용: ₩800,000~1,500,000
```

### ⚠️ Narabo 검수 포인트
```
[ ] 시퀀스 원칙 4가지가 임상적으로 정확한가?
[ ] "같은 층 이중 타격 금지" 원칙에 예외가 있는가?
[ ] 색소 치료와 리프팅 사이 3~5일 간격이 적절한가?
[ ] 예시 시퀀스의 예상 비용이 현실적인가? (2026년 한국 기준)
[ ] 누락된 중요한 시퀀스 사례가 있는가?
    (예: 여드름 흉터 집중, 안티에이징 콤보 등)
[ ] 인젝터블 + 에너지 시술 동시 시행의 순서가 정확한가?
    (에너지 먼저? 인젝터블 먼저?)
```

---

# 문서 상태 및 다음 단계

## 검수 현황

| 섹션 | 초안 | NotebookLM | Narabo 검수 | Founding Partner |
|------|------|-----------|-----------|---------------------|
| §1 DEMOGRAPHIC | ✅ | — | ⬜ | — |
| §2 OPEN_TEXT | ✅ | — | ⬜ | — |
| §3 SMART_CHIPS | ✅ | — | ⬜ | — |
| §4 BRANCH_SKIN_PROFILE | ✅ | ✅ 보강 | ⬜ | ⬜ |
| §5 BRANCH_PAST_HISTORY | ✅ | ✅ 검증 | ⬜ | ⬜ |
| §6 BRANCH_VISIT_PLAN | ✅ | ✅ 매트릭스 | ⬜ | ⬜ |
| §7 BRANCH_ADVERSE | ✅ | ✅ 검증 | ⬜ | ⬜ |
| §8 PREFERENCES | ✅ | ✅ 세그먼트 | ⬜ | ⬜ |
| §9 SAFETY_CHECKPOINT | ✅ | ✅ 11종 확장 | ⬜ | ⬜ |
| §10 장비 매핑 테이블 | ✅ | ✅ 32종 스펙 | ⬜ | ⬜ |
| §11 시퀀스 생성 규칙 | ✅ | ✅ 8사례 | ⬜ | ⬜ |
| 부록 A 장비 스펙 | 🆕 | ✅ | ⬜ | ⬜ |
| 부록 B 시퀀스 사례 | 🆕 | ✅ | ⬜ | ⬜ |
| 부록 C 홈케어 가이드 | 🆕 | ✅ | ⬜ | ⬜ |

## 다음 단계

1. **Narabo 검수**: NotebookLM 데이터가 반영된 각 섹션 + 부록을 검토
2. **4개국어 번역**: KO 확정 후 EN/JP/ZH-CN (Phase 1)
3. **Founding Partner 검수**: 임상 정확성 확인 (Phase 2 전)
4. **V4 주석은 이미 완료** — 추가 주석 불필요

---

# 부록 A. 장비 32종 통합 스펙 테이블 (NotebookLM Block 1 + SecretRF/VirtueRF 추가)

> 이 테이블은 §10 장비 매핑 테이블의 근거 데이터이자, DeviceWiki(V4 §8)의 seed 데이터로 사용된다.
> 🆕 No.31 SecretRF, No.32 VirtueRF 추가 (Narabo 피드백 반영)

```
No | 장비명              | 메커니즘           | 타겟층         | 통증 | 다운타임 | 효과유지  | 간격      | 회차  | Fitz제한     | 가격(₩)
───┼────────────────────┼──────────────────┼──────────────┼─────┼────────┼────────┼──────────┼──────┼────────────┼───────────
 1 | Ultherapy          | HIFU              | SMAS/심부진피 | 4-5 | 1~3일  | 1년     | 6~12개월 | 1회  | 제한없음    | 100~150만
 2 | Thermage FLX       | Monopolar RF      | 진피 전층     | 3-4 | 0~1일  | 1년     | 6~12개월 | 1회  | 제한없음    | 150~200만
 3 | Sofwave            | SUPERB 병렬초음파 | 진피 중간1.5mm| 2-3 | 0일    | 1년     | 6~12개월 | 1-2회| 제한없음    | 100~150만
 4 | Shrink Universe    | HIFU              | SMAS/심부진피 | 2-3 | 0~1일  | 3~6개월 | 1~3개월  | 3회  | 제한없음    | 20~30만
 5 | InMode Forma       | Multi-polar RF    | 표피~진피상층 | 1   | 0일    | 1~3개월 | 2~4주    | 3-5회| 제한없음    | 10~20만
 6 | InMode Mini FX     | Bipolar RF+HV     | 피하지방      | 3   | 1~3일  | 3~6개월 | 2~4주    | 3회  | 제한없음    | 10~20만
 7 | Morpheus8          | MN-RF             | 진피하부~피하 | 4-5 | 1~3일  | 6~12개월| 4주      | 3회  | IV-VI주의   | 60~100만
 8 | Volnewmer          | Monopolar RF(수랭)| 진피 전층     | 1   | 0일    | 6~12개월| 6~12개월 | 1-2회| 제한없음    | 50~90만
 9 | Oligio             | Monopolar RF(가스) | 진피 전층     | 2-3 | 0~1일  | 3~6개월 | 1~3개월  | 3회  | 제한없음    | 10~40만
10 | Titanium           | 3파장 다이오드    | 지지인대/진피 | 1-2 | 0일    | 3~6개월 | 3~4주    | 3-5회| IV-VI주의   | 40~60만
11 | Genius             | MN-RF(임피던스FB) | 진피전층/하부 | 5   | 2~5일  | 1년+    | 4주      | 3회+ | 제한없음    | 60~100만+
12 | Potenza            | MN-RF(펌핑약물)   | 진피층        | 3-4 | 1~3일  | 6개월   | 3~4주    | 3회+ | 제한없음    | 30~50만
13 | Sylfirm X          | MN-RF(PW/CW)     | 기저막/진피상 | 2   | 0~1일  | 3~6개월 | 2~4주    | 3-5회| 제한없음    | 20~30만
14 | PicoSure Pro       | 755nm 피코초      | 표피/진피상   | 2   | 0~1일  | 3~6개월 | 2~4주    | 3-5회| IV-VI주의   | 15~30만
15 | PicoPlus           | 1064/532nm 피코   | 표피/진피전층 | 2   | 0~1일  | 3~6개월 | 1~2주    | 5-10회| 532nm주의  | 5~15만
16 | Reepot VSLS        | 532nm Nd:YAG      | 표피 기저(흑자)| 3   | 7~14일 | 반영구  | 1회완치  | 1회  | 안전(VSLS) | 50~100만+
17 | Hollywood Spectra  | 1064nm Q-switched | 표피/진피전   | 1-2 | 0일    | 3~6개월 | 1~2주    | 5-10회| 제한없음   | 5~15만
18 | BBL HERO           | 광대역IPL         | 표피/얕은혈관 | 2   | 0~1일  | 3~6개월 | 3~4주    | 3-5회| IV-VI금기  | 15~30만
19 | LaseMD Ultra       | 1927nm 툴륨프락셔널| 표피/진피상   | 3   | 3~7일  | 3~6개월 | 2~4주    | 3-5회| IV-VI에너지↓| 20~40만
20 | CO2 Fractional     | 10600nm 박피      | 표피~진피심부 | 5   | 7~14일 | 1년+    | 6~8주    | 3회+ | IV-VI PIH高| 5~10만
21 | DermaV             | 532/1064nm 롱펄스 | 혈관/진피전   | 3   | 1~3일  | 6개월   | 4주      | 3-5회| 532nm주의  | 15~30만
22 | Quadessy           | Hybrid MN-RF      | 진피전/피지선 | 2-3 | 1~3일  | 6~12개월| 3~4주    | 3회  | 제한없음    | 20~40만
23 | Emface             | HIFES+Sync RF     | 안면근육/진피 | 1   | 0일    | 6~12개월| 1~2주    | 4회  | 제한없음    | 100~150만
24 | Healite II         | 830/590nm LLLT    | 세포단위재생  | 0   | 0일    | 일시적  | 수시     | 지속 | 제한없음    | 1~3만
25 | Juvelook Volume    | PDLLA 생체자극제  | 피하/진피하부 | 2-3 | 1~3일  | 1~2년   | 4~6주    | 3회  | 해당없음    | 50~70만
26 | Rejuran Healer     | PN(폴리뉴클레오타이드)| 진피층     | 4-5 | 1~3일  | 3~6개월 | 3~4주    | 3회  | 해당없음    | 20~30만
27 | Sculptra           | PLLA 생체자극제   | 피하지방층    | 2-3 | 1~3일  | 2년+    | 4~6주    | 3회  | 해당없음    | 50~70만
28 | Ellanse            | PCL 생체자극제    | 피하지방층    | 2-3 | 1~3일  | 2년+    | 1회      | 1회  | 해당없음    | 70~100만+
29 | Exosome ASCE+      | 세포배양액/줄기세포| 진피상(도포)  | 1-2 | 0~1일  | 3~6개월 | 2~4주    | 3-5회| 해당없음    | 20~30만
30 | NCTF/Skinvive      | HA칵테일          | 진피층        | 2-3 | 0~1일  | 3~6개월 | 3~4주    | 3회  | 해당없음    | 30~50만
31 | 🆕 Secret RF       | 침습 MN-RF        | 진피층        | 3-4 | 1~3일  | 3~6개월 | 3~4주    | 3회+ | IV-VI PIH주의| 10~20만
32 | 🆕 Virtue RF       | MN-RF(Sub-pulse)  | 진피층        | 2-3 | 1~2일  | 3~6개월 | 3~4주    | 3회+ | IV-VI PIH주의| 20~40만
```

### 핵심 장비 간 임상적 차이 (NotebookLM 심층 분석)

```
1. Sofwave는 HIFU가 아니다:
   - SUPERB™ 기술 = 원통형 평행 초음파빔 → 정확히 1.5mm 진피 중간층만 타겟
   - 피하 지방층에 열이 도달하지 않음 → 해부학적으로 볼패임 불가
   - 따라서 §10 매핑에서 "볼륨 재건 시 HIFU 제외"에서 Sofwave는 예외

2. Genius vs Potenza:
   - Genius: 1ms 실시간 임피던스 피드백(PID 제어), 통증 5점, 깊은 흉터/강력 리프팅
   - Potenza: 임피던스 피드백 없음(Peak Power), 통증 3~4점, 펌핑팁 약물전달 특화
   
3. Sylfirm X CW vs PW:
   - CW: 열에너지 지속 → 콜라겐 수축 → 리프팅/흉터
   - PW: 마이크로펄스 → 열 없이 기저막 복원 + 비정상 모세혈관 응고 → 기미 안전 치료

4. Volnewmer vs Thermage:
   - 동일 6.78MHz 단극성 RF, 동일 진피 체적 가열
   - 차이: 수랭식(Volnewmer) vs 가스 냉매(Thermage) → 통증 획기적 감소("Pain-free")
   - 가성비: 써마지 대비 30~40% 저렴

🆕 5. MN-RF 4종 포지셔닝 비교 (Genius / Potenza / Secret RF / Virtue RF):

  | 항목          | Genius         | Potenza        | Secret RF      | Virtue RF      |
  |---------------|----------------|----------------|----------------|----------------|
  | 포지셔닝       | 프리미엄       | 약물전달 특화    | 가성비(1세대)   | 가성비(저통증)  |
  | 임피던스 FB    | ✅ 실시간 PID  | ❌ Peak Power  | ❌ 없음        | ❌ 없음        |
  | 펌핑팁(LADD)  | ❌ 없음        | ✅ 음압 약물전달 | ❌ 없음        | ❌ 없음        |
  | 통증(1-5)     | 5 (매우 강함)  | 3-4            | 3-4            | 2-3 (Sub-pulse)|
  | 다운타임       | 2~5일         | 1~3일          | 1~3일          | 1~2일          |
  | 핵심 적응증    | 깊은 흉터, 강력 리프팅 | 모공+약물 병행  | 모공/복합(범용) | 모공/결(저자극) |
  | 세그먼트       | VIP           | PREMIUM        | BUDGET         | BUDGET~PREMIUM |
  | 가격(₩)       | 60~100만+     | 30~50만        | 10~20만        | 20~40만        |

  선택 가이드:
  - 깊은 흉터 + 강력 효과 + 비용 무관 → Genius
  - 모공 + 스킨부스터 병행 → Potenza (펌핑팁)
  - 가성비 모공/흉터 입문 → Secret RF
  - 통증 민감 + 짧은 다운타임 → Virtue RF (Sub-pulse 분산)
  - PIH 이력 + 기미 → Potenza(저에너지) 또는 Virtue RF (열 분산으로 안전)
```

---

# 부록 B. 시술 시퀀스 추가 사례 (NotebookLM Block 7 + Narabo 마지막날 전략)

> 기존 3사례(§11)에 5사례 추가 + 국내 환자 3주기 시퀀스

```
[사례 4] 단기 5일 + 여드름 흉터 + 모공 + 통증 OK + Fitz III

  Day 1:
    ① Genius (강한 MN-RF — 깊은 흉터 타겟)
    ② 쥬베룩 스킨 (LADD 펌핑 — 미세 채널 5분 내 주입)
    ③ 크라이오 진정
  Day 4:
    ④ 재생 관리 (LDM + Healite II LED)
  ※ Fitz III → 지니어스 후 PIH 주의, 시술 후 딱지 상태로 출국
  비용: 110~170만 원


[사례 5] 중기 10일 + 전체 안티에이징 + 프리미엄

  Day 1:
    ① Ulthera (하안부 윤곽 SMAS)
    ② Thermage FLX (전체 타이트닝)
    ③ PicoSure Pro (표피 무손상 색소/텍스처)
    ④ Re2O 또는 Profhilo (프리미엄 부스터)
    ※ 수면 마취 동반 일반적
  Day 9:
    ⑤ 최종 점검 + LDM 보습 + Exosome ASCE+ (회복 가속)
  비용: 400~600만 원


[사례 6] 초단기 2일 + 기미 집중 + 무통 + 가성비

  Day 1:
    ① Sylfirm X PW모드 (기저막 복원)
    ② Hollywood Spectra 저출력 토닝
    ③ 일반 물광주사 (MTS 얕은 주입)
  ※ 기미는 단발성 치료 어려움 → 본국 트라넥삼산(TA) 홈케어 안내 필수
  비용: 30~50만 원


[사례 7] 장기 2주 + 심한 처짐 + 볼패임 + 흑자 다수 + 프리미엄

  Day 1:
    ① Sofwave (볼패임 없는 리프팅 — HIFU 대신)
    ② Reepot VSLS (흑자 완치 → 듀오덤 시작)
    ③ Sculptra (관자놀이/볼 패임 볼륨)
  Day 14:
    ④ 듀오덤 제거 + 흑자 확인 + 재생 LED
  ※ 볼패임 위험으로 울쎄라 절대 금기 → Sofwave 대체
  비용: 250~400만 원


[사례 8] 단기 4일 + 주근깨 + 건조/홍조 + 가성비 + Fitz II

  Day 1:
    ① BBL HERO (주근깨+홍조 동시 — Fitz II라 안전)
    ② LaseMD Ultra (미세 채널)
    ③ NCTF 샤넬 앰플 도포 (건조 개선)
  Day 3:
    ④ 크라이오셀 + 모델링 마스크 (진정)
  ※ BBL 후 미세 커피가루 딱지 → 화장으로 커버 가능
  비용: 60~100만 원
```

### 🆕 마지막날 전략 적용 사례

```
[사례 9] 초단기 3일 + 흑자 + 리프팅 + 럭셔리 + Fitz III

  Day 1: 
    ① Sofwave (리프팅 — 다운타임 0)
    ② Volnewmer (타이트닝 — 무통, 다운타임 0)
  Day 3 (마지막날):
    ③ Reepot VSLS (흑자 완치 — 듀오덤 부착)
    → 듀오덤 붙인 채 출국
    → 본국 사후관리 가이드 제공 (듀오덤 14일 유지, 교체법)
  비용: 200~350만 원
```

### 국내 환자(Local) 주기별 시퀀스

```
A. 2주 주기 (리프팅 중심):
  1회: InMode (Mini FX + Forma)
  2회(2주후): LDM + 보톡스 (턱선/스킨)
  3회(4주후): InMode 반복
  4회(6주후): Oligio 300샷 (진피 유지)

B. 4주 주기 (색소 중심):
  1회: Pico Toning + Sylfirm X + 비타민C 이온토포레시스
  2회(4주후): Pico Toning + LaseMD Ultra + Exosome
  3회(8주후): Pico Toning + LDM 보습

C. 8주 주기 (종합 안티에이징):
  1회: Thermage FLX (또는 Volnewmer) + Rejuran Healer
  2회(8주후): Juvelook Volume + 슈링크 유니버스
  3회(16주후): Juvelook Volume 2차 + PicoSure Pro
```

---

# 부록 C. 시술 후 글로벌 홈케어 가이드 (NotebookLM Block 7)

> 이 가이드는 리포트의 HomecareSection(V4 §4 Depth 1)에 표시되는 내용의 원본이다.

```
🗓️ 시술 당일 (Day 0):
  - 세안: 에너지/레이저 시술 후 세안 가능. 
    단, 주사/MN-RF로 미세 채널이 뚫린 경우 3~4시간 물세안 금지.
  - 화장: 가급적 다음날부터.
  - 열감: RF 시술 후 열감은 콜라겐 재생의 신호. 당일 얼음찜질 금지.

🗓️ 시술 후 1주일 (Day 1~7):
  - 열 발생 금지: 심한 운동, 사우나, 찜질방, 음주, 흡연 1주일 금지.
  - 건조함 관리: 재생 크림 하루 3~4번 두껍게 덧바르기.

🧴 필수 스킨케어:
  - 자외선 차단제: SPF 30~50, PA+++ 이상, 2~3시간마다 재도포 (실내 포함)
  - 재생 크림: 세라마이드, EGF, 마데카소사이드 함유 장벽 강화 크림
  - 금지 성분 (1주일): 레티놀, 비타민 C, AHA/BHA

🩺 시술별 특수 홈케어:
  - Reepot/강한 색소 레이저: 듀오덤 14일 유지, 진물 나도 중간에 떼지 말기
  - 프락셔널/Genius: 3~4일차 미세 딱지 → 문지르지 말기, 보습제로 자연 탈락 유도 (7일)
  - 기미 치료: 하이드로퀴논 4% 연고 → 피부 회복 후 밤에만 국소 얇게
```
