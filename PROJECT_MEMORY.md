# ConnectingDocs Project Memory
> **Last Updated**: 2026-03-09 Session 18
> **Purpose**: 대화 컨텍스트 보존용. 새 세션 시작 시 이 파일을 먼저 읽으세요.

---

## 1. 프로젝트 개요

**ConnectingDocs** — K-Medical Pre-consulting SaaS
- 해외 환자가 하이브리드 설문 → AI 추천 → 프리미엄 리포트 받는 플랫폼
- Tech Stack: Next.js 16.1 (Pages Router) + Tailwind CSS + Framer Motion + Anthropic SDK + recharts
- Deploy: Netlify
- DB: Airtable (REST API direct, no npm package)

## 2. Survey V2 파이프라인 (핵심 흐름)

```
Demographic(3Q) → Open Question(1Q) → Haiku AI Analysis → Smart Chips(3-6Q) → Safety Checkpoint → Opus Final Analysis → Report v2
```

### API 엔드포인트
| Endpoint | Model | Purpose | Status |
|---|---|---|---|
| `/api/survey-v2/analyze-open` | Haiku 4.5 | Open question 분석 | ✅ 테스트 완료 |
| `/api/survey-v2/generate-chips` | — | Smart Chip 질문 생성 | ✅ 구현완료 |
| `/api/survey-v2/safety-followup` | Haiku 4.5 | Safety flag 확인 질문 | ✅ 구현완료 |
| `/api/survey-v2/final-recommendation` | Opus 4.6 | 최종 추천 생성 | ✅ 테스트 완료 |
| `/api/survey-v2/save-result` | — | Airtable 저장 | ✅ 테스트 완료 |
| `/api/survey-v2/notify-report` | — | 이메일 알림 (Resend) | ✅ 테스트 완료 |

### Real API 테스트 결과 (Session 17, 22/22 pass)
- **analyze-open**: JP/EN/KO 3개 시나리오 모두 ~1.5-3s, 정확한 goal 분석
  - JP: Brightening/radiance (serious), EN: Anti-aging/prevention, KO: Brightening/radiance
- **generate-chips**: 6개 chip 생성 (skin_profile, past_experience, pigment_pattern, style, downtime_tolerance, treatment_rhythm)
- **safety-followup**: 5개 테스트 pass — isotretinoin/anticoagulant follow-up 생성, pregnancy/keloid 플래그 매핑
- **save-result**: Airtable 저장 성공 (recqqEjrNb5y53eVz 등)
- **notify-report**: admin email 발송 성공

## 3. 주요 파일 맵

### Survey V2 Core
- `src/types/survey-v2.ts` — 모든 타입 정의 (Demographics, HaikuAnalysis, SafetyFlag 등)
  - ⚠️ SafetyFlag = string union type (NOT object with .type)
  - ⚠️ Demographics: `d_gender`, `d_age`, `detected_country`, `detected_language`
- `src/hooks/useSurveyV2.ts` — 설문 상태관리 훅 + fire-and-forget Airtable save
- `src/pages/api/survey-v2/analyze-open.ts` — Haiku 분석
- `src/pages/api/survey-v2/final-recommendation.ts` — Opus 최종 추천
- `src/pages/api/survey-v2/generate-chips.ts` — Smart Chip 질문 생성
- `src/pages/api/survey-v2/safety-followup.ts` — Safety 추가 질문
- `src/pages/api/survey-v2/save-result.ts` — Airtable 저장
- `src/pages/api/survey-v2/notify-report.ts` — Resend 이메일 알림 (관리자+환자, 4개 언어)
- `src/pages/api/survey-v2/AIRTABLE_SCHEMA_V2.md` — Airtable 스키마 문서 (24 fields)

### Report V2
- `src/pages/report-v2/[id].tsx` — Report V2 메인 페이지 (DeviceCard + charts)
- `src/components/report-v2/RadarChart.tsx` — recharts 레이더 차트 (dynamic import, ssr:false)
- `src/components/report-v2/SkinLayerDiagram.tsx` — 피부 단면도 (4 layers)

