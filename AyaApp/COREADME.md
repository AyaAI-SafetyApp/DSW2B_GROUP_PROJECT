AYA App - Comprehensive README
This document provides a complete guide for setting up, using, and maintaining the AYA App, a safety-focused mobile application with features like emergency SOS, location sharing, AI-powered safe routes, fall detection, health monitoring, in-app calling, social media integration, and an AI Therapist. The app uses a subscription-based model to control access to premium features, secure passkey authentication with Supabase, wakeword detection for voice-activated SOS, account reactivation via email verification, and serverless email integration.
Last Updated: November 3, 2025
Version: 1.0.0

Overview
The AYA App is designed to enhance personal and family safety through a range of features, including:

Emergency SOS: Quick-access emergency button and voice-activated SOS with "Hello Aya"
Location Sharing: Real-time and basic location sharing with emergency contacts
AI Safe Routes: AI-powered route recommendations for safer travel
Fall Detection: Automatic detection and alerts for falls
Health Monitoring: Advanced health tracking and digital medical card
In-App Calling: Secure voice and video calls to emergency contacts
Social Media Integration: Share safety updates and connect with the community
AI Therapist: AI-powered mental health support for Personal Pro subscribers
Subscription-Based Access: Tiered access to premium features
Passkey Authentication: Secure biometric-based login
Account Reactivation: Email-based reactivation for deactivated accounts


Features
✅ Free Features (Available to All Users)


FeatureDescriptionScreenEmergency SOSQuick emergency button and voice-activated SOSSOS ScreenBasic Location SharingShare location with up to 3 contactsHome ScreenEmergency ContactsUp to 3 emergency contactsEmergency ScreenCommunity SupportAccess to community newsfeedNewsfeed TabSafety Tips & ResourcesEducational content and tipsHome ScreenGBV News FeedLatest news about GBV awarenessNews TabLearning GamesEducational safety gamesLearning TabProfile ManagementBasic profile featuresProfile ScreenSocial Media SharingShare safety updates to external platforms (e.g., Twitter, WhatsApp)Social Media Screen
🔒 Premium Features



TierPriceFeaturesPersonalR49.99/monthAll Free + Real-time Alerts, Offline Support, AI Safe Routes, Priority Support, Advanced Location, Unlimited Contacts, Fall Detection, In-App CallingFamilyR67.99/monthAll Personal + Family Tracking, Shared Alerts, Group Safety Zones, Child Safety, Family SupportPersonal ProR99.99/monthAll Personal + Family + AI Therapist, Advanced Analytics, Extended Offline Maps, Dedicated Support, Health Monitoring
Locked Screens

Therapist Tab: Requires Personal Pro
AI Safe Routes (Map View): Requires Personal
Health Monitoring: Requires Personal Pro
Fall Detection: Requires Personal
In-App Calling: Requires Personal


Wakeword Detection - "Hello Aya"
Overview
Enables voice-activated emergency SOS using Picovoice Porcupine for offline wakeword detection of "Hello Aya".
Integration

Integrated into SosScreen.js
Uses @picovoice/porcupine-react-native
Replaces WebView-based speech recognition

Usage
javascriptimport WakewordDetection from "../components/WakewordDetection";

<WakewordDetection
  onWakewordDetected={triggerSOS}
  enabled={fallDetectionEnabled}
/>
Component Props

onWakewordDetected: Callback when "Hello Aya" is detected
enabled: Boolean to enable/disable detection (default: true)
accessKey: Picovoice access key (optional, has default)

How It Works

Requests microphone permission on mount
Listens for "Hello Aya" when enabled
Triggers onWakewordDetected callback on detection
Cleans up on unmount

Features

✅ Offline detection
✅ Low power consumption
✅ On-device processing for privacy
✅ Custom-trained "Hello Aya" model
✅ Automatic permission handling

Android Configuration

Ensure .ppn model file is in android/app/src/main/assets/
For EAS builds, automatically bundled
For local builds, verify file inclusion

Troubleshooting

Wakeword not detected:

Check microphone permissions
Verify model file in assets/
Ensure enabled prop is true


Permission errors:

Grant microphone permission
Check app permissions in Android Settings


Build errors:

