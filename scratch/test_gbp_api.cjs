const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const docSnap = await getDoc(doc(db, 'settings', 'studio'));
  if (!docSnap.exists()) {
    console.log('No settings/studio doc');
    process.exit(1);
  }

  const settings = docSnap.data();
  const automations = settings?.automations || {};
  const refreshToken = automations.googleGbpRefreshToken;

  if (!refreshToken) {
    console.log('No refresh token found in Firestore.');
    process.exit(1);
  }

  console.log('Refreshing access token...');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    console.error('Failed to refresh token:', tokenData);
    process.exit(1);
  }

  const access_token = tokenData.access_token;
  console.log('Success. Access token:', access_token);

  console.log('Fetching Google Business accounts...');
  const accountsResponse = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  const accountsData = await accountsResponse.json();
  console.log('Accounts Response Status:', accountsResponse.status);
  console.log('Accounts Response Data:', JSON.stringify(accountsData, null, 2));

  if (accountsResponse.ok && accountsData.accounts && accountsData.accounts.length > 0) {
    for (const account of accountsData.accounts) {
      console.log(`Fetching locations for account ${account.name} (${account.title})...`);
      const locationsResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      const locationsData = await locationsResponse.json();
      console.log(`Locations for ${account.name} Status:`, locationsResponse.status);
      console.log(`Locations for ${account.name} Data:`, JSON.stringify(locationsData, null, 2));
    }
  }

  process.exit(0);
}

run().catch(console.error);
