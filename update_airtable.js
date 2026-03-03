const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appS8kd8H48DMYXct');
const data = JSON.parse(fs.readFileSync('./.agent/ebd_mapped.json', 'utf8'));

async function updateRecords() {
    try {
        console.log("Fetching existing EBD_Category records to get record IDs...");
        const existingRecords = await base('tblCCnizVeFcNpjbj').select({
             fields: ['category_id']
        }).all();
        
        let updates = [];
        for (const row of data) {
             const match = existingRecords.find(r => r.get('category_id') === row.category_id);
             if (match) {
                 updates.push({
                     id: match.id,
                     fields: {
                         "survey_primary_match": row.survey_primary_match || "",
                         "survey_secondary_match": row.survey_secondary_match || "",
                         "risk_flag_trigger": row.risk_flag_trigger || "",
                         "concern_area_trigger": row.concern_area_trigger || ""
                     }
                 });
             }
        }
        
        console.log(`Prepared ${updates.length} records for batch update.`);
        
        // Batch update limits to 10 records at a time
        while(updates.length > 0) {
            const batch = updates.splice(0, 10);
            await base('tblCCnizVeFcNpjbj').update(batch);
            console.log("Updated a batch of", batch.length);
        }
        console.log("Airtable Injection Complete!");
    } catch (e) {
        console.error("Failed to update airtable records. Ensure the columns exist!");
        console.error(e.message);
    }
}

updateRecords();