Install @picovoice/porcupine-react-native
Run pnpm install
Clear Metro cache: npx expo start --clear



Testing

Enable "Alerts" toggle in SOS screen
Say "Hello Aya" clearly
Verify SOS alert triggers


Passkey Authentication System
Overview
A secure passkey authentication system migrated from Firebase to Supabase, supporting biometric authentication (Face ID/Fingerprint) for registration and login.
Architecture
Backend Components

passkeyService.js (Backend/passkeyService.js):

generatePasskey(): Creates unique passkey credentials
storePasskey(): Stores passkeys in Supabase
getPasskey(): Retrieves specific passkey
getUserPasskeys(): Gets all user passkeys
verifyPasskey(): Verifies passkey exists


server.js (Backend/server.js):

POST /register: Registers new user with passkey
POST /login/verify: Verifies login with passkey
GET /api/passkey/:userId: Retrieves user passkeys



Frontend Components

CreateCredential.js (AyaApp/screens/Auth/CreateCredential.js):

Handles registration with biometric authentication
Sends request to backend for passkey generation


GetAssertion.js (AyaApp/screens/Auth/GetAssertion.js):

Handles login with biometric authentication
Fetches and verifies passkeys



Database Schema
sqlCREATE TABLE passkeys (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    provider TEXT DEFAULT 'biometric',
    created_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

Indexes: idx_passkeys_user_id, idx_passkeys_credential_id
Row Level Security (RLS): Enabled, users can only access their own passkeys

Setup Instructions

Run Database Migration:

Open Supabase Dashboard: https://app.supabase.com
Go to SQL Editor
Copy and run Backend/supabase_passkeys_migration.sql
Verify passkeys table creation


Install Dependencies:
bashcd Backend
npm install @supabase/supabase-js
cd ../AyaApp
npm install @supabase/supabase-js expo-local-authentication axios

Start Backend:
bashcd Backend
node server.js


Supabase Configuration

URL: https://gfrnxqhivmgfgdersflu.supabase.co
Project ID: gfrnxqhivmgfgdersflu
Anon Key: Configured in Backend/passkeyService.js and AyaApp/lib/supabaseClient.js

Security Features

Biometric authentication required
Unique passkeys per user
RLS for data isolation
HTTPS/TLS for API calls
Timestamp-based credential IDs

Testing

Registration:

Navigate to CreateCredential screen
Enter email (e.g., test@example.com)
Click "Continue with Apple/Google"
Complete biometric authentication
Verify passkey in Supabase


Login:

Navigate to GetAssertion screen
Click "Authenticate"
Complete biometric authentication
Verify navigation to MainTabs



Troubleshooting

"No passkeys found": Register user first
"Biometric not available": Ensure device supports biometrics
"Failed to store passkey": Verify migration and RLS policies


Account Reactivation System
Overview
Allows deactivated users to reactivate accounts via a 6-digit email verification code.
Components

Database Schema (Backend/reactivation_codes_schema.sql):

Stores 6-digit codes with 24-hour expiration
Tracks email, usage, and timestamps


ReactivateAccountScreen.js (AyaApp/screens/ReactivateAccountScreen.js):

Two-step flow: email input, code verification
Updates account status in Supabase


LoginScreen.js (AyaApp/screens/LoginScreen.js):

Added "Reactivate Account" link



Setup Instructions

Run Database Migration:

Copy Backend/reactivation_codes_schema.sql
Paste into Supabase SQL Editor
Run and verify reactivation_codes table


Verify Table Structure:
sqlSELECT * FROM reactivation_codes LIMIT 1;
Expected columns: id, user_email, code, is_used, created_at, expires_at, used_at

Testing

Deactivate Account:

Go to Profile → Settings → Deactivate Account
Confirm and sign out


Attempt Login:

Try logging in with deactivated account
Should see "Account is deactivated" alert


Reactivate:

Click "Reactivate Account" on Login screen
Enter email and request code
Enter 6-digit code (shown in Alert for development)
Verify account reactivation and redirect to Login



Email Integration (Production)

Development: Codes shown in Alert
Production: Deploy Supabase Edge Function for email:
bashsupabase functions deploy send-email
supabase secrets set RESEND_API_KEY=re_your_api_key_here

Update ReactivateAccountScreen.js to invoke email function:
javascriptconst { data, error } = await supabase.functions.invoke('send-reactivation-email', {
  body: { email: email.trim(), code }
});


Security Features

24-hour code expiration
One-time use codes
Server-side validation
Automatic cleanup of expired codes
RLS on reactivation_codes table


Social Authentication
Overview
Supports Google and Facebook OAuth for user authentication.
Credentials

Google OAuth:

Client ID: 250843888677-qgiiffabejo21rn372p2oaa22b56m7rq.apps.googleusercontent.com
Client Secret: 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
Project ID: arched-proton-452514-n8


Supabase:

Callback URL: https://gfrnxqhivmgfgdersflu.supabase.co/auth/v1/callback
Project URL: https://gfrnxqhivmgfgdersflu.supabase.co



Setup

Google Cloud Console:

Add redirect URI: https://gfrnxqhivmgfgdersflu.supabase.co/auth/v1/callback
Configure OAuth consent screen


Supabase Dashboard:

Enable Google provider
Enter Client ID and Secret


App Configuration:

Deep linking scheme: ayaai://auth/callback in app.json



Testing

Google Sign-In:

Run app: npm start
Tap Google button
Select account and verify redirect to MainTabs


Facebook Sign-In (Optional):

Set up Facebook App
Enable in Supabase
Test similarly



Troubleshooting

"redirect_uri_mismatch": Verify callback URL
"Invalid client": Check Client ID/Secret
Popup not opening: Check internet and Supabase project status


Subscription-Based Feature Access
Overview
Controls access to premium features based on subscription tier, with upgrade prompts for restricted features.
Implementation

Screens:

HomeScreen.js: Checks for Safe Route, Medical, Emergency
TherapistScreen.js: Requires Personal Pro for AI Therapist
FallDetection.js: Requires Personal
HealthScreen.js: Requires Personal Pro
CallScreen.js: Requires Personal for in-app calling
SocialMediaScreen.js: Free for basic sharing, premium for advanced features


Subscription Management:

subscriptionScreen.js and SubscriptionUpgrade.js save tier and expiration to Supabase
Uses user_subscriptions table


UI:

Locked screens show lock icon, feature description, and upgrade button
Cached in AsyncStorage for performance



Database Schema
sqlCREATE TABLE user_subscriptions (
  email TEXT NOT NULL,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'personal', 'family', 'personal_pro')),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
