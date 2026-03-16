# Phase 0 Completion Report

> ConnectingDocs.ai Report v7 — HTML → React Migration
> Completed: 2026-03-16

## Overview

Migrated the monolithic `report-v7-premium.html` (8,452 lines) into a modular React
component architecture under `src/components/report-v7/`. The legacy file is archived
at `_archive/report-v7-premium.html`.

**Total new/modified code: ~6,142 lines** (excluding CSS 1,484 lines = ~4,658 TS/TSX)

---

## File Tree

```
src/
├── types/
│   └── report-v7.ts                      320 lines   # All interfaces + defaults
├── validators/
│   └── report-v7-validator.ts             389 lines   # Zod schema + lenient parse
├── mocks/
│   └── report-v7-mock.ts                  374 lines   # Full realistic mock data
├── hooks/
│   └── useReportData.ts                   356 lines   # snake→camelCase + validation
├── pages/
│   └── report-v2/
│       └── [id].tsx                       292 lines   # Refactored: no iframe
└── components/
    └── report-v7/
        ├── report-v7.css                 1484 lines   # Scoped CSS (rv7- prefix)
        ├── ReportV7.tsx                   235 lines   # Main wrapper, 3-depth layout
        ├── ReportI18nContext.tsx           191 lines   # i18n provider (KO/EN/JP/ZH-CN)
        ├── ReportErrorBoundary.tsx          93 lines   # Per-section error isolation
        ├── SkeletonReport.tsx             179 lines   # Loading state skeleton
        ├── ReportHeader.tsx                99 lines   # Patient profile header
        ├── SafetyFlags.tsx                117 lines   # Safety flag badges
        ├── MirrorLayer.tsx                 33 lines   # Narrative: empathy layer
        ├── ConfidenceLayer.tsx              32 lines   # Narrative: clinical confidence
        ├── EBDCard.tsx                    171 lines   # Device recommendation card
        ├── EBDSection.tsx                  70 lines   # EBD card list + scroll
        ├── InjectableCard.tsx             144 lines   # Injectable recommendation card
        ├── InjectableSection.tsx            65 lines   # Injectable card list + scroll
        ├── RadarChart5Axis.tsx             233 lines   # SVG radar chart
        ├── SkinLayer3D.tsx                299 lines   # Skin layer depth visualization
        ├── SignatureSolutions.tsx          192 lines   # EBD + Injectable combos
        ├── HomecareSection.tsx              89 lines   # Morning/evening/weekly/avoid
        ├── BudgetSection.tsx              209 lines   # Budget estimate display
        ├── LegalDisclaimer.tsx              45 lines   # 4-language legal notice
        ├── useMediaQuery.ts                27 lines   # Mobile detection hook
        └── sections/
            ├── TreatmentPlanSection.tsx    197 lines   # Lazy: treatment phases
            ├── DoctorTabSection.tsx        490 lines   # Lazy: doctor read-only view
            └── SkinLayerSection.tsx          9 lines   # Stub (inline in EBDCard)
```

---

## Component Hierarchy

```
ReportV7 (data, lang)
├── ReportI18nProvider
│   └── ReportV7Inner (data)
│       ├── Tab Bar [patient | doctor]
│       │
│       ├── Patient Tab
│       │   ├── ReportHeader (patient, lang)
│       │   ├── SafetyFlags (flags, lang)
│       │   ├── MirrorLayerView (mirror, lang)
│       │   ├── ConfidenceLayerView (confidence, lang)
│       │   ├── EBDSection (recommendations, lang)
│       │   │   └── EBDCard[] (rec, lang, expanded, onToggle)
│       │   │       ├── RadarChart5Axis (scores, size, color)
│       │   │       └── SkinLayer3D (skinLayer, size)
│       │   ├── InjectableSection (recommendations, lang)
│       │   │   └── InjectableCard[] (rec, lang, expanded, onToggle)
│       │   ├── SignatureSolutions (solutions, lang)
│       │   ├── HomecareSection (homecare, lang)
│       │   ├── TreatmentPlanSection (plan, status, lang)  [lazy]
│       │   ├── BudgetSection (budget, status, lang)
│       │   └── LegalDisclaimer (lang)
│       │
│       └── Doctor Tab
│           └── DoctorTabSection (doctorData, patient,     [lazy]
│               safetyFlags, ebdList, injectableList,
│               status, lang)
│
└── SkeletonReport (lang)  [shown when data=null]
```

---

