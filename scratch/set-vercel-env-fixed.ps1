$envs = @{
    "VITE_FIREBASE_API_KEY" = "AIzaSyBkmKUQs0Nf_oer1Mvwtg_QumzXANX7m0Y"
    "VITE_FIREBASE_AUTH_DOMAIN" = "ojonque.firebaseapp.com"
    "VITE_FIREBASE_PROJECT_ID" = "ojonque"
    "VITE_FIREBASE_STORAGE_BUCKET" = "ojonque.firebasestorage.app"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "108299544531"
    "VITE_FIREBASE_APP_ID" = "1:108299544531:web:b0fa221ca26901aae77126"
}

foreach ($key in $envs.Keys) {
    $val = $envs[$key]
    
    Write-Host "Adding $key to Vercel preview..." -ForegroundColor Cyan
    cmd /c npx vercel env add $key preview --value $val --yes --force
    
    Write-Host "Adding $key to Vercel development..." -ForegroundColor Cyan
    cmd /c npx vercel env add $key development --value $val --yes --force
}

Write-Host "All environment variables added to preview and development!" -ForegroundColor Green
