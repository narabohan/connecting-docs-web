# RESEARCH_REPORT_V7: 현재 리포트 코드베이스 상세 분석 보고서

> **작성일**: 2026-03-15
> **대상 코드**: `report-v7-premium.html` (8,452 lines, 549KB), `[id].tsx` (487 lines), `RadarChart.tsx` (109 lines), `SkinLayerDiagram.tsx` (140 lines)
> **목적**: React 전환 전 현행 구조 완전 파악 (Phase 0 사전조사)
> **원칙**: 코드 수정 없음 — 읽기 전용 리서치

---

## 1. report-v7-premium.html 전체 구조 (섹션별)

### 1.1 파일 개요

| 구간 | 라인 범위 (약) | 내용 |
|------|-------------|------|
| HEAD + CSS | 1–640 | `<head>`, 디자인 시스템 CSS (~600 lines) |
| Animations | 637–690 | `@keyframes` 11개, 마이크로인터랙션 |
| Skeleton Loading | 1270–1280 | 스켈레톤 로딩 애니메이션 |
| Language Switcher | ~700–750 | 9개 언어 셀렉터 드롭다운 |
| Tab Bar | ~750–770 | Patient / Doctor 2-Tab 전환 |
| Patient Tab HTML | ~770–2590 | `#tab-patient` 전체 |
| Doctor Tab HTML | ~2597–3680 | `#tab-doctor` 전체 |
| JavaScript: I18N | ~3683–5930 | 9개 언어 딕셔너리 (~100+ 키/언어) |
| JavaScript: Core | ~5930–8150 | 탐색/선택/렌더링/차트 로직 |
| JavaScript: initReport + Bridge | ~8150–8452 | postMessage 브릿지, 데이터 주입 |

### 1.2 Patient Tab (`#tab-patient`) — Zone별 구조

**Zone 1: Patient Profile**
- `.p-header` — 아바타(`.p-avatar`), 이름(`.p-name`), 메타정보(`.p-meta`)
- `.p-chips` — 피부타입, 우려사항, 연령대 등 환자 태그 칩
- 데이터 속성: `data-i18n` 기반 다국어 레이블

**Zone 2: AI EBD Device Cards**
- `.rec-section` 컨테이너
- `.rec-grid` — 수평 스크롤 카드 그리드 (`scroll-snap-type: x mandatory`)
- `.rec-card.ebd-card` — 개별 디바이스 카드
  - `.rec-badge` — 추천 순위 뱃지 (1st, 2nd 등)
  - `.rec-head` — 디바이스 썸네일 SVG + 이름 + Evidence Badge
  - `.rec-summary` — AI 요약 텍스트
  - `.rec-expand-btn` → `.rec-detail` — 확장 패널
    - `.rec-gauges` — Pain/Downtime/Safety 게이지 (5단계 도트)
    - `.why-fit` — "왜 나에게 맞는가" 임상 설명
    - `.moa-section` — MOA (Mechanism of Action)
    - `.moa-infographic` — 인라인 SVG 인포그래픽
    - `.moa-inline-summary` — MOA 아이콘 요약 + 모달 팝업 연결
- `.ai-desc-panel.ebd-desc` — AI 설명 패널 (이름, 본문, 소스, 신뢰도)

**Zone 3: AI Injectable Cards**
- `.rec-card.inj-card` — Zone 2와 동일 패턴, rose 색상 테마
- `.ai-desc-panel.inj-desc` — rose 컬러 AI 설명

**Zone 4: 3D Skin Layer Diagram**
- `.skin-3d-section` → `.skin-3d-container` → `.skin-3d-inner`
- 대형 인라인 SVG: 6개 레이어 (epidermis, upper dermis, deep dermis, subcutaneous fat, SMAS, muscle)
- 동적 에너지 빔 SVG 애니메이션 (선택된 디바이스 타겟 깊이 시각화)

**Zone 5: Radar Chart + Practical Info**
- `.radar-card` — 커스텀 SVG 레이더 차트 (`#radar-svg`)
  - 5축: Tightening / Lifting / Volume / Brightening / Texture
  - `.radar-scores` — 5개 점수 수치 그리드
  - `.radar-pd-indicators` — Pain/Downtime 5단계 인디케이터
- `.radar-legend` — EBD(cyan) / INJ(rose) 범례

**Zone 5B: Signature Solutions**
- `#sig-panel` → `.sig-bar-list` — 확장 가능 바 레이아웃
- `.sig-bar` — 각 시그니처 솔루션 (순위, 아바타, 이름, 콤보 칩, 적합도 점수)
- `.sig-bar-detail` — 확장 상세 (디바이스 조합, 시너지, 의사 프로필)
- `.sig-bar-fit` — 적합도 표시 (high/mid/low 색상 구분)

**Treatment Plan Timeline**
- `.plan-timeline` — 수평 스크롤 타임라인
- `.plan-phase` — 위상별 카드 (배지, 제목, 항목, 메타)

**Homecare Guide**
- `.homecare-grid` — 2x2(모바일) / 4열(데스크탑)
- `.hc-card` — SPF, 보습, 주의사항, 재생 4개 카드

