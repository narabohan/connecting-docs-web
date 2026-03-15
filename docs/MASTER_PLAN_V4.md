# MASTER_PLAN_V4.md — ConnectingDocs.ai 최종 통합 마스터 플랜

> 작성일: 2026-03-15 | 작성: [전략] Window A
> 상태: **PM 승인 대기 — 승인 전 코드 구현 절대 금지**
> 범위: 비전 · 비즈니스 · 기술 · 수익 · 법률 · 인프라 · QA · 정부지원 · 경쟁분석 · 모바일을 **단일 문서에 완전 수록**
> 운영 주체: **Narabo (PM/기획/QA/영업) + Claude Code (개발 실행)** — 1인 운영 체제
> 선행 문서: plan.md (V1) → MASTER_PLAN_V2.md → MASTER_PLAN_V3.md → **본 문서 (V4 최종)**
> 원칙: **이 문서를 100% 검토·승인하기 전까지 어떠한 코드 구현도 허용하지 않는다.**
> 독립성: **V4는 자기 완결형(self-contained) 문서다. V1-V3을 참조할 필요 없이 본 문서만으로 모든 설계가 완성된다.**

---

## 목차

| 파트 | 섹션 | 주제 | V3 대비 변경 |
|------|------|------|------------|
| **I** | §0 | 비전 + 8대 원칙 + V3→V4 보강 맵 | 원칙 8개로 확장, 팀 구조 변경 |
| **II** | §1 | 경로 및 권한 분리 | V2 §1 완전 인라인 |
| **III** | §2 | 환자 가치 (진단·추천·플랜) | V2 §2 완전 인라인 |
| **IV** | §3 | 반응형 설문 State Machine | V2 §3 완전 인라인 |
| **V** | §4 | 점진적 정보 노출 (Depth) | V2 §4 완전 인라인 |
| **VI** | §5 | 의사 신뢰도 + 온보딩 + 🆕 매칭 알고리즘 | V2 §5 + V3 보강 + **§5.3 신규** |
| **VII** | §6 | CRM 여정 + 재방문 유도 + 🆕 자동화 강화 | V2 §6 + V3 §6.2 + **§6.2 보강** |
| **VIII** | §7 | 글로벌 소셜 로그인 | V2 §7 완전 인라인 |
| **IX** | §8 | 장비 위키 + Fit 분석 + 🆕 콘텐츠 파이프라인 | V2 §8 + **§8.5 신규** |
| **X** | §9 | 관리자 대시보드 | V2 §9 완전 인라인 |
| **XI** | §10 | 시스템 안정성 + 🆕 i18n 통합 + 🆕 성능 예산 | V2 §10 + V3 §10.5 + **§10.6, §10.7 신규** |
| **XII** | §11 | 수익 모델 + 🆕 Paywall 전환 + 🆕 B2B 가격 검증 | V3 §11 + **§11.6, §11.7 신규** |
| **XIII** | §12 | AI 비용 + 토큰 관리 | V3 §12 완전 인라인 |
| **XIV** | §13 | 글로벌 컴플라이언스 (PIPA/GDPR/APPI) | V3 §13 완전 인라인 |
| **XV** | §14 | 인프라 확장 + 🆕 CI/CD 파이프라인 | V3 §14 + **CI/CD 신규** |
| **XVI** | §15 | 테스트·QA + 에러 모니터링 | V3 §15 완전 인라인 |
| **XVII** | §16 | 기술적 취약점 해결 | V3 §16 완전 인라인 |
| **XVIII** | §17 | 🆕 1인 운영 통합 로드맵 (전면 재설계) | **전면 재설계** |
| **XIX** | §18 | 부록: 커버리지 매트릭스 + 기술 부채 원장 | V3 §18 확장 |
| **XX** | §19 | 🆕 예비창업패키지 (PSST) 통합 가이드 | **신규** |
| **XXI** | §20 | 🆕 모바일 / PWA 전략 | **신규** |
| **XXII** | §21 | 🆕 경쟁 분석 + TAM/SAM/SOM | **신규** |
| **XXIII** | §22 | 🆕 개발자 핸드오프 패키지 | **신규** |
| **XXIV** | §23 | 🆕 메인 페이지 전략적 리디자인 | **신규** |
| **XXV** | — | PM 승인 체크리스트 (28개 항목) | 16→28 확장 |
| **XXVI** | — | 자기 검증 체크리스트 (47개 항목) | **신규** |

---

# Part I. 비전

## §0. V3 → V4: 무엇이 달라지는가

### 0.1 V4의 존재 이유

V3는 수익·법률·인프라·QA·취약점 6개 축을 보강하여 사업 지속 가능성을 확보했다. 그러나 V3에는 **실행 가능성을 보장하는 5개 축**이 여전히 부재했다:

| 축 | V3 상태 | V4에서 추가 |
|----|---------|-----------|
| **팀**: 누가 실행하는가? | `[코드 B]` 팀 가정 | §0.3 + §17: Narabo + Claude Code 1인 운영 체제 |
| **정부지원**: 자금 조달은? | ❌ 미언급 | §19: 예비창업패키지(PSST) 통합 가이드 |
| **경쟁**: 시장에 누가 있는가? | ❌ 미언급 | §21: 경쟁 분석 + TAM/SAM/SOM |
| **모바일**: 모바일 사용자는? | ❌ 미언급 | §20: PWA 전략 |
| **핸드오프**: 팀 확장 시 인수인계는? | ❌ 미언급 | §22: 개발자 핸드오프 패키지 |

추가로, V3에서 설계만 하고 **세부 메커니즘이 빠진** 영역:

| 영역 | V3 상태 | V4에서 추가 |
|------|---------|-----------|
| 환자-의사 매칭 | "매칭 알림" 언급만 | §5.3 매칭 알고리즘 + 스코어링 수도코드 |
| 위키 콘텐츠 생산 | "Narabo가 입력" 언급만 | §8.5 AI 초안 → 검수 파이프라인 |
| i18n | 5곳에 산재 | §10.6 i18n 통합 전략 |
| 성능 예산 | "Lighthouse 90+" 언급만 | §10.7 FCP/LCP/CLS/JS 번들 수치 목표 |
| Paywall 전환 | "Phase 3에서 도입" 언급만 | §11.6 기존 무료 사용자 Grandfathering |
| B2B 가격 | "₩99K/₩299K/₩990K" 제시만 | §11.7 Van Westendorp 가격 검증 |
| CI/CD | ❌ 미언급 | §14.5 GitHub Actions + Preview Deploy |
| 메인 페이지 | ❌ 미언급 | §23 전략적 리디자인 |

### 0.2 V4 문서 독립성 선언

```
MASTER_PLAN_V4.md (본 문서) ← 자기 완결형
  │
  ├── §1-§10: V2 원문 완전 인라인 (+ V3 보강 인라인)
  │     (경로/권한, 환자 가치, 설문 SM, Depth, 의사, CRM, 소셜, 위키, 관리자, 안정성)
  │
  ├── §11-§16: V3 원문 완전 인라인
  │     (수익, AI 비용, 컴플라이언스, 인프라, QA, 취약점)
  │
  ├── §17: 1인 운영 로드맵 (전면 재설계)
  │
  ├── §18: 부록 (커버리지 매트릭스, 기술 부채 원장)
  │
  └── §19-§23: V4 신규
        (PSST, 모바일/PWA, 경쟁분석, 핸드오프, 메인 페이지)

⚠️ V1 (plan.md), V2, V3는 더 이상 참조할 필요 없음.
   본 문서가 모든 내용을 포함한다.
```

### 0.3 팀 구조 — 1인 운영 체제

**V3까지의 가정**: `[코드 B]` 별도 개발팀 존재
**V4 현실**: Narabo 1인이 PM/기획/QA/영업을 담당하고, Claude Code가 개발 실행을 맡는다.

```
┌─────────────────────────────────────────────────────────┐
│              ConnectingDocs 운영 체제                      │
│                                                          │
│  ┌──────────────────┐     ┌──────────────────────────┐  │
│  │    Narabo         │     │    Claude Code            │  │
│  │  (Human + PM)     │────▶│  (AI Dev Agent)           │  │
│  │                   │     │                           │  │
│  │  • 전략 기획      │     │  • 코드 구현              │  │
│  │  • UI/UX 검토     │     │  • 테스트 작성            │  │
│  │  • 임상 콘텐츠    │     │  • 버그 수정              │  │
│  │  • 의사 네트워크  │     │  • 리팩토링               │  │
│  │  • 사업 개발      │     │  • CI/CD 설정             │  │
│  │  • QA/검수        │     │  • 배포                   │  │
│  │  • 정부지원 신청  │     │                           │  │
│  └──────────────────┘     └──────────────────────────┘  │
│                                                          │
│  원칙:                                                   │
│  1. Narabo가 "무엇을"과 "왜"를 결정                       │
│  2. Claude Code가 "어떻게"를 실행                         │
│  3. 모든 코드는 Narabo가 검토 후 배포                      │
│  4. 1인 운영이므로 자동화 극대화 (CI/CD, 테스트, 모니터링)  │
│  5. 핸드오프 문서를 상시 최신화 (팀 확장 대비)              │
└─────────────────────────────────────────────────────────┘
```

**리소스 현실**:
- Narabo 가용 시간: 주 40h (풀타임 창업자)
  - 코드 검토/QA: ~10h/주
  - 사업 개발/영업: ~15h/주
  - 콘텐츠/임상: ~10h/주
  - 관리/행정: ~5h/주
- Claude Code: 제한 없음 (on-demand)
  - 단, 세션당 컨텍스트 제한 → 태스크 단위 명확 분리 필요

### 0.4 핵심 원칙 8가지

1. **기획 선행**: 100% 승인 전 코드 금지
2. **Actor 분리**: 환자·의사·관리자의 경로·데이터·UI 격리
3. **점진적 구축**: Phase 0→1→2→3→4 순차, Phase 0 미완료 시 이후 차단
4. **오염 방지**: Validator + CSS Scoping + Error Boundary + 최소 인터페이스
5. **데이터 영속성**: sessionStorage 탈피 → Airtable/Supabase CRM 중심
6. **수익 지속성**: 무료 체험 → 유료 전환 경로가 모든 기능에 내장
7. **법적 안전**: 글로벌 데이터 규제 준수가 아키텍처에 내재
8. **🆕 핸드오프 준비**: 코드·문서·프로세스가 항시 제3자 인수 가능 상태 유지

---

# Part II. 경로 및 권한 분리

## §1. 환자 · 의사 · 관리자 3-Actor 시스템

### 1.1 현행 코드 진단

현재 코드베이스에는 이미 기초적인 역할 분리가 존재한다:

| 현행 자산 | 파일 | 상태 |
|-----------|------|------|
| AuthContext (role: patient/doctor) | `src/context/AuthContext.tsx` | ✅ 동작, 단 admin role 미정의 |
| Firebase Auth (Google, GitHub, Email) | `src/lib/firebase.ts` | ✅ 동작, 소셜 확장 필요 |
| Doctor Guard (HOC) | `src/components/auth/ProtectedRoute.tsx` | ✅ withDoctorGuard 구현됨 |
| Doctor Dashboard | `src/components/dashboard/DoctorDashboard.tsx` | ✅ 기본 구현 |
| Patient Dashboard | `src/components/dashboard/PatientDashboard.tsx` | ✅ 기본 구현 |
| Admin Reports | `src/pages/admin/reports.tsx` | ⚠️ 인증 가드 미적용 |
| Auth Modal | `src/components/auth/AuthModal.tsx` | ✅ 동작 |
| Role Switcher | `src/components/auth/RoleSwitcher.tsx` | ⚠️ 데모용 (프로덕션 부적합) |

### 1.2 목표 아키텍처 — 3-Actor 라우팅

```
URL 구조:
  /                          ← 랜딩 (비인증 접근 가능)
  /survey-v2                 ← 설문 (비인증도 가능, 리포트 저장 시 가입 유도)
  /report-v2/[id]            ← 리포트 (비인증 열람 가능, 풀 기능은 로그인 필요)

  /patient/                  ← 환자 전용 영역 (🔒 patient role)
  /patient/dashboard         ← 환자 대시보드 (치료 여정)
  /patient/reports           ← 내 리포트 목록
  /patient/feedback/[id]     ← 시술 피드백

  /doctor/                   ← 의사 전용 영역 (🔒 doctor role)
  /doctor/dashboard          ← 의사 대시보드 (매칭, 상담)
  /doctor/patient/[id]       ← 환자 상세 (리포트 + 임상 메모)
  /doctor/onboarding         ← 의사 온보딩
  /doctor/waitlist           ← 대기 환자 목록

  /admin/                    ← 관리자 영역 (🔒 admin role)
  /admin/dashboard           ← 관리자 대시보드
  /admin/reports             ← 전체 리포트 통계
  /admin/content             ← 홈페이지 콘텐츠 관리

  /wiki/                     ← 장비 위키 (비인증 열람 가능)
  /wiki/device/[slug]        ← 장비 상세
  /wiki/injectable/[slug]    ← 인젝터블 상세
```

### 1.3 권한 가드 설계

**접근방식**: 현행 `withDoctorGuard` HOC 패턴을 확장하여 범용 가드 시스템 구축

```typescript
// src/components/auth/guards.ts — 설계 의사코드 (아직 구현 금지)

type Role = 'patient' | 'doctor_pending' | 'doctor' | 'admin';

interface GuardConfig {
  requiredRole: Role | Role[];
  redirectTo?: string;
  allowUnauthenticated?: boolean;
}

function withRoleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: GuardConfig
) {
  return function GuardedRoute(props: P) {
    const { user, loading, openAuthModal } = useAuth();
    const router = useRouter();

    // 1. 로딩 중 → 스피너
    // 2. 비인증 + allowUnauthenticated → 컴포넌트 렌더 (기능 제한은 내부에서)
    // 3. 비인증 + !allowUnauthenticated → redirect
    // 4. 인증 + role 불일치 → role별 기본 페이지로 redirect
    // 5. 인증 + role 일치 → 컴포넌트 렌더
  };
}

// 사용 예시:
// export default withRoleGuard(DoctorDashboard, { requiredRole: 'doctor' });
// export default withRoleGuard(AdminReports, { requiredRole: 'admin' });
// export default withRoleGuard(ReportPage, { requiredRole: ['patient', 'doctor'], allowUnauthenticated: true });
```

### 1.4 AuthUser 확장

```typescript
// 현행 AuthUser 타입 (AuthContext.tsx):
interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'patient' | 'doctor';
  provider: 'google' | 'github' | 'apple' | 'email' | 'demo';
}

// 목표 AuthUser 타입:
interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'patient' | 'doctor_pending' | 'doctor' | 'admin';
  provider: AuthProvider;
  country?: string;
  language?: SurveyLang;
  created_at?: string;
  airtable_record_id?: string;
}

type AuthProvider =
  | 'google' | 'github' | 'apple' | 'email' | 'demo'
  | 'kakao' | 'line' | 'naver';
```

### 1.5 트레이드오프 — 권한 관리 방식

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: HOC 패턴 확장 (현행 withDoctorGuard 기반) | 기존 코드 재사용, 간결 | 중첩 HOC 가독성 저하 | ✅ Phase 0-1 |
| B: Next.js Middleware (edge) | 서버 레벨 보호, 클라이언트 깜빡임 없음 | Firebase 클라이언트 토큰 검증 복잡 | ⏳ Phase 3 검토 |
| C: Layout 기반 가드 (App Router) | 레이아웃 단위 보호 | Pages Router 사용 중 → App Router 전환 필요 | ❌ 현재 불가 |

**결정 근거**: 현재 Pages Router 기반이며, `withDoctorGuard`가 이미 동작 중. 이를 `withRoleGuard`로 일반화하는 것이 가장 안전한 경로.

---

# Part III. 환자 가치 — 진단 · 추천 · 플랜

## §2. 진단 → 추천 → 플랜 모듈

### 2.1 환자 가치 흐름 전체도

```
[설문] ──→ [AI 진단] ──→ [리포트]
  │                        │
  │   Phase A               ├── Mirror Layer (감정 공감)
  │   즉시 노출              ├── Confidence Layer (임상 확신)
  │                        ├── EBD 추천 (디바이스 3개)
  │                        ├── Injectable 추천 (3개)
  │                        └── Safety Flags (안전 경고)
  │
  │   Phase B               ├── Treatment Plan (시술 플랜)
  │   지연 로딩              ├── Budget Section (예산)
  │                        └── Homecare (홈케어 가이드)
  │
  │   Phase C (신규)         ├── Doctor Tab (의사 임상 요약)
  │   별도 API              └── Fit Analysis (개인화 적합 분석)
```

### 2.2 국내 환자 vs 해외 환자 분기 로직

**핵심 결정**: 국내 환자(KR)는 **주기별 플랜**, 해외 환자는 **방문 기간별 플랜**

```typescript
interface TreatmentPlanRequest {
  patient_country: string;
  visit_type: 'local' | 'medical_tourist';
  cycle_preference?: '2weeks' | '4weeks' | '8weeks';
  visit_duration?: '3days' | '5days' | '7days' | '14days';
  visit_date_range?: { start: string; end: string };
}

// AI 프롬프트에 주입할 컨텍스트:
// local → "이 환자는 한국 거주자입니다. 2주/4주/8주 주기 시술 플랜을 설계하세요."
// medical_tourist → "이 환자는 5일간 한국을 방문합니다. 방문 기간 내 최적 시술 시퀀스를 설계하세요."
```