## Type Dependency Graph

```
survey-v2.ts
  └── SurveyLang ('KO' | 'EN' | 'JP' | 'ZH-CN')
  └── SafetyFlag (union of 8 codes)

report-v7.ts (imports SurveyLang)
  ├── ReportSafetyFlag
  ├── ReportPatientProfile
  ├── MirrorLayer / ConfidenceLayer
  ├── PracticalInfo
  ├── EBDRecommendation (23 fields)
  ├── InjectableRecommendation (16 fields)
  ├── SignatureSolution
  ├── TreatmentPhase / TreatmentPlan
  ├── HomecareGuide
  ├── BudgetSegment / BudgetEstimate
  ├── PatientIntelligence / ConsultationStrategy / DoctorTab
  └── ReportV7Data (14 top-level fields)

report-v7-validator.ts (imports ReportV7Data, z)
  └── RecommendationOutputSchema (18 Zod schemas, ~121 fields)
  └── validateRecommendation() → { data: ReportV7Data, warnings: string[] }

useReportData.ts (imports ReportV7Data, OpusRecommendationOutput, validateRecommendation)
  └── StoredReportPayload (sessionStorage shape)
  └── 11 converter functions (snake_case → camelCase)
  └── useReportData(reportId) → { data, status, error, lang }

final-recommendation.ts (API route)
  └── OpusRecommendationOutput (snake_case)
  └── OpusDeviceRecommendation, OpusInjectableRecommendation, etc.
```

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| 3-Depth rendering | Depth 0 (instant) → Depth 1 (click) → Depth 2 (lazy) for fast perceived load |
| Per-section ErrorBoundary | One broken section doesn't crash the entire report |
| CSS scoping via `rv7-` prefix | No CSS modules needed; avoids Next.js global CSS import restrictions |
| Zod lenient validation | AI output is unreliable; defaults + warnings > hard failures |
| JSON truncation recovery | SSE streams can be cut off mid-JSON; `tryParseJSON()` recovers partial data |
| snake_case → camelCase | Opus API uses snake_case; React components use camelCase conventions |
| Mock mode via env var | `NEXT_PUBLIC_AI_MOCK=true` enables testing without API calls |
| DoctorTab read-only | Phase 0: display only; drag & drop deferred to Phase 3 |

---

## Phase 1 TODOs

### High Priority
- [ ] **Airtable fallback** in `useReportData.ts` — load report from Airtable when sessionStorage is empty
- [ ] **Budget generation** — currently hardcoded empty; implement budget calculation from treatment costs
- [ ] **Real-time streaming** — SSE streaming for Opus recommendations with progressive section reveals
- [ ] **Image integration** — Device/injectable product images from CDN/Airtable

### Medium Priority
- [ ] **SkinLayerSection** — Full lazy-loaded skin layer diagram (currently inline in EBDCard)
- [ ] **Radar chart animation** — Entrance animation for radar chart on card expand
- [ ] **Print/PDF export** — Generate downloadable PDF from React components
- [ ] **Analytics events** — Track section views, card expansions, CTA clicks

### Phase 3 (Doctor Tab Enhancement)
- [ ] **Drag & drop** treatment ordering in DoctorTab
- [ ] **Doctor memo/textarea** for clinical notes
- [ ] **Drop zones + drag handles** for custom treatment plans
- [ ] **Save/persist** doctor customizations to Airtable

### Tech Debt
- [ ] Remove `src/utils/report-v7-render.ts` (legacy HTML rendering utility)
- [ ] Remove `src/utils/report-v7-i18n.ts` (legacy HTML i18n utility)
- [ ] Remove `src/utils/report-v7-safety.ts` (legacy HTML safety utility)
- [ ] Clean up comment references to `report-v7-premium.html`
- [ ] Add unit tests for `validateRecommendation()` and `tryParseJSON()`
- [ ] Add component snapshot tests for all report-v7 components

---

## Stats

| Metric | Value |
|---|---|
| Total files created/modified | 24 |
| TypeScript/TSX lines | ~4,658 |
| CSS lines | 1,484 |
| Total lines | ~6,142 |
| Component count | 18 (15 eager + 3 lazy) |
| Type interfaces | 15+ |
| Zod schemas | 18 |
| Props per component (max) | 7 (DoctorTabSection) |
| `any`/`unknown` in public API | 0 |
| Languages supported | 4 (KO, EN, JP, ZH-CN) |
| Sessions completed | 7 (R-0 through R-5) |
