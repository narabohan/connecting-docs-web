const fetch = require('node-fetch');

async function testWebhook() {
  const url = "https://hook.us2.make.com/9klo4kjhsu9rhqomkesj1po5d9yjcjqr";
  console.log(`Sending ping to ${url}...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'new_report_generated',
        userEmail: 'vip_patient@example.com',
        reportId: 'recTESTING12345',
        topProtocol: 'MNRF + Exosome (Glass Skin Booster)',
        primaryGoal: 'Pore reduction and glowing skin',
        expectedRevenue: '$1000-$3000',
        test_mode: true
      })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
  } catch(e) {
    console.error('Error:', e);
  }
}

testWebhook();