**Disclaimer + CTA**
- `.p-disclaimer` — 면책조항
- `.p-cta-btn` — 상담 신청 CTA 버튼

### 1.3 Doctor Tab (`#tab-doctor`) — Zone별 구조

**Sticky Selection Bar**
- `#sticky-bar` — EBD/INJ 디바이스 칩 빠른 선택 (`.sb-chip`)

**Clinic Equipment Bar**
- `.doc-equip-bar` — sticky top bar, 보유/미보유 장비 표시
- `.deb-chip` — owned/not-owned/in-protocol 상태별 스타일링

**Zone 1: Patient Header**
- `.d-hero` — 대형 환자 이름(28px), 인구통계, 국기 이모지
- `.d-hero-chips` — `.d-hchip` 태그 (alert 상태 포함)

**Country Intelligence**
- `.d-country-insight` — 환자 국가 기반 미용시술 인사이트
- 7개 국가 참조 탭 (KR, JP, TH, SA, CN, VN, SG, AU) — `<details>` 토글
- `.d-ci-grid` — 키-값 정보 그리드

**Zone 2: Selected Signature Solution**
- `.d-selected-card` — 환자 선택 시그니처 솔루션 상세
- `.d-sel-scores` — 점수 표시
- 시술 순서 가이드: `.d-order-flow` → `.d-order-step` (화살표 연결)

**Survey Detail**
- `.d-survey-grid` → `.d-survey-card` — Q&A 카드 (질문/답변/태그)
- `.d-survey-expand` — 더보기 토글
- `.d-qa-list` — Q&A 아코디언

**Pre-Assessment Checklist**
- `.d-checklist` → `.d-check-item` — 임상 체크리스트 (ok/risk/caution 아이콘)

**Protocol Cards**
- `.d-proto-card` — 추천 프로토콜 상세
  - `.d-proto-head` — 번호 + 디바이스명
  - `.d-proto-params` — 시술 파라미터 그리드 (에너지, 깊이, 반복 등)
  - `.d-proto-notes` — 주의사항
  - 드래그 핸들 + 제거 버튼 (`.d-proto-drag-handle`, `.d-proto-remove`)

**Equipment Pool Dock**
- `.equip-dock` — 하단 고정 패널 (접힘/펼침)
- `.equip-pool` → `.equip-chip` — EBD/INJ 장비 칩 (grab 커서, 드래그 가능)
- `.d-proto-drop-zone` — 프로토콜 드롭존

**Doctor Notes + Save**
- `.d-notes textarea` — 의사 메모 영역
- `.d-save-btn` — 저장 버튼

---

## 2. CSS 변수, 클래스명, 애니메이션 목록

### 2.1 CSS Custom Properties (`:root`)

| 변수명 | 값 | 용도 |
|--------|------|------|
| `--bg` | `#09090b` | 전체 배경 (near-black) |
| `--surface` | `rgba(255,255,255,0.05)` | 1차 카드/패널 배경 |
| `--surface-2` | `rgba(255,255,255,0.08)` | 2차 표면 (hover, 내부 블록) |
| `--surface-3` | `rgba(255,255,255,0.12)` | 3차 표면 (활성 상태) |
| `--border` | `rgba(255,255,255,0.10)` | 기본 테두리 |
| `--border-2` | `rgba(255,255,255,0.14)` | 강조 테두리 |
| `--text` | `#e4e4e7` | 기본 텍스트 (zinc-200) |
| `--text-hi` | `#f4f4f5` | 강조 텍스트 (zinc-100) |
| `--text-2` | `#a1a1aa` | 보조 텍스트 (zinc-400) |
| `--text-3` | `#71717a` | 약한 텍스트 (zinc-500) |
| `--cyan` | `#22d3ee` | 주 브랜드 색상 (EBD 테마) |
| `--cyan-dim` | `rgba(34,211,238,0.12)` | cyan 배경 |
| `--cyan-glow` | box-shadow 값 | cyan 글로우 효과 |
| `--cyan-border` | `rgba(34,211,238,0.30)` | cyan 테두리 |
| `--red` | `#f87171` | 위험/경고 |
| `--red-dim` | `rgba(248,113,113,0.10)` | red 배경 |
| `--amber` | `#fbbf24` | 주의/시그니처 솔루션 |
| `--amber-dim` | `rgba(251,191,36,0.10)` | amber 배경 |
| `--green` | `#4ade80` | 안전/확인 |
| `--green-dim` | `rgba(74,222,128,0.10)` | green 배경 |
| `--violet` | `#a78bfa` | 보조 강조 |
| `--violet-dim` | `rgba(167,139,250,0.10)` | violet 배경 |
| `--rose` | `#fb7185` | Injectable 테마 |
| `--rose-dim` | `rgba(251,113,133,0.10)` | rose 배경 |
| `--orange` | `#fb923c` | 트렌드/보조 |
| `--orange-dim` | `rgba(251,146,60,0.10)` | orange 배경 |
| `--radius` | `16px` | 대형 border-radius |
| `--radius-sm` | `10px` | 중형 border-radius |
| `--radius-xs` | `6px` | 소형 border-radius |

