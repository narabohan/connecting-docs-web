# SurveyV2_Results — Airtable Table Schema

> Create this table in base `appS8kd8H48DMYXct` before deploying.
> API endpoint: `POST /api/survey-v2/save-result`

## Fields

| Field Name             | Airtable Type       | Purpose                              |
|------------------------|---------------------|--------------------------------------|
| run_id                 | Single line text    | Primary key (v2_timestamp)           |
| created_at             | Single line text    | ISO 8601 timestamp                   |
| patient_country        | Single line text    | ISO 3166 code (KR, JP, CN, SG…)     |
| patient_age_range      | Single select       | teen/20s/30s/40s/50s/60+             |
| patient_gender         | Single select       | female/male/other                    |
| survey_lang            | Single select       | KO/EN/JP/ZH-CN                       |
| safety_flags_summary   | Single line text    | Comma-separated flag types or "NONE" |
| has_danger_flag        | Checkbox            | true if isotretinoin/anticoag/preg   |
| top_devices            | Single line text    | Top 5 device names, comma-separated  |
| top_injectables        | Single line text    | Top 5 injectable names               |
| aesthetic_goal         | Single line text    | Patient's primary aesthetic goal      |
| device_1_confidence    | Number (decimal)    | Confidence score of #1 device        |
| device_1_name          | Single line text    | Name of #1 ranked device             |
| model_used             | Single line text    | e.g. claude-opus-4-6                  |
| input_tokens           | Number (integer)    | Anthropic API input tokens           |
| output_tokens          | Number (integer)    | Anthropic API output tokens          |
| total_tokens           | Number (integer)    | Sum of input + output                |
| open_question_raw      | Long text           | Patient's free-text response (≤5000) |
| recommendation_json    | Long text           | Full OpusRecommendationOutput JSON   |
| demographics_json      | Long text           | Demographics snapshot JSON           |
| safety_flags_json      | Long text           | SafetyFlag[] JSON                    |
| chip_responses_json    | Long text           | SmartChip responses JSON             |
| doctor_tab_json        | Long text           | OpusDoctorTab JSON (for doctors)     |
| treatment_plan_json    | Long text           | OpusTreatmentPlan JSON               |
| user_id_prefix         | Single line text    | First 8 chars of Firebase UID        |

## Notes

- Long text fields have 100k char limit in Airtable; JSON is truncated at 90k
- `has_danger_flag` enables quick filtering for high-risk consultations
- `top_devices` / `top_injectables` enable Airtable views without parsing JSON
- Doctor tab and treatment plan are stored separately for easy doctor-side access
