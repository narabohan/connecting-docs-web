#!/usr/bin/env node

/**
 * DermaV LP_532_1064 Fix Script
 * 
 * This script automatically adds missing LP_532_1064 mappings to vascular/rosacea
 * indications in the Airtable indication_map table.
 * 
 * Usage: node fix_derma_v_mappings.mjs [--dry-run] [--skip-existing]
 */

import Airtable from 'airtable';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dryRun = process.argv.includes('--dry-run');
const skipExisting = process.argv.includes('--skip-existing');

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

// New indications that need LP_532_1064
const newIndications = [
  {
    indication_id: 'IND_ERYTHEMATOTELANGIECTATIC_ROSACEA',
    indication_name: 'Erythematotelangiectatic Rosacea',
    signal_keys: 'rosacea, erythema, facial_redness, 홍조, 혈관확장',
    recommended_category_ids: 'LP_532_1064',
    priority_score: 95
  },
  {
    indication_id: 'IND_VASCULAR_ROSACEA',
    indication_name: 'Vascular Rosacea',
    signal_keys: 'rosacea, vascular, telangiectasia, 혈관성 로사세아',
    recommended_category_ids: 'LP_532_1064',
    priority_score: 90
  },
  {
    indication_id: 'IND_FACIAL_REDNESS',
    indication_name: 'Facial Redness',
    signal_keys: 'redness, facial, erythema, 안면홍조',
    recommended_category_ids: 'LP_532_1064',
    priority_score: 85
  },
  {
    indication_id: 'IND_PERSISTENT_ERYTHEMA',
    indication_name: 'Persistent Erythema',
    signal_keys: 'erythema, persistent, vascular, 지속성홍반',
    recommended_category_ids: 'LP_532_1064',
    priority_score: 80
  },
  {
    indication_id: 'IND_TELANGIECTASIA',
    indication_name: 'Telangiectasia',
    signal_keys: 'telangiectasia, capillary, vascular, 모세혈관확장증',
    recommended_category_ids: 'LP_532_1064',
    priority_score: 85
  }
];

// Keywords to identify vascular/rosacea indications that need LP_532_1064
const vascularKeywords = ['rosacea', 'redness', 'vascular', '홍조', '혈관', '홍반', 'erythema', 'telangiectasia'];

async function fix() {
  try {
    console.log(dryRun ? '[DRY RUN MODE]' : '[LIVE MODE]');
    console.log('\n' + '='.repeat(70));
    console.log('DermaV LP_532_1064 Fix - Airtable Mapper');
    console.log('='.repeat(70) + '\n');

    // Step 1: Get all existing indications
    console.log('Step 1: Fetching all existing indications from indication_map...');
    const allIndications = await base('indication_map').select({
      fields: ['indication_id', 'indication_name', 'signal_keys', 'recommended_category_ids', 'priority_score']
    }).all();

    console.log(`✓ Found ${allIndications.length} existing indications\n`);

    // Step 2: Create new indications
    console.log('Step 2: Creating new vascular/rosacea indications...');
    
    const existingIds = new Set(allIndications.map(r => r.fields.indication_id));
    const toCreate = newIndications.filter(ind => !existingIds.has(ind.indication_id));

    if (toCreate.length === 0) {
      console.log('✓ All new indications already exist, skipping creation\n');
    } else {
      console.log(`  Indications to create: ${toCreate.length}\n`);
      
      toCreate.forEach((ind, i) => {
        console.log(`  ${i + 1}. ${ind.indication_name}`);
        console.log(`     ID: ${ind.indication_id}`);
        console.log(`     Categories: ${ind.recommended_category_ids}`);
        console.log(`     Priority: ${ind.priority_score}`);
      });

      if (!dryRun) {
        console.log('\n  Creating records...');
        
        // Batch create in chunks of 10 (Airtable batch limit)
        for (let i = 0; i < toCreate.length; i += 10) {
          const batch = toCreate.slice(i, i + 10);
          const records = batch.map(ind => ({
            fields: {
              indication_id: ind.indication_id,
              indication_name: ind.indication_name,
              signal_keys: ind.signal_keys,
              recommended_category_ids: ind.recommended_category_ids,
              priority_score: ind.priority_score
            }
          }));

          try {
            const created = await base('indication_map').create(records);
            console.log(`  ✓ Created ${created.length} records`);
          } catch (e) {
            console.error(`  ❌ Failed to create batch: ${e.message}`);
          }
        }
      } else {
        console.log('  [DRY RUN] Would create these records');
      }
      console.log();
    }

    // Step 3: Update existing vascular indications to include LP_532_1064
    if (!skipExisting) {
      console.log('Step 3: Updating existing vascular/rosacea indications...');
      
      const vascularExisting = allIndications.filter(r => {
        const name = (r.fields.indication_name || '').toLowerCase();
        const signal = (r.fields.signal_keys || '').toLowerCase();
        return vascularKeywords.some(kw => name.includes(kw) || signal.includes(kw));
      });

      console.log(`  Found ${vascularExisting.length} existing vascular indications\n`);

      const toUpdate = vascularExisting.filter(r => {
        const catIds = (r.fields.recommended_category_ids || '').split(',').map(s => s.trim());
        return !catIds.includes('LP_532_1064');
      });

      console.log(`  Indications missing LP_532_1064: ${toUpdate.length}\n`);

      toUpdate.forEach((ind, i) => {
        const catIds = (ind.fields.recommended_category_ids || '').split(',').map(s => s.trim());
        console.log(`  ${i + 1}. ${ind.fields.indication_name}`);
        console.log(`     Current categories: ${catIds.join(', ') || 'NONE'}`);
        console.log(`     Will add: LP_532_1064`);
      });

      if (!dryRun && toUpdate.length > 0) {
        console.log('\n  Updating records...');
        
        for (const ind of toUpdate) {
          const catIds = (ind.fields.recommended_category_ids || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          
          if (!catIds.includes('LP_532_1064')) {
            catIds.unshift('LP_532_1064'); // Add to beginning
          }

          try {
            await base('indication_map').update(ind.id, {
              recommended_category_ids: catIds.join(', ')
            });
            console.log(`  ✓ Updated: ${ind.fields.indication_name}`);
          } catch (e) {
            console.error(`  ❌ Failed to update: ${e.message}`);
          }
        }
      } else if (dryRun) {
        console.log('  [DRY RUN] Would update these records');
      }
      console.log();
    }

    // Summary
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70) + '\n');

    console.log(`New indications created: ${dryRun ? '[DRY RUN]' : toCreate.length}`);
    console.log(`Existing indications updated: ${dryRun ? '[DRY RUN]' : (skipExisting ? 'skipped' : toUpdate.length)}`);

    if (dryRun) {
      console.log('\n⚠️  DRY RUN - No changes made to Airtable');
      console.log('To apply changes, run without --dry-run flag');
    } else {
      console.log('\n✅ Changes applied to Airtable');
      console.log('Run "node investigate_derma_v.mjs" to verify');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

fix();
