# Deploy Updated Edge Function to Supabase (PowerShell)

Write-Host "🚀 Deploying updated Edge Function with welcome email support..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
$supabaseCommand = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCommand) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Deploy the function
Write-Host "📦 Deploying dynamic-api function..." -ForegroundColor Yellow
supabase functions deploy dynamic-api --project-ref gfrnxqhivmgfgdersflu

# Check deployment status
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test signup with a real email address"
    Write-Host "2. Check your inbox for welcome email"
    Write-Host "3. Verify full name appears in greeting"
    Write-Host "4. Check Supabase logs: supabase functions logs dynamic-api"
    Write-Host ""
    Write-Host "📧 Expected email subject:" -ForegroundColor Cyan
    Write-Host "   'Welcome to Aya App - Your Passkey is Ready! 🦋'" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual deployment steps:" -ForegroundColor Yellow
    Write-Host "1. Go to https://app.supabase.com"
    Write-Host "2. Select project: gfrnxqhivmgfgdersflu"
    Write-Host "3. Navigate to Edge Functions → dynamic-api"
    Write-Host "4. Click Edit Function"
    Write-Host "5. Copy contents of: supabase/functions/send-passkey-email/index.ts"
    Write-Host "6. Paste and Save"
    Write-Host ""
}