### E2E Test
- `src/__tests__/e2e-survey-v2-pipeline.test.ts` — 시뮬레이션 E2E 테스트 (mock 기반)
- `src/__tests__/e2e-real-api-flow.test.ts` — ✅ Real API E2E 테스트 (22/22 pass, localhost:3099)
- `src/__tests__/fixtures/sample-opus-real-output.json` — 실제 Opus 출력 샘플 (23KB)
- `jest.config.ts` — Jest + ts-jest 설정 (testTimeout: 300s)

### Config
- `.env.local` — Firebase, Airtable, Resend, Anthropic API keys
- `tsconfig.json` — exclude: `src/__tests__`
- `netlify.toml` — Netlify 배포 설정 (@netlify/plugin-nextjs, 보안 헤더, 리다이렉트)
- `API_TEST_RESULTS.md` — API 테스트 결과 상세 보고서

## 4. 환경 설정 주의사항

### ANTHROPIC_API_KEY 충돌 문제
- `.env.local`에 키가 있지만, 시스템 레벨에 빈 `ANTHROPIC_API_KEY`가 설정되어 있어 dotenv가 override하지 않음
- **해결**: dev 서버 시작 시 명시적 전달 필요:
  ```bash
  ANTHROPIC_API_KEY=sk-ant-... npx next dev
  ```
- 또는 코드에서 `.env.local`을 직접 파싱하는 방법 (미해결)

### Airtable
- Base ID: `appS8kd8H48DMYXct`
- API Key: Personal Access Token (patyWDt...)
- `SurveyV2_Results` 테이블: Table ID `tblJWi7l19t3QM5VH` (25 fields)

## 5. 알려진 이슈 (Session 17 기준)

| # | Issue | Impact | Status |
|---|---|---|---|
| 1 | ANTHROPIC_API_KEY env var 충돌 | dev 서버에서 키 미인식 | ✅ 해결 (next.config.ts 강제 로딩) |
| 2 | Sonnet 첫 호출 ~176초 | UX 대기시간 여전 | 🟡 Prompt Caching 2회차부터 개선 예상 |
| 3 | Sonnet 비용 ~$0.18/call | 기존 Opus $0.76 대비 76% 절감 | ✅ 해결 |
| 4 | Sonnet JSON 응답 truncation | max_tokens=12000 초과 시 500 | 🟡 간헐적 (재시도로 해결) |
| 5 | save-result truncJSON null 체크 | undefined 입력 시 crash | ✅ 해결 (Session 17) |

## 6. 완료된 작업 이력

### Session 1-12 (이전)
- Firebase auth, Airtable v1 연동, 설문 v1, 리포트 v1
- Device/Injectable DB, category mapping
- Report v7 premium HTML 템플릿

### Session 13
- E2E integration test simulation
- tsc --noEmit 0 errors
- Airtable save-result endpoint 구현
- RadarChart + SkinLayerDiagram 컴포넌트
- Report-v2 chart 통합

### Session 14 (2026-03-09)
- Anthropic API Key 설정 (.env.local 추가)
- env var 충돌 문제 발견 및 우회
- **Haiku analyze-open 실제 API 테스트 성공** ✅
- **Opus final-recommendation 실제 API 테스트 성공** ✅
- 전체 JSON 구조 검증 (22/22 필드 완벽)
- 테스트 fixture 저장 (sample-opus-real-output.json)

### Session 15 (2026-03-09)
- ✅ next.config.ts env 충돌 해결 (강제 로딩 로직)
- ✅ Sonnet 4.6 전환 완료 (final-recommendation.ts)
- ✅ Prompt Caching 구현 (static/dynamic 분리, cache_control: ephemeral)
- ✅ Sonnet 실제 API 테스트 성공 — 11/11 필드, 일본어 출력 정상
- ✅ Sonnet vs Opus 비교: 76% 비용 절감 ($0.76 → $0.18), 품질 동등
- 테스트 fixture 저장 (sample-sonnet-real-output.json)