### 2.2 주요 CSS 클래스 네이밍 컨벤션

**공통 컴포넌트 클래스**

| 접두사 | 네임스페이스 | 예시 |
|--------|-------------|------|
| `.glass` | 글래스모피즘 카드 | `backdrop-filter: blur(12px)` |
| `.neon-tag` | 형광 태그 | `.neon-tag.cyan`, `.neon-tag.rose` 등 6가지 |
| `.evidence-badge` | 근거수준 뱃지 | `.ev-5`(green) ~ `.ev-2`(gray) |
| `.sec-label` | 섹션 라벨 | 좌측 3px 컬러 바 + 대문자 |
| `.tab-btn` | 탭 버튼 | `.active` 상태에서 cyan border-bottom |

**Patient Tab 접두사 (`.p-`)**

| 클래스 | 용도 |
|--------|------|
| `.p-container` | 환자 탭 최대폭 컨테이너 (620px, 768px+: 760px) |
| `.p-header` | 프로필 헤더 |
| `.p-avatar` | 아바타 원형 |
| `.p-name`, `.p-meta` | 이름, 메타 |
| `.p-chips`, `.p-chip` | 정보 칩 |
| `.p-disclaimer` | 면책조항 |
| `.p-cta`, `.p-cta-btn` | CTA 버튼 |

**Recommendation Card 클래스 (`.rec-`)**

| 클래스 | 용도 |
|--------|------|
| `.rec-section` | 추천 섹션 컨테이너 |
| `.rec-grid` | 수평 스크롤 카드 그리드 |
| `.rec-card` | 카드 본체 (`.ebd-card` / `.inj-card`) |
| `.rec-badge` | 순위 뱃지 |
| `.rec-head`, `.rec-thumb`, `.rec-name`, `.rec-sub` | 카드 헤더 요소들 |
| `.rec-summary` | 카드 요약 |
| `.rec-expand-btn`, `.rec-detail` | 확장/축소 |
| `.rec-gauges`, `.rec-gauge-dot` | Pain/Downtime/Safety 게이지 |

**AI 설명 패널 (`.ai-desc-`)**

| 클래스 | 용도 |
|--------|------|
| `.ai-desc-panel` | 패널 컨테이너 (`.ebd-desc` / `.inj-desc`) |
| `.ai-desc-header`, `.ai-tag` | 헤더 + "AI" 태그 |
| `.ai-desc-body` | 설명 본문 |
| `.ai-desc-footer`, `.ai-src`, `.ai-confidence` | 소스 + 신뢰도 |

**시그니처 솔루션 (`.sig-`)**

| 클래스 | 용도 |
|--------|------|
| `.sig-section` | amber 테두리 컨테이너 |
| `.sig-bar-list`, `.sig-bar` | 바 리스트, 개별 바 |
| `.sig-bar-head`, `.sig-bar-rank`, `.sig-bar-fit` | 바 헤더 구성요소 |
| `.sig-bar-detail`, `.sig-detail-grid` | 확장 상세 패널 |
| `.sig-best`, `.sig-active`, `.sig-open` | 상태 클래스 |

**MOA 관련**

| 클래스 | 용도 |
|--------|------|
| `.moa-section`, `.moa-content` | MOA 텍스트 |
| `.moa-infographic` | MOA SVG 인포그래픽 슬롯 |
| `.moa-inline-summary` | 인라인 아이콘 요약 |
| `.moa-modal-overlay`, `.moa-modal` | 풀스크린 MOA 모달 |
| `.moa-cat-badge` | 카테고리 뱃지 (hifu/laser/rf/pdrn/pdlla/plla) |

**Plan & Homecare**

| 클래스 | 용도 |
|--------|------|
| `.plan-timeline`, `.plan-phase` | 타임라인 수평 스크롤 |
| `.pp-badge`, `.pp-title`, `.pp-items` | 위상 카드 요소 |
| `.homecare-grid`, `.hc-card` | 홈케어 그리드 |

**Doctor Tab 접두사 (`.d-`)**

| 클래스 | 용도 |
|--------|------|
| `.d-container` | 의사 탭 최대폭 컨테이너 (900px) |
| `.d-hero`, `.d-hero-name`, `.d-hero-chips` | 환자 대형 헤더 |
| `.d-section`, `.d-section-title` | 섹션 구분 |
| `.d-selected-card`, `.d-sel-*` | 선택 솔루션 카드 |
| `.d-survey-grid`, `.d-survey-card` | 설문 Q&A 그리드 |
| `.d-checklist`, `.d-check-item` | 사전평가 체크리스트 |
| `.d-proto-card`, `.d-proto-params` | 프로토콜 카드 |
| `.d-country-insight`, `.d-ci-*` | 국가별 인사이트 |
| `.d-order-flow`, `.d-order-step` | 시술 순서 가이드 |

**Equipment (`.deb-`, `.equip-`)**

