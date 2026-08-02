import fs from 'fs';

let apiKey = '';
try {
  const envContent = fs.readFileSync('.env.vercel.prod', 'utf8');
  const match = envContent.match(/MAILERSEND_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) apiKey = match[1];
} catch (e) {}

async function checkActivity() {
  const domainId = 'r9084zkd3p84w63d'; // ojonquecortou.com.br
  const dateFrom = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const dateTo = Math.floor(Date.now() / 1000);
  
  const resEvents = await fetch(`https://api.mailersend.com/v1/activity/${domainId}?date_from=${dateFrom}&date_to=${dateTo}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  console.log('Events Status:', resEvents.status);
  if (resEvents.ok) {
    const data = await resEvents.json();
    console.log('Events Data:', JSON.stringify(data.data ? data.data.slice(0, 10) : data, null, 2));
  } else {
    console.log('Events Error:', await resEvents.text());
  }
}

checkActivity();
