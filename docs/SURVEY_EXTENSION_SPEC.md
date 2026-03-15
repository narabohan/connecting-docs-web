# ConnectingDocs.ai — Survey Extension Specification (Phase 2)
> 작성일: 2026-03-12 | 작성: [전략] Window A
> Purpose: Phase 2 설문 확장 — 신규 질문 5종 + i18n + 조건부 노출 로직 + 컴포넌트 설계
> 참조: TREATMENT_PLAN_PROMPT.md, PHASE2_MASTER_PLAN.md
> 📊 데이터 참조: 외국인환자_데이터_v5 (CDJ 채널), 플랫폼 트렌드 리포트 (고민 카테고리 검증), 의료뷰티 컨셉 조사 (SQ8 고민 분류)

---

## 1. 설문 플로우 변경

### 현재 (Phase 0)
```
Demographics → Open → Chips → Safety → Messenger → Analyzing
(6 steps)
```

### Phase 2 확장
```
Demographics → Open → Chips → Safety → Budget → [Stay/Frequency/Event] → Messenger → Analyzing
(7~9 steps — 조건부)
```

### 조건부 Step 노출 로직

```typescript
// Step 순서 결정 로직
function getStepOrder(country: string, budgetType: string): string[] {
  const base = ['demographics', 'open', 'chips', 'safety', 'budget'];

  if (country !== 'KR') {
    // 외국인: 체류 기간 질문
    base.push('stay_duration');
  } else {
    // 한국인: 관리 빈도 질문
    base.push('management_frequency');
  }

  // 이벤트는 모든 환자에게 선택적으로 노출
  base.push('event_optional');

  base.push('messenger', 'analyzing');
  return base;
}
```

---

## 2. 신규 질문 상세 설계

### 2-1. Budget 질문 (전체 환자 — 필수)

#### 컴포넌트: `BudgetStep.tsx`

**한국 환자 UI:**
```
┌──────────────────────────────────────────────┐
│                                                │
│  💰 나에게 맞는 피부 관리 투자 범위는?         │
│                                                │
│  ┌─────────────────────────────────────┐      │
│  │  🌱 월 30만원 이하                   │      │
│  │  가벼운 정기 관리                    │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  ✨ 월 30~70만원                     │      │
│  │  정기 관리 + 집중 시술               │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  💎 월 70~150만원                    │      │
│  │  프리미엄 맞춤 관리                  │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  👑 월 150만원 이상                  │      │
│  │  VIP 종합 관리                       │      │
│  └─────────────────────────────────────┘      │
│                                                │
│  ─ 또는 ─                                     │
│                                                │
│  ┌─────────────────────────────────────┐      │
│  │  📝 1회 시술 기준으로 알려주세요      │      │
│  └─────────────────────────────────────┘      │
│                                                │
│  (선택 시 별도 1회 기준 범위 표시)              │
│                                                │
└──────────────────────────────────────────────┘
```

**1회 기준 (한국) 서브옵션:**
- ₩10만원 이하
- ₩10~30만원
- ₩30~70만원
- ₩70~150만원
- ₩150만원 이상

**외국인 환자 UI:**
```
┌──────────────────────────────────────────────┐
│                                                │
│  💰 What's your budget for this visit?         │
│                                                │
│  ┌─────────────────────────────────────┐      │
│  │  🌱 Under $500                       │      │
│  │  Light care — booster + essentials   │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  ✨ $500 ~ $1,500                    │      │
│  │  Standard package — 2-3 procedures   │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  💎 $1,500 ~ $3,000                  │      │
│  │  Premium — full treatment plan       │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  👑 $3,000+                          │      │
│  │  VIP comprehensive care              │      │
│  └─────────────────────────────────────┘      │
│                                                │
└──────────────────────────────────────────────┘
```

#### i18n 텍스트