| 클래스 | 용도 |
|--------|------|
| `.doc-equip-bar`, `.deb-chip` | 상단 장비 바 |
| `.equip-dock`, `.equip-pool`, `.equip-chip` | 하단 장비 풀 독 |
| `.deb-chip.owned`, `.deb-chip.not-owned` | 보유/미보유 상태 |
| `.d-proto-drop-zone` | 프로토콜 드롭존 |

**Sticky Bar (`.sticky-bar`, `.sb-`)**

| 클래스 | 용도 |
|--------|------|
| `.sticky-bar` | Patient Tab 스티키 선택 바 |
| `.sb-chip`, `.sb-chip.active-ebd`, `.sb-chip.active-inj` | 디바이스 칩 |

### 2.3 애니메이션 (`@keyframes`) 목록

| 애니메이션 | 라인 | 용도 |
|-----------|------|------|
| `fadeUp` | 51 | 탭 전환 시 컨텐츠 페이드업 |
| `countPulse` | 646 | 점수 업데이트 시 펄스 효과 |
| `shimmer` | 650 | 배경 시머 효과 |
| `selectRing` | 654 | EBD 카드 선택 시 cyan 링 |
| `selectRingRose` | 656 | INJ 카드 선택 시 rose 링 |
| `slideDown` | 660 | 위에서 아래로 슬라이드 |
| `riskPulse` | 667 | Safety flag 경고 펄스 |
| `dotFill` | 671 | 게이지 도트 채우기 |
| `moaShimmer` | 683 | MOA 인포그래픽 시머 |
| `skeletonWave` | 1275 | 스켈레톤 로딩 웨이브 |
| `skeletonReveal` | 1277 | 스켈레톤에서 실제 컨텐츠 전환 |

**CSS Transition 패턴**:
- 카드 전환: `cubic-bezier(.4,0,.2,1)` (일관된 ease 커브)
- 확장/축소: `max-height` 트랜지션 (0 ↔ 600px/900px)
- 글로우 효과: `box-shadow` 트랜지션
- 색상 전환: `.3s ~ .4s ease`

### 2.4 반응형 브레이크포인트

| 브레이크포인트 | 적용 |
|--------------|------|
| 580px | `split-view` 2열, `homecare-grid` 4열, `d-survey-grid` 2열 |
| 600px | `d-alt-grid` 2열 |
| 768px | `p-container` 760px, 24px 패딩 |

### 2.5 썸네일 그래디언트 클래스

| 클래스 | 색상 | 대상 장비 카테고리 |
|--------|------|-----------------|
| `.thumb-us` | `#1e40af → #3b82f6` | 초음파 (Ultrasound) |
| `.thumb-rf` | `#991b1b → #ef4444` | RF |
| `.thumb-mw` | `#14532d → #16a34a` | 마이크로웨이브 |
| `.thumb-hifes` | `#9a3412 → #f97316` | HIFES |
| `.thumb-laser` | `#4c1d95 → #7c3aed` | 레이저 |
| `.thumb-inj` | `#831843 → #ec4899` | Injectable 1 |
| `.thumb-inj2` | `#064e3b → #10b981` | Injectable 2 |
| `.thumb-inj3` | `#713f12 → #eab308` | Injectable 3 |

---

## 3. 데이터 바인딩 구조

### 3.1 전체 데이터 플로우

```
sessionStorage('connectingdocs_v2_report')
    │
    ▼
[id].tsx (ReportPayload parse)
    │
    ▼ postMessage { type: 'INIT_REPORT', payload: reportData }
    │
    ▼
report-v7-premium.html → initReport(data)
    │
    ├── injectPatientI18n(lang, patient)     → Zone 1 DOM 텍스트
    ├── renderEBDCards(ebd_devices)           → Zone 2 카드 HTML 재생성
    ├── renderINJCards(inj_devices)           → Zone 3 카드 HTML 재생성
    ├── injectEBDData(ebd_devices)           → EBD_SCORES[], EBD_PD[] 등 배열 채움
    ├── injectINJData(inj_devices)           → INJ_SCORES[], INJ_PD[] 등 배열 채움
    ├── injectSignatureSolutions(solutions)  → SIGNATURE_SOLUTIONS[] 채움
    ├── renderSignatureSolutions()           → Zone 5B DOM 생성
    ├── injectSafetyFlags(flags, lang)       → Doctor Tab 안전 경고 배너
    ├── injectCountryIntel(intel, lang)      → Doctor Tab 국가별 인사이트
    ├── renderTreatmentPlan(phases)          → 타임라인 DOM 생성
    ├── renderHomecareGrid(items)            → 홈케어 그리드 DOM 생성
    ├── renderDoctorEquipBar(ebd, inj)       → Doctor 장비바 DOM 생성
    ├── renderDoctorProtocolCards(ebd, inj)  → Doctor 프로토콜 DOM 생성
    ├── selectEBD(0) / selectINJ(0)          → 초기 선택 + 레이더 업데이트
    └── postMessage { type: 'REPORT_READY', success: true }
```

### 3.2 OpusRecommendationOutput → initReport(data) 필드 매핑

`initReport(data)` 가 받는 `data` 객체의 핵심 필드:

