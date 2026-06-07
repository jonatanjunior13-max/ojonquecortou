const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getDoc, doc, query, where } = require('firebase/firestore');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/.env';
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

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

const isChemistry = (serviceName) => {
  if (!serviceName) return false;
  return /(quimica|química|mechas|luzes|coloração|coloracao|descoloração|descoloracao|relaxamento|alisamento|botox|progressiva)/i.test(serviceName);
};

async function run() {
  const todayStr = '2026-06-06';
  console.log(`=== ANALYZING AUTOMATIONS FOR TODAY: ${todayStr} ===\n`);

  // Load Settings
  const settingsDoc = await getDoc(doc(db, 'settings', 'studio'));
  const settings = settingsDoc.exists() ? settingsDoc.data() : null;
  const automations = settings?.automations || {};
  const sequenceEnabled = automations.sequenceEnabled !== false;

  console.log('--- Settings Status ---');
  console.log(`Mestre (sequenceEnabled): ${sequenceEnabled}`);
  console.log(`D+1 (seqD1): ${automations.seqD1 !== false}`);
  console.log(`D+7 (seqD7): ${automations.seqD7 !== false}`);
  console.log(`D+21 (seqD21): ${automations.seqD21 !== false}`);
  console.log(`D+35 (seqD35): ${automations.seqD35 !== false}`);
  console.log(`D+60 (seqD60): ${automations.seqD60 !== false}`);
  console.log(`D+90 (seqD90): ${automations.seqD90 !== false}`);
  console.log(`D+150 (seqD150): ${automations.seqD150 !== false}`);
  console.log(`Aniversário (birthdayEnabled): ${automations.birthdayEnabled !== false}`);
  console.log(`Campanha Lançamento (launchCampaignEnabled): ${automations.launchCampaignEnabled === true}\n`);

  // Check Birthdays
  if (automations.birthdayEnabled !== false) {
    console.log('--- Checking Birthdays (D-5) ---');
    // Target bday is 5 days from today
    const targetBday = new Date(todayStr + 'T12:00:00');
    targetBday.setDate(targetBday.getDate() + 5); // June 11
    const targetMonth = String(targetBday.getMonth() + 1).padStart(2, '0');
    const targetDay = String(targetBday.getDate()).padStart(2, '0');
    const monthDayStr = `${targetMonth}-${targetDay}`;
    console.log(`Target birthday pattern: -${monthDayStr} (Date: ${targetBday.toISOString().split('T')[0]})`);

    const profilesSnap = await getDocs(collection(db, 'client_profiles'));
    let foundBdays = 0;
    for (const docSnap of profilesSnap.docs) {
      const p = docSnap.data();
      if (p.birthdate) {
        // Just print any birthdate we find to understand format
        // console.log(`Client birthdate format check: ${p.name} - ${p.birthdate}`);
        if (p.birthdate.endsWith(`-${monthDayStr}`) || p.birthdate.endsWith(`/${targetDay}/${targetMonth}`) || p.birthdate.includes(`-${targetMonth}-${targetDay}`)) {
          foundBdays++;
          console.log(`Match: ${p.name} (${p.email}) - Birthday: ${p.birthdate}`);
          
          if (p.unsubscribed === true) {
            console.log('  -> SKIPPED: client is unsubscribed.');
            continue;
          }
          if (!p.email || p.email === 'Não informado' || !p.email.includes('@')) {
            console.log('  -> SKIPPED: email is invalid or missing.');
            continue;
          }

          // Check if already sent today
          const logQ = query(
            collection(db, 'automation_logs'),
            where('email', '==', p.email),
            where('date', '==', todayStr),
            where('stage', '==', 'Aniversário')
          );
          const logSnap = await getDocs(logQ);
          if (!logSnap.empty) {
            console.log('  -> SKIPPED: Birthday email already sent today.');
          } else {
            console.log('  -> TO BE SENT TODAY!');
          }
        }
      }
    }
    if (foundBdays === 0) {
      console.log('No matching birthdays for this target date.\n');
    } else {
      console.log();
    }
  }

  // Check Sequence Windows
  const windows = [1, 7, 21, 35, 50, 60, 90, 150]; // Include 150 here to check even if the cron loop has a gap
  
  if (sequenceEnabled) {
    console.log('--- Checking Relationship Sequence Windows ---');
    for (const daysAgo of windows) {
      const d = new Date(todayStr + 'T12:00:00');
      d.setDate(d.getDate() - daysAgo);
      const targetDateStr = d.toISOString().split('T')[0];
      
      // Note: cron only runs for [1, 7, 21, 35, 50, 60, 90]. 150 is not in the cron's windows array!
      const isCronWindow = [1, 7, 21, 35, 50, 60, 90].includes(daysAgo);

      const q = query(
        collection(db, 'bookings'),
        where('date', '==', targetDateStr),
        where('status', 'in', ['Concluído', 'finalizado'])
      );
      const snap = await getDocs(q);

      if (snap.size > 0) {
        console.log(`\nWindow D+${daysAgo} (Target Booking Date: ${targetDateStr})`);
        if (!isCronWindow) {
          console.log(`⚠️ Warning: D+${daysAgo} is NOT in the production cron's 'windows' array, so it won't trigger automatically unless corrected!`);
        }
        
        for (const bDoc of snap.docs) {
          const booking = bDoc.data();
          console.log(`Client: ${booking.clientName} (${booking.clientEmail}, ${booking.clientPhone})`);
          console.log(`  Service: ${booking.serviceName} | Status: ${booking.status}`);

          if (!booking.clientEmail || !booking.clientEmail.includes('@')) {
            console.log('  -> SKIPPED: invalid/missing email.');
            continue;
          }

          // Check unsubscribed
          const phoneKey = booking.clientPhone.replace(/\D/g, '');
          const profileDoc = await getDoc(doc(db, 'client_profiles', phoneKey));
          const isUnsubscribed = profileDoc.exists() && profileDoc.data().unsubscribed === true;
          if (isUnsubscribed) {
            console.log('  -> SKIPPED: client is unsubscribed.');
            continue;
          }

          // Check for more recent bookings
          const recentQ = query(
            collection(db, 'bookings'),
            where('clientPhone', '==', booking.clientPhone)
          );
          const recentSnap = await getDocs(recentQ);
          const hasRecent = recentSnap.docs.some(doc => {
            const b = doc.data();
            return b.date > targetDateStr && ['Concluído', 'Confirmado', 'finalizado'].includes(b.status);
          });
          
          if (hasRecent) {
            console.log('  -> SKIPPED: client has a more recent booking after this target date.');
            continue;
          }

          // Check if already sent today for this milestone
          const logQ = query(
            collection(db, 'automation_logs'),
            where('email', '==', booking.clientEmail),
            where('date', '==', todayStr),
            where('stage', '==', `D+${daysAgo}`)
          );
          const logSnap = await getDocs(logQ);
          if (!logSnap.empty) {
            console.log(`  -> SKIPPED: Email D+${daysAgo} was already sent today.`);
            continue;
          }

          // Determine template and sub-switch
          const chem = isChemistry(booking.serviceName || '');
          let tplKey = null;
          let subSwitchName = null;

          if (daysAgo === 1) { tplKey = 'd1'; subSwitchName = 'seqD1'; }
          else if (daysAgo === 7) { tplKey = 'd7'; subSwitchName = 'seqD7'; }
          else if (daysAgo === 21) { tplKey = 'd21'; subSwitchName = 'seqD21'; }
          else if (daysAgo === 35 && !chem) { tplKey = 'd35'; subSwitchName = 'seqD35'; }
          else if (daysAgo === 50 && chem) { tplKey = 'd35'; subSwitchName = 'seqD35'; } // Uses seqD35 switch & d35 template
          else if (daysAgo === 60) { tplKey = 'd60'; subSwitchName = 'seqD60'; }
          else if (daysAgo === 90) { tplKey = 'd90'; subSwitchName = 'seqD90'; }
          else if (daysAgo === 150) { tplKey = 'reativacao_5_meses'; subSwitchName = 'seqD150'; }

          if (!tplKey) {
            console.log(`  -> SKIPPED: No template mapped for daysAgo=${daysAgo} and serviceChemistry=${chem}.`);
            continue;
          }

          const subSwitchEnabled = automations[subSwitchName] !== false;
          console.log(`  -> Switch ${subSwitchName} active: ${subSwitchEnabled}`);
          if (!subSwitchEnabled) {
            console.log(`  -> SKIPPED: Specific switch ${subSwitchName} is disabled.`);
            continue;
          }

          console.log(`  -> TO BE SENT TODAY! Template: ${tplKey} (Subject: ${templates[tplKey]?.subject || 'Seu cabelo tem memória'})`);
        }
      }
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