**트레이드오프 — 분기 시점**:

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: 설문에서 visit_type 질문 추가 | 명시적 데이터 수집 | 설문 길이 증가 | ✅ 채택 |
| B: IP 감지로 자동 분기 | 설문 단축 | 해외 교포, VPN 사용자 오분류 | ❌ |
| C: 리포트 내에서 토글로 전환 | 유연성 최고 | AI 호출 2회 필요 (비용) | ⏳ Phase 2 검토 |

### 2.3 환자 가치 단계별 모듈 맵

| 단계 | 모듈 | 데이터 소스 | 렌더링 시점 |
|------|------|-----------|-----------|
| 진단 | MirrorLayer + ConfidenceLayer | Phase A AI 출력 | 즉시 |
| 추천 | EBDSection + InjectableSection | Phase A AI 출력 | 즉시 |
| 플랜 (국내) | TreatmentPlan (cycle mode) | Phase B AI 출력 | 지연 |
| 플랜 (해외) | TreatmentPlan (visit mode) | Phase B AI 출력 | 지연 |
| 예산 | BudgetSection | Phase B AI 출력 | 지연 |
| 홈케어 | HomecareSection | Phase A AI 출력 | 즉시 |
| Fit 분석 | FitAnalysis (신규) | Phase C AI/DB | 클릭 시 |
| 위키 연결 | DeviceLink (신규) | 정적 DB | 클릭 시 |

---

# Part IV. 반응형 인뎁스 설문

## §3. 꼬리물기형 State Machine 설문 엔진

### 3.1 현행 설문 분석

현재 설문(`useSurveyV2.ts`)은 **선형 5-Step** 구조:

```
demographics → open → chips → safety → analyzing
```

모든 사용자가 동일한 경로를 따르며, 깊이 있는 데이터 추출이 제한적이다. 특히:
- 피부 두께(fitzpatrick) 수집 부재
- 기저 질환 상세 분기 없음 (단순 토글만)
- 과거 시술 경험의 깊이 부족 (있음/없음만)
- 해외 환자의 방문 일정 수집 없음

### 3.2 State Machine 설계

**접근방식**: XState 스타일의 유한 상태 머신(FSM)으로 설문 흐름을 제어. 각 노드에서 응답에 따라 다음 노드가 결정됨.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SURVEY STATE MACHINE                             │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐           │
│  │DEMOGRAPHIC│───▶│OPEN_TEXT │───▶│    HAIKU_ANALYSIS    │           │
│  │          │    │          │    │  (AI: analyze-open)  │           │
│  └──────────┘    └──────────┘    └──────────┬───────────┘           │
│                                             │                        │
│                                    ┌────────▼────────┐              │
│                                    │  SMART_CHIPS    │              │
│                                    │  (AI-생성 칩)    │              │
│                                    └────────┬────────┘              │
│                                             │                        │
│                         ┌───────────────────┼───────────────────┐   │
│                         ▼                   ▼                   ▼   │
│                  ┌─────────────┐   ┌──────────────┐   ┌──────────┐ │
│                  │SKIN_PROFILE │   │ PAST_HISTORY │   │  (skip)  │ │
│                  │(꼬리질문 A) │   │(꼬리질문 B)  │   │          │ │
│                  └──────┬──────┘   └──────┬───────┘   └────┬─────┘ │
│                         │                 │                │        │
│        ┌────────────────┤        ┌────────┤                │        │
│        ▼                ▼        ▼        ▼                │        │
│  ┌───────────┐  ┌──────────┐ ┌────────┐ ┌──────────┐      │        │
│  │FITZPATRICK│  │THICKNESS │ │ADVERSE │ │PREV_TREAT│      │        │
│  │(피부 타입) │  │(피부 두께)│ │(부작용) │ │(과거 시술)│      │        │
│  └─────┬─────┘  └─────┬────┘ └───┬────┘ └─────┬────┘      │        │
│        └───────┬───────┘         └──────┬──────┘           │        │
│                ▼                        ▼                   │        │
│        ┌──────────────┐        ┌──────────────┐            │        │
│        │ VISIT_PLAN   │        │   SAFETY     │            │        │
│        │(해외환자 only)│        │ CHECKPOINT   │◀───────────┘        │
│        └──────┬───────┘        └──────┬───────┘                     │
│               │                       │                              │
│               └───────────┬───────────┘                              │
│                           ▼                                          │
│                   ┌──────────────┐                                   │
│                   │  ANALYZING   │                                   │
│                   │ (AI 분석 중)  │                                   │
│                   └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 시퀀스 다이어그램 — 반응형 설문 흐름

```
사용자              SurveyStateMachine        API (Haiku)         UI
  │                      │                      │                  │
  │─── 인구통계 입력 ───▶│                      │                  │
  │                      │                      │                  │
  │─── 자유텍스트 입력 ──▶│                      │                  │
  │                      │──── analyze-open ────▶│                  │
  │                      │◀─── HaikuAnalysis ───│                  │
  │                      │                      │                  │
  │                      │── transition(CHIPS) ─────────────────▶│
  │◀──── 스마트 칩 표시 ──│                      │                 │
  │                      │                      │                  │
  │─── 칩 응답: "타이트닝" + "피부 얇음" ──────▶│                  │
  │                      │                      │                  │
  │                      │── evaluate_branch() ─┐                 │
  │                      │   skin_profile=thin   │                 │
  │                      │   → FITZPATRICK 분기  │                 │
  │                      │◀──────────────────────┘                │
  │                      │                      │                  │
  │◀── Fitzpatrick 질문 ─│                      │        ┌────────┤
  │─── "Type II" 응답 ──▶│                      │        │꼬리질문│
  │                      │                      │        │렌더링  │
  │                      │── evaluate_branch() ─┐        └────────┤
  │                      │   past_experience=yes │                 │
  │                      │   → PREV_TREAT 분기  │                 │
  │                      │◀──────────────────────┘                │
  │                      │                      │                  │
  │◀── 과거 시술 상세 ───│                      │                  │
  │─── "Ulthera 2회" ──▶│                      │                  │
  │                      │                      │                  │
  │                      │── evaluate_branch() ─┐                 │
  │                      │   country=JP          │                 │
  │                      │   → VISIT_PLAN 분기  │                 │
  │                      │◀──────────────────────┘                │
  │                      │                      │                  │
  │◀── 방문 일정 질문 ───│                      │                  │
  │─── "5일, 4/15~4/19"──▶│                     │                  │
  │                      │                      │                  │
  │                      │── transition(SAFETY)─────────────────▶│
  │◀── 안전 체크포인트 ──│                      │                  │
  │─── 약물/상태 토글 ──▶│                      │                  │
  │                      │                      │                  │
  │                      │── 최종 시그널 맵 합산 ─┐               │
  │                      │   (demographics       │               │
  │                      │    + haiku_analysis   │               │
  │                      │    + chip_responses   │               │
  │                      │    + branch_responses │               │
  │                      │    + safety_flags)    │               │
  │                      │◀──────────────────────┘               │
  │                      │                      │                  │
  │                      │── transition(ANALYZING) ────────────▶│
  │                      │── final-recommendation ──▶│            │
  │                      │◀──── SSE Stream ─────────│            │
  │◀── 리포트 완성 ──────│                          │            │
```

### 3.4 State Machine 의사코드

```typescript
// src/hooks/useSurveyStateMachine.ts — 설계 의사코드 (구현 금지)

type SurveyNode =
  | 'DEMOGRAPHIC'
  | 'OPEN_TEXT'
  | 'SMART_CHIPS'
  | 'BRANCH_SKIN_PROFILE'
  | 'BRANCH_PAST_HISTORY'
  | 'BRANCH_VISIT_PLAN'
  | 'BRANCH_ADVERSE'
  | 'SAFETY_CHECKPOINT'
  | 'ANALYZING';

interface SurveyTransition {
  from: SurveyNode;
  to: SurveyNode;
  condition: (signals: SurveySignals) => boolean;
}

const TRANSITIONS: SurveyTransition[] = [
  // 기본 흐름
  { from: 'DEMOGRAPHIC', to: 'OPEN_TEXT', condition: () => true },
  { from: 'OPEN_TEXT', to: 'SMART_CHIPS', condition: () => true },

  // 칩 응답 후 분기
  { from: 'SMART_CHIPS', to: 'BRANCH_SKIN_PROFILE',
    condition: (s) => s.chip_responses.skin_profile === 'thin'
                   || s.chip_responses.skin_profile === 'sensitive'
                   || s.haiku_analysis?.concern_area_hint?.includes('wrinkle') },

  { from: 'SMART_CHIPS', to: 'BRANCH_PAST_HISTORY',
    condition: (s) => s.chip_responses.past_experience === 'yes_multiple'
                   || s.chip_responses.past_experience === 'yes_recent' },

  { from: 'SMART_CHIPS', to: 'SAFETY_CHECKPOINT',
    condition: (s) => true },  // fallback

  // 꼬리 질문 간 전이
  { from: 'BRANCH_SKIN_PROFILE', to: 'BRANCH_PAST_HISTORY',
    condition: (s) => s.chip_responses.past_experience !== 'none' },

  { from: 'BRANCH_SKIN_PROFILE', to: 'BRANCH_VISIT_PLAN',
    condition: (s) => s.demographics.detected_country !== 'KR' },

  { from: 'BRANCH_SKIN_PROFILE', to: 'SAFETY_CHECKPOINT',
    condition: () => true },

  { from: 'BRANCH_PAST_HISTORY', to: 'BRANCH_ADVERSE',
    condition: (s) => s.branch_responses.had_adverse === true },

  { from: 'BRANCH_PAST_HISTORY', to: 'BRANCH_VISIT_PLAN',
    condition: (s) => s.demographics.detected_country !== 'KR' },

  { from: 'BRANCH_PAST_HISTORY', to: 'SAFETY_CHECKPOINT',
    condition: () => true },

  { from: 'BRANCH_VISIT_PLAN', to: 'SAFETY_CHECKPOINT',
    condition: () => true },

  { from: 'BRANCH_ADVERSE', to: 'SAFETY_CHECKPOINT',
    condition: () => true },

  // 최종
  { from: 'SAFETY_CHECKPOINT', to: 'ANALYZING', condition: () => true },
];

function getNextNode(current: SurveyNode, signals: SurveySignals): SurveyNode {
  const candidates = TRANSITIONS
    .filter(t => t.from === current && t.condition(signals))
    .sort((a, b) => /* 우선순위: 구체적 조건 > fallback */);
  return candidates[0]?.to ?? 'SAFETY_CHECKPOINT';
}
```

### 3.5 꼬리 질문 상세 설계

| 분기 노드 | 트리거 조건 | 수집 데이터 | 리포트 반영 |
|-----------|-----------|-----------|-----------|
| BRANCH_SKIN_PROFILE | skin_profile ∈ {thin, sensitive} | Fitzpatrick type (I-VI), 피부 두께 자가 평가, 홍조 여부 | 레이저 파워 제한, 냉각 프로토콜 |
| BRANCH_PAST_HISTORY | past_experience ≠ none | 과거 시술명, 횟수, 최근 일시, 만족도 | 반복 시술 시너지, 간격 계산 |
| BRANCH_ADVERSE | had_adverse = true | 부작용 유형(PIH, 화상, 부종), 발생 시술, 회복 기간 | Safety Flag 강화, 대안 장비 추천 |
| BRANCH_VISIT_PLAN | country ≠ KR | 방문 기간, 도착/출발일, 숙소 지역 | 단기 집중 플랜, 지역 기반 병원 추천 |

### 3.6 트레이드오프 — State Machine 구현 방식

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: 순수 TypeScript FSM (직접 구현) | 의존성 0, 가벼움, 완전 제어 | 복잡한 상태 시각화 어려움 | ✅ Phase 0-1 |
| B: XState 라이브러리 도입 | 시각화 도구, 직렬화, 커뮤니티 | 번들 사이즈 +40KB, 학습 비용 | ⏳ Phase 2 검토 |
| C: 현행 useReducer 확장 | 기존 코드 재사용 | 분기 로직이 복잡해질수록 유지보수 어려움 | ❌ |

**결정 근거**: 현재 분기는 4개 꼬리 노드 수준. XState는 10개+ 노드에서 가치가 커짐.

---

# Part V. 점진적 정보 노출

## §4. Depth별 지연 로딩 전략

### 4.1 3-Depth 모델

```
┌─────────────────────────────────────────────────────────────┐
│  Depth 0 — 즉시 노출 (Phase A 완료 즉시, <2초)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ReportHeader (프로필 + 미적 목표)                        │ │
│  │ MirrorLayer (감정 공감 — "당신의 고민을 이해합니다")       │ │
│  │ ConfidenceLayer (임상 확신 — "이런 이유로 추천합니다")    │ │
│  │ EBD Top-3 카드 (접힌 상태 — 이름 + 한줄 요약만)          │ │
│  │ Injectable Top-3 카드 (접힌 상태)                        │ │
│  │ SafetyFlags (경고 배너)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Depth 1 — 클릭 시 확장 (사용자 인터랙션 트리거)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ EBD 카드 상세 (토글 열기)                                │ │
│  │   → why_fit_html (왜 나에게 맞는가)                      │ │
│  │   → RadarChart (8차원 스코어)                            │ │
│  │   → SkinLayerDiagram (피부 단면도)                       │ │
│  │   → 실용 정보 (세션수, 간격, 다운타임)                    │ │
│  │ Injectable 카드 상세 (동일 패턴)                          │ │
│  │ SignatureSolutions (시그니처 조합)                        │ │
│  │ Homecare (홈케어 가이드)                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Depth 2 — 지연 로딩 (Phase B/C API 별도 호출)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ TreatmentPlan (시술 플랜 + 타임라인)  ← Phase B SSE     │ │
│  │ BudgetSection (예산 브레이크다운)      ← Phase B SSE     │ │
│  │ DoctorTab (의사 임상 요약)            ← Phase C API     │ │
│  │ FitAnalysis (개인화 적합 분석)         ← Phase C API     │ │
│  │ WikiLink (장비 상세 위키 연결)         ← 정적 라우팅     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 시퀀스 다이어그램 — Depth별 로딩

```
브라우저                [id].tsx          ReportV7           API Server
  │                      │                  │                    │
  │── /report-v2/abc ───▶│                  │                    │
  │                      │── useReportData()│                    │
  │                      │   (Tier 1: sessionStorage)            │
  │                      │   (Tier 2: Airtable fallback)         │
  │                      │── data 확보 ────▶│                    │
  │                      │                  │                    │
  │◀════ Depth 0 렌더 ═══════════════════│                    │
  │  Header + Mirror + Confidence +       │                    │
  │  접힌 카드 + SafetyFlags              │                    │
  │                      │                  │                    │
  │                      │  [동시] Phase B SSE 시작 ────────────▶│
  │                      │                  │                    │
  │── [사용자] EBD 카드 1번 클릭 ──────────▶│                    │
  │◀════ Depth 1 렌더 (EBD 카드 1 상세) ═══│                    │
  │  why_fit_html + RadarChart +          │                    │
  │  SkinLayer + 실용 정보                │                    │
  │                      │                  │                    │
  │                      │◀──────── Phase B SSE 완료 ───────────│
  │                      │── setTreatmentPlan() ──▶│             │
  │◀════ Depth 2 렌더 (TreatmentPlan) ════│                    │
  │                      │                  │                    │
  │── [사용자] "의사 탭" 클릭 ─────────────▶│                    │
  │                      │── Phase C API ──────────────────────▶│
  │                      │◀──── DoctorTab 데이터 ───────────────│
  │◀════ Depth 2 렌더 (DoctorTab) ═════════│                    │
  │                      │                  │                    │
  │── [사용자] 장비명 클릭 ────────────────▶│                    │
  │                      │                  │── /wiki/device/xxx─▶
  │◀════ 위키 페이지 이동 ═════════════════│                    │
```

### 4.3 각 Depth 컴포넌트의 로딩 전략

```typescript
// Depth 0: 즉시 렌더 — props가 있으면 바로, 없으면 스켈레톤
interface Depth0Props {
  data: OpusRecommendationOutput | null;
  lang: SurveyLang;
}

// Depth 1: 클릭 시 확장 — 데이터는 이미 data에 포함, UI만 접힘/펼침
interface Depth1CardProps {
  recommendation: OpusDeviceRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
}