| 필드 경로 | 타입 | 바인딩 대상 |
|-----------|------|-----------|
| `data.patient.name` | string | `.p-name`, `.d-hero-name` |
| `data.patient.age` | string | `.p-meta`, `.d-hero-demos` |
| `data.patient.gender` | string | `.p-meta`, `.d-hero-demos` |
| `data.patient.skin_type` | string | `.p-chip` (피부타입) |
| `data.patient.concerns[]` | string[] | `.p-chips` 생성 |
| `data.patient.aesthetic_goal` | string | `.p-chip.highlight` |
| `data.patient.country` | string | `.d-hero-flag`, `.d-ci-country` |
| `data.ebd_devices[]` | DeviceRec[] | Zone 2 카드, 레이더, 스티키바 |
| `data.inj_devices[]` | DeviceRec[] | Zone 3 카드, 레이더, 스티키바 |
| `data.signature_solutions[]` | SigSolution[] | Zone 5B 시그니처 솔루션 |
| `data.treatment_plan.phases[]` | Phase[] | 타임라인 카드 |
| `data.homecare[]` | HomecareItem[] | 홈케어 그리드 |
| `data.country_intel` | CountryIntel | Doctor 국가 인사이트 |
| `data.lang` | string | 전체 i18n 적용 |
| `data.safety_flags` | object | Doctor 안전 경고 |

### 3.3 EBD/INJ Device 데이터 → Score 배열 매핑

각 디바이스에서 추출되는 11차원 점수 배열:

```
EBD_SCORES[i] = [
  tightening,  // [0] 타이트닝
  lifting,     // [1] 리프팅
  volume,      // [2] 볼륨
  brightening, // [3] 브라이트닝
  texture,     // [4] 텍스처
  evidence,    // [5] 근거수준
  synergy,     // [6] 시너지
  longevity,   // [7] 지속성
  roi,         // [8] 가성비
  trend,       // [9] 트렌드 점수
  popularity   // [10] 인기도
]
```

레이더 차트는 이 중 인덱스 0–4만 사용 (5축):
- Tightening, Lifting, Volume, Brightening, Texture

인덱스 5–10은 메타 뱃지, 이유 칩, 시그니처 솔루션 계산에 사용:
- `trend ≥ 7` → 🔥 트렌드 뱃지
- `popularity ≥ 7` → ⭐ 인기 뱃지
- `evidence ≥ 7` → 📊 근거 뱃지
- `roi ≥ 7` → 💰 ROI 이유 칩
- `longevity ≥ 7` → ⏰ 지속성 이유 칩
- `synergy ≥ 7` → ✨ 시너지 이유 칩

### 3.4 Pain/Downtime 데이터 구조

```
EBD_PD[i] = [pain_score, downtime_score]  // 각 1–5
INJ_PD[i] = [pain_score, downtime_score]
```

5단계 색상 매핑:
| 점수 | 색상 | 의미 |
|------|------|------|
| 1 | `#4ade80` (green) | 최소 |
| 2 | `#22d3ee` (cyan) | 낮음 |
| 3 | `#fbbf24` (amber) | 보통 |
| 4 | `#fb923c` (orange) | 높음 |
| 5 | `#f87171` (red) | 매우 높음 |

### 3.5 Practical Info 바인딩

```
EBD_PRACTICAL[i] = {
  sessions: "3–5회",
  interval: "4주",
  duration: "30분",
  onset: "2–4주",
  maintenance: "6개월"
}
```

바인딩 대상 DOM 요소: `#pr-sessions`, `#pr-interval`, `#pr-duration`, `#pr-onset`, `#pr-maintenance`

### 3.6 AI Description 바인딩

```
AI_EBD_DESC[i] = {
  device_name: string,
  body_html: string,
  sources: string[],
  confidence: number
}
```

바인딩: `.ai-desc-panel.ebd-desc` 내부의 `.ai-device-name`, `.ai-desc-body`, `.ai-src`, `.ai-confidence`

### 3.7 i18n 데이터 바인딩

HTML의 `data-i18n` 속성 기반 시스템:

```html
<span data-i18n="lbl_skin_type">피부 타입</span>
```

`applyI18nDOM()` 함수가 `document.querySelectorAll('[data-i18n]')` 순회하며 `I18N[currentLang][key]` 로 치환.

지원 언어: `ko`, `en`, `ja`, `zh-CN`, `zh-TW`, `th`, `mn`, `vi`, `ru` (9개)

각 언어 사전에 ~100+ 키 포함 (라벨, 설명, 의학 용어집 등).

### 3.8 Safety Flags 바인딩

`injectSafetyFlags(flags, lang)` 가 받는 `flags` 객체:

| 키 | 동작 |
|------|------|
| `flags.isotretinoin` | Doctor Tab에 이소트레티노인 경고 배너 삽입 |
| `flags.anticoagulant` | 항응고제 경고 배너 |
| `flags.pregnancy` | 임신 경고 배너 |
| `flags.keloid_history` | 켈로이드 경고 배너 |
| `flags.photosensitive_drug` | 광과민약물 경고 |
| `flags.adverse_history` | 부작용 이력 경고 |
| `flags.hormonal_melasma` | 호르몬성 기미 경고 |
| `flags.retinoid_pause` | 레티노이드 중지 경고 |