```typescript
const BUDGET_I18N = {
  KO: {
    title: '나에게 맞는 피부 관리 투자 범위는?',
    subtitle: '정확한 금액이 아니어도 괜찮아요. 대략적인 범위를 알려주세요.',
    options: {
      light: { label: '월 30만원 이하', desc: '가벼운 정기 관리' },
      standard: { label: '월 30~70만원', desc: '정기 관리 + 집중 시술' },
      premium: { label: '월 70~150만원', desc: '프리미엄 맞춤 관리' },
      vip: { label: '월 150만원 이상', desc: 'VIP 종합 관리' },
    },
    per_session_toggle: '1회 시술 기준으로 알려주세요',
    per_session_options: {
      light: '₩10만원 이하',
      standard: '₩10~30만원',
      premium: '₩30~70만원',
      luxury: '₩70~150만원',
      ultra: '₩150만원 이상',
    },
  },
  EN: {
    title: "What's your budget for this visit?",
    subtitle: "An approximate range is fine — this helps us tailor your plan.",
    options: {
      light: { label: 'Under $500', desc: 'Light care — booster + essentials' },
      standard: { label: '$500 ~ $1,500', desc: 'Standard package — 2-3 procedures' },
      premium: { label: '$1,500 ~ $3,000', desc: 'Premium — full treatment plan' },
      vip: { label: '$3,000+', desc: 'VIP comprehensive care' },
    },
  },
  JA: {
    title: 'ご予算の目安を教えてください',
    subtitle: '大まかな範囲で結構です。最適なプランをご提案します。',
    options: {
      light: { label: '5万円以下', desc: 'ライトケア' },
      standard: { label: '5~15万円', desc: 'スタンダード' },
      premium: { label: '15~30万円', desc: 'プレミアム' },
      vip: { label: '30万円以上', desc: 'VIP総合ケア' },
    },
  },
  ZH_CN: {
    title: '您的预算范围是？',
    subtitle: '大概范围即可，帮助我们为您定制最佳方案。',
    options: {
      light: { label: '3000元以下', desc: '轻护理' },
      standard: { label: '3000~10000元', desc: '标准套餐' },
      premium: { label: '10000~20000元', desc: '高端定制' },
      vip: { label: '20000元以上', desc: 'VIP综合护理' },
    },
  },
};
```

#### 데이터 타입

```typescript
type BudgetRange = 'light' | 'standard' | 'premium' | 'vip';
type BudgetType = 'monthly' | 'per_visit' | 'per_session';

interface BudgetSelection {
  range: BudgetRange;
  type: BudgetType;
}
```

---

### 2-2. Stay Duration 질문 (외국인만 — 조건부 필수)

#### 컴포넌트: `StayDurationStep.tsx`

**표시 조건:** `patient.country !== 'KR'`

```
┌──────────────────────────────────────────────┐
│                                                │
│  🛫 How long will you be in Korea?             │
│                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  3-4 days │ │  5-6 days │ │   7 days  │     │
│  └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 10-14 days│ │  2+ weeks │ │ Not sure  │     │
│  └──────────┘ └──────────┘ └──────────┘      │
│                                                │
│  💡 We'll design your treatment schedule       │
│     around your stay                           │
│                                                │
└──────────────────────────────────────────────┘
```

#### i18n 텍스트

```typescript
const STAY_DURATION_I18N = {
  EN: {
    title: 'How long will you be in Korea?',
    subtitle: "We'll design your treatment schedule around your stay.",
    options: [
      { value: 4, label: '3-4 days' },
      { value: 6, label: '5-6 days' },
      { value: 7, label: '7 days' },
      { value: 14, label: '10-14 days' },
      { value: 21, label: '2+ weeks' },
      { value: 0, label: 'Not sure yet' },
    ],
  },
  JA: {
    title: '韓国滞在期間はどのくらいですか？',
    subtitle: '滞在スケジュールに合わせた施術プランをご提案します。',
    options: [
      { value: 4, label: '3〜4日' },
      { value: 6, label: '5〜6日' },
      { value: 7, label: '7日' },
      { value: 14, label: '10〜14日' },
      { value: 21, label: '2週間以上' },
      { value: 0, label: 'まだ未定' },
    ],
  },
  ZH_CN: {
    title: '您在韩国停留多长时间？',
    subtitle: '我们会根据您的行程安排最佳治疗计划。',
    options: [
      { value: 4, label: '3-4天' },
      { value: 6, label: '5-6天' },
      { value: 7, label: '7天' },
      { value: 14, label: '10-14天' },
      { value: 21, label: '2周以上' },
      { value: 0, label: '还没确定' },
    ],
  },
};
```

