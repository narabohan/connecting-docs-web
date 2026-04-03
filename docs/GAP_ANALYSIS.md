# GAP_ANALYSIS.md — SURVEY_CLINICAL_SPEC vs 현재 코드 갭 분석

> 작성일: 2026-04-02
> **업데이트: 2026-04-03 — Phase 3-B 잔여 갭 해결 (P1+P2 6개 태스크) 완료 후 반영**
> 기준 문서: docs/SURVEY_CLINICAL_SPEC.md
> 분석 범위: FSM 노드, 칩 생성, 장비 매핑, PREFERENCES 노드, first_time 경로, SAFETY_CHECKPOINT, Branch 컴포넌트

---

## 1. FSM 노드 목록 비교

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| DEMOGRAPHIC | ✅ 존재 | 없음 | — |
| OPEN_TEXT | ✅ 존재 | 없음 | — |
| SMART_CHIPS | ✅ 존재 | 없음 | — |
| BRANCH_SKIN_PROFILE | ✅ 존재 | 없음 | — |
| BRANCH_PAST_HISTORY | ✅ 존재 | 없음 | — |
| BRANCH_VISIT_PLAN | ✅ 존재 | 없음 | — |
| BRANCH_ADVERSE | ✅ 존재 | 없음 | — |
| PREFERENCES (§8) | ✅ Task 3에서 추가 | 없음 | ✅ 해결됨 |
| SAFETY_CHECKPOINT | ✅ 존재 | 없음 | — |
| ANALYZING | ✅ 존재 | 없음 | — |
| COMPLETE | ✅ 존재 | 없음 | — |

**요약**: 11개 노드 모두 코드에 존재. ✅ 갭 없음.

---

## 2. 칩 카테고리 비교 (SPEC §3 vs generate-chips.ts)

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| 카테고리 A — concern_area (11개 value) | ✅ Task 2에서 수정 — CONCERN_HINT_TO_CHIPS 매핑 추가 | 없음 | ✅ 해결됨 |
| 카테고리 B — skin_signal (thin, sensitive, tanned) | ✅ recently_tanned 신호 BranchSkinProfile에 추가 (잔여 Task 5) | 없음 | ✅ 해결됨 |
| 카테고리 C — past_experience | ✅ 존재. value 명명 차이는 FSM 내부 매핑으로 해결 | 기능적 영향 없음 | ✅ 해결됨 |
| Demographic 기반 칩 우선순위 | ✅ Task 2에서 추가 — getDemographicPriorityChips 함수 | 없음 | ✅ 해결됨 |

---

## 3. 장비 매핑 테이블 비교 (SPEC §10 vs final-recommendation.ts)

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| concern_area→장비 매핑 (리프팅/색소/피부결) | ✅ Task 5+7에서 프롬프트 주입, clinical-rules.ts로 구조화 | 없음 | ✅ 해결됨 |
| Fitzpatrick 제한 규칙 | ✅ Task 7 — FITZPATRICK_RESTRICTIONS | 없음 | ✅ 해결됨 |
| PIH 이력 대응 규칙 | ✅ Task 5 — melasma PIH 규칙 프롬프트에 포함 | 없음 | ✅ 해결됨 |
| 세그먼트별 장비 우선순위 (VIP/PREMIUM/BUDGET) | ✅ Task 7 — SEGMENT_DEVICE_PRIORITY | 없음 | ✅ 해결됨 |
| §11 시퀀스 생성 규칙 | ✅ Task 5+7 — SAFETY_RULES, MEDICAL_TOURIST_PATTERNS, STAY_DURATION_MATRIX | 없음 | ✅ 해결됨 |
| 장비별 다운타임 데이터 | ✅ Task 7 — DOWNTIME_MAP (26개 장비) | 없음 | ✅ 해결됨 |

---

## 4. PREFERENCES 노드 존재 여부 (SPEC §8)

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| pain_tolerance(5단계), downtime_preference(4단계), budget_segment(3단계) | ✅ Task 3+4 — PreferencesBranch, BranchPreferences.tsx, 4개 언어 i18n | 없음 | ✅ 해결됨 |
| patient_segment 자동 할당 (VIP/PREMIUM/BUDGET) | ✅ Task 3 — derivePatientSegment() + **잔여 Task 3: revisit_cycle 연동** | 없음 | ✅ 해결됨 |
| 다운타임 동적 비활성화 (체류 기간 연동) | ✅ **잔여 Task 2** — stayDays prop + isDowntimeDisabled() + 4개 언어 tooltip | 없음 | ✅ 해결됨 |