각 경고는 `.d-check-item` 패턴의 빨간(`.risk`) 아이콘 카드로 렌더링.

### 3.9 Country Intelligence 바인딩

`injectCountryIntel(intel, lang)`:

| 필드 | 바인딩 |
|------|--------|
| `intel.country_name` | `.d-ci-country` |
| `intel.flag_emoji` | `.d-ci-flag` |
| `intel.market_size` | `.d-ci-val` (시장 규모) |
| `intel.popular_treatments` | 인기 시술 리스트 |
| `intel.pricing_range` | 가격대 |
| `intel.regulation_notes` | 규제 참고사항 |
| `intel.cultural_preferences` | 문화적 선호도 |
| `intel.reference_countries[]` | 7개국 참조 패널 생성 |

---

## 4. 기존 React 컴포넌트 Props 인터페이스

### 4.1 RadarChart.tsx

**파일 위치**: `connecting-docs-web/src/components/report-v2/RadarChart.tsx`
**라인 수**: 109
**의존성**: `recharts` (RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip)

```typescript
interface RadarChartProps {
  /** Record<string, number> from OpusDeviceRecommendation.scores */
  scores: Record<string, number>;
  /** Device name for the chart title */
  deviceName: string;
  lang: SurveyLang;
  /** Optional: Compare another device's scores (overlay) */
  compareScores?: Record<string, number>;
  compareName?: string;
}
```

**Score Dimension Labels** (8차원, 4개 언어):

| 키 | KO | EN | JP | ZH-CN |
|-----|-----|-----|-----|-------|
| efficacy | 효과 | Efficacy | 効果 | 效果 |
| safety | 안전성 | Safety | 安全性 | 安全性 |
| downtime | 다운타임 | Downtime | ダウンタイム | 恢复期 |
| pain | 통증 | Pain | 痛み | 疼痛 |
| cost_efficiency | 가성비 | Value | コスパ | 性价比 |
| maintenance | 유지력 | Duration | 持続 | 持久性 |
| evidence | 근거 | Evidence | エビデンス | 循证 |
| comfort | 편안함 | Comfort | 快適さ | 舒适度 |

**주요 차이점 (vs HTML 인라인 SVG 레이더)**:
- React 컴포넌트: recharts 라이브러리 기반, **8차원**, `Record<string, number>` 형태
- HTML 인라인: 커스텀 SVG, **5축** (Tightening/Lifting/Volume/Brightening/Texture), 11차원 배열에서 인덱스 0–4 사용
- React는 비교 오버레이(`compareScores`) 지원, HTML은 EBD+INJ 동시 오버레이
- React는 `domain: [0, 10]`, HTML은 `domain: [0, 10]` (동일)

### 4.2 SkinLayerDiagram.tsx

**파일 위치**: `connecting-docs-web/src/components/report-v2/SkinLayerDiagram.tsx`
**라인 수**: 140
**의존성**: 없음 (순수 HTML/CSS + Tailwind)

```typescript
interface SkinLayerDiagramProps {
  /** Which skin layer(s) this device targets */
  targetLayers: string[];
  lang: SurveyLang;
  /** Device names to display alongside markers */
  deviceNames?: string[];
}

interface LayerDef {
  id: string;
  label: Record<SurveyLang, string>;
  color: string;         // 비활성 배경색
  activeColor: string;   // 활성 배경색
  depth: string;         // 깊이 범위 텍스트
  height: number;        // px 높이
}
```

**LAYERS 정의** (4개 레이어):

| id | KO | EN | color | activeColor | depth | height |
|----|-----|-----|-------|-------------|-------|--------|
| epidermis | 표피 | Epidermis | #fef3c7 | #fbbf24 | 0.05–0.1mm | 28px |
| upper_dermis | 진피 상층 | Upper Dermis | #fed7aa | #f97316 | 0.1–0.5mm | 36px |
| deep_dermis | 진피 심층 | Deep Dermis | #fecaca | #ef4444 | 0.5–2.0mm | 44px |
| smas | SMAS/지방 | SMAS / Fat | #e9d5ff | #a855f7 | 2.0–4.5mm | 36px |

**matchLayer() 매핑 로직**:
- 다국어 문자열 매칭 (영/한/일 키워드 기반)
- `epiderm*` / `표피` / `表皮` → epidermis
- `upper` / `상층` / `上層` / `papillary` → upper_dermis
- `deep` / `심층` / `深層` / `reticular` → deep_dermis
- `smas` / `fat` / `지방` / `脂肪` / `subcutan*` → smas
- fallback: `dermis` 포함 시 → upper_dermis + deep_dermis

**주요 차이점 (vs HTML 인라인 SVG)**:
- React 컴포넌트: **4개 레이어**, 수평 바 형태, Tailwind 스타일링, 192px 고정 너비
- HTML 인라인: **6개 레이어** (epidermis, upper dermis, deep dermis, subcutaneous fat, SMAS, muscle), SVG 기반 3D 와이어프레임, 에너지 빔 애니메이션, `aspect-ratio: 16/10` 반응형
- HTML 버전이 시각적으로 훨씬 풍부하지만 코드 복잡도 극히 높음