#### 데이터 타입
```typescript
interface StayDuration {
  days: number;  // 0 = not sure
}
```

---

### 2-3. Management Frequency 질문 (한국만 — 조건부 필수)

#### 컴포넌트: `ManagementFrequencyStep.tsx`

**표시 조건:** `patient.country === 'KR'`

```
┌──────────────────────────────────────────────┐
│                                                │
│  📅 선호하는 관리 주기는?                       │
│                                                │
│  ┌─────────────────────────────────────┐      │
│  │  📆 월 1~2회 정기 관리               │      │
│  │  꾸준한 유지 + 점진적 개선            │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  📋 분기 1~2회 집중 관리              │      │
│  │  시즌별 집중 시술                     │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │  🎯 1회 시술 후 경과 관찰             │      │
│  │  큰 시술 1회 + 경과 확인              │      │
│  └─────────────────────────────────────┘      │
│                                                │
└──────────────────────────────────────────────┘
```

#### 데이터 타입
```typescript
type ManagementFrequency = 'monthly' | 'quarterly' | 'once';
```

---

### 2-4. Event 질문 (전체 — 선택)

#### 컴포넌트: `EventStep.tsx` (또는 Budget Step 하단에 토글)

**노출 방식:** Budget Step 하단에 "특별한 일정이 있으신가요?" 토글로 노출.
선택하면 이벤트 타입 + 날짜 입력 UI 확장.

```
┌──────────────────────────────────────────────┐
│                                                │
│  📌 특별한 일정이 있으신가요? (선택)            │
│                                                │
│  ┌───────────┐ ┌───────────┐                  │
│  │  💍 결혼   │ │  💼 면접   │                  │
│  └───────────┘ └───────────┘                  │
│  ┌───────────┐ ┌───────────┐                  │
│  │  📸 촬영   │ │  🎉 행사   │                  │
│  └───────────┘ └───────────┘                  │
│                                                │
│  📅 일정: [날짜 선택기]                         │
│                                                │
│  💡 일정에 맞춰 시술 타이밍을 조절해 드립니다    │
│                                                │
└──────────────────────────────────────────────┘
```

#### i18n
```typescript
const EVENT_I18N = {
  KO: {
    toggle: '특별한 일정이 있으신가요?',
    types: {
      wedding: '💍 결혼',
      interview: '💼 면접',
      photoshoot: '📸 촬영',
      reunion: '🎉 행사/모임',
      other: '📌 기타',
    },
    date_label: '일정',
    hint: '일정에 맞춰 시술 타이밍을 조절해 드립니다',
  },
  EN: {
    toggle: 'Do you have a special occasion coming up?',
    types: {
      wedding: '💍 Wedding',
      interview: '💼 Interview',
      photoshoot: '📸 Photoshoot',
      reunion: '🎉 Event/Reunion',
      other: '📌 Other',
    },
    date_label: 'Date',
    hint: "We'll time your treatments to look your best on the day",
  },
  JA: {
    toggle: '特別な予定はありますか？',
    types: {
      wedding: '💍 結婚式',
      interview: '💼 面接',
      photoshoot: '📸 撮影',
      reunion: '🎉 イベント',
      other: '📌 その他',
    },
    date_label: '日程',
    hint: 'イベントに合わせた最適なタイミングでご提案します',
  },
  ZH_CN: {
    toggle: '您有什么特别的日程安排吗？',
    types: {
      wedding: '💍 婚礼',
      interview: '💼 面试',
      photoshoot: '📸 拍摄',
      reunion: '🎉 聚会/活动',
      other: '📌 其他',
    },
    date_label: '日期',
    hint: '我们会根据您的日程安排最佳治疗时间',
  },
};
```