Testing

Verify free user sees upgrade prompts for premium features
Confirm Personal subscribers access Fall Detection and In-App Calling
Confirm Personal Pro subscribers access AI Therapist and Health Monitoring
Test subscription saving and expiration handling


In-App Calling
Overview
Enables secure voice and video calls to emergency contacts, available to Personal tier and above.
Integration

Implemented in CallScreen.js
Uses WebRTC or similar library for real-time communication
Integrated with emergency contacts list

Usage
javascriptimport CallScreen from "../screens/CallScreen";

<CallScreen
  contactId={selectedContactId}
  userSubscription={userSubscription}
/>
Features

✅ Voice and video call support
✅ Encrypted communication
✅ Integration with emergency contacts
✅ Accessible only to Personal tier and above
✅ Displays upgrade prompt for free users

Setup

Install dependencies:
bashnpm install react-native-webrtc

Configure permissions in app.json:
json{
  "expo": {
    "permissions": ["camera", "microphone"]
  }
}


Testing

Select an emergency contact
Initiate a voice or video call
Verify call connects for Personal tier users
Confirm free users see upgrade prompt

Troubleshooting

Call fails to connect: Check network and permissions
No video/audio: Verify camera/microphone permissions
Upgrade prompt not shown: Ensure subscription check in CallScreen.js


Social Media Integration
Overview
Allows users to share safety updates and connect with the AYA community via external social media platforms.
Integration

Implemented in SocialMediaScreen.js
Supports sharing to Twitter, WhatsApp, and other platforms
Basic sharing (e.g., predefined safety tips) available to all users
Advanced features (e.g., custom posts, community engagement) require Personal tier

Usage
javascriptimport SocialMediaScreen from "../screens/SocialMediaScreen";