// Depth 2: 별도 API 호출 — 스켈레톤 → 실데이터
interface Depth2TreatmentProps {
  treatmentPlan: TreatmentPlanV2 | null;
  status: 'idle' | 'loading' | 'done' | 'error';
}
```

### 4.4 트레이드오프 — Depth 1 접힘/펼침 방식

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: Accordion (한 번에 하나만 열림) | 화면 깔끔, 스크롤 감소 | 비교 어려움 | ✅ 모바일 |
| B: 독립 토글 (여러 개 동시 열림) | 비교 용이 | 긴 스크롤 | ✅ 데스크톱 |
| C: 탭 전환 (카드 1/2/3) | 공간 효율 | 동시 비교 불가 | ❌ |

**결정**: 반응형 적용. 모바일(< 768px)은 Accordion, 데스크톱은 독립 토글.

---

# Part VI. 의사 신뢰도 + 온보딩 + 매칭

## §5. 의사가 진료 확신을 갖는 리포트

### 5.1 Magic Moment 정의

의사가 ConnectingDocs 리포트를 보고 **"이 정보면 바로 상담에 쓸 수 있겠다"**고 느끼는 순간.

| 정보 | 수집 경로 | 현행 | 목표 |
|------|----------|------|------|
| **피부 두께** (Fitzpatrick + 자가평가) | 꼬리질문 BRANCH_SKIN_PROFILE | ❌ 미수집 | ✅ 설문에서 수집 |
| **통증 민감도** (0-10 스케일) | 칩 pain_tolerance | ✅ 3단계 | ✅ → 5단계로 세분화 |
| **다운타임 선호도** | 칩 downtime_tolerance | ✅ 3단계 | ✅ → 일수 기반 (0/1-2/3-5/7+일) |
| **기저 질환** | 꼬리질문 BRANCH_ADVERSE | ⚠️ 토글만 | ✅ 상세 분기 (PIH, 화상, 부종, 면역) |
| **병행 치료** | Safety 약물 토글 | ✅ 6종 약물 | ✅ → 현행 유지 + isotretinoin 상세 |
| **과거 시술 이력** | 꼬리질문 BRANCH_PAST_HISTORY | ⚠️ 있음/없음만 | ✅ 시술명 + 횟수 + 최근 일시 |
| **프로토콜 인퍼런스** | AI (PROTO_01-06) | ✅ 자동 매핑 | ✅ → 의사탭에 근거 표시 |

### 5.1.1 DoctorTab 구조 설계

```typescript
interface DoctorTabData {
  clinical_profile: {
    fitzpatrick: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
    skin_thickness_self: 'thin' | 'normal' | 'thick';
    pain_sensitivity: 1 | 2 | 3 | 4 | 5;
    downtime_days: 0 | 1 | 2 | 3 | 5 | 7;
    active_conditions: string[];
    concurrent_medications: string[];
    past_treatments: PastTreatmentRecord[];
  };

  protocol: {
    code: string;
    rationale: string;
    conflict_check: string[];
  };

  equipment_pool: {
    recommended: EquipmentSuggestion[];
    alternatives: EquipmentSuggestion[];
    contraindicated: ContraindicatedDevice[];
  };

  clinical_notes: string;
  safety_summary: SafetyFlagDoctor[];
}

interface PastTreatmentRecord {
  device_name: string;
  sessions: number;
  last_date: string;
  satisfaction: 'low' | 'mid' | 'high';
}

interface EquipmentSuggestion {
  device_name: string;
  suggested_params: string;
  rationale: string;
}
```

**트레이드오프 — DoctorTab 데이터 소스**:

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: Phase A에 포함 (단일 AI 호출) | API 1회, 단순 | 토큰 예산 초과 (8,192 한계) | ❌ |
| B: Phase C 별도 API (의사탭 클릭 시 호출) | 토큰 분산, 필요 시만 호출 | 추가 API 엔드포인트, 지연 | ✅ 채택 |
| C: 사전 생성 + 캐싱 | 즉시 표시 | 불필요한 생성 비용 | ⏳ Phase 3 검토 |

### 5.2 의사 온보딩 플로우

현행 코드에는 `withDoctorGuard`로 의사 접근을 차단하지만, 의사가 **어떻게 등록되는지**에 대한 설계가 없다.

```
의사 온보딩 플로우:

[의사 가입 신청]
  │  이름, 이메일, 면허번호, 전문과목
  │  소속 병원/클리닉
  ▼
[관리자 승인 대기] ← Airtable Users 테이블 role='doctor_pending'
  │  Narabo가 Airtable에서 면허번호 확인 후 role→'doctor' 변경
  │  (자동화: Phase 4에서 면허 API 연동 검토)
  ▼
[의사 프로필 완성]
  │  전문 분야 (복수 선택): 리프팅, 볼륨, 피부재생, ...
  │  보유 장비 체크리스트: Ulthera, Thermage, Oligio, ...
  │  가격대 범위: min-max (비공개, 매칭에만 사용)
  │  프로필 사진 + 소개문
  ▼
[온보딩 완료] → 의사 대시보드 접근 가능
```

```typescript
// AuthUser role 확장 (doctor_pending 추가)
type UserRole = 'patient' | 'doctor_pending' | 'doctor' | 'admin';

// Airtable DoctorProfiles 테이블 (신규)
interface DoctorProfile {
  user_id: string;
  license_number: string;
  specialty: string[];
  equipment: string[];
  clinic_name: string;
  clinic_location: string;
  price_tier: 'budget' | 'mid' | 'premium';
  bio: string;
  photo_url?: string;
  onboarding_completed: boolean;
  approved_at?: string;
}
```

**트레이드오프 — 의사 인증 방식**:

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: Narabo 수동 승인 | 즉시 구현, 품질 통제 | 확장 안 됨 | ✅ Phase 0-2 |
| B: 면허 API 자동 검증 | 확장 가능 | 한국 HIRA API 연동 비용, 해외 의사 미지원 | ⏳ Phase 4 |
| C: 자기 인증 (unverified badge) | 빠른 온보딩 | 신뢰도 문제 | ❌ |

### 5.3 🆕 환자-의사 매칭 알고리즘

V3에서는 "매칭 알림"만 언급했으나, V4에서는 스코어링 기반 매칭 알고리즘을 설계한다.

```typescript
// src/lib/matching/calculateMatchScore.ts — 의사코드

interface MatchInput {
  patient: {
    protocol: string;           // PROTO_01 ~ PROTO_06
    top_devices: string[];      // AI 추천 장비 3개
    top_injectables: string[];  // AI 추천 인젝터블 3개
    country: string;
    visit_type: 'local' | 'medical_tourist';
    price_sensitivity: 'budget' | 'mid' | 'premium';
    language: SurveyLang;
  };
  doctor: DoctorProfile;
}

interface MatchResult {
  doctor_id: string;
  total_score: number;    // 0-100
  breakdown: {
    equipment_match: number;     // 0-35
    specialty_match: number;     // 0-25
    price_match: number;         // 0-20
    location_match: number;      // 0-10
    language_match: number;      // 0-10
  };
  rank: number;
}

function calculateMatchScore(input: MatchInput): number {
  let score = 0;

  // 1. 장비 매칭 (35점): 의사가 추천 장비를 보유하는가?
  const equipmentOverlap = input.patient.top_devices.filter(
    d => input.doctor.equipment.includes(d.toLowerCase())
  );
  score += Math.min(35, equipmentOverlap.length * 12);

  // 2. 전문 분야 매칭 (25점): 프로토콜과 전문 분야 매핑
  const PROTOCOL_SPECIALTY_MAP: Record<string, string[]> = {
    'PROTO_01': ['lifting', 'tightening'],
    'PROTO_02': ['volume', 'filler'],
    'PROTO_03': ['rejuvenation', 'texture'],
    'PROTO_04': ['pigment', 'brightening'],
    'PROTO_05': ['acne', 'scar'],
    'PROTO_06': ['body_contouring'],
  };
  const requiredSpecialties = PROTOCOL_SPECIALTY_MAP[input.patient.protocol] || [];
  const specialtyOverlap = requiredSpecialties.filter(
    s => input.doctor.specialty.includes(s)
  );
  score += Math.min(25, specialtyOverlap.length * 13);

  // 3. 가격대 매칭 (20점)
  if (input.patient.price_sensitivity === input.doctor.price_tier) {
    score += 20;
  } else if (
    Math.abs(['budget', 'mid', 'premium'].indexOf(input.patient.price_sensitivity) -
             ['budget', 'mid', 'premium'].indexOf(input.doctor.price_tier)) === 1
  ) {
    score += 10;  // 인접 티어
  }

  // 4. 위치 매칭 (10점): medical_tourist → 서울 강남 우선
  if (input.patient.visit_type === 'medical_tourist') {
    if (input.doctor.clinic_location.includes('강남') ||
        input.doctor.clinic_location.includes('Gangnam')) {
      score += 10;
    } else if (input.doctor.clinic_location.includes('서울')) {
      score += 5;
    }
  } else {
    score += 5;  // 로컬은 위치 중립 (추후 거리 기반 확장)
  }

  // 5. 언어 매칭 (10점)
  // Phase 2에서 DoctorProfile.languages 필드 추가 시 활성화
  score += 5;  // 기본 점수 (한국 내 기본 한국어 소통)

  return Math.min(100, score);
}

// 매칭 실행 (상위 3명 반환)
async function findTopMatches(patient: MatchInput['patient']): Promise<MatchResult[]> {
  const doctors = await airtable.select('DoctorProfiles', {
    filterByFormula: `{onboarding_completed} = TRUE()`
  });

  const results = doctors.map(doc => ({
    doctor_id: doc.user_id,
    total_score: calculateMatchScore({ patient, doctor: doc }),
    breakdown: { /* 각 항목 점수 */ },
    rank: 0,
  }));

  return results
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 3)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
```

**매칭 트리거 시점**: 리포트 생성 완료 → 자동 매칭 실행 → 결과를 Airtable `Matches` 테이블에 저장 → 환자 리포트 하단에 "추천 클리닉" 표시

---

# Part VII. CRM 여정 + 재방문 유도

## §6. Airtable CRM 스키마 + 사이클 자동화

### 6.1 CRM 사이클 — 5단계 상태 관리

```
[가입] ──→ [설문 완료] ──→ [상담 신청] ──→ [시술 진행] ──→ [피드백]
  │           │               │               │              │
  │    survey_completed  consultation_    treatment_      feedback_
  │                      requested         in_progress    submitted
  │                                                          │
  └──────────────────────── 재방문 유도 ◀────────────────────┘
                        (re-engagement)
```

### 6.2 Airtable 테이블 설계

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AIRTABLE CRM SCHEMA                              │
│                                                                      │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────────────┐   │
│  │  Users    │────▶│ SurveyV2_    │────▶│ Consultation_          │   │
│  │          │     │ Results      │     │ Requests               │   │
│  │ uid      │     │ run_id       │     │ report_id → Results    │   │
│  │ email    │     │ user_id→Users│     │ patient_id → Users     │   │
│  │ name     │     │ demographics │     │ doctor_id → Users      │   │
│  │ role     │     │ recommendation│    │ status (pending/       │   │
│  │ provider │     │ safety_flags │     │  contacted/scheduled/  │   │
│  │ country  │     │ created_at   │     │  completed/cancelled)  │   │
│  │ language │     │              │     │ requested_at           │   │
│  │ stage    │     └──────────────┘     │ scheduled_at           │   │
│  │ (signup/ │                          └────────────────────────┘   │
│  │  survey/ │                                                       │
│  │  consult/│     ┌──────────────┐     ┌────────────────────────┐   │
│  │  treat/  │────▶│ Treatments   │────▶│ Feedback               │   │
│  │  feedback│     │ (신규)        │     │ (신규)                  │   │
│  │  re_visit│     │ patient_id   │     │ treatment_id→Treatments│   │
│  │ )        │     │ doctor_id    │     │ satisfaction (1-5)     │   │
│  │ created  │     │ device_used  │     │ side_effects          │   │
│  │ last_act │     │ treatment_dt │     │ would_recommend       │   │
│  └──────────┘     │ notes        │     │ photos (before/after) │   │
│                   │ status (done/│     │ submitted_at          │   │
│                   │  in_progress)│     └────────────────────────┘   │
│                   └──────────────┘                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  DeviceWiki (신규) — 장비/인젝터블 데이터베이스                   │   │
│  │  slug, name_ko, name_en, name_jp, name_zh,                  │   │
│  │  category (ebd/injectable), manufacturer,                     │   │
│  │  mechanism_of_action, depth_range, pain_level,               │   │
│  │  downtime_days, evidence_level, fda_approved,                │   │
│  │  contraindications, typical_sessions, typical_interval,      │   │
│  │  price_range_kr, price_range_us,                             │   │
│  │  scores_json (8차원 기본 스코어)                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Users stage 전이 규칙

```typescript
type UserStage =
  | 'signup'       // 가입만 완료
  | 'survey'       // 설문 1회 이상 완료
  | 'consult'      // 상담 신청
  | 'treat'        // 시술 진행 중
  | 'feedback'     // 피드백 제출
  | 're_visit'     // 재방문 대상
  | 'churned';     // 이탈 (90일 미활동)

// stage 전이 규칙:
// signup → survey: save-result.ts 호출 시
// survey → consult: consultation/request.ts 호출 시
// consult → treat: 의사가 mark-contacted → scheduled → completed
// treat → feedback: 시술 후 7일 자동 피드백 요청 (이메일/푸시)
// feedback → re_visit: 피드백 제출 후 다음 추천 시술 시점 도래
// * → churned: 90일 미활동 (scheduled task로 체크)
```

### 6.4 데이터 유실 방지 전략

```typescript
async function onSurveyComplete(result: FinalRecommendationResponse, user: AuthUser | null) {
  const run_id = generateRunId();

  // 1. sessionStorage 저장 (즉시)
  sessionStorage.setItem('connectingdocs_v2_report', JSON.stringify(result));

  // 2. Airtable 저장 (영구 보존)
  await fetch('/api/survey-v2/save-result', {
    method: 'POST',
    body: JSON.stringify({
      run_id,
      ...result,
      user_id: user?.uid ?? null,
      user_email: user?.email ?? null,
    }),
  });

  // 3. 비인증 사용자 → run_id를 localStorage에 보관
  if (!user) {
    const pendingReports = JSON.parse(localStorage.getItem('cd_pending_reports') ?? '[]');
    pendingReports.push(run_id);
    localStorage.setItem('cd_pending_reports', JSON.stringify(pendingReports));
  }
}

// 가입 완료 시:
async function linkPendingReports(userId: string) {
  const pending = JSON.parse(localStorage.getItem('cd_pending_reports') ?? '[]');
  if (pending.length > 0) {
    await fetch('/api/auth/link-reports', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, run_ids: pending }),
    });
    localStorage.removeItem('cd_pending_reports');
  }
}
```

### 6.5 CRM 사이클 자동화 — 상태 전이 트리거

```
상태 전이 트리거 맵:

signup → survey:
  트리거: save-result.ts 호출 시 Users.stage 업데이트
  자동 액션: 없음

survey → consult:
  트리거: consultation/request.ts 호출 시
  자동 액션: Resend로 의사에게 알림 이메일

consult → treat:
  트리거: 의사가 doctor/mark-contacted.ts 호출 → status='scheduled'
  자동 액션: 환자에게 예약 확인 이메일 (Resend)

treat → feedback:
  트리거: 시술일로부터 7일 후 (예약 스케줄러)
  자동 액션: 환자에게 피드백 요청 이메일 + 인앱 알림
  ⚡ 구현: Netlify Scheduled Functions 또는 Cron (§17 참조)

feedback → re_visit:
  트리거: 피드백 제출 완료
  자동 액션: AI가 다음 추천 시술 시점 계산 → 해당 시점에 리마인더
  예: "지난 Ulthera 시술 후 12주가 지났습니다. 유지 시술을 검토해보세요."

* → churned:
  트리거: 90일 미활동 (Scheduled Function으로 체크)
  자동 액션: 재활성화 이메일 시퀀스 (1회 + 7일 후 1회)
```

```typescript
// 재방문 유도 스케줄러 의사코드
interface ReVisitSchedule {
  user_id: string;
  last_treatment_date: string;
  treatment_type: string;
  recommended_next_interval_weeks: number;
  reminder_date: string;
  status: 'pending' | 'sent' | 'clicked' | 'completed';
}

// Netlify Scheduled Function (cron: 매일 09:00 KST)
async function checkReVisitReminders() {
  const today = new Date().toISOString().split('T')[0];
  const due = await airtable.select('ReVisitSchedules', {
    filterByFormula: `AND({reminder_date} = '${today}', {status} = 'pending')`
  });

  for (const record of due) {
    await sendReVisitEmail(record.user_id, record.treatment_type);
    await airtable.update('ReVisitSchedules', record.id, { status: 'sent' });
  }
}
```

---

# Part VIII. 글로벌 소셜 로그인

## §7. 국가별 소셜 OAuth

### 7.1 현행 vs 목표

| 제공자 | 현행 | 목표 | 대상 국가 | 구현 난이도 |
|--------|------|------|----------|-----------|
| Google | ✅ 동작 | ✅ 유지 | 전체 | — |
| GitHub | ✅ 동작 | ⚠️ 유지 (개발자 전용) | — | — |
| Apple | ✅ 설정됨 | ✅ 활성화 | 글로벌 iOS | 낮 |
| Email/Password | ✅ 동작 | ✅ 유지 | 전체 | — |
| **Kakao** | ❌ | ✅ 신규 | 🇰🇷 KR | 중 |
| **Naver** | ❌ | ✅ 신규 | 🇰🇷 KR | 중 |
| **Line** | ❌ | ✅ 신규 | 🇯🇵 JP, 🇹🇭 TH, 🇹🇼 TW | 중 |
| **WeChat** | ❌ | ⏳ Phase 3 | 🇨🇳 CN | 높 (ICP 필요) |
| **WhatsApp** | ❌ | ⏳ Phase 3 | 🇻🇳 VN, 글로벌 | 중 |

### 7.2 접근방식 — Firebase Custom Auth + OAuth

```typescript
// Kakao, Naver, Line은 Firebase에 내장 제공자가 아님.
// 접근: Custom Token 방식

// POST /api/auth/social-login
interface SocialLoginRequest {
  provider: 'kakao' | 'naver' | 'line';
  access_token: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { provider, access_token } = req.body;

  // 1. 제공자별 사용자 정보 조회
  let userInfo: { id: string; email: string; name: string; photo?: string };
  switch (provider) {
    case 'kakao':
      userInfo = await fetchKakaoUser(access_token);
      break;
    case 'naver':
      userInfo = await fetchNaverUser(access_token);
      break;
    case 'line':
      userInfo = await fetchLineUser(access_token);
      break;
  }