#### 데이터 타입
```typescript
interface EventInfo {
  type: 'wedding' | 'interview' | 'photoshoot' | 'reunion' | 'other';
  date: string;  // ISO date YYYY-MM-DD
  description?: string;  // type=other 일 때
}
```

---

### 2-5. Location 질문 (전체 — 선택, Phase 3 사전 수집)

> Phase 3 병원 매칭용 사전 데이터 수집. Phase 2에서는 저장만 하고 사용하지 않음.

#### 노출 방식: Messenger Step 또는 마지막에 가볍게 한 줄

```
"📍 선호하는 시술 지역이 있으신가요?" (선택)
[강남] [서초] [압구정/신사] [홍대/마포] [기타]
```

#### 데이터 타입
```typescript
interface LocationPreference {
  area?: string;  // "gangnam" | "seocho" | "apgujeong" | "hongdae" | "other"
  custom?: string;  // area=other 일 때
}
```

---

## 3. useSurveyV2.ts 확장 사항

### Step 배열 동적 생성

```typescript
// 현재
const STEPS = ['demographics', 'open', 'chips', 'safety', 'messenger', 'analyzing'];

// Phase 2
function buildSteps(country: string): string[] {
  const steps = ['demographics', 'open', 'chips', 'safety', 'budget'];

  if (country !== 'KR') {
    steps.push('stay_duration');
  } else {
    steps.push('management_frequency');
  }

  // event는 budget step 내 토글이므로 별도 step 불필요
  steps.push('messenger', 'analyzing');
  return steps;
}
```

### State 확장

```typescript
interface SurveyV2State {
  // ... 기존 필드 유지 ...

  // Phase 2 추가
  budget: BudgetSelection | null;
  stay_duration: number | null;          // 외국인만
  management_frequency: ManagementFrequency | null;  // KR만
  event_info: EventInfo | null;          // 선택
  location_preference: LocationPreference | null;  // 선택
}
```

### Airtable 저장 필드 추가

```typescript
// SurveyV2_Results 테이블에 추가할 필드
const PHASE2_AIRTABLE_FIELDS = {
  budget_range: 'string',        // 'light' | 'standard' | 'premium' | 'vip'
  budget_type: 'string',         // 'monthly' | 'per_visit' | 'per_session'
  stay_duration: 'number',       // 일수 (외국인만)
  management_frequency: 'string', // 'monthly' | 'quarterly' | 'once' (KR만)
  event_type: 'string',          // optional
  event_date: 'string',          // optional ISO date
  location_preference: 'string', // optional
};
```

---

## 4. 디자인 가이드라인

### 일관성 유지 원칙
- 기존 `DemographicStep`, `OpenQuestionStep`, `MessengerContactStep` 스타일 따름
- Framer Motion 애니메이션 동일 적용
- Tailwind 다크 테마 색상 유지
- 카드형 선택지 (기존 패턴)
- 모바일 우선 반응형

### 진행률 표시
- Step 수가 7~8개로 늘어나므로, 프로그레스 바 업데이트 필요
- 조건부 step 포함해 전체 step 수 동적 계산

### UX 고려사항
- Budget 질문은 민감할 수 있음 → "정확한 금액이 아니어도 괜찮아요" 문구 필수
- 외국인 체류 기간 "Not sure" 옵션 반드시 포함
- 이벤트 질문은 가볍게 — "선택" 명시, 강제하지 않음
- Location은 Phase 3 사전 수집이므로 최소한으로

---

## 5. final-recommendation.ts 입력 변경

```typescript
// 프롬프트에 전달할 Phase 2 데이터 (user_message 부분)
const phase2Context = `
BUDGET: ${budget.range} (${budget.type})
${stayDuration ? `STAY_DURATION: ${stayDuration} days` : ''}
${managementFrequency ? `MANAGEMENT_FREQUENCY: ${managementFrequency}` : ''}
${eventInfo ? `EVENT: ${eventInfo.type} on ${eventInfo.date}` : ''}
`;

// user_message에 기존 데이터 + phase2Context 추가
```

