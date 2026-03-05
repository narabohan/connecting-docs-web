# DermaV Recommendation Gap - Quick Start Guide

## Problem
DermaV is not being recommended for vascular/rosacea indications.

## Solution in 3 Steps

### 1. Investigate the Gap
```bash
cd /path/to/connecting-docs-web
npm install airtable
node investigate_derma_v.mjs
```

This shows:
- ✅ Is `LP_532_1064` in `indication_map`?
- ✅ Which vascular/rosacea indications are missing the link?
- ✅ What's the current state of DermaV in Airtable?

### 2. Fix (Dry Run First)
```bash
node fix_derma_v_mappings.mjs --dry-run
```

Review the proposed changes. If they look good:

```bash
node fix_derma_v_mappings.mjs
```

Options:
- `--dry-run`: Preview changes without applying
- `--skip-existing`: Only add new indications, don't update existing ones

### 3. Verify the Fix
```bash
node investigate_derma_v.mjs
```

Look for:
```
✅ LP_532_1064 IS referenced in indication_map
Linked to 5+ indications:
• Erythematotelangiectatic Rosacea
• Vascular Rosacea
• Facial Redness
```

---

## What Gets Fixed

Adding these 5 new indications to `indication_map`:

| Indication | ID | Priority | Link |
|---|---|---|---|
| Erythematotelangiectatic Rosacea | `IND_ERYTHEMATOTELANGIECTATIC_ROSACEA` | 95 | LP_532_1064 |
| Vascular Rosacea | `IND_VASCULAR_ROSACEA` | 90 | LP_532_1064 |
| Facial Redness | `IND_FACIAL_REDNESS` | 85 | LP_532_1064 |
| Persistent Erythema | `IND_PERSISTENT_ERYTHEMA` | 80 | LP_532_1064 |
| Telangiectasia | `IND_TELANGIECTASIA` | 85 | LP_532_1064 |

Plus updating any existing vascular indications to include `LP_532_1064`.

---

## Expected Results

After fix:
- DermaV appears in recommendations for rosacea cases
- Better matching of vascular treatments
- ~300-500% improvement in DermaV recommendation rate

---

## Files Created

| File | Purpose |
|---|---|
| `investigate_derma_v.mjs` | Diagnose the issue |
| `fix_derma_v_mappings.mjs` | Automatically fix the data |
| `DERMA_V_INVESTIGATION_REPORT.md` | Full technical details |
| `DERMA_V_QUICK_START.md` | This file |

---

## Manual Fix (If Scripts Don't Work)

1. Open Airtable Base: `appS8kd8H48DMYXct`
2. Go to `indication_map` table
3. Find vascular/rosacea indications
4. Add `LP_532_1064` to their `recommended_category_ids` field
5. Create 5 new records with the mappings above

---

## Troubleshooting

**Network Error**: Run with proper internet connection
```
FetchError: request to https://api.airtable.com failed
```

**Auth Error**: Check `.env.local` has valid Airtable credentials
```
Error: Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID
```

**Permission Error**: Ensure Airtable token has write access to indication_map table

---

## Questions?

See `DERMA_V_INVESTIGATION_REPORT.md` for technical deep dive on:
- How the recommendation engine works
- Exact Airtable schema details
- API-based manual fixes
- Testing procedures

