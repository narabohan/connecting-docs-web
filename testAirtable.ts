import Airtable from 'airtable';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

async function run() {
    try {
        const records = await base('Protocol_block').select({ maxRecords: 8 }).firstPage();
        records.forEach(r => {
            console.log('---');
            console.log('Name:', r.fields.protocol_name);
            console.log('Target Layer:', r.fields.target_layer);
            console.log('Indications:', r.fields['indication_name (from indications)']);
            console.log('Sequence Steps:', r.fields.sequence_steps);
        });
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
run();