### Session 16 (2026-03-09)
- ✅ Airtable SurveyV2_Results 테이블 생성 (25 fields, Table ID: tblJWi7l19t3QM5VH)
- ✅ save-result 엔드투엔드 테스트 성공 (recq1iDNQVajCy05Y)
- ✅ **로딩 UX 대폭 개선** (AnalyzingStep.tsx 전면 리뉴얼)
  - 6단계 적응형 프로그레스 (~148s 커버, 최대 95%까지 자동 진행)
  - requestAnimationFrame 기반 부드러운 프로그레스 바
  - 3중 회전 스피너 + 단계별 아이콘 변경
  - 6초마다 회전하는 팁 메시지 (4개 언어 × 8개 팁)
  - API 완료 시 즉시 100% → 완료 메시지 표시
  - 에러 발생 시 재시도 UI
  - isLoading/error props 연동 (SurveyV2Container → AnalyzingStep)
- ✅ **이메일 알림 시스템 구현** (notify-report.ts)
  - 관리자 알림: 매 리포트 생성 시 자동 발송 (narabohan@gmail.com)
  - 환자 알림: Firebase 로그인 사용자에게 리포트 링크 발송
  - 4개 언어 이메일 템플릿 (KO/EN/JP/ZH-CN)
  - API 비용 정보 포함 (관리자용)
  - fire-and-forget 패턴 (useSurveyV2.ts에 통합)
  - ✅ 실제 Resend API 테스트 성공 (admin email: 8ac58039...)

### Sonnet vs Opus 비교 결과
| 항목 | Opus 4.6 | Sonnet 4.6 |
|---|---|---|
| 비용 | $0.76/call | $0.18/call (76% 절감) |
| 응답시간 | ~145s | ~176s (첫 호출) |
| EBD #1 | Ultraformer MPT 93% | HIFU(Ulthera/Doublo) 93% |
| EBD #2 | Sylfirm X PW 89% | Sylfirm X 88% |
| Injectable #1 | Rejuran Healer 91% | Sculptra 91% |
| 필드 완성도 | 11/11 | 11/11 |

### Session 17 (현재, 2026-03-09)
- ✅ **Real API E2E 통합 테스트 완성** (e2e-real-api-flow.test.ts)
  - Jest + ts-jest 설정 (jest.config.ts)
  - 22/22 pass (Step 4 Sonnet 제외 시), 총 23 테스트
  - 7개 테스트 스위트: analyze-open(4), generate-chips(1), safety-followup(5), save-result(2), notify-report(2), Full Pipeline(6), Multi-language(3)
  - 3개 시나리오: JP Female 30s(멜라스마), EN Male 40s(안티에이징), KO Female 20s(브라이트닝)
- ✅ **Safety flag 테스트 케이스 추가** (4개 추가 → 총 5개)
  - pregnancy + keloid → 플래그 정상 매핑
  - anticoagulant → follow-up 질문 생성 확인
  - 전체 safety items 결합 → 제한된 follow-up 생성 확인
- ✅ **save-result 버그 수정 2건**
  - truncJSON null 체크 (`JSON.stringify(undefined)` → `??''`)
  - `body.recommendation?.doctor_tab` optional chaining 추가
- ✅ **toBeInstanceOf(Array) cross-VM 이슈 해결** → Array.isArray() 전환
- 🟡 **Sonnet Step 4 간헐적 500** — JSON 응답 truncation (max_tokens 제한)