  // 2. Firebase Custom Token 생성
  const firebaseToken = await admin.auth().createCustomToken(
    `${provider}_${userInfo.id}`,
    { role: 'patient', provider }
  );

  // 3. 반환
  res.json({ token: firebaseToken, user: userInfo });
}
```

### 7.3 국가별 로그인 UI — IP 감지 기반 우선순위

```typescript
const SOCIAL_PRIORITY: Record<string, AuthProvider[]> = {
  KR: ['kakao', 'naver', 'google', 'apple', 'email'],
  JP: ['line', 'google', 'apple', 'email'],
  TH: ['line', 'google', 'email'],
  TW: ['line', 'google', 'apple', 'email'],
  CN: ['wechat', 'google', 'email'],
  VN: ['google', 'email'],
  US: ['google', 'apple', 'email'],
  DEFAULT: ['google', 'apple', 'email'],
};
```

### 7.4 트레이드오프 — 구현 순서

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: 전체 동시 구현 | 완성도 | +2주, 개발자 등록 선행 필요 | ❌ |
| B: Phase별 점진 추가 | 빠른 런칭, 수요 기반 | 초기 KR/JP 전환율 낮을 수 있음 | ✅ 채택 |
| C: Google + Email only | 최소 구현 | KR 사용자 불편 | ❌ |

**구현 순서**: Phase 0: Google + Email + Apple → Phase 1: Kakao + Naver → Phase 2: Line → Phase 3: WeChat

---

# Part IX. 장비/인젝터블 위키 + 콘텐츠 파이프라인

## §8. 독점 콘텐츠 + 개인화 Fit 분석

### 8.1 위키 구조

```
/wiki/
├── /wiki/device/[slug]          ← 장비 상세 (예: /wiki/device/ultherapy)
│   ├── 기본 정보 (메커니즘, 깊이, 통증, 다운타임)
│   ├── 임상 근거 (FDA, 논문 수)
│   ├── 스코어 레이더 (8차원)
│   ├── 적합 분석 ("나에게 맞는 이유")  ← 로그인 + 설문 완료 시
│   └── 관련 프로토콜 연결
│
├── /wiki/injectable/[slug]      ← 인젝터블 상세
│   ├── 기본 정보 (성분, 작용 기전, 시술 부위)
│   ├── 임상 근거
│   ├── 적합 분석
│   └── 관련 시술 조합
│
└── /wiki/compare?a=ulthera&b=thermage  ← 비교 뷰 (Phase 3)
```

### 8.2 DeviceWiki 테이블 스키마

```typescript
interface DeviceWikiRecord {
  slug: string;
  name: Record<SurveyLang, string>;
  category: 'ebd' | 'injectable';
  manufacturer: string;
  mechanism_of_action: Record<SurveyLang, string>;
  depth_range: string;
  target_layers: string[];
  pain_level: number;
  downtime_days: number;
  evidence_level: 'A' | 'B' | 'C';
  fda_approved: boolean;
  contraindications: string[];
  typical_sessions: string;
  typical_interval: string;
  price_range: Record<string, { min: number; max: number }>;
  scores: Record<string, number>;
  related_protocols: string[];
}
```

### 8.3 개인화 Fit 분석

```typescript
function calculateFitScore(device: DeviceWikiRecord, profile: UserSurveyProfile): FitResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. 프로토콜 매칭 (30점)
  if (device.related_protocols.includes(profile.protocol)) {
    score += 30;
    reasons.push(`프로토콜 ${profile.protocol}에 최적화된 장비`);
  }

  // 2. 통증 허용도 매칭 (20점)
  if (device.pain_level <= profile.pain_tolerance * 2) {
    score += 20;
    reasons.push('통증 수준이 허용 범위 내');
  }

  // 3. 다운타임 매칭 (20점)
  if (device.downtime_days <= profile.downtime_days) {
    score += 20;
    reasons.push('다운타임이 선호 범위 내');
  }

  // 4. 피부 타입 호환성 (15점)
  if (!device.contraindications.includes(`fitzpatrick_${profile.fitzpatrick}`)) {
    score += 15;
    reasons.push('피부 타입과 호환');
  }

  // 5. 안전 플래그 충돌 확인 (15점)
  const conflicts = checkSafetyConflicts(device, profile.safety_flags);
  if (conflicts.length === 0) {
    score += 15;
    reasons.push('안전 제약 사항 없음');
  } else {
    reasons.push(`주의: ${conflicts.join(', ')}`);
  }

  return { score, reasons, conflicts };
}
```

### 8.4 트레이드오프 — 위키 데이터 관리

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: Airtable + ISR | Narabo 직접 편집 가능 | Airtable 무료 한도 | ✅ Phase 2 |
| B: Markdown 파일 | 빠른 빌드, git 관리 | 비개발자 편집 어려움 | ❌ |
| C: Headless CMS | 전문 CMS 기능 | 추가 비용 | ⏳ Phase 4 검토 |

### 8.5 🆕 위키 콘텐츠 생산 파이프라인

V3에서는 "Narabo가 입력"만 언급했으나, 35종 이상의 장비·인젝터블 데이터를 수동 입력하는 것은 비현실적. AI 초안 → Narabo 검수 파이프라인을 설계한다.

```
위키 콘텐츠 생산 파이프라인:

[Step 1: AI 초안 생성]
  입력: 장비명, 제조사, 카테고리
  도구: Claude Code에게 다음을 요청:
    - 메커니즘 설명 (4개국어)
    - FDA/CE 승인 상태
    - 임상 근거 요약
    - 8차원 스코어 초안
    - 가격대 범위 (한국/미국/일본)
  출력: DeviceWikiRecord JSON 초안

[Step 2: Narabo 검수]
  - 업계 경험 기반 스코어 보정
  - 가격대 현실 반영
  - 임상 근거 추가/수정
  - 적합한 프로토콜 매핑 확인

[Step 3: Airtable 입력]
  - 검수 완료 후 Airtable DeviceWiki 테이블에 등록
  - ISR 리빌드 트리거 → 위키 페이지 자동 업데이트

예상 소요:
  - AI 초안: 장비 1종 당 ~10분 (Claude Code)
  - Narabo 검수: 장비 1종 당 ~15분
  - 초기 35종: ~14시간 (2일 집중)
  - 이후 월 2-3종 추가: ~1시간/월
```

```typescript
// AI 초안 생성용 프롬프트 템플릿
const WIKI_DRAFT_PROMPT = `
You are an expert in aesthetic medicine devices.
Generate a comprehensive wiki entry for the following device:

Device: {{device_name}}
Manufacturer: {{manufacturer}}
Category: {{category}}

Output JSON matching DeviceWikiRecord schema with:
1. name in KO, EN, JP, ZH-CN
2. mechanism_of_action in 4 languages (2-3 sentences each)
3. Realistic 8-dimension scores (0-10): tightening, volumizing, texture, brightening, anti_aging, comfort, evidence, versatility
4. Price ranges for KR and US markets
5. Related protocols from PROTO_01 to PROTO_06
6. Evidence level (A/B/C) based on published studies
`;
```

---

# Part X. 관리자 대시보드

## §9. 어드민 기능 설계

### 9.1 현행 관리자 기능

- `src/pages/admin/reports.tsx` — 리포트 목록 (인증 가드 미적용!)
- `src/pages/api/admin/reports.ts` — Airtable Reports 조회 API

### 9.2 목표 어드민 대시보드

```
/admin/dashboard
├── 핵심 지표 (KPI Cards)
│   ├── 오늘 리포트 수 / 주간 추이
│   ├── 설문 완료율 (시작 vs 완료)
│   ├── 상담 전환율 (리포트 → 상담 신청)
│   └── 국가별 사용자 분포
│
├── 고객 현황 (CRM View)
│   ├── 최근 가입자
│   ├── stage별 사용자 수 (파이프라인 뷰)
│   ├── 이탈 경고 (90일 미활동)
│   └── 피드백 요약
│
├── 리포트 관리
│   ├── 전체 리포트 목록 (검색, 필터)
│   ├── 개별 리포트 상세 (AI 출력 확인)
│   └── 에러 리포트 (JSON 파싱 실패 등)
│
└── 콘텐츠 관리
    ├── 랜딩 페이지 텍스트 편집
    ├── 위키 장비 데이터 편집 (Airtable 연결)
    └── 공지사항 관리
```

### 9.3 Admin Role 부여

```typescript
// Airtable Users 테이블에 Role 필드로 관리
// auth/sync.ts에서 동기화 시 Airtable의 Role 값을 클라이언트에 반영
// 이미 구현된 코드:
// if (data.dbRole && data.dbRole !== u.role) {
//   const updatedUser = { ...u, role: data.dbRole };
//   ...
// }
// → 타입만 'patient' | 'doctor' | 'admin' 으로 확장하면 동작

export default withRoleGuard(AdminDashboard, { requiredRole: 'admin' });
```

---

# Part XI. 시스템 안정성 + i18n 통합 + 성능 예산

## §10. 안정성 설계 6대 원칙

### 10.1 원칙 1: 데이터 인터페이스 Validator

**문제**: AI 응답 필드 누락/형식 불일치 → 컴포넌트 크래시 → 전체 페이지 화이트아웃

**접근방식**: Zod 스키마 기반 런타임 검증기를 AI 응답과 컴포넌트 사이에 배치

```typescript
// src/utils/validators.ts — 설계 의사코드

import { z } from 'zod';

const EBDRecommendationSchema = z.object({
  rank: z.number().min(1).max(5),
  device_name: z.string().min(1),
  device_id: z.string().optional(),
  category: z.string(),
  confidence: z.string(),
  why_fit_html: z.string().default('<p>분석 데이터가 부족합니다.</p>'),
  scores: z.record(z.string(), z.number().min(0).max(10)).optional().default({}),
  pain_level: z.string().default('moderate'),
  downtime_level: z.string().default('moderate'),
  practical: z.object({
    sessions: z.string().default('3-5회'),
    interval: z.string().default('4주'),
    duration: z.string().optional(),
    onset: z.string().optional(),
    maintain: z.string().optional(),
  }).optional().default({}),
  skin_layers: z.array(z.string()).optional().default([]),
  clinical_evidence: z.string().optional().default(''),
});

const RecommendationOutputSchema = z.object({
  patient: z.object({
    age: z.string(),
    gender: z.string(),
    country: z.string(),
    aesthetic_goal: z.string(),
    top3_concerns: z.array(z.string()),
  }).optional(),
  mirror_message: z.string().default(''),
  confidence_message: z.string().default(''),
  ebd_recommendations: z.array(EBDRecommendationSchema).default([]),
  injectable_recommendations: z.array(z.any()).default([]),
  signature_solutions: z.array(z.any()).default([]),
  safety_flags: z.any().optional(),
  homecare: z.any().optional(),
});

export function validateRecommendation(raw: unknown): {
  data: z.infer<typeof RecommendationOutputSchema>;
  warnings: string[];
} {
  const result = RecommendationOutputSchema.safeParse(raw);
  if (result.success) {
    return { data: result.data, warnings: [] };
  }
  const partial = RecommendationOutputSchema.partial().safeParse(raw);
  const warnings = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
  return {
    data: { ...getDefaults(), ...(partial.success ? partial.data : {}) },
    warnings,
  };
}
```

**핵심 설계 결정**: Validator는 **절대 throw하지 않는다**. 누락 필드를 기본값으로 대체하고, warnings 배열로 기록.

### 10.2 원칙 2: CSS 스코핑

```css
/* report-v7.css — 모든 선택자에 .rv7- 접두사 */

/* ❌ 위험: 전역 오염 */
.card { background: var(--card-bg); }

/* ✅ 안전: 스코핑된 선택자 */
.rv7-card { background: var(--rv7-card-bg); }
.rv7-section h2 { color: var(--rv7-cyan); }

/* CSS 변수도 .rv7-report 스코프 내 정의 */
.rv7-report {
  --rv7-bg: #09090b;
  --rv7-card-bg: #18181b;
  --rv7-card-border: #27272a;
  --rv7-text-primary: #fafafa;
  --rv7-text-secondary: #a1a1aa;
  --rv7-cyan: #06b6d4;
  --rv7-rose: #f43f5e;
  --rv7-amber: #f59e0b;
}
```

**규칙**:

| 규칙 | 설명 |
|------|------|
| report-v7/ 내부 컴포넌트 | `rv7-` 클래스 + Tailwind 유틸리티 병행 가능 |
| report-v7/ 외부 컴포넌트 | `rv7-` 클래스 사용 금지 — Tailwind만 |
| 전역 스타일 | globals.css에만 — report-v7.css에서 전역 선택자 사용 금지 |

### 10.3 원칙 3: Error Boundary — 컴포넌트별 에러 격리

```typescript
function ReportV7({ data, lang, ... }: ReportV7Props) {
  return (
    <div className="rv7-report">
      {/* Depth 0: 개별 에러 격리 */}
      <ErrorBoundary fallback={<ErrorFallback componentName="Header" lang={lang} />}>
        <ReportHeader data={data.patient} lang={lang} />
      </ErrorBoundary>

      <ErrorBoundary fallback={<ErrorFallback componentName="Mirror" lang={lang} />}>
        <MirrorLayer message={data.mirror_message} lang={lang} />
      </ErrorBoundary>

      {/* Depth 1: 카드별 에러 격리 */}
      {data.ebd_recommendations?.map((rec, i) => (
        <ErrorBoundary key={i} fallback={<ErrorFallback componentName={`EBD #${i+1}`} lang={lang} />}>
          <EBDCard recommendation={rec} lang={lang} />
        </ErrorBoundary>
      ))}

      {/* Depth 2: 전체 영역 에러 격리 */}
      <ErrorBoundary fallback={<ErrorFallback componentName="Treatment Plan" lang={lang} />}>
        <TreatmentPlan plan={treatmentPlan} status={phaseBStatus} lang={lang} />
      </ErrorBoundary>
    </div>
  );
}
```

### 10.4 원칙 4: 최소 인터페이스

```typescript
// ❌ 금지: 전체 데이터 전달
<EBDSection data={recommendation} />

// ✅ 필수: 필요한 필드만 명시적 전달
<EBDSection
  recommendations={recommendation.ebd_recommendations}
  lang={lang}
/>

// ❌ 금지: Context에 전체 데이터
const ReportContext = createContext(recommendation);

// ✅ 허용: Context는 순수 설정용만
const ReportI18nContext = createContext({ t: translateFn, lang: 'KO' });
```

**Props 규칙**: props ≤ 7개, 중첩 ≤ 2 depth, callback은 `on` 접두사, optional은 반드시 기본값.

### 10.5 Validator 적용 범위 확장 (V3 보강)

| 입구 | Validator | 실패 시 동작 |
|------|-----------|------------|
| AI 응답 (final-recommendation SSE) | RecommendationOutputSchema | 기본값 대체, 경고 로그 |
| Airtable 조회 (report fallback) | ReportPayloadSchema | 404 에러 UI |
| 소셜 로그인 (Kakao/Line 응답) | SocialUserInfoSchema | 로그인 실패 메시지 |
| 설문 입력 (State Machine 전이) | SurveySignalsSchema | 전이 차단, 현재 노드 유지 |
| Admin API 응답 | AdminResponseSchema | 빈 대시보드 + 재시도 |

### 10.6 🆕 i18n 통합 전략

현재 번역 키가 5곳에 산재:

```
현행 i18n 소스:
1. src/utils/survey-v2-i18n.ts        — 설문 UI 번역
2. src/utils/report-v7-i18n.ts        — 리포트 UI 번역 (레거시)
3. CTA_TEXT in [id].tsx               — CTA 버튼 번역
4. LANG_MAP in [id].tsx               — 언어 코드 매핑
5. AI 프롬프트 내 lang 파라미터        — AI 응답 언어 결정
```

**V4 통합 설계**:

```typescript
// src/i18n/index.ts — 단일 진입점

import { SurveyLang } from '@/types/survey-v2';

// 네임스페이스별 번역 키 분리
type I18nNamespace = 'survey' | 'report' | 'auth' | 'wiki' | 'common' | 'admin';

interface I18nConfig {
  defaultLang: SurveyLang;
  fallbackLang: 'EN';
  supportedLangs: SurveyLang[];
  namespaces: I18nNamespace[];
}

const config: I18nConfig = {
  defaultLang: 'KO',
  fallbackLang: 'EN',
  supportedLangs: ['KO', 'EN', 'JP', 'ZH-CN'],
  namespaces: ['survey', 'report', 'auth', 'wiki', 'common', 'admin'],
};

// 번역 함수
function t(key: string, lang: SurveyLang, namespace: I18nNamespace = 'common'): string {
  const translations = loadNamespace(namespace);
  return translations[lang]?.[key]
    ?? translations[config.fallbackLang]?.[key]
    ?? `[MISSING: ${namespace}.${key}]`;
}

// React Context
const I18nContext = createContext<{
  lang: SurveyLang;
  t: (key: string, ns?: I18nNamespace) => string;
  setLang: (lang: SurveyLang) => void;
}>({ lang: 'KO', t: () => '', setLang: () => {} });