---

## 5. "처음이에요(first_time)" 경로 — Fitzpatrick 필수 여부

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| 모든 사용자 BRANCH_SKIN_PROFILE 통과 필수 | ✅ Task 3 — SMART_CHIPS fallback → BRANCH_SKIN_PROFILE | 없음 | ✅ 해결됨 |

---

## 6. SAFETY_CHECKPOINT 비교 (SPEC §9 vs 코드)

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| 11종 (기존 6+1 + 신규 4종: 당뇨, 금속이식물, 면역억제제, 단순포진) | ✅ **잔여 Task 1** — SafetyFlag union에 4종 추가, SafetyCheckpoint UI 업데이트, 14개 파일 Record 동기화 | 없음 | ✅ 해결됨 |
| 위치: PREFERENCES 이후 | ✅ Task 3 — 전이: PREFERENCES → SAFETY_CHECKPOINT | 없음 | ✅ 해결됨 |

---

## 7. Branch 컴포넌트 질문 내용 비교 (SPEC §4~§7 vs 코드)

### §4 vs BranchSkinProfile.tsx

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| Fitzpatrick 간접 질문 (햇빛 반응) | 직접 타입 선택 (6개 옵션) | 질문 방식 차이 | ⚪ Narabo 검수 대기 |
| 보조 Q4-1b/c (눈동자색, 물집) | ❌ 없음 | 보조 질문 미구현 | ⚪ 추후 추가 |
| Q4-3 태닝 여부 (RECENT_TANNING flag) | ✅ **잔여 Task 5** — recently_tanned boolean + tanning_label i18n (4개 언어) | 없음 | ✅ 해결됨 |

### §5 vs BranchPastHistory.tsx

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| 시술 카테고리 멀티셀렉트 (13개) | 자유 텍스트 입력 | 형식 차이 | ⚪ Narabo 판단 |
| PIH 경험 전용 질문 (yes/no/not sure) | ✅ **잔여 Task 5** — pih_history 3지선다 + pih_label i18n (4개 언어) | 없음 | ✅ 해결됨 |

### §6 vs BranchVisitPlan.tsx

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| 재방문 주기 질문 | ✅ **잔여 Task 3** — RevisitCycle 타입 + revisit_cycle 필드 + 4개 선택지 UI + derivePatientSegment 연동 | 없음 | ✅ 해결됨 |
| 마지막날 전략 | ✅ Task 5+7 — 프롬프트 + clinical-rules.ts | 없음 | ✅ 해결됨 |

### §7 vs BranchAdverse.tsx

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| 부작용 유형 6종 (allergy 포함) | ✅ **잔여 Task 4** — 'allergy' 추가 + allergy_detail 조건부 입력 + i18n (4개 언어) | 없음 | ✅ 해결됨 |

---

## 8. analyze-open.ts 하이쿠 분석 (신규 — Task 6)

| SPEC 정의 | 코드 현재 상태 | GAP | 상태 |
|-----------|--------------|-----|------|
| concern_area_hint가 SPEC §3 칩 value와 매칭 | ✅ Task 6 — CONCERN_KEYWORD_MAP 4개 언어 키워드→칩 매핑 테이블 | 없음 | ✅ 해결됨 |
| 분석 신뢰도 | ✅ Task 6 — confidence_score (0~1) 필드 추가 | 없음 | ✅ 해결됨 |

---

## 9. clinical-rules.ts 구조화 데이터 (신규 — Task 7)

