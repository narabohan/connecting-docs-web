# Survey V2 API Integration Test Results
**Date**: 2026-03-09  
**Environment**: Next.js 16.1.6 (Turbopack), localhost:3099

## Test Case: JP Female 30-39 (Lifting + Volume)

### 1. Haiku analyze-open ✅
- **Model**: claude-haiku-4-5-20251001
- **Latency**: ~3s
- **Result**: 
  - Primary: Contouring/lifting
  - Secondary: Volume/elasticity
  - Emotion: serious
  - Prior alignment: aligned (JP priors matched)
  - Already known: goal, concern_area, pain_tolerance, style, past_experience
  - Needs: skin_profile, volume_logic, pigment_pattern, downtime_tolerance, treatment_rhythm

### 2. Opus final-recommendation ✅
- **Model**: claude-opus-4-6
- **Latency**: ~145s
- **Tokens**: input=2,435 / output=9,632
- **Cost**: ~$0.76 per call
- **Response size**: 23KB JSON

### Output Validation (All Fields Present ✅)
- Top-level: 11/11 keys
- EBD Device: 22/22 fields
- Injectable: all fields present
- Scores: 11 radar dimensions (device), 8 dimensions (injectable)

### Recommended Devices
1. **Ultraformer MPT** (93% confidence, HIFU, SMAS layer, pain=2)
2. **Sylfirm X PW Mode** (89% confidence, MN-RF, upper dermis, pain=2)
3. **LDM MED** (82% confidence, ultrasound, upper dermis, pain=1)

### Recommended Injectables
1. **Rejuran Healer** (91% confidence, PN/PDRN)
2. **Juvelook** (87% confidence, HA)
3. **ASCE+ SRLV** (83% confidence, Exosome)

### Clinical Quality Assessment
- ✅ Country context (JP) correctly applied — low-pain devices prioritized
- ✅ Natural style preference reflected in device selection
- ✅ Protocols: PROTO_01 (Lifting) + PROTO_03 (Volume) triggered
- ✅ 4-phase treatment plan with Japanese labels
- ✅ Homecare routine in Japanese
- ✅ Doctor tab with bilingual KO+EN clinical notes

## Known Issues
- `ANTHROPIC_API_KEY` env var conflict: system-level empty string overrides .env.local → must pass explicitly when starting dev server
- Opus latency (~145s) may need streaming for production UX
- Cost per Opus call ($0.76) — consider caching/Sonnet fallback for cost optimization

## Next Steps
- [ ] Airtable SurveyV2_Results table creation
- [ ] Safety flag test case (e.g., SAFETY_ISOTRETINOIN)
- [ ] Multi-language test (KO, EN, ZH-CN)
- [ ] Streaming implementation for Opus response
- [ ] Report PDF export
