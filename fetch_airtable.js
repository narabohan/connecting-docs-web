const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appS8kd8H48DMYXct');

async function fetchCategories() {
    try {
        const records = await base('tblCCnizVeFcNpjbj').select({
            fields: ['category_id', 'category_display_name', 'best_primary_indication', 'secondary_indications', 'contraindicated_conditions', 'notes_internal']
        }).all();
        
        // Use process.stdout.write to prevent dotenv prepending stdout logs
        process.stdout.write(JSON.stringify(records.map(r => r.fields), null, 2));
    } catch (e) {
        console.error(e);
    }
}

fetchCategories();