// 마이그레이션 전략:
// Phase 0: ReportI18nContext 유지 (report 네임스페이스)
// Phase 1: survey-v2-i18n.ts → I18nContext (survey 네임스페이스)
// Phase 2: wiki, auth 네임스페이스 추가
// Phase 3: 전체 통합 (레거시 삭제)
```

### 10.7 🆕 성능 예산 (Performance Budget)

V3에서 "Lighthouse 90+"만 언급했으나, 구체적인 수치 목표를 설정한다.

```
┌─────────────────────────────────────────────────────────────┐
│                    성능 예산 (Performance Budget)              │
│                                                              │
│  메트릭           │ 목표       │ 경고       │ 차단          │
│  ─────────────────┼────────────┼────────────┼──────────────│
│  FCP (First       │ < 1.5초    │ < 2.0초    │ > 2.5초      │
│  Contentful Paint)│            │            │              │
│  ─────────────────┼────────────┼────────────┼──────────────│
│  LCP (Largest     │ < 2.5초    │ < 3.5초    │ > 4.0초      │
│  Contentful Paint)│            │            │              │
│  ─────────────────┼────────────┼────────────┼──────────────│
│  CLS (Cumulative  │ < 0.1      │ < 0.15     │ > 0.25       │
│  Layout Shift)    │            │            │              │
│  ─────────────────┼────────────┼────────────┼──────────────│
│  TTI (Time to     │ < 3.0초    │ < 5.0초    │ > 7.0초      │
│  Interactive)     │            │            │              │
│  ─────────────────┼────────────┼────────────┼──────────────│
│  JS 번들 크기      │ < 200KB    │ < 300KB    │ > 400KB      │
│  (gzipped, 페이지별)│           │            │              │
│  ─────────────────┼────────────┼────────────┼──────────────│
│  Lighthouse Score │ ≥ 90       │ ≥ 80       │ < 70         │
│  (Performance)    │            │            │              │
└─────────────────────────────────────────────────────────────┘
```

**측정 시점**:
- Phase 0 완료 시: 리포트 페이지 기준선 측정
- 매 Phase 완료 시: Lighthouse CI로 자동 측정 (§14 CI/CD 참조)
- "차단" 임계값 초과 시: 해당 배포 롤백 또는 최적화 우선 처리

**최적화 전략**:

| 전략 | 대상 | 절감 | Phase |
|------|------|------|-------|
| Dynamic import (React.lazy) | 리포트 Depth 2 컴포넌트 | JS ~50KB | 0 |
| next/image 최적화 | 위키 이미지, 의사 프로필 | LCP -0.5s | 2 |
| Tailwind purge 검증 | 전체 CSS | CSS ~30KB | 0 |
| Airtable 응답 캐싱 (SWR staleTime) | 위키 페이지, 리포트 | TTI -1s | 2 |
| 폰트 서브세팅 (한/영/일) | Pretendard, Noto Sans JP | FCP -0.3s | 1 |

---

# Part XII. 수익 모델

## §11. 단계별 수익화 전략

### 11.1 수익 모델 개요

```
Phase       수익원                    대상        예상 시점
─────────────────────────────────────────────────────────
Phase 0-1   무료 (Growth)             전체        Week 1-4
Phase 2     Founding Partners         의사 5-10명  Week 5-7
Phase 3     B2B SaaS (병원 구독)      병원/클리닉  Week 8-10
Phase 4     Premium Report (환자)     환자         Week 11+
Phase 4+    데이터 인사이트 리포트      제조사       향후
```

### 11.2 Founding Partners 전략

```
대상: 초기 의사 5-10명 (피부과/성형외과)
제안:
  - ConnectingDocs 무료 사용 (6개월)
  - 환자 매칭 우선권
  - 리포트에 "파트너 클리닉" 배지 표시
  - 플랫폼 피드백 참여 (월 1회 인터뷰)

교환 조건:
  - 실제 환자 3명 이상에게 리포트 기반 상담 진행
  - 시술 결과 데이터 (before/after) 공유 (익명화)
  - 장비 보유 현황 + 가격대 정보 제공

수익 기여: 직접 수익 없음. 그러나:
  - 서비스 검증 (PMF)
  - 실제 사용 데이터 축적
  - 의사 사이드 네트워크 효과
```

### 11.3 B2B SaaS 모델 (Phase 3)

```typescript
interface ClinicSubscription {
  tier: 'starter' | 'professional' | 'enterprise';
  monthly_price_krw: number;
  features: string[];
}

const PLANS: ClinicSubscription[] = [
  {
    tier: 'starter',
    monthly_price_krw: 99_000,       // ~$70/월
    features: [
      '리포트 열람 (월 20건)',
      '환자 매칭 알림',
      '기본 통계 대시보드',
    ],
  },
  {
    tier: 'professional',
    monthly_price_krw: 299_000,      // ~$210/월
    features: [
      '리포트 열람 (무제한)',
      '환자 매칭 우선권',
      'DoctorTab 풀 액세스',
      '장비 파라미터 추천',
      'CRM 연동 (상담 이력)',
    ],
  },
  {
    tier: 'enterprise',
    monthly_price_krw: 990_000,      // ~$700/월 (협의)
    features: [
      'professional 전체',
      '멀티 의사 계정',
      '화이트 라벨 리포트',
      '전용 AI 커스텀 프롬프트',
      'API 직접 연동',
    ],
  },
];
```

### 11.4 환자 Premium Report (Phase 4)

```
무료 리포트:
  - Mirror Layer (감정 공감)
  - Confidence Layer (임상 확신)
  - EBD Top-3 (접힌 상태 — 이름 + 한줄 요약)
  - 기본 Safety Flags

유료 해제 (1회 ₩9,900 또는 구독 ₩4,900/월):
  - EBD 상세 (why_fit, RadarChart, SkinLayer)
  - Injectable 상세
  - Treatment Plan (Phase B)
  - Budget Section
  - Homecare Guide
  - Fit Analysis (위키 연동)
  - PDF 내보내기
```

### 11.5 트레이드오프 — Paywall 위치

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| A: 리포트 전체 Paywall | 단순 | 무료 가치 없음 → 전환율 0% | ❌ |
| B: Depth 0 무료 + Depth 1-2 유료 | 가치 체험 후 결제 | 무료/유료 경계 구현 복잡 | ✅ 채택 |
| C: 모두 무료, 의사 매칭만 유료 | 환자 유입 극대화 | AI 비용만 소모 | ⏳ Phase 2까지 유지 후 전환 |

**결정**: Phase 0-2는 **모두 무료** (Growth). Phase 3부터 Depth 기반 Paywall 도입.

### 11.6 🆕 Paywall 전환 시 기존 사용자 관리 (Grandfathering)

Phase 3에서 Paywall을 도입하면, Phase 0-2에서 무료로 사용하던 기존 사용자들의 처리가 필요하다.

```
Grandfathering 정책:

1. Founding Partners 의사 (5-10명):
   → Professional 플랜 무료 유지 (12개월)
   → 12개월 후 50% 할인 전환 제안

2. Phase 0-2 가입 환자:
   → "Early Adopter" 배지 부여
   → 기존에 생성한 리포트: Depth 2까지 영구 무료 열람
   → 신규 리포트: Depth 0 무료, 1-2 유료 (일반 정책)
   → 특별 할인: 첫 3개월 50% (₩4,900 → ₩2,450/월)

3. 미가입 비인증 사용자:
   → 변경 없음 (Depth 0 무료 유지)

구현:
  - Users 테이블에 early_adopter: boolean 필드 추가
  - Phase 2 완료 시점 이전 가입자 = early_adopter = true
  - Paywall 컴포넌트에서 early_adopter 확인 → 할인 가격 표시
```

```typescript
// Paywall 분기 의사코드
interface PaywallConfig {
  user: AuthUser | null;
  reportId: string;
  depth: 0 | 1 | 2;
}

function shouldShowPaywall(config: PaywallConfig): {
  blocked: boolean;
  reason?: string;
  discountRate?: number;
} {
  // Phase 0-2: 모든 콘텐츠 무료
  if (CURRENT_PHASE < 3) return { blocked: false };

  // Depth 0: 항상 무료
  if (config.depth === 0) return { blocked: false };

  // 비인증: Paywall
  if (!config.user) return { blocked: true, reason: 'login_required' };

  // Early Adopter + 기존 리포트: 무료
  if (config.user.early_adopter && isExistingReport(config.reportId)) {
    return { blocked: false };
  }

  // 구독자: 무료
  if (hasActiveSubscription(config.user.uid)) return { blocked: false };

  // Early Adopter + 신규 리포트: 할인
  if (config.user.early_adopter) {
    return { blocked: true, discountRate: 0.5 };
  }

  // 일반: Paywall
  return { blocked: true };
}
```

### 11.7 🆕 B2B 가격 검증 — Van Westendorp PSM

V3에서 ₩99K/₩299K/₩990K를 제시했으나, 이 가격이 시장에서 적절한지 검증이 필요하다.

```
Van Westendorp Price Sensitivity Meter (PSM):

Founding Partners 5-10명 + 추가 의사 10명에게 4개 질문:
  Q1: "이 서비스가 '너무 싸서 의심스러울' 가격은?"
  Q2: "이 서비스가 '합리적인 편' 가격은?"
  Q3: "이 서비스가 '비싸지만 고려할' 가격은?"
  Q4: "이 서비스가 '너무 비싸서 절대 안 쓸' 가격은?"

수집 시점: Phase 2 (Founding Partners 피드백 기간)
분석 방법: 4개 곡선의 교차점 → Optimal Price Point (OPP) 도출

예상 결과 반영:
  - OPP가 ₩99K-₩299K 사이면 → Starter 가격 확정
  - OPP가 ₩299K 이상이면 → Starter 가격 상향 검토
  - OPP가 ₩99K 미만이면 → Freemium 모델 강화 (Starter 폐지)

추가 검증:
  - 의사 1인당 월 상담 건수 × 건당 가치 = WTP (Willingness To Pay) 추산
  - 예: 월 20건 상담 × 건당 ₩10,000 가치 = ₩200,000 WTP → Professional ₩299K 적정
```

---

# Part XIII. AI 비용 및 토큰 관리

## §12. Burn Rate 정밀 추산

### 12.1 현행 AI 사용 패턴 (코드 기반 분석)

| API 엔드포인트 | 모델 | max_tokens | 호출/리포트 | 역할 |
|---------------|------|-----------|-----------|------|
| analyze-open.ts | claude-haiku-4-5-20251001 | 1,024 | 1 | 자유 텍스트 분석 |
| safety-followup.ts | claude-haiku-4-5-20251001 | 512 | 0-1 (조건부) | 안전 후속질문 |
| final-recommendation.ts | claude-haiku-4-5-20251001 | 8,192 | 1 | 최종 추천 리포트 |
| (Phase B 예정) | claude-haiku-4-5-20251001 | 4,096 | 1 | Treatment Plan |
| (Phase C 예정) | claude-haiku-4-5-20251001 | 2,048 | 0-1 | DoctorTab |

### 12.2 리포트당 토큰 소모 추산

```
── 리포트 1건 기본 (Phase A) ────────────────────────

analyze-open:
  Input:  시스템 프롬프트 (~2,000) + 환자 데이터 (~500) = ~2,500 tokens
  Output: ~800 tokens (HaikuAnalysis JSON)

safety-followup (50% 확률):
  Input:  ~1,500 tokens
  Output: ~400 tokens

final-recommendation:
  Input:  시스템 프롬프트 (~4,000, cached) + 환자 프롬프트 (~2,000) = ~6,000 tokens
  Output: ~6,000 tokens (OpusRecommendationOutput JSON)
  ※ prompt caching: 시스템 프롬프트 4,000 tokens × 90% 캐시 hit = 실비 400 tokens

Phase A 합계:
  Input:  ~8,900 tokens (캐시 적용 시 ~5,300)
  Output: ~7,200 tokens

── 리포트 1건 전체 (Phase A+B+C) ───────────────────

Phase B (Treatment Plan):
  Input:  ~3,000 tokens
  Output: ~3,000 tokens

Phase C (DoctorTab, 50% 확률):
  Input:  ~2,500 tokens
  Output: ~1,500 tokens

전체 합계 (최대):
  Input:  ~14,400 tokens (캐시 적용 시 ~10,800)
  Output: ~11,700 tokens
  총합:   ~22,500 tokens/리포트 (캐시 미적용 ~26,100)
```

### 12.3 월간 비용 추산

```
Claude Haiku 4.5 가격 (2026-03 기준):
  Input:  $0.80 / 1M tokens
  Output: $4.00 / 1M tokens
  Prompt Cache Write: $1.00 / 1M tokens
  Prompt Cache Read:  $0.08 / 1M tokens

── 시나리오별 월간 비용 ──────────────────────────

시나리오 A: 초기 (일 10건 / 월 300건)
  월 합계: ~$17 (₩23,000)

시나리오 B: 성장기 (일 50건 / 월 1,500건)
  월 합계: ~$83 (₩112,000)

시나리오 C: 확장기 (일 200건 / 월 6,000건)
  월 합계: ~$333 (₩450,000)

시나리오 D: 풀 스케일 (일 500건 / 월 15,000건)
  월 합계: ~$832 (₩1,120,000)
```

### 12.4 비용 최적화 전략

| 전략 | 절감율 | 구현 난이도 | Phase |
|------|--------|-----------|-------|
| Prompt Caching (현행) | ~30% | ✅ 이미 적용 | 0 |
| 응답 캐싱 (동일 입력→캐시 반환) | ~15% | 중 (Redis/KV) | 3 |
| 토큰 예산 축소 (불필요 필드 제거) | ~10% | 낮 | 1 |
| Batch API (비실시간 리포트) | ~50% | 중 | 4 |
| Mock 모드 (개발/QA) | 100% | 낮 | 0 |

### 12.5 Mock 모드 설계

```typescript
// .env.local
NEXT_PUBLIC_AI_MOCK=true

// final-recommendation.ts 상단
if (process.env.NEXT_PUBLIC_AI_MOCK === 'true') {
  return res.status(200).json(MOCK_RESPONSE);
}
```

---

# Part XIV. 글로벌 컴플라이언스

## §13. 데이터 수집 동의 및 규제 준수

### 13.1 적용 규제 맵

| 규제 | 적용 국가 | 핵심 요구사항 |
|------|----------|-------------|
| **PIPA** (개인정보보호법) | 🇰🇷 한국 | 동의 수집, 최소 수집, 파기 의무, 제3자 제공 동의 |
| **GDPR** | 🇪🇺 EU + 🇬🇧 UK | 명시적 동의, 데이터 이동권, 삭제권, DPO 지정 |
| **APPI** | 🇯🇵 일본 | 이용 목적 명시, 제3자 제공 동의, 개인정보 관리자 |
| **PDPA** | 🇹🇭 태국 | GDPR 유사, 동의 수집 필수 |
| **HIPAA** | 🇺🇸 미국 | 직접 적용 아님 (의료기관 아님), PHI 모범사례 적용 권장 |

### 13.2 수집 개인정보

| 데이터 | 분류 | 수집 시점 | 보존 기간 |
|--------|------|----------|----------|
| 이메일, 이름 | 일반 개인정보 | 가입 | 탈퇴 시 삭제 |
| 성별, 연령대 | 인구통계 | 설문 | 3년 후 익명화 |
| 피부 상태, 시술 이력 | **민감 건강정보** | 설문 | 3년 후 익명화 |
| 안전 플래그 (약물, 임신 등) | **민감 건강정보** | 설문 | 3년 후 익명화 |
| AI 분석 결과 | 서비스 데이터 | AI 응답 | 3년 후 삭제 |
| IP 주소 | 네트워크 정보 | 설문 | 즉시 폐기 (국가 추론용) |

### 13.3 동의 수집 설계

```
동의 UI 플로우:

[설문 시작 전] ConsentBanner 표시:
  • 성별, 연령대, 국가 (인구통계)
  • 피부 상태, 시술 이력 (건강정보)
  • 약물 복용, 알레르기 (안전 정보)

  수집 목적: AI 기반 시술 추천 리포트 생성
  보존 기간: 3년 (이후 익명화)
  제3자 제공: 상담 신청 시 매칭된 의사에게 공유

  동의 유형:
  ☑ [필수] 서비스 이용 동의
  ☑ [필수] 건강정보 수집·이용 동의
  ☐ [선택] 마케팅 수신 동의
  ☐ [선택] 의사 매칭 시 정보 공유 동의

  동의 저장: Airtable UserConsents 테이블
  동의 철회: /settings/privacy → 언제든 철회 가능
```

### 13.4 삭제권 구현

```typescript
// /api/privacy/delete-account — GDPR Article 17 대응
async function handleDeleteAccount(userId: string) {
  // 1. Firebase Auth 계정 삭제
  await admin.auth().deleteUser(userId);

  // 2. Airtable Users 레코드 익명화
  await airtable.update('Users', userId, {
    email: 'deleted@anonymized.local',
    name: 'Deleted User',
    role: 'deleted',
    phone: '',
  });

  // 3. SurveyV2_Results에서 개인정보 필드 삭제
  const results = await airtable.select('SurveyV2_Results', {
    filterByFormula: `{user_id_prefix} = '${userId.slice(0,8)}...'`
  });
  for (const r of results) {
    await airtable.update('SurveyV2_Results', r.id, {
      user_id_prefix: 'DELETED',
      open_question_raw: '[DELETED]',
      demographics_json: '[DELETED]',
    });
  }

  return { success: true, message: 'Account deleted.' };
}
```

### 13.5 국가별 동의 차이

| 항목 | KR (PIPA) | EU (GDPR) | JP (APPI) |
|------|-----------|-----------|-----------|
| 건강정보 수집 | **별도 동의** 필수 | **명시적 동의** 필수 | 이용 목적 공지 |
| 제3자 제공 | 별도 동의 | 별도 동의 | 별도 동의 |
| 파기 의무 | 목적 달성 시 | 삭제 요청 시 | 없음 (권장) |
| 미성년자 | 14세 미만 법정대리인 | 16세 미만 | 없음 |

---

# Part XV. 인프라 확장 + CI/CD

## §14. Airtable → Supabase 전환 + 배포 파이프라인

### 14.1 현행 Airtable 한계

| 제약 | 무료 플랜 | Pro 플랜 ($20/user/월) | Enterprise |
|------|----------|---------------------|-----------|
| 레코드 수 / 베이스 | 1,000 | 50,000 | 500,000 |
| API Rate Limit | 5 req/sec | 5 req/sec | 커스텀 |
| Long Text 필드 | 100K 자 | 100K 자 | 100K 자 |

### 14.2 임계점 판단 기준

```
전환 트리거 (하나라도 해당 시 Supabase 전환 시작):

