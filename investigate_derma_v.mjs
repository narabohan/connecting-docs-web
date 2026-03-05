#!/usr/bin/env node

/**
 * DermaV Recommendation Gap Investigation Script
 * 
 * This script investigates why DermaV is not being recommended for
 * vascular/rosacea indications despite having the LP_532_1064 category.
 * 
 * Run with: node investigate_derma_v.mjs
 */

import Airtable from 'airtable';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const AIRTABLE_API_KEY = envVars.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = envVars.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('ERROR: Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function investigate() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('DermaV Recommendation Gap Investigation');
    console.log('='.repeat(70) + '\n');

    // STEP 1: Get all EBD_Category records
    console.log('STEP 1: Fetching all EBD_Category records...');
    const allCategories = await base('EBD_Category').select({
      fields: ['category_id', 'category_display_name', 'best_primary_indication', 'budget_tier']
    }).all();
    
    const categoryMap = {};
    const categoryById = {};
    allCategories.forEach(r => {
      categoryMap[r.id] = r.fields.category_id;
      categoryById[r.fields.category_id] = r.fields.category_display_name;
    });

    console.log(`✓ Found ${allCategories.length} categories\n`);

    // STEP 2: Get all indication_map entries
    console.log('STEP 2: Fetching all indication_map entries...');
    const allIndications = await base('indication_map').select({
      fields: ['indication_id', 'indication_name', 'signal_keys', 'recommended_category_ids', 'priority_score']
    }).all();

    const mentionedCategoryIds = new Set();
    const indicationsByCategory = {};

    allIndications.forEach(r => {
      const f = r.fields;
      const catIds = (f.recommended_category_ids || '').split(',').map(s => s.trim()).filter(Boolean);
      catIds.forEach(c => {
        mentionedCategoryIds.add(c);
        if (!indicationsByCategory[c]) {
          indicationsByCategory[c] = [];
        }
        indicationsByCategory[c].push({
          id: f.indication_id,
          name: f.indication_name,
          priority: f.priority_score
        });
      });
    });

    console.log(`✓ Found ${allIndications.length} indication entries`);
    console.log(`✓ ${mentionedCategoryIds.size} unique categories referenced\n`);

    // STEP 3: Check if LP_532_1064 appears in indication_map
    console.log('STEP 3: Checking for LP_532_1064 in indication_map...');
    if (mentionedCategoryIds.has('LP_532_1064')) {
      console.log('✅ LP_532_1064 IS referenced in indication_map');
      console.log(`   Linked to ${indicationsByCategory['LP_532_1064'].length} indications:\n`);
      indicationsByCategory['LP_532_1064'].forEach(ind => {
        console.log(`   • ${ind.name} (${ind.id}) - Priority: ${ind.priority}`);
      });
    } else {
      console.log('❌ LP_532_1064 is NOT referenced in any indication_map entry');
      console.log(`\n   All referenced category IDs (${mentionedCategoryIds.size} total):\n`);
      [...mentionedCategoryIds].sort().forEach(c => {
        console.log(`   • ${c} (${categoryById[c] || 'Unknown'})`);
      });
    }

    // STEP 4: Find vascular/rosacea-related indications
    console.log('\n\nSTEP 4: Finding vascular/rosacea-related indications...');
    const vascularKeywords = ['rosacea', 'redness', 'vascular', '홍조', '혈관', '홍반', 'erythema', 'telangiectasia'];
    
    const vascularIndications = allIndications.filter(r => {
      const name = (r.fields.indication_name || '').toLowerCase();
      const signal = (r.fields.signal_keys || '').toLowerCase();
      return vascularKeywords.some(kw => name.includes(kw) || signal.includes(kw));
    });

    console.log(`✓ Found ${vascularIndications.length} vascular/rosacea-related indications:\n`);
    
    const lp532Issues = [];
    vascularIndications.forEach(r => {
      const catIds = (r.fields.recommended_category_ids || '').split(',').map(s => s.trim()).filter(Boolean);
      console.log(`• [${r.fields.indication_id}] ${r.fields.indication_name}`);
      console.log(`  Signal keys: ${r.fields.signal_keys}`);
      console.log(`  Recommended categories: ${catIds.length > 0 ? catIds.join(', ') : 'NONE'}`);
      
      if (!catIds.includes('LP_532_1064')) {
        lp532Issues.push({
          id: r.fields.indication_id,
          name: r.fields.indication_name,
          currentCats: catIds,
          signals: r.fields.signal_keys
        });
      }
      console.log();
    });

    // STEP 5: Get DermaV details
    console.log('\nSTEP 5: Fetching DermaV device details...');
    const dermaV = await base('EBD_Device').select({
      filterByFormula: `{device_id}="Derma_V"`,
      fields: ['device_id', 'device_name', 'primary_indication', 'secondary_indication', 'clinical_charactor', 'signature_technology']
    }).all();
    
    if (dermaV.length > 0) {
      console.log('✓ DermaV found:\n');
      dermaV.forEach(r => {
        const f = r.fields;
        console.log(`  Device ID: ${f.device_id}`);
        console.log(`  Name: ${f.device_name}`);
        console.log(`  Primary Indication: ${f.primary_indication}`);
        console.log(`  Secondary Indication: ${f.secondary_indication}`);
        console.log(`  Signature Technology: ${f.signature_technology}`);
        console.log(`  Clinical Character: ${f.clinical_charactor}`);
      });
    } else {
      console.log('❌ DermaV device not found in EBD_Device table');
    }

    // STEP 6: Get LP_532_1064 category details
    console.log('\n\nSTEP 6: Fetching LP_532_1064 category details...');
    const lp532Cat = await base('EBD_Category').select({
      filterByFormula: `{category_id}="LP_532_1064"`,
      fields: ['category_id', 'category_display_name', 'best_primary_indication', 'preferred_booster_roles', 'budget_tier', 'reason_why_EN']
    }).all();
    
    if (lp532Cat.length > 0) {
      console.log('✓ LP_532_1064 category found:\n');
      lp532Cat.forEach(r => {
        const f = r.fields;
        console.log(`  Category ID: ${f.category_id}`);
        console.log(`  Name: ${f.category_display_name}`);
        console.log(`  Best Primary Indication: ${f.best_primary_indication}`);
        console.log(`  Preferred Booster Roles: ${f.preferred_booster_roles}`);
        console.log(`  Budget Tier: ${f.budget_tier}`);
        console.log(`  Reason (EN): ${f.reason_why_EN}`);
      });
    } else {
      console.log('❌ LP_532_1064 category not found in EBD_Category table');
    }

    // SUMMARY
    console.log('\n\n' + '='.repeat(70));
    console.log('SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(70) + '\n');

    if (mentionedCategoryIds.has('LP_532_1064')) {
      console.log('✅ Status: LP_532_1064 IS properly configured\n');
      if (lp532Issues.length > 0) {
        console.log(`⚠️  WARNING: ${lp532Issues.length} vascular/rosacea indications missing LP_532_1064 link:\n`);
        lp532Issues.forEach(issue => {
          console.log(`   • ${issue.name}`);
          console.log(`     Current categories: ${issue.currentCats.join(', ') || 'NONE'}`);
        });
        console.log('\n   ACTION: Add LP_532_1064 to recommended_category_ids for these indications');
      } else {
        console.log('✅ All vascular/rosacea indications are properly mapped to LP_532_1064');
      }
    } else {
      console.log('❌ CRITICAL ISSUE: LP_532_1064 is not referenced in any indication_map entry\n');
      console.log(`   ${lp532Issues.length} vascular/rosacea indications need LP_532_1064 mapping:\n`);
      lp532Issues.forEach(issue => {
        console.log(`   • ${issue.name} (${issue.id})`);
      });
      console.log('\n   ACTION: Add LP_532_1064 to recommended_category_ids for all listed indications');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

investigate();