<SocialMediaScreen
  userSubscription={userSubscription}
/>
Features

✅ Share predefined safety tips (Free)
✅ Custom post creation (Personal tier)
✅ Community engagement features (Personal tier)
✅ Integration with Twitter, WhatsApp, etc.
✅ Upgrade prompt for premium features

Setup

Install dependencies:
bashnpm install react-native-share

Configure sharing permissions in app.json

Testing

Share a predefined safety tip (all users)
Attempt custom post creation (free users should see upgrade prompt)
Verify post sharing to external platforms
Confirm community engagement features for Personal tier

Troubleshooting

Sharing fails: Check platform-specific API keys
Upgrade prompt not shown: Verify subscription check
Community features unavailable: Ensure Personal tier


AI Therapist
Overview
Provides AI-powered mental health support, available exclusively to Personal Pro subscribers.
Integration

Implemented in TherapistScreen.js
Uses AI-driven chatbot for mental health conversations
Fully locked for non-Personal Pro users

Usage
javascriptimport TherapistScreen from "../screens/TherapistScreen";

<TherapistScreen
  userSubscription={userSubscription}
/>
Features

✅ Conversational AI for mental health support
✅ Personalized response generation
✅ Secure and private interactions
✅ Requires Personal Pro subscription
✅ Upgrade prompt for non-subscribers

Setup

Ensure Supabase integration for user data
Configure AI model API (e.g., OpenAI or custom model)

Testing

Access Therapist Tab as a Personal Pro user
Verify chatbot responses
Confirm free/Personal/Family users see upgrade prompt
Test conversation persistence and privacy

Troubleshooting

Chatbot not responding: Check AI model API configuration
Upgrade prompt not shown: Verify subscription check
Data privacy issues: Ensure RLS and encryption


Supabase Edge Function Email Setup
Overview
Replaces Express.js backend with serverless Supabase Edge Functions for email sending.
Setup

Install Supabase CLI:
bashnpm install -g supabase

Deploy Email Function:
bashsupabase login
supabase link --project-ref gfrnxqhivmgfgdersflu
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase functions deploy send-email


Email Types

Reactivation: 6-digit code
Deactivation: Account suspended notice
Deletion: Account deleted confirmation

Testing

Check logs: supabase functions logs send-email
Test function:
bashcurl -X POST 'https://gfrnxqhivmgfgdersflu.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","code":"123456","userName":"Test","type":"reactivation"}'



Testing Checklist

 Wakeword detection triggers SOS with "Hello Aya"
 Passkey registration and login work with biometrics
 Account reactivation flow completes successfully
 Google OAuth login redirects to MainTabs
 In-App Calling connects for Personal tier users
 Social Media sharing works for all users (basic) and Personal tier (advanced)
 AI Therapist responds for Personal Pro users
 Premium features show upgrade prompts for free users
 Subscription tier changes update database correctly
 Email function sends reactivation codes in production


Troubleshooting

Wakeword Issues: Check microphone permissions, model file, and enabled prop
Passkey Issues: Verify migration, RLS, and biometric support
Reactivation Issues: Ensure reactivation_codes table exists, check RLS
OAuth Issues: Validate redirect URI and credentials
Call Issues: Check network, permissions, and WebRTC setup
Social Media Issues: Verify platform API keys and subscription checks
AI Therapist Issues: Check AI model API and subscription status
Subscription Issues: Check user_subscriptions table and AsyncStorage cache
Email Issues: Verify Resend API key and Edge Function deployment


Future Enhancements

Annual billing discounts
Family member invitation system
Referral rewards program
Trial periods for premium features
Passkey expiration/refresh
Multi-device passkey support
Subscription renewal notifications
Feature usage analytics
Enhanced AI Therapist capabilities
Additional social media platform integrations


Support

Check Supabase Dashboard for logs and database entries
Review console logs for backend and frontend errors
Refer to individual documentation files:

PASSKEY_SUPABASE_README.md
PASSKEY_SETUP_GUIDE.md
PASSKEY_TESTING_GUIDE.md
PASSKEY_FLOW_DIAGRAM.md



Status: ✅ Ready for testing (Development mode)
Production: ⏳ Requires email integration and production deployment