1. SurveyV2_Results 레코드 > 40,000건 (Pro 한도의 80%)
2. API Rate Limit 병목 (동시 접속 50명 이상)
3. 관계형 쿼리 필요 (JOIN)
4. 월 비용 > ₩500,000
```

### 14.3 전환 전략 — Repository 패턴

```typescript
// Phase 3: Repository 패턴 도입
// src/lib/repositories/
//   ├── IReportRepository.ts      (인터페이스)
//   ├── AirtableReportRepo.ts     (현행 구현)
//   └── SupabaseReportRepo.ts     (전환 시 구현)

interface IReportRepository {
  save(data: SaveResultRequest): Promise<{ id: string }>;
  findById(reportId: string): Promise<ReportPayload | null>;
  findByUserId(userId: string): Promise<ReportPayload[]>;
  delete(reportId: string): Promise<void>;  // GDPR 삭제권
}

class AirtableReportRepo implements IReportRepository {
  async save(data) { /* 현행 save-result.ts 로직 */ }
  async findById(id) { /* Airtable API 호출 */ }
}

class SupabaseReportRepo implements IReportRepository {
  async save(data) { /* supabase.from('reports').insert(data) */ }
  async findById(id) { /* supabase.from('reports').select().eq('id', id) */ }
}
```

### 14.4 기술 부채 — Pages Router

| 항목 | Pages Router (현행) | App Router |
|------|-------------------|-----------|
| 설정 | 안정적 | 마이그레이션 비용 높음 |
| API | pages/api/*.ts | Route Handlers |
| **결정** | **Phase 0-3 유지** | **Phase 4+ 검토** |

### 14.5 🆕 CI/CD 파이프라인

1인 운영 체제에서 자동화는 필수. GitHub Actions + Netlify를 활용한 CI/CD 설계:

```yaml
# .github/workflows/ci.yml

name: CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  unit-test:
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4

  lighthouse:
    runs-on: ubuntu-latest
    needs: unit-test
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true

  # Netlify Preview Deploy는 Netlify 자체 통합으로 자동
```

```json
// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 4000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.15 }]
      }
    }
  }
}
```

**브랜치 전략**:
```
main (프로덕션) ← PR 머지만 허용, 자동 배포
  │
  └── develop (개발) ← Claude Code 작업 브랜치에서 머지
        │
        ├── feature/phase-0-report-rebuild
        ├── feature/phase-1-crm
        └── fix/safety-flag-validation
```

**배포 플로우**:
1. Claude Code가 feature 브랜치에서 작업
2. PR 생성 → CI 자동 실행 (lint + type check + test + lighthouse)
3. Netlify Preview Deploy 자동 생성 → Narabo가 시각적 검수
4. Narabo 승인 → develop 머지
5. develop → main PR → 프로덕션 배포

---

# Part XVI. 테스트·QA + 에러 모니터링

## §15. 테스트 전략 + Sentry

### 15.1 현행 테스트 인프라

| 도구 | 상태 |
|------|------|
| Jest `^30.2.0` + ts-jest | 설치됨, 테스트 파일 0개 |
| @types/jest | 설치됨 |
| Playwright | ❌ 미설치 (Phase 1 설치) |
| ESLint `^9` | 설정됨 |

### 15.2 테스트 피라미드

```
       ╱  E2E (Playwright)  ╲           ← 5-10개 핵심 시나리오
      ╱────────────────────────╲
     ╱   Integration (Jest)     ╲        ← API 엔드포인트 + Hook
    ╱────────────────────────────╲
   ╱     Unit (Jest)              ╲      ← Validator, 유틸, 순수 함수
  ╱────────────────────────────────╲
 ╱       Static (TypeScript + ESLint)╲   ← 이미 적용
