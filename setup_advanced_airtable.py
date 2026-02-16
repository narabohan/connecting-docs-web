import os
import requests
from dotenv import load_dotenv

load_dotenv('/Users/nrb/.gemini/antigravity/scratch/connecting-docs-web/.env.local')

API_KEY = os.getenv('AIRTABLE_API_KEY')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')

if not API_KEY or not BASE_ID:
    print("Error: Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local")
    exit(1)

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_table(table_name, fields):
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    payload = {
        "name": table_name,
        "fields": fields
    }
    response = requests.post(url, json=payload, headers=HEADERS)
    if response.status_code == 200:
        print(f"✅ Table '{table_name}' created successfully.")
    elif response.status_code == 422 and "already exists" in response.text:
       print(f"ℹ️ Table '{table_name}' already exists.")
    else:
        print(f"❌ Failed to create table '{table_name}': {response.text}")

def update_table_field(table_name, field_name, field_type, options=None):
    # First get table ID
    url_list = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    resp = requests.get(url_list, headers=HEADERS)
    if resp.status_code != 200:
        print(f"❌ Failed to list tables: {resp.text}")
        return

    tables = resp.json().get('tables', [])
    table_id = next((t['id'] for t in tables if t['name'] == table_name), None)
    
    if not table_id:
        print(f"❌ Table '{table_name}' not found.")
        return

    # Create field
    url_field = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables/{table_id}/fields"
    payload = {
        "name": field_name,
        "type": field_type,
        "options": options
    }
    resp = requests.post(url_field, json=payload, headers=HEADERS)
    if resp.status_code == 200:
        print(f"✅ Field '{field_name}' added to '{table_name}'.")
    else:
        print(f"⚠️ Failed to add field '{field_name}' (might exist): {resp.text}")

# 1. Create 'Reports' Table
reports_fields = [
    {"name": "Title", "type": "singleLineText"},
    {"name": "Input_JSON", "type": "multilineText"},
    {"name": "Result_JSON", "type": "multilineText"},
]

# We want to link to Users, but we can't do that at creation easily if we don't know Users table ID. 
# Best practice: Create table first, then create link field.
create_table("Reports", reports_fields)

# 2. Add Link to Users in Reports
# We need Users Table ID
url_list = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
resp = requests.get(url_list, headers=HEADERS)
if resp.status_code == 200:
    tables = resp.json().get('tables', [])
    users_table_id = next((t['id'] for t in tables if t['name'] == 'Users'), None)
    
    if users_table_id:
        update_table_field("Reports", "User_Link", "multipleRecordLinks", { "linkedTableId": users_table_id })
    else:
        print("❌ 'Users' table not found. Cannot link.")

# 3. Add 'Language' to Users
update_table_field("Users", "Language", "singleSelect", { "choices": [
    {"name": "EN"}, {"name": "KO"}, {"name": "JP"}, {"name": "CN"}
]})

print("🎉 Airtable Schema Setup Complete.")
