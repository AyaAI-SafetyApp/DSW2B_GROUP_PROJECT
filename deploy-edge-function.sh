#!/bin/bash
# Deploy Updated Edge Function to Supabase

echo "🚀 Deploying updated Edge Function with welcome email support..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Deploy the function
echo "📦 Deploying dynamic-api function..."
supabase functions deploy dynamic-api --project-ref gfrnxqhivmgfgdersflu

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Test signup with a real email address"
    echo "2. Check your inbox for welcome email"
    echo "3. Verify full name appears in greeting"
    echo "4. Check Supabase logs: supabase functions logs dynamic-api"
    echo ""
    echo "📧 Expected email subject:"
    echo "   'Welcome to Aya App - Your Passkey is Ready! 🦋'"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "🔧 Manual deployment steps:"
    echo "1. Go to https://app.supabase.com"
    echo "2. Select project: gfrnxqhivmgfgdersflu"
    echo "3. Navigate to Edge Functions → dynamic-api"
    echo "4. Click Edit Function"
    echo "5. Copy contents of: supabase/functions/send-passkey-email/index.ts"
    echo "6. Paste and Save"
    echo ""
fi