---

---

## 6. 외부 데이터 검증 참조 (📊 2026-03-12 추가)

### 6-1. Smart Chips 고민 카테고리 검증

현재 Chips 카테고리와 실데이터 크로스체크:

| 현재 Chips 카테고리 | 강남언니 고민검색 순위 | 의료뷰티 조사 SQ8 | 검증 결과 |
|---------------------|----------------------|-------------------|-----------|
| 피부 (tightening/texture) | #1 "피부" | 피부 고민 카테고리 존재 | ✅ 일치 — 최우선 유지 |
| 주름/탄력 (lifting) | 상위권 | 주름/탄력 상위 | ✅ 일치 |
| 색소/톤 (brightening) | 상위권 | 기미/잡티 상위 | ✅ 일치 |
| 여드름/흉터 (scar) | 상위권 | 여드름 관련 존재 | ✅ 일치 |
| 보톡스/주사 | #1 시술검색 "보톡스" | — | ⚠️ 시술 검색에서 #1이나 현재 고민 Chips에 미반영 → Phase 3 고려 |
| 쥬베룩 (biostimulator) | 강남언니 상승세 | — | ⚠️ 트렌드 상승 — trend_score 반영 필요 |

### 6-2. 연령대별 설문 응답 패턴 참조 (바비톡)

| 연령대 | 바비톡 실데이터 키워드 | 설문 응답 예상 패턴 | Chips 가중치 조정 |
|--------|----------------------|---------------------|-------------------|
| 10-20대 | 주사 키워드 이동 | 보톡스/스킨부스터 관심 | 가벼운 시술 Chips 우선 노출 |
| 20-30대 | 온다리프팅 관심 급증 | 리프팅+피부 관리 | 리프팅+토닝 Chips 강조 |
| 30대 | 울쎄라/실리프팅 지배적 | HIFU/리프팅 중심 | 고강도 리프팅 Chips 강조 |
| 40-50대 | 고강도+바디 시술 | 종합 관리 플랜 | 전체 카테고리 균등 |

### 6-3. CDJ 기반 메신저 매핑 검증 (외국인환자 데이터)

현재 MessengerContactStep의 국가별 기본 메신저가 CDJ 데이터와 일치하는지 확인:
- JP: LINE ✅ (CDJ 자유여행 상담 채널 = LINE)
- CN: WeChat ✅ (CDJ 자유여행 상담 채널 = WeChat)
- US: WhatsApp ✅ (CDJ 자유여행 = WhatsApp/Email)
- TW: LINE ✅ (CDJ 자유여행 = LINE)
- TH: LINE ✅ (CDJ 자유여행 = LINE)
- VN: Zalo ✅ (CDJ 자유여행 = Zalo)

→ 전체 국가 메신저 매핑이 CDJ 실데이터와 일치함

### 6-4. 브랜드 인지도 기반 Confidence 강화 (의료뷰티 컨셉 조사 500명)

500명 서베이 결과 중 ConnectingDocs 활용 가능 데이터:
- 8대 브랜드(InMode/Ulthera/Thermage/Oligio/Shurink/Volnewmer/V-RO/Liftera) 인지도/만족도/선호도
- 연령×피부타입별 교차분석 → EBD_Device 테이블 스코어 보정 근거
- 컨셉 테스트 3종(변함없는 광채/깨어나는 아름다움/언제나 스무 살) → 리포트 톤앤매너 참고
- 정보 습득 경로(SQ7) → 마케팅 채널 우선순위

---

*이 문서의 i18n 텍스트와 UI 스펙을 기반으로 [코드] B가 컴포넌트를 구현합니다.*
*[임상] C는 가격 범위 데이터를 확정한 후 Budget 옵션의 정확한 금액대를 검증해야 합니다.*