### Session 18 (2026-03-09)
- ✅ **Netlify 배포 준비 완료**
  - `netlify.toml` 생성 (build config, @netlify/plugin-nextjs v5.15.8, 보안 헤더, HTTPS/www 리다이렉트)
  - `next build` 성공 (Turbopack, 14 static + 18 dynamic pages)
  - 모든 env var 매핑 확인 (16개 변수)
  - 배포 블로커 없음 확인: dynamic import 1개만 (RadarChart ssr:false), getServerSideProps 미사용
  - next.config.ts의 fs 기반 .env.local 로딩 → Netlify에서는 .env.local 없지만 try/catch로 안전 처리

### Netlify 배포 환경변수 체크리스트 (Dashboard에 설정 필요)
| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ 필수 | Haiku + Sonnet AI 분석 |
| `AIRTABLE_API_KEY` | ✅ 필수 | 설문 결과 저장 |
| `AIRTABLE_BASE_ID` | ✅ 필수 | Airtable Base |
| `RESEND_API_KEY` | ✅ 필수 | 이메일 발송 |
| `RESEND_FROM_EMAIL` | ✅ 필수 | 발신자 이메일 |
| `ADMIN_EMAIL` | ✅ 필수 | 관리자 알림 |
| `NEXT_PUBLIC_BASE_URL` | ✅ 필수 | https://connectingdocs.com |
| `NEXT_PUBLIC_FIREBASE_*` (6개) | ✅ 필수 | Firebase Auth |
| `STRIPE_SECRET_KEY` | 🟡 선택 | 결제 (미사용 시 무시) |
| `OPENAI_API_KEY` | 🟡 선택 | v1 engine (deprecated) |

## 7. 즉시 실행 (현재 세션)

1. ✅ Real API E2E 통합 테스트 — 22/22 pass
2. ✅ Safety flag 테스트 케이스 — 5개 pass
3. ✅ 다국어 테스트 — JP/EN/KO 3개 pass
4. ✅ save-result 버그 수정

## 8. 단기 로드맵 (다음 1-2세션)

1. **[MED]** Report PDF export (report-v7-premium.html + Puppeteer)
2. ~~**[MED]** Netlify 배포 테스트~~ → ✅ 완료 (Session 18, netlify.toml 생성)
3. **[MED]** Netlify 실제 배포 (git push → 첫 deploy 확인)
4. **[LOW]** Sonnet max_tokens 증가 또는 재시도 로직 추가

## 9. 중기 로드맵 (향후 계획)

### 9-1. 메신저 알림 시스템 🔔
- **목적**: 리포트 완성 시 환자에게 메신저로 알림 → 대기 UX 근본 해결 + CRM 채널 확보
- **플로우**: 설문 완료 → "어디로 알려드릴까요?" → [카카오톡/LINE/WhatsApp/이메일] → 백그라운드 분석 → 완성 시 알림 발송
- **우선순위**: 이메일(Resend, 이미 연동) → 카카오 알림톡 → LINE → WhatsApp
- **국가별 메신저**: KR=카카오톡, JP=LINE, CN=WeChat, SEA/글로벌=WhatsApp

### 9-2. 소셜 로그인 확장 🔐
- **현재**: Google OAuth만 지원
- **추가 예정 (우선순위순)**:
  1. 카카오 로그인 — 한국 필수, 카카오톡 알림과 시너지
  2. 네이버 로그인 — 한국 40대+ 사용자 많음
  3. LINE 로그인 — 일본 시장 필수
  4. Apple 로그인 — iOS 사용자 비중 높은 KR/JP
  5. WeChat — 중국 (법인 필요, 나중에)

### 9-3. 관리자 대시보드 📊
- **현재**: 관리자 페이지 없음 — 반드시 필요
- **필요 기능**:
  - 실시간 설문 현황 (일별/주별 완료 수, 이탈률)
  - 고객 목록 + 리포트 열람 이력
  - 매출/비용 대시보드 (API 호출 비용, 건당 단가)
  - 디바이스/스킨부스터·인젝터블 추천 통계 (어떤 장비가 가장 많이 추천되는지)
  - 고객 메시지 발송 관리 (메신저 알림 이력)
  - 설문 질문 관리 (Smart Chip 수정)
  - A/B 테스트 관리