---

## 5. [id].tsx의 현재 iframe 로직 상세

### 5.1 파일 개요

**파일 위치**: `connecting-docs-web/src/pages/report-v2/[id].tsx`
**라인 수**: 487
**역할**: Next.js 동적 라우트 페이지, iframe 내 `report-v7-premium.html` 로드 및 postMessage 브릿지 관리

### 5.2 타입 정의

```typescript
interface ReportPayload {
  recommendation: OpusRecommendationOutput;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
  survey_state: {
    demographics: {
      detected_language: SurveyLang;  // 'KO' | 'EN' | 'JP' | 'ZH-CN'
      detected_country: string;
      d_gender: string;
      d_age: string;
    };
    safety_flags: SafetyFlag[];
    open_question_raw: string;
  };
  created_at: string;
}

type IframeStatus = 'loading' | 'ready' | 'rendered' | 'error';
```

### 5.3 상태 관리

| State | Type | 초기값 | 용도 |
|-------|------|--------|------|
| `payload` | `ReportPayload \| null` | null | 리포트 데이터 |
| `iframeStatus` | `IframeStatus` | 'loading' | iframe 상태 추적 |
| `error` | `string \| null` | null | 에러 메시지 |
| `consultationSent` | `boolean` | false | 상담 신청 완료 여부 |
| `consultationLoading` | `boolean` | false | 상담 신청 로딩 |

### 5.4 데이터 로딩 (useEffect #1)

```
Route → /report-v2/[id]
                │
                ▼
    sessionStorage.getItem('connectingdocs_v2_report')
                │
         ┌──────┴──────┐
         │             │
       없음          있음
         │             │
    setError()     JSON.parse → setPayload()
```

- 데이터 소스: `sessionStorage` 단일 소스 (**Airtable fallback 없음**)
- 키: `'connectingdocs_v2_report'`
- 에러 핸들링: parse 실패 시 에러 상태 전환

### 5.5 postMessage 브릿지 프로토콜