| 데이터 | 상태 | 설명 |
|--------|------|------|
| DEVICE_CATEGORIES | ✅ | 8개 카테고리, 26개 장비 |
| CONCERN_TO_DEVICE_MAP | ✅ | 12개 concern → device 매핑 (segment별 우선순위 포함) |
| FITZPATRICK_RESTRICTIONS | ✅ | Type I-II, III, IV-V-VI 규칙 |
| SEGMENT_DEVICE_PRIORITY | ✅ | VIP/PREMIUM/BUDGET 장비 목록 |
| DOWNTIME_MAP | ✅ | 26개 장비별 min/max/typical 다운타임 |
| SAFETY_RULES | ✅ | medication/condition flags, max cap, same-layer rules |
| STAY_DURATION_MATRIX | ✅ | 4개 체류 구간별 장비 가용성 |
| MEDICAL_TOURIST_PATTERNS | ✅ | 4가지 행동 패턴 (A~D) |
| buildClinicalRulesPromptBlock() | ✅ | final-recommendation.ts에서 import |

---

## 요약: 전체 갭 현황 (Phase 3-B + 잔여 갭 해결 완료)

### ✅ 해결된 P0/P1/P2 갭

| 이전 우선순위 | 갭 | 해결 태스크 |
|-------------|-----|-----------|
| 🔴 P0 | PREFERENCES 노드 전체 미구현 | Task 3+4 |
| 🔴 P0 | first_time 경로에서 Fitzpatrick 건너뜀 | Task 3 |
| 🟠 P1 | generate-chips 칩 풀 SPEC 불일치 | Task 2 |
| 🟠 P1 | final-recommendation에 §10 규칙 미주입 | Task 5+7 |
| 🟠 P1 | analyze-open concern_area_hint 매핑 불일치 | Task 6 |
| 🟠 P1 | SAFETY_CHECKPOINT 신규 5종 미추가 | 잔여 Task 1 |
| 🟡 P2 | PREFERENCES 다운타임 동적 비활성화 | 잔여 Task 2 |
| 🟡 P2 | BranchVisitPlan 재방문 주기 질문 누락 | 잔여 Task 3 |
| 🟡 P2 | BranchAdverse allergy 옵션 누락 | 잔여 Task 4 |
| 🟡 P2 | BranchSkinProfile 태닝 여부 질문 누락 | 잔여 Task 5 |
| 🟡 P2 | BranchPastHistory PIH 전용 질문 없음 | 잔여 Task 5 |

### ⚪ 남은 P3 갭 (기능적 영향 없음, Narabo 판단 대기)

| 우선순위 | 갭 | 비고 |
|---------|-----|------|
| ⚪ P3 | BranchSkinProfile Fitzpatrick 질문 방식 (직접 vs 간접) | Narabo 검수 후 결정 |
| ⚪ P3 | BranchPastHistory 시술 입력 방식 (텍스트 vs 카테고리) | Narabo 판단 |
| ⚪ P3 | chip value 명명 불일치 (yes_multiple vs multiple_past) | 매핑 레이어로 해결 가능, 기능적 영향 없음 |
| ⚪ P3 | BranchSkinProfile 보조 질문 (눈동자색, 물집) | 추후 추가 |

---

## 커밋 이력

### Phase 3-B 본 작업 (2026-04-02)

```
effe2a0 feat(B-3): create clinical-rules.ts — structured device/concern/safety data
b3f9421 feat(B-3): improve haiku analysis prompt — precise concern_area mapping + multilingual keywords
94d7f32 feat(B-3): inject CLINICAL_SPEC mapping rules into recommendation prompt
cf46e99 feat(B-3): add BranchPreferences component — pain/downtime/budget
1e1ab0e feat(B-3): sync FSM transitions with CLINICAL_SPEC — add PREFERENCES node + universal Fitzpatrick
85d78e0 feat(B-3): sync generate-chips prompt with CLINICAL_SPEC chip pool
```

### Phase 3-B 잔여 갭 해결 (2026-04-03)

```
b66b900 feat(B-3-P1): add 5 new safety conditions — diabetes, implant, immunosuppressant, photosensitivity, herpes
b265d09 feat(B-3-P2): dynamic downtime option disable based on stay duration
337b301 feat(B-3-P2): add revisit cycle question to BranchVisitPlan + update derivePatientSegment
79f4665 feat(B-3-P2): add allergy option to BranchAdverse with conditional detail input
efb4f78 feat(B-3-P2): add tanning question to SkinProfile + PIH history to PastHistory
```

## 빌드 최종 확인

```
npm run build          ✅ PASS
npx tsc --noEmit       ✅ PASS (0 errors)
```