╱──────────────────────────────────────╲
```

### 15.3 AI 응답 엣지케이스 테스트

```typescript
describe('validateRecommendation', () => {
  it('정상 데이터 → 경고 없이 통과', () => {
    const result = validateRecommendation(VALID_SAMPLE);
    expect(result.warnings).toHaveLength(0);
  });

  it('ebd_recommendations 누락 → 빈 배열 기본값', () => {
    const { ebd_recommendations, ...rest } = VALID_SAMPLE;
    const result = validateRecommendation(rest);
    expect(result.data.ebd_recommendations).toEqual([]);
  });

  it('완전 빈 객체 → 전체 기본값', () => {
    const result = validateRecommendation({});
    expect(result.data.mirror_message).toBe('');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('JSON truncation (SSE 끊김) → 파싱 가능한 부분만 추출', () => {
    const truncated = JSON.stringify(VALID_SAMPLE).slice(0, 500);
    const result = validateRecommendation(tryParseJSON(truncated));
    expect(result.data).toBeDefined();
  });
});
```

### 15.4 에러 모니터링 — Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,

  beforeSend(event) {
    if (event.tags?.module === 'ai-pipeline') {
      event.level = 'error';
      return event;
    }
    return event;
  },
});
```

### 15.5 롤백 전략

```
배포 롤백 프로토콜:

1. Netlify 자동 롤백: 1-click 롤백 가능
2. 롤백 트리거 조건 (Phase 3 자동화):
   - Sentry 에러율 > 5% (5분 내)
   - 리포트 생성 성공률 < 90% (30분 평균)
   - API 응답 시간 > 10초 (p95)
3. 실행:
   Phase 0-2: Narabo 수동 (Netlify 대시보드)
   Phase 3+: Sentry + Netlify API 연동 자동 롤백
```

---

# Part XVII. 기술적 취약점 해결

## §16. 3대 취약점 해결 방안

### 16.1 fire-and-forget → Await-Confirm + Retry

```typescript
// 현행 코드 패턴 (useSurveyV2.ts):
fetch('/api/survey-v2/save-result', { ... })
  .then(res => res.json())
  .catch(e => console.error('Save failed:', e));  // ← 실패 시 유실!
router.push(`/report-v2/${reportId}`);  // 저장 확인 안 함

// V4 해결 — Await-Confirm 패턴:
async function onAnalysisComplete(result: FinalRecommendationResponse) {
  const run_id = generateRunId();

  // 1. sessionStorage 저장 (즉시)
  sessionStorage.setItem('connectingdocs_v2_report', JSON.stringify(result));

  // 2. Airtable 저장 — 반드시 확인 (최대 3회 재시도)
  let saved = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('/api/survey-v2/save-result', {
        method: 'POST',
        body: JSON.stringify({ run_id, ...result }),
      });
      if (res.ok) { saved = true; break; }
    } catch {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  // 3. 저장 실패 시 — 로컬 큐에 보관
  if (!saved) {
    const failedQueue = JSON.parse(localStorage.getItem('cd_save_queue') ?? '[]');
    failedQueue.push({ run_id, ...result, failed_at: Date.now() });
    localStorage.setItem('cd_save_queue', JSON.stringify(failedQueue));
    Sentry.captureMessage('save-result failed after 3 retries', { level: 'warning' });
  }

  // 4. 이동 (실패해도 sessionStorage로 리포트 열람 가능)
  router.push(`/report-v2/${run_id}`);
}
```

### 16.2 비인증 유저 run_id 유실 방지

```
비인증 유저 데이터 보존 전략 (3-Layer):

Layer 1: localStorage (V2와 동일)
  cd_pending_reports = ['run_abc', 'run_def']
  → 가입 시 linkPendingReports() 호출

Layer 2: 이메일 기반 매칭
  리포트 완성 시 → "이메일을 입력하면 리포트를 저장합니다" 모달
  → Airtable SurveyV2_Results의 pending_email 필드에 저장
  → 해당 이메일로 가입 시 → 자동 연결

Layer 3: 단축 URL 전송
  리포트 완성 시 → "리포트 링크를 이메일로 보내드릴까요?"
  → Resend로 /report-v2/{run_id} 링크 전송
  → 링크 클릭 → 리포트 열람 (Airtable fallback)
```

### 16.3 의사 온보딩 — §5.2에서 상세 설계 (중복 방지)

> §5.2 참조: doctor_pending → 관리자 승인 → doctor → 프로필 완성 → 대시보드 접근

---

# Part XVIII. 🆕 1인 운영 통합 로드맵 (전면 재설계)

## §17. Narabo + Claude Code 5-Phase 로드맵

### 17.1 V3 → V4 로드맵 변경 사항

V3 로드맵은 `[코드 B]` 개발팀을 가정했다. V4에서는 **Narabo 1인 + Claude Code** 체제로 전면 재설계:

| 변경 | V3 | V4 |
|------|----|----|
| 개발자 | [코드 B] 팀 | Claude Code (AI) |
| PM/QA | Narabo | Narabo (동일) |
| 임상 콘텐츠 | [임상 C] | Narabo (업계 10년 경험) |
| 주당 개발 시간 | ~15h (팀 기준) | ~20h (Claude Code on-demand) |
| 병렬 작업 | 가능 (팀원 분산) | 제한적 (순차 태스크) |
| 코드 검토 | 팀 내 리뷰 | Narabo 직접 검토 |

### 17.2 Phase 개요

| Phase | 기간 | 핵심 목표 | Narabo 역할 | Claude Code 역할 | 산출물 |
|-------|------|----------|-----------|----------------|--------|
| **0** | Week 1-2 | 리포트 리빌드 + 안정성 | QA, 배포 검수 | 15 컴포넌트, Validator, CSS | 리포트 v7 React 전환 |
| **1** | Week 3-5 | CRM + 인증 + 데이터 안전 | Airtable 설정, 개인정보처리방침 | Kakao OAuth, Await-Confirm, Jest | CRM 기반 인증 시스템 |
| **2** | Week 6-9 | 설문 고도화 + 위키 + PSST | 위키 콘텐츠 검수, PSST 신청서 | State Machine, Wiki ISR, Fit 분석 | 반응형 설문 + 위키 35종 |
| **3** | Week 10-13 | 수익화 + 글로벌 + 모니터링 | B2B 영업, 가격 검증 | Stripe, Line OAuth, Sentry, Paywall | 수익화 인프라 |
| **4** | Week 14-16 | 관리자 + 최적화 + PWA | 전체 QA, 라이브 런칭 | Admin, Repository, 성능, PWA | 풀 프로덕션 |

### 17.3 Phase 0 상세 — 리포트 리빌드 + 안정성 기초

```
Week 1:
  [Claude Code]  R-1: CSS 추출 + rv7- 스코핑 (3h)
  [Claude Code]  R-2a: ReportV7 래퍼 + Skeleton + ErrorBoundary (3h)
  [Claude Code]  R-2b: Header + Mirror + Confidence (2h)
  [Claude Code]  R-2c: EBDSection + Injectable + 토글 (4h)
  [Narabo]       CI/CD 파이프라인 설정 (GitHub Actions + Netlify)
  [Narabo]       Founding Partners 의사 2명 섭외 시작

Week 2:
  [Claude Code]  R-2d: Signature + Safety + Homecare (2h)
  [Claude Code]  R-2e: TreatmentPlan + Budget (Phase B skeleton) (2h)
  [Claude Code]  R-3: [id].tsx 리팩토링 + useReportData (3h)
  [Claude Code]  R-4: Validator (Zod) + Mock 모드 (2h)
  [Claude Code]  R-5: 통합 테스트 + archive + CI green 확인 (2h)
  [Narabo]       배포 후 라이브 QA + Lighthouse 기준선 측정

Phase 0 합계: Claude Code ~23h + Narabo ~8h = 31h
```

### 17.4 Phase 1 상세 — CRM + 인증 + 데이터 안전

```
Week 3:
  [Claude Code]  C-1: Users 테이블 stage 필드 + save-result 연동 (2h)
  [Claude Code]  C-2: withRoleGuard 범용 가드 구현 (2h)
  [Claude Code]  C-3: Await-Confirm + Retry Queue (3h)
  [Claude Code]  C-4: 비인증 유저 이메일 매칭 모달 (2h)
  [Narabo]       Airtable CRM 테이블 수동 생성 + 초기 데이터

Week 4:
  [Claude Code]  C-5: Kakao OAuth (Firebase Custom Token) (4h)
  [Claude Code]  C-6: Naver OAuth (3h)
  [Claude Code]  C-7: ConsentBanner (PIPA 동의 수집 UI) (2h)
  [Narabo]       Kakao/Naver 개발자 앱 등록

Week 5:
  [Claude Code]  C-8: Jest 단위 테스트 15개 (Validator + 유틸 + Guard) (4h)
  [Claude Code]  C-9: i18n 기초 통합 (survey + report 네임스페이스) (3h)
  [Narabo]       개인정보처리방침 초안 작성 + 법무 검토 의뢰

Phase 1 합계: Claude Code ~25h + Narabo ~12h = 37h
```

### 17.5 Phase 2 상세 — 설문 고도화 + 위키 + PSST 신청

```
Week 6:
  [Claude Code]  S-1: useSurveyStateMachine 훅 (순수 TS FSM) (4h)
  [Claude Code]  S-2a: BRANCH_SKIN_PROFILE 꼬리질문 UI (2h)
  [Claude Code]  S-2b: BRANCH_PAST_HISTORY 꼬리질문 UI (2h)
  [Narabo]       꼬리질문 임상 검증 (피부 두께 분류, Fitzpatrick 기준)

Week 7:
  [Claude Code]  S-2c: BRANCH_VISIT_PLAN (해외 환자) (2h)
  [Claude Code]  S-2d: BRANCH_ADVERSE (부작용 상세) (2h)
  [Claude Code]  S-3: DeviceWiki Airtable 테이블 + ISR 페이지 (4h)
  [Narabo]       위키 콘텐츠 AI 초안 생성 시작 (§8.5 파이프라인)

Week 8:
  [Claude Code]  S-4: /wiki/device/[slug] + /wiki/injectable/[slug] (3h)
  [Claude Code]  S-5: FitAnalysis 위젯 (규칙 기반 점수 계산) (3h)
  [Claude Code]  S-6: 환자-의사 매칭 알고리즘 (§5.3) (3h)
  [Narabo]       DeviceWiki 콘텐츠 검수 (35종 목표)

Week 9:
  [Claude Code]  S-7: Playwright E2E 5개 시나리오 (4h)
  [Claude Code]  S-8: 위키 콘텐츠 파이프라인 도구 (3h)
  [Narabo]       PSST 예비창업패키지 신청서 작성 (§19 참조)
  [Narabo]       Founding Partners 피드백 수집 + Van Westendorp 설문

Phase 2 합계: Claude Code ~32h + Narabo ~25h = 57h
```

### 17.6 Phase 3 상세 — 수익화 + 글로벌 + 모니터링

```
Week 10:
  [Claude Code]  G-1: Line OAuth (JP, TH, TW) (4h)
  [Claude Code]  G-2: DoctorTab Phase C API 엔드포인트 (3h)
  [Narabo]       Line Developers 등록 + 앱 생성

Week 11:
  [Claude Code]  G-3: 국내/해외 TreatmentPlan 분기 (3h)
  [Claude Code]  G-4: CRM 재방문 유도 스케줄러 (3h)
  [Claude Code]  G-5: Sentry 연동 + Error Boundary 연결 (2h)
  [Narabo]       B2B 가격 확정 (Van Westendorp 결과 반영)

Week 12:
  [Claude Code]  G-6: Paywall 구조 (Depth 기반) + Grandfathering (4h)
  [Claude Code]  G-7: Stripe 결제 연동 (4h)
  [Narabo]       Founding Partners 의사에게 유료 전환 안내

Week 13:
  [Claude Code]  G-8: Repository 패턴 도입 (Airtable 추상화) (3h)
  [Claude Code]  G-9: 성능 최적화 1차 (Dynamic Import, 폰트) (3h)
  [Narabo]       B2B 초기 영업 (Founding Partners 외 5개 클리닉)

Phase 3 합계: Claude Code ~29h + Narabo ~18h = 47h
```

### 17.7 Phase 4 상세 — 관리자 + 최적화 + PWA

```
Week 14:
  [Claude Code]  A-1: Admin Dashboard (KPI 카드 + CRM 파이프라인) (6h)
  [Claude Code]  A-2: 의사 온보딩 플로우 UI (doctor_pending → doctor) (3h)
  [Narabo]       의사 온보딩 테스트 (실제 의사 2명)

Week 15:
  [Claude Code]  A-3: PDF 내보내기 (jsPDF 연동) (3h)
  [Claude Code]  A-4: 콘텐츠 관리 (위키 편집 UI) (3h)
  [Claude Code]  A-5: PWA 기초 (manifest.json + service worker) (3h)
  [Narabo]       전체 시스템 QA

Week 16:
  [Claude Code]  A-6: GDPR 삭제권 API (2h)
  [Claude Code]  A-7: 전체 E2E 보강 (10개 시나리오) (3h)
  [Claude Code]  A-8: 메인 페이지 리디자인 구현 (§23) (4h)
  [Claude Code]  A-9: 개발자 핸드오프 문서 생성 (§22) (2h)
  [Narabo]       라이브 런칭 + 모니터링

Phase 4 합계: Claude Code ~29h + Narabo ~12h = 41h
```

### 17.8 전체 리소스 요약

| Phase | Claude Code | Narabo | 합계 | 기간 |
|-------|------------|--------|------|------|
| 0 | 23h | 8h | 31h | 2주 |
| 1 | 25h | 12h | 37h | 3주 |
| 2 | 32h | 25h | 57h | 4주 |
| 3 | 29h | 18h | 47h | 4주 |
| 4 | 29h | 12h | 41h | 3주 |
| **총계** | **138h** | **75h** | **213h** | **16주** |

**Narabo 주간 부하**: 75h ÷ 16주 = ~4.7h/주 (코드 검토/QA만, 사업 개발·콘텐츠 별도)

---

# Part XIX. 부록

## §18. 커버리지 매트릭스 + 기술 부채 원장

### 18.1 11대 비즈니스 요구사항

| # | 요구사항 | 섹션 | Phase | 상태 |
|---|---------|------|-------|------|
| 1 | 경로/권한 분리 | §1 | 0-1 | ✅ |
| 2 | 환자 가치 | §2 | 0, 2 | ✅ |
| 3 | 반응형 설문 | §3 | 2 | ✅ |
| 4 | 점진적 노출 | §4 | 0 | ✅ |
| 5 | 의사 신뢰도 + 온보딩 + 매칭 | §5 | 2-3 | ✅ |
| 6 | CRM 여정 + 자동화 | §6 | 1-3 | ✅ |
| 7 | 소셜 로그인 | §7 | 1-3 | ✅ |
| 8 | 장비 위키 + Fit + 파이프라인 | §8 | 2 | ✅ |
| 9 | 관리자 대시보드 | §9 | 4 | ✅ |
| 10 | 시스템 안정성 + i18n + 성능 | §10 | 0-2 | ✅ |
| 11 | 수익 모델 + Paywall + B2B 검증 | §11 | 2-4 | ✅ |

**비즈니스 커버리지: 11/11 (100%)**

### 18.2 V4 신규 항목

| # | V4 신규 항목 | 섹션 | Phase | 상태 |
|---|-------------|------|-------|------|
| 1 | 환자-의사 매칭 알고리즘 | §5.3 | 2 | ✅ |
| 2 | 위키 콘텐츠 파이프라인 | §8.5 | 2 | ✅ |
| 3 | i18n 통합 | §10.6 | 0-3 | ✅ |
| 4 | 성능 예산 | §10.7 | 0+ | ✅ |
| 5 | Paywall Grandfathering | §11.6 | 3 | ✅ |
| 6 | B2B 가격 검증 (Van Westendorp) | §11.7 | 2 | ✅ |
| 7 | CI/CD 파이프라인 | §14.5 | 0 | ✅ |
| 8 | 1인 운영 로드맵 | §17 | 전체 | ✅ |
| 9 | PSST 통합 가이드 | §19 | 2 | ✅ |
| 10 | 모바일/PWA | §20 | 4 | ✅ |
| 11 | 경쟁 분석 + TAM/SAM/SOM | §21 | — | ✅ |
| 12 | 개발자 핸드오프 | §22 | 4 | ✅ |
| 13 | 메인 페이지 리디자인 | §23 | 4 | ✅ |

**V4 신규 커버리지: 13/13 (100%)**

### 18.3 기술적 취약점 해결

| # | 취약점 | 섹션 | Phase | 상태 |
|---|--------|------|-------|------|
| 1 | fire-and-forget → Await-Confirm | §16.1 | 1 | ✅ |
| 2 | 비인증 유저 연결 (3-Layer) | §16.2 | 1 | ✅ |
| 3 | 의사 온보딩 플로우 | §5.2 | 2-4 | ✅ |

**취약점 해결 커버리지: 3/3 (100%)**

### 18.4 시스템 안정성 원칙

| # | 원칙 | 섹션 | 상태 |
|---|------|------|------|
| 1 | Validator (Zod) | §10.1, §10.5 | ✅ |
| 2 | CSS Scoping (rv7-) | §10.2 | ✅ |
| 3 | Error Boundary | §10.3 | ✅ |
| 4 | 최소 인터페이스 | §10.4 | ✅ |
| 5 | 🆕 i18n 통합 | §10.6 | ✅ |
| 6 | 🆕 성능 예산 | §10.7 | ✅ |

**안정성 원칙 커버리지: 6/6 (100%)**

### 18.5 기술 부채 원장

| # | 부채 | 해결 시점 | 비용 추산 |
|---|------|----------|----------|
| D1 | Pages Router | Phase 4+ (App Router 검토) | ~40h |
| D2 | Airtable 단일 의존 | Phase 3 (Repository 패턴) | ~6h |
| D3 | openai 패키지 미사용 | Phase 0 (정리) | 0.5h |
| D4 | stripe 패키지 미활성 | Phase 3 (활용 예정) | — |
| D5 | bcryptjs 미사용 | Phase 0 (정리) | 0.5h |
| D6 | OpusRecommendation 변수명 | Phase 1 (리네이밍) | 2h |
| D7 | IP 감지 ipapi.co 의존 | Phase 3 (유료 전환) | 3h |
| D8 | report-v7-premium.html 잔존 | Phase 0 (archive) | 0.5h |
| D9 | Firebase 미설정 시 demo 모드 | Phase 1 (Firebase 필수화) | 2h |
| D10 | notify-report fire-and-forget | Phase 1 (Retry 적용) | 1h |

### 18.6 트레이드오프 총괄표

| # | 결정 사항 | 선택 | 기각 대안 | 근거 |
|---|----------|------|----------|------|
| T1 | 권한 관리 | HOC 가드 확장 | Middleware, App Router | Pages Router 유지 |
| T2 | 국내/해외 분기 | 설문 visit_type 질문 | IP 자동 분기 | 오분류 방지 |
| T3 | State Machine | 순수 TS FSM | XState | 4분기 수준, 과도한 의존성 불필요 |
| T4 | Depth 1 토글 | 반응형 Accordion/독립 | 탭 전환 | 비교 용이 |
| T5 | DoctorTab 소스 | Phase C 별도 API | Phase A 통합 | 토큰 8,192 한계 |
| T6 | 의사 인증 | 수동 승인 | 면허 API | 초기 비용 0 |
| T7 | CRM DB | Airtable → Repository | PostgreSQL 직행 | 운영 부담 최소 |
| T8 | 소셜 순서 | Google→Kakao→Line | 전체 동시 | 빠른 런칭 |
| T9 | 위키 데이터 | Airtable + ISR | CMS | 비용 0 |
| T10 | Validator | Zod (no throw) | 수동 체크 | 런타임 안정성 |
| T11 | CSS 스코핑 | rv7- 접두사 | CSS Modules | Tailwind 병행 |
| T12 | Error Boundary | 영역별 배치 | 페이지 단일 | 부분 실패 격리 |
| T13 | Data 전달 | 최소 props | Context 전역 | 결합도 최소화 |
| T14 | Paywall | Depth 기반 (Phase 3) | 전체/없음 | 가치 체험 후 결제 |
| T15 | 저장 전략 | Await-Confirm + Retry | fire-and-forget | 데이터 유실 방지 |
| T16 | 비인증 보존 | 3-Layer 안전망 | localStorage만 | 이메일+URL 보조 |
| T17 | 인프라 전환 | Repository → Supabase | 처음부터 Supabase | 초기 부담 최소 |
| T18 | 에러 모니터링 | Sentry | 자체 구현 | 설정 10분 |
| T19 | 🆕 팀 구조 | Narabo + Claude Code | 외주 개발팀 | 비용 효율, 속도 |
| T20 | 🆕 모바일 | PWA | React Native | 코드베이스 단일화 |

---

# Part XX. 🆕 예비창업패키지 (PSST) 통합 가이드

## §19. 정부지원 사업 연계 전략

### 19.1 예비창업패키지 개요

```
사업명: 예비창업패키지 (Pre-Startup Support & Training)
주관: 중소벤처기업부 → 창업진흥원
지원금: 최대 1억원 (평균 5,000만원)
대상: 예비 창업자 (사업자 미등록 또는 등록 3년 이내)
기간: 약 10개월 (선정 후)
핵심 평가: 기술성, 시장성, 사업성, 팀 역량
```

### 19.2 전략적 아이템 명명 — 3개 후보

| 후보 | 아이템명 | 강조점 | PSST 적합도 |
|------|---------|--------|-----------|
| A | **AI 기반 피부 시술 추천 플랫폼** | 기술 (AI) + 의료 | ★★★★☆ |
| B | **글로벌 메디컬 에스테틱 AI 리포트 SaaS** | 글로벌 + B2B SaaS | ★★★★★ |
| C | **환자-의사 매칭 AI 플랫폼 for 의료관광** | 의료관광 + 매칭 | ★★★★☆ |

**추천: B안** — "글로벌 메디컬 에스테틱 AI 리포트 SaaS"
- 이유: "글로벌"은 시장 규모 어필, "SaaS"는 수익 모델 명확, "AI"는 기술 혁신성

### 19.3 PSST ↔ MASTER_PLAN 매핑 테이블

| PSST 평가 항목 | 본 문서 섹션 | 핵심 데이터 포인트 |
|---------------|------------|-----------------|
| **기술성** — 기술 혁신성 | §3 (설문 SM), §5.3 (매칭 알고리즘), §12 (AI 파이프라인) | 3-Stage Haiku 파이프라인, FSM 설문, 스코어링 매칭 |
| **기술성** — 기술 완성도 | §10 (안정성 6원칙), §14.5 (CI/CD), §15 (테스트) | Zod Validator, Error Boundary, 80%+ test coverage 목표 |
| **시장성** — 시장 규모 | §21 (TAM/SAM/SOM) | TAM $XX B, SAM $XX M, SOM $XX M |
| **시장성** — 경쟁 우위 | §21 (경쟁 분석) | Narabo 10년 업계 경험, AI 개인화, 4개국어 |
| **사업성** — 수익 모델 | §11 (수익 모델) | Founding Partners → B2B SaaS → Premium |
| **사업성** — 자금 운용 계획 | §12 (AI 비용), §17 (리소스) | 월 $17~$333 AI 비용, 16주 개발 로드맵 |
| **팀 역량** — 대표자 | §0.3 (팀 구조) | UofT 철학+경제, 연세 MBA, 10년 미용의료기기 |
| **팀 역량** — 기술 역량 | §0.3, §22 (핸드오프) | Claude Code AI 개발, 핸드오프 문서 상시 유지 |

### 19.4 PSST 신청서 작성 가이드

```
신청서 핵심 구성:

1. 창업 아이템 개요 (1페이지)
   → §0 비전 + §21 시장 규모 요약

2. 문제 정의 (1페이지)
   "현재 미용 시술 시장에서 환자는 정보 비대칭으로 적절한 시술을
    선택하지 못하고, 의사는 충분한 사전 정보 없이 상담을 진행한다."
   → §2 환자 가치 + §5 의사 Magic Moment

3. 솔루션 (2페이지)
   "AI가 환자의 피부 상태, 시술 이력, 안전 요인을 분석하여
    개인화된 시술 추천 리포트를 생성하고,
    적합한 의사를 자동으로 매칭한다."
   → §3 설문 + §4 리포트 + §5.3 매칭 알고리즘

4. 기술 설명 (2페이지)
   → §12 AI 파이프라인 + §10 안정성 원칙 + §14.5 CI/CD

5. 시장 분석 (1페이지)
   → §21 TAM/SAM/SOM + 경쟁 분석

6. 사업화 전략 (1페이지)
   → §11 수익 모델 + §17 로드맵

7. 자금 운용 계획 (1페이지)
   → §12 AI 비용 + 개발 인건비 + 마케팅 예산 배분

8. 대표자 역량 (1페이지)
   "루트로닉, 사이노슈어, 클래시스 등 글로벌 의료기기 기업에서
    10년간 근무한 도메인 전문가. UofT 철학+경제, 연세 MBA."
```

### 19.5 PSST 자금 운용 계획 (5,000만원 기준)

```
항목                    금액        비율    근거
──────────────────────────────────────────────────
AI API 비용 (10개월)    ₩1,500,000   3%    시나리오 B ($83/월) × 10 + 버퍼
클라우드 인프라          ₩2,000,000   4%    Netlify Pro + Airtable Pro + Sentry
개발 도구/라이선스       ₩1,000,000   2%    GitHub Team, Figma, 도메인
마케팅 (초기 고객 확보)  ₩15,000,000  30%   SEO, 의사 네트워크 이벤트, 콘텐츠
인건비 (Narabo)         ₩20,000,000  40%   10개월 × ₩2,000,000
법무/특허               ₩5,000,000   10%   개인정보처리방침, 서비스 이용약관, 상표
예비비                  ₩5,500,000   11%   돌발 비용
──────────────────────────────────────────────────
합계                    ₩50,000,000  100%
```

---

# Part XXI. 🆕 모바일 / PWA 전략

## §20. Progressive Web App

### 20.1 왜 PWA인가

| 선택지 | 장점 | 단점 | **결정** |
|--------|------|------|----------|
| React Native | 네이티브 성능, 앱스토어 | 코드베이스 분리, 개발 2배 | ❌ |
| Flutter | 크로스 플랫폼 | 새 기술 스택, 웹 경험 부재 | ❌ |
| **PWA** | 코드베이스 단일, 설치 가능, 오프라인 | 일부 네이티브 기능 제한 | ✅ |
| 반응형 웹만 | 가장 단순 | 홈 화면 설치 불가, 오프라인 불가 | ⏳ Phase 0-3 |

**결정**: Phase 0-3은 반응형 웹, Phase 4에서 PWA 도입.

### 20.2 PWA 구현 범위

```
Phase 4 PWA:

1. manifest.json
   - name: "ConnectingDocs"
   - short_name: "CDocs"
   - theme_color: "#06b6d4" (cyan)
   - display: "standalone"
   - icons: 192px, 512px

2. Service Worker (next-pwa 패키지)
   - 정적 자산 캐싱 (CSS, JS, 폰트)
   - 위키 페이지 오프라인 열람
   - 리포트 데이터 오프라인 캐싱 (IndexedDB)

3. 설치 프롬프트
   - 리포트 생성 완료 후 "앱으로 설치하면 언제든 리포트를 확인할 수 있습니다" 배너
   - 2회 이상 방문 시 자동 트리거

4. 오프라인 지원 범위
   - ✅ 기존 리포트 열람 (캐싱됨)
   - ✅ 위키 장비 상세 (캐싱됨)
   - ❌ 새 설문 (AI 호출 필요 → 온라인 필수)
   - ❌ 의사 매칭 (서버 데이터 필요)
```

### 20.3 모바일 UX 우선 사항

```
모바일 최적화 체크리스트:

☐ 설문: 한 손 조작 가능 (버튼 44px 이상, 하단 배치)
☐ 리포트: 카드형 레이아웃 (가로 스크롤 없음)
☐ Depth 1 토글: Accordion 모드 (모바일 < 768px)
☐ 차트 (RadarChart): 터치 인터랙션 (탭으로 상세)
☐ PDF 내보내기: "공유" 버튼으로 대체 (모바일)
☐ 네비게이션: 하단 탭 바 (PWA 모드)
```

---

# Part XXII. 🆕 경쟁 분석 + TAM/SAM/SOM

## §21. 시장 현황과 포지셔닝

### 21.1 경쟁사 분석

```
┌─────────────────────────────────────────────────────────────┐
│                    경쟁 환경 매트릭스                          │
│                                                              │
│  축: X = AI 개인화 수준, Y = 의사 연결 깊이                   │
│                                                              │
│       높음 ┤                                                 │
│  의사      │         ★ ConnectingDocs (목표)                 │
│  연결      │                                                 │
│  깊이      │    ● 강남언니                                   │
│            │    ● 바비톡                                      │
│            │                                                 │
│       낮음 ┤  ○ RealSelf        ○ 유튜브/블로그              │
│            │  ○ SkinVision      ○ 일반 정보 사이트            │
│            └──────────────────────────────────────────       │
│           낮음              AI 개인화              높음       │
└─────────────────────────────────────────────────────────────┘
```

| 경쟁사 | 유형 | AI 개인화 | 의사 연결 | 글로벌 | ConnectingDocs 차별점 |
|--------|------|---------|---------|--------|---------------------|
| **강남언니** | 시술 리뷰 플랫폼 | ❌ 없음 | ✅ 예약 | ❌ KR only | AI 분석, 글로벌, B2B |
| **바비톡** | 성형 커뮤니티 | ❌ 없음 | ⚠️ 광고 | ❌ KR only | AI 리포트, 임상 근거 |
| **RealSelf** | 리뷰/정보 | ❌ 없음 | ⚠️ 광고 | ✅ US | AI 개인화, 4개국어 |
| **SkinVision** | 피부암 AI | ✅ 이미지 AI | ❌ 없음 | ✅ EU | 미용 시술 특화, 의사 매칭 |
| **유튜브/블로그** | 일반 정보 | ❌ 없음 | ❌ 없음 | ✅ | 개인화, 임상 근거, 안전 |

### 21.2 ConnectingDocs 핵심 차별점

1. **AI 개인화 리포트**: 설문 기반 3-Stage 파이프라인으로 개인 맞춤 추천
2. **임상 근거 기반**: Narabo의 10년 업계 경험 + AI 프로토콜 추론
3. **글로벌 4개국어**: KO, EN, JP, ZH-CN (경쟁사 대부분 단일 언어)
4. **양면 플랫폼**: 환자 AI 리포트 + 의사 DoctorTab + 매칭 (B2C + B2B)
5. **데이터 독점**: 설문 응답 + AI 분석 결과 축적 → 추천 정확도 향상

### 21.3 TAM / SAM / SOM

```
TAM (Total Addressable Market):
  글로벌 메디컬 에스테틱 시장
  = $15.9B (2025) → $25.3B (2030) CAGR 9.8%
  출처: Grand View Research, 2025

SAM (Serviceable Addressable Market):
  한국 + 일본 + 태국 메디컬 에스테틱 중 온라인 상담/예약 시장
  = 한국 ₩1.2조 + 일본 ¥3,500억 + 태국 $500M
  ≈ $3.5B × 온라인 비율 15% = $525M

SOM (Serviceable Obtainable Market):
  Year 1 목표: 한국 시장 0.1% 점유
  = 한국 온라인 시술 상담 ₩1,800억 × 0.1% = ₩1.8억 (≈ $130K)
  달성 경로:
    - 의사 10명 × Professional 플랜 ₩299K/월 × 12개월 = ₩35.9M
    - 환자 Premium Report 2,000건 × ₩9,900 = ₩19.8M
    - 의사 추가 확보 + B2B 성장 = ₩124M (잔여)

Year 3 목표:
  = SAM의 1% = $5.25M (₩70억)
  달성 경로: 병원 200곳 × 평균 ₩200K/월 + 환자 Premium 50K건/년
```

---

# Part XXIII. 🆕 개발자 핸드오프 패키지

## §22. 팀 확장 시 인수인계 문서

### 22.1 핸드오프 문서 구성

1인 운영 체제에서 팀 확장 또는 외주 시 즉시 인수인계가 가능하도록, 아래 문서를 **상시 최신 상태**로 유지한다:

```
docs/
├── ARCHITECTURE.md        ← 시스템 아키텍처 (본 마스터 플랜 요약)
├── GETTING_STARTED.md     ← 로컬 개발 환경 설정 가이드
├── API_REFERENCE.md       ← 32개 API 엔드포인트 목록 + 요청/응답 스키마
├── DEPLOYMENT.md          ← Netlify 배포 + 환경변수 목록
├── DATABASE_SCHEMA.md     ← Airtable 테이블 구조 + 필드 설명
├── AI_PIPELINE.md         ← 3-Stage Haiku 파이프라인 + 프롬프트 템플릿
├── TESTING.md             ← 테스트 실행 + 테스트 작성 가이드
└── STYLE_GUIDE.md         ← 코드 컨벤션 + 컴포넌트 네이밍

핸드오프 업데이트 규칙:
  - 매 Phase 완료 시 docs/ 전체 업데이트
  - 새 API 추가 시 API_REFERENCE.md 즉시 업데이트
  - 새 Airtable 테이블 추가 시 DATABASE_SCHEMA.md 즉시 업데이트
```

### 22.2 GETTING_STARTED.md 핵심 내용

```markdown
# 로컬 개발 환경 설정

## 필수 요구사항
- Node.js 20+
- npm 10+
- Git

## 환경변수 (.env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_AI_MOCK=true  # 개발 시 AI 호출 스킵

## 실행
npm install
npm run dev

## 테스트
npm test
npm run test:e2e  # Playwright (Phase 1+)

## 배포
git push origin main  # Netlify 자동 배포
```

### 22.3 핸드오프 체크리스트 — 신규 개발자 온보딩

```
신규 개발자 온보딩 (예상 소요: 1일):

1. [ ] GETTING_STARTED.md 따라 로컬 환경 구축 (30분)
2. [ ] ARCHITECTURE.md 읽기 (1시간)
3. [ ] 설문 → 리포트 전체 플로우 직접 체험 (30분)
4. [ ] AI_PIPELINE.md 읽기 + Mock 모드 테스트 (30분)
5. [ ] 간단한 UI 수정 태스크 1개 완료 (2시간)
6. [ ] PR 생성 → CI 통과 → Narabo 리뷰 (1시간)
7. [ ] DATABASE_SCHEMA.md 읽고 Airtable 구조 파악 (30분)
```

---

# Part XXIV. 🆕 메인 페이지 전략적 리디자인

## §23. 랜딩 페이지 설계

### 23.1 현행 메인 페이지 문제

현재 메인 페이지는 기본적인 랜딩 구조만 갖추고 있으며, 다음 문제가 있다:
- CTA(Call to Action) 동선 불명확
- 의사 대상 가치 제안 부재
- 글로벌 사용자 대상 다국어 미지원
- 신뢰도 지표 (의사 수, 리포트 수) 미표시

### 23.2 목표 메인 페이지 구조

```
┌─────────────────────────────────────────────────────────────┐
│  [Nav]  로고 │ 서비스 소개 │ 위키 │ 의사용 │ KO/EN/JP/ZH    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HERO SECTION                                                │
│  "AI가 분석하는 나만의 시술 리포트"                             │
│  [무료로 시작하기] ← Primary CTA → /survey-v2                │
│  [의사이신가요?] ← Secondary CTA → /doctor/onboarding        │
│                                                              │
│  실시간 지표 (Airtable 기반):                                 │
│  "리포트 1,234건 생성 │ 파트너 의사 12명 │ 4개국어 지원"       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HOW IT WORKS (3-Step)                                       │
│  ①설문 입력 → ②AI 분석 → ③맞춤 리포트 + 의사 매칭             │
│  [각 단계별 애니메이션 또는 목업 이미지]                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FOR PATIENTS (환자 가치)                                     │
│  • AI 기반 개인화 시술 추천                                    │
│  • 8차원 스코어 레이더 차트                                    │
│  • 안전 경고 시스템                                           │
│  • 검증된 의사 매칭                                           │
│  [무료 리포트 받기] CTA                                       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FOR DOCTORS (의사 가치)                                      │
│  • 사전 분석된 환자 프로필                                     │
│  • 장비 파라미터 추천                                         │
│  • 환자 매칭 자동화                                           │
│  • CRM 연동                                                  │
│  [파트너 의사 신청] CTA                                       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SOCIAL PROOF                                                │
│  • Founding Partners 의사 추천사                               │
│  • 리포트 샘플 미리보기 (Depth 0 일부)                         │
│  • 파트너 클리닉 로고                                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FAQ (아코디언)                                               │
│  • "리포트는 무료인가요?"                                      │
│  • "의사 인증은 어떻게 하나요?"                                 │
│  • "개인정보는 안전한가요?"                                     │
│  • "어떤 시술을 추천하나요?"                                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [Footer] 개인정보처리방침 │ 이용약관 │ 문의 │ © 2026         │
└─────────────────────────────────────────────────────────────┘
```

### 23.3 메인 페이지 성능 목표

- FCP < 1.0초 (히어로 섹션 즉시 렌더)
- LCP < 2.0초 (히어로 이미지/텍스트)
- CLS < 0.05 (레이아웃 시프트 최소)
- 전체 JS < 100KB gzipped (메인 페이지는 가벼워야 함)

### 23.4 구현 우선순위

| 요소 | Phase | 난이도 | 비고 |
|------|-------|--------|------|
| Hero + CTA | 0 (기존 개선) | 낮 | 텍스트 + 버튼만 |
| How It Works | 0 | 낮 | 정적 콘텐츠 |
| 실시간 지표 | 1 (Airtable 연동) | 중 | SWR + ISR |
| For Patients / For Doctors | 2 | 낮 | 정적 콘텐츠 |
| Social Proof | 3 (Founding Partners 확보 후) | 중 | 동적 데이터 |
| FAQ | 1 | 낮 | Accordion 컴포넌트 |
| 다국어 지원 | 2 (§10.6 i18n 완성 후) | 중 | I18nContext 연동 |

---

# Part XXV. PM 승인 체크리스트 (28개 항목)

**코드 작성 시작 전, Narabo가 아래 모든 항목을 확인해야 한다.**

| # | 카테고리 | 항목 | 상태 |
|---|---------|------|------|
| 1 | 비즈니스 | 11대 요구사항 설계 동의 | ⬜ |
| 2 | 비즈니스 | 수익 모델 (Founding Partners → B2B → Premium) 순서 동의 | ⬜ |
| 3 | 비즈니스 | Paywall 위치 (Depth 0 무료 / 1-2 유료) 동의 | ⬜ |
| 4 | 비즈니스 | B2B 가격대 (₩99K/₩299K/₩990K) 방향성 동의 | ⬜ |
| 5 | 비즈니스 | Grandfathering 정책 (Early Adopter 할인) 동의 | ⬜ |
| 6 | 비즈니스 | Van Westendorp 가격 검증 실행 동의 | ⬜ |
| 7 | 기술 | Phase 0 리포트 리빌드 범위 동의 | ⬜ |
| 8 | 기술 | 시스템 안정성 6대 원칙 동의 | ⬜ |
| 9 | 기술 | Await-Confirm 저장 전략 동의 | ⬜ |
| 10 | 기술 | Repository 패턴 (Airtable→Supabase 전환 대비) 동의 | ⬜ |
| 11 | 기술 | CI/CD 파이프라인 (GitHub Actions + Netlify) 동의 | ⬜ |
| 12 | 기술 | 성능 예산 (FCP<1.5s, LCP<2.5s, CLS<0.1) 동의 | ⬜ |
| 13 | 기술 | i18n 통합 전략 (네임스페이스별 분리) 동의 | ⬜ |
| 14 | 기술 | 환자-의사 매칭 알고리즘 스코어링 방식 동의 | ⬜ |
| 15 | 법률 | PIPA 동의 수집 UI 요구사항 확인 | ⬜ |
| 16 | 법률 | 건강정보 보존 기간 (3년 후 익명화) 확인 | ⬜ |
| 17 | 법률 | GDPR 삭제권 구현 범위 확인 | ⬜ |
| 18 | 운영 | 의사 온보딩 (수동 승인) 방식 동의 | ⬜ |
| 19 | 운영 | CRM 사이클 자동화 범위 확인 | ⬜ |
| 20 | 운영 | 위키 콘텐츠 파이프라인 (AI 초안 → 검수) 동의 | ⬜ |
| 21 | 운영 | 1인 운영 체제 (Narabo + Claude Code) 확인 | ⬜ |
| 22 | 운영 | 5-Phase 로드맵 순서 + 16주 기간 동의 | ⬜ |
| 23 | 비용 | AI 월간 비용 추산 (시나리오 B: ~$83/월) 확인 | ⬜ |
| 24 | 비용 | Sentry 도입 (무료 플랜 시작) 동의 | ⬜ |
| 25 | 전략 | PSST 아이템 명칭 (후보 B: "글로벌 메디컬 에스테틱 AI 리포트 SaaS") 동의 | ⬜ |
| 26 | 전략 | PSST 자금 운용 계획 (5,000만원 배분) 확인 | ⬜ |
| 27 | 전략 | 경쟁 분석 + TAM/SAM/SOM 수치 확인 | ⬜ |
| 28 | 전략 | 메인 페이지 리디자인 방향성 동의 | ⬜ |

**모든 항목이 ✅ 될 때까지 코드 구현을 시작하지 않는다.**

---

# Part XXVI. 자기 검증 체크리스트 (47개 항목)

> 본 문서의 완성도를 자체 검증하기 위한 체크리스트.
> 문서 작성 완료 후, 아래 모든 항목이 충족되어야 한다.

### A. 구조적 완성성 (10항목)

| # | 항목 | 상태 |
|---|------|------|
| A1 | §0-§23 전체 24개 섹션이 존재하는가 | ✅ |
| A2 | 모든 V2 내용이 인라인으로 포함되었는가 (외부 참조 없음) | ✅ |
| A3 | 모든 V3 내용이 인라인으로 포함되었는가 (외부 참조 없음) | ✅ |
| A4 | 목차(TOC)가 실제 섹션과 일치하는가 | ✅ |
| A5 | 팀 구조가 전체적으로 `Narabo + Claude Code`로 통일되었는가 | ✅ |
| A6 | `[코드 B]` 표현이 제거되었는가 | ✅ |
| A7 | 자기 완결형 문서 선언이 §0.2에 존재하는가 | ✅ |
| A8 | 문서 계보(V1→V4)가 명시되었는가 | ✅ |
| A9 | PM 승인 체크리스트가 28개 항목인가 | ✅ |
| A10 | 자기 검증 체크리스트가 47개 항목인가 | ✅ |

### B. 비즈니스 완성성 (10항목)

| # | 항목 | 상태 |
|---|------|------|
| B1 | 11대 비즈니스 요구사항이 모두 커버되었는가 | ✅ |
| B2 | 수익 모델 4단계 (Founding→B2B→Premium→Data)가 설계되었는가 | ✅ |
| B3 | B2B 가격이 3개 티어로 제시되었는가 | ✅ |
| B4 | Van Westendorp 가격 검증 방법이 설명되었는가 | ✅ |
| B5 | Paywall Grandfathering 정책이 설계되었는가 | ✅ |
| B6 | 경쟁사 분석이 5개 이상 포함되었는가 | ✅ |
| B7 | TAM/SAM/SOM 수치가 출처와 함께 제시되었는가 | ✅ |
| B8 | PSST 매핑 테이블이 작성되었는가 | ✅ |
| B9 | PSST 자금 운용 계획이 항목별로 배분되었는가 | ✅ |
| B10 | 전략적 아이템 명칭 후보 3개가 제시되었는가 | ✅ |

### C. 기술 완성성 (12항목)

| # | 항목 | 상태 |
|---|------|------|
| C1 | 15개 React 컴포넌트 리빌드가 설계되었는가 | ✅ |
| C2 | Zod Validator (no-throw) 설계가 포함되었는가 | ✅ |
| C3 | CSS rv7- 스코핑 규칙이 정의되었는가 | ✅ |
| C4 | Error Boundary 배치 전략이 정의되었는가 | ✅ |
| C5 | State Machine FSM 전이 테이블이 작성되었는가 | ✅ |
| C6 | 3-Depth 모델 시퀀스 다이어그램이 포함되었는가 | ✅ |
| C7 | 환자-의사 매칭 알고리즘 수도코드가 포함되었는가 | ✅ |
| C8 | CI/CD 파이프라인 (GitHub Actions YAML)이 설계되었는가 | ✅ |
| C9 | 성능 예산 수치 (FCP, LCP, CLS, TTI, JS 번들)가 정의되었는가 | ✅ |
| C10 | i18n 통합 전략 (네임스페이스, 마이그레이션 단계)이 설계되었는가 | ✅ |
| C11 | Repository 패턴 인터페이스가 정의되었는가 | ✅ |
| C12 | Mock 모드 설계가 포함되었는가 | ✅ |

### D. 운영 완성성 (8항목)

| # | 항목 | 상태 |
|---|------|------|
| D1 | 5-Phase 로드맵이 1인 운영 기준으로 재설계되었는가 | ✅ |
| D2 | 각 Phase별 Claude Code / Narabo 시간이 배분되었는가 | ✅ |
| D3 | 총 개발 시간이 현실적인가 (138h Claude Code + 75h Narabo) | ✅ |
| D4 | Narabo 주간 부하가 가용 시간 내인가 (~4.7h/주 QA) | ✅ |
| D5 | 위키 콘텐츠 파이프라인 (AI 초안 → 검수)이 설계되었는가 | ✅ |
| D6 | 의사 온보딩 플로우가 설계되었는가 | ✅ |
| D7 | CRM 사이클 자동화 (상태 전이 트리거)가 설계되었는가 | ✅ |
| D8 | 개발자 핸드오프 문서 목록과 갱신 규칙이 정의되었는가 | ✅ |

### E. 법률/인프라 완성성 (7항목)

| # | 항목 | 상태 |
|---|------|------|
| E1 | PIPA 동의 수집 UI가 설계되었는가 | ✅ |
| E2 | GDPR 삭제권 구현 수도코드가 포함되었는가 | ✅ |
| E3 | 국가별 동의 차이 (KR/EU/JP)가 정리되었는가 | ✅ |
| E4 | AI 비용 Burn Rate가 4개 시나리오로 추산되었는가 | ✅ |
| E5 | Airtable → Supabase 전환 임계점이 정의되었는가 | ✅ |
| E6 | Sentry 에러 모니터링 설정이 설계되었는가 | ✅ |
| E7 | 롤백 전략 (조건 + 실행 방법)이 정의되었는가 | ✅ |

**자기 검증 결과: 47/47 (100%)**

---

> **이 문서는 [전략] Window A가 작성한 ConnectingDocs.ai 최종 통합 마스터 플랜 V4입니다.**
>
> **V1** (plan.md, 729줄): Phase 0 기술 리빌드 세부 가이드
> **V2** (MASTER_PLAN_V2.md, 1,565줄): 11대 비즈니스 요구사항 + 안정성 원칙
> **V3** (MASTER_PLAN_V3.md, 1,194줄): V2 + 수익·비용·법률·인프라·QA·취약점 6개 축
> **V4** (본 문서): **모든 이전 문서를 인라인으로 포함 + 13개 신규 섹션**
>
> ⚠️ **V4는 자기 완결형이다. V1-V3은 더 이상 참조할 필요 없다.**
>
> 문서 계보: plan.md → V2 → V3 → **MASTER_PLAN_V4.md (최종)**
>
> **Narabo 승인 (28개 항목 ✅) → Phase 0 코드 착수 → Phase 1 → ... → Phase 4**