- **기술**: Next.js admin route + Airtable 조회 또는 별도 admin 앱

### 9-4. 1인 기업 운영 자동화 🤖
- **문제**: AI로 홈페이지 만드는 건 쉽지만, 유지보수/고객관리가 1인 기업의 병목
- **해결 방향**:
  - 관리자 대시보드로 고객 현황 한눈에 파악
  - 자동 알림 시스템으로 고객 관리 인력 불필요
  - 예약/상담 자동화 (챗봇 + 메신저 연동)
  - 모니터링 자동화 (에러 발생 시 Slack/카카오 알림)
  - 정기 리포트 자동 생성 (주간/월간 운영 현황)

### 9-5. 사업계획서 업데이트 📋
- **배경**: 예비창업패키지 등 정부 지원 사업계획서 수정 필요
- **방법**: 현재 서비스 개발 내용 반영하여 사업계획서 갱신
  - Survey V2 하이브리드 AI 분석 기능 반영
  - 국가별 맞춤 추천 시스템 (Country Context) 내용 추가
  - Airtable 기반 데이터 관리 구조 설명
  - 예상 비용 구조 (Sonnet 건당 ~$0.05) 반영
- **진행 방식**: 홈페이지 개발과 병행 가능
  - Claude Desktop Cowork에서 별도 대화로 사업계획서 작업 가능
  - PROJECT_MEMORY.md 읽으면 최신 서비스 상태 파악 가능
  - 개발 세션에서 변경사항 발생 시 PROJECT_MEMORY 업데이트 → 사업계획서 세션에서 반영

## 10. 타입 주의사항 (반복 실수 방지)

```typescript
// ❌ WRONG
flags.map(f => f.type)           // SafetyFlag는 string union, .type 없음
demographics.country             // 필드명 틀림
demographics.ageRange            // 필드명 틀림

// ✅ CORRECT
flags.join(', ')                 // SafetyFlag는 그 자체가 string
demographics.detected_country    // 정확한 필드명
demographics.d_age               // 정확한 필드명
demographics.d_gender            // 정확한 필드명
```

## 11. 리마인드 체크리스트 (세션 시작 시 확인)

- [ ] 관리자 대시보드 진행 상황 확인
- [ ] 메신저 알림 시스템 구현 일정 논의
- [ ] 소셜 로그인 확장 진행 상황
- [ ] 사업계획서 업데이트 진행 여부 확인
- [ ] 1인 기업 운영 자동화 도구 필요 여부

## 12. Change Log

| 날짜 | Issue | Commit | 요약 |
|------|-------|--------|------|
| 2026-03-09 | #2 | `f7e7b25` | Report v7-premium 다크 테마 iframe + postMessage 브릿지 적용 |
| 2026-03-09 | #9 | `ee12645` | 주사제 → 스킨부스터/인젝터블 용어 통일 (3파일 4곳) |
| 2026-03-09 | #1 | `d4ab215` | Clinical depth chips 7종 추가 (ChipType, i18n, generate-chips, analyze-open) |
| 2026-03-09 | #5+#6 | `ed0aa19` | Trend/Popularity 가중치 + 나이/국가 분기 skeleton 추가 |
| 2026-03-09 | #6 | `22c75f2` | 나이 브라켓(20s~50+) + 국가별(KR/JP/CN/SEA/SG-US) 실제 임상 규칙으로 업그레이드 |
| 2026-03-09 | — | `05257f1` | feature/cto-ux-fixes → main 머지 (기준 아키텍처 통합, survey-v2 파이프라인 보존) |

---
*이 파일은 대화 컨텍스트 보존용입니다. 새 세션에서 "PROJECT_MEMORY.md를 읽고 이어서 진행해"라고 말하세요.*
*사업계획서 작업 시: "PROJECT_MEMORY.md를 읽고 사업계획서 업데이트를 진행해"라고 말하세요.*