**수신 메시지 (useEffect #2)**:

| 메시지 type | 보낸 곳 | 동작 |
|------------|---------|------|
| `IFRAME_READY` | iframe (DOMContentLoaded) | `setIframeStatus('ready')` |
| `REPORT_READY` | iframe (initReport 완료) | `success` → `setIframeStatus('rendered')`, else → `'error'` |

**송신 메시지 (useEffect #3)**:

조건: `iframeStatus === 'ready' && payload !== null && iframeRef.current?.contentWindow`

```javascript
// 1. 메인 데이터 전송
iframeRef.current.contentWindow.postMessage({
  type: 'INIT_REPORT',
  payload: {
    ...payload.recommendation,      // OpusRecommendationOutput 전체 spread
    lang: LANG_MAP[detected_language],  // 'ko' | 'en' | 'ja' | 'zh-CN'
    safety_flags: buildSafetyFlagsObject(safety_flags)
  }
}, '*');

// 2. 300ms 후 환자 전용 뷰 강제
setTimeout(() => {
  iframeRef.current.contentWindow.postMessage(
    { type: 'SWITCH_TAB', tab: 'patient' },
    '*'
  );
}, 300);
```

### 5.6 LANG_MAP

```typescript
const LANG_MAP: Record<SurveyLang, string> = {
  KO: 'ko',
  EN: 'en',
  JP: 'ja',
  'ZH-CN': 'zh-CN',
};
```

주의: HTML의 i18n 시스템은 9개 언어 지원 (`ko, en, ja, zh-CN, zh-TW, th, mn, vi, ru`), [id].tsx의 LANG_MAP은 4개 언어만 매핑.

### 5.7 buildSafetyFlagsObject() 변환

```typescript
SafetyFlag enum array → Object format

입력: SafetyFlag[] = ['SAFETY_PREGNANCY', 'SAFETY_KELOID']
출력: { pregnancy: true, keloid_history: true }
```

매핑 테이블:

| SafetyFlag | 출력 키 | 출력 값 |
|------------|---------|---------|
| SAFETY_ISOTRETINOIN | isotretinoin | `{ status: 'active' }` |
| SAFETY_ANTICOAGULANT | anticoagulant | `{ status: 'active' }` |
| SAFETY_PREGNANCY | pregnancy | `true` |
| SAFETY_KELOID | keloid_history | `true` |
| SAFETY_PHOTOSENSITIVITY | photosensitive_drug | `true` |
| SAFETY_ADVERSE_HISTORY | adverse_history | `true` |
| HORMONAL_MELASMA | hormonal_melasma | `true` |
| RETINOID_PAUSE | retinoid_pause | `true` |

### 5.8 iframe 렌더링

```jsx
<iframe
  ref={iframeRef}
  src="/report-v7-premium.html"
  sandbox="allow-scripts allow-same-origin"
  style={{ opacity: iframeStatus === 'rendered' ? 1 : 0 }}
/>
```

- `sandbox`: `allow-scripts allow-same-origin` (postMessage 통신에 필요)
- 투명도 트랜지션: 렌더 완료 전 숨김 → 완료 후 페이드인 (0.4s)
- 로딩 오버레이: `iframeStatus === 'loading'` 시 스피너 표시

### 5.9 상담 CTA (Consultation Request)

**하단 플로팅 바** — `iframeStatus === 'rendered'` 시 표시:

```
POST /api/consultation/request
Body: {
  report_id: id,
  patient_profile: payload.recommendation.patient,
  demographics: payload.survey_state.demographics,
  safety_flags: payload.survey_state.safety_flags
}
```

**CTA_TEXT i18n** (4개 언어):
- KO: '맞춤 시술 상담을 원하시나요?' / '상담 신청하기'
- EN: 'Want a personalized consultation?' / 'Request Consultation'
- JP: 'カスタマイズされた相談をご希望ですか？' / '相談を申し込む'
- ZH-CN: '想要个性化的咨询吗？' / '申请咨询'

### 5.10 스타일링

모든 스타일은 `<style jsx>` (CSS-in-JS) 인라인:
- 클래스 접두사: `report-v7-`
- 로딩/에러/래퍼/CTA 스타일 모두 컴포넌트 내 정의
- 색상 체계: HTML의 CSS 변수와 동일 (`#09090b`, `#22d3ee`, `#a1a1aa` 등)

---

## 부록 A: JavaScript 함수 목록 (report-v7-premium.html)

| 함수명 | 라인 | 역할 |
|--------|------|------|
| `applyI18nDOM()` | 5934 | `data-i18n` DOM 요소 일괄 번역 |
| `switchLang(lang)` | 5968 | 언어 전환 + i18n 재적용 |
| `switchTab(t)` | 6000 | Patient/Doctor 탭 전환 |
| `selectEBD(idx)` | 6319 | EBD 카드 선택 + 레이더 업데이트 |
| `selectINJ(idx)` | 6330 | INJ 카드 선택 + 레이더 업데이트 |
| `updateRadar()` | 6345 | 5축 SVG 레이더 차트 재렌더링 |
| `renderBadges()` | 6425 | 트렌드/인기/근거 뱃지 |
| `renderReasonChips()` | 6455 | 추천 이유 칩 (ROI/지속성/시너지/근거) |
| `renderSignatureSolutions()` | 6506 | 시그니처 솔루션 바 리스트 DOM 생성 |
| `updateSynergy()` | 6809 | 시너지 점수 업데이트 |
| `renderEBDCards(recs)` | 7911 | EBD 카드 HTML 동적 생성 |
| `renderINJCards(recs)` | 7986 | INJ 카드 HTML 동적 생성 |
| `renderTreatmentPlan(phases)` | 8059 | 타임라인 카드 DOM 생성 |
| `renderHomecareGrid(items)` | 8074 | 홈케어 그리드 DOM 생성 |
| `renderDoctorEquipBar(ebd, inj)` | 8088 | Doctor 장비바 DOM 생성 |
| `renderDoctorProtocolCards(ebd, inj)` | 8115 | Doctor 프로토콜 카드 DOM 생성 |
| `initReport(data)` | 8156 | **진입점** — 전체 초기화 오케스트레이터 |
| `injectPatientI18n(lang, p)` | 8203 | 환자 프로필 i18n 적용 |
| `injectEBDData(recs)` | 8246 | EBD 점수 배열 채움 |
| `injectINJData(recs)` | 8281 | INJ 점수 배열 채움 |
| `injectSignatureSolutions(solutions)` | 8304 | 시그니처 솔루션 데이터 주입 |
| `injectSafetyFlags(flags, lang)` | 8315 | 안전 플래그 경고 배너 생성 |
| `injectCountryIntel(intel, lang)` | 8382 | 국가별 인사이트 데이터 주입 |

---

## 부록 B: React 전환 시 주요 고려사항

1. **Score 차원 불일치**: RadarChart.tsx는 8차원(`scores: Record<string, number>`), HTML은 5축+6메타=11차원 배열. 통합 전략 필요.

2. **SkinLayer 복잡도 차이**: React는 4레이어 순수 CSS, HTML은 6레이어 SVG+에너지 빔. HTML 버전의 시각적 품질을 React로 포팅할지 결정 필요.

3. **i18n 범위**: [id].tsx는 4개 언어 매핑, HTML은 9개 언어 풀 지원. 전환 시 언어 확장 여부 결정.

4. **postMessage 브릿지 제거**: React 전환 시 iframe+postMessage 아키텍처를 React props/state로 대체. sessionStorage 의존도 Airtable 또는 API 기반으로 변경 가능.

5. **Doctor Tab 인터랙션**: 드래그&드롭 장비 관리, 프로토콜 편집 등 복잡한 인터랙션은 React DnD 라이브러리 필요.

6. **모놀리식 → 컴포넌트 분해**: 8,452라인 단일 HTML을 ~20-30개 React 컴포넌트로 분해 시 상태 관리 전략 (Context / Zustand 등) 사전 설계 필수.

---

> **이 보고서는 읽기 전용 리서치 목적으로 작성되었습니다. 코드 수정은 포함되지 않았습니다.**
