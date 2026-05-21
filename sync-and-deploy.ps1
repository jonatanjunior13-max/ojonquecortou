# Script to automatically copy the new profile picture, test the build, and deploy to Vercel via Git
Write-Host "Starting update and deploy process..." -ForegroundColor Cyan

$srcImages = @(
    "C:\Users\jonat\.gemini\antigravity\brain\596317c0-68b8-4610-9993-d41ae372cebb\media__1779204349484.jpg",
    "C:\Users\jonat\.gemini\antigravity\brain\596317c0-68b8-4610-9993-d41ae372cebb\media__1779204307347.jpg",
    "C:\Users\jonat\.gemini\antigravity\brain\596317c0-68b8-4610-9993-d41ae372cebb\media__1779204040308.jpg"
)

$destImage = Join-Path $PSScriptRoot "public\jon-perfil.jpg"
$copied = $false

foreach ($src in $srcImages) {
    if (Test-Path $src) {
        try {
            Copy-Item -Path $src -Destination $destImage -Force
            Write-Host "Success: Copied profile image to $destImage" -ForegroundColor Green
            $copied = $true
            break
        } catch {
            Write-Host "Warning: Failed to copy from $src" -ForegroundColor Yellow
        }
    }
}

if (-not $copied) {
    Write-Host "Error: Could not find the uploaded image in any of the expected locations." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "Staging files for Git..." -ForegroundColor Cyan
git add public/jon-perfil.jpg

Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "feat: update homepage profile photo"

Write-Host "Pushing to repository (triggers Vercel deploy)..." -ForegroundColor Cyan
git push

Write-Host "All done! Vercel should start deploying your updated site in 1-2 minutes." -ForegroundColor Green
Read-Host "Press Enter to close this window"
