# 🔐 AYA App Feature Access Guide

## Subscription Pricing

### 💚 Free Plan - R0 (Forever)
**Basic safety features at no cost**

### 💗 Personal Plan - R49.99/month
**Perfect for individual safety with premium features**

### 👨‍👩‍👧‍👦 Family Plan - R67.99/month
**Complete protection for your entire family**

### ⭐ Personal Pro Plan - R99.99/month
**Advanced protection with maximum features**

---

## Feature Access Matrix

### ✅ FREE Features (Available to All Users)

| Feature | Description | Screen |
|---------|-------------|--------|
| **Emergency SOS** | Quick emergency button | SOS Screen |
| **Basic Location Sharing** | Share location with up to 3 contacts | Home Screen |
| **Emergency Contacts** | Up to 3 emergency contacts | Emergency Screen |
| **Community Support** | Access to community newsfeed | Newsfeed Tab |
| **Safety Tips & Resources** | Educational content and tips | Home Screen |
| **GBV News Feed** | Latest news about GBV awareness | News Tab |
| **Learning Games** | Educational safety games | Learning Tab |
| **Profile Management** | Basic profile features | Profile Screen |

---

### 🔒 PERSONAL PLAN Features (R49.99/month)

All Free features PLUS:

| Feature | Description | Screen |
|---------|-------------|--------|
| **Real-time Alerts** | Instant notifications for emergencies | Throughout App |
| **Offline Support** | Emergency features work offline | Throughout App |
| **AI Safe Routes** | AI-powered route recommendations | Map View Screen |
| **Priority Support** | 24/7 priority customer support | Help & Support |
| **Advanced Location** | Precise location sharing | Map View Screen |
| **Unlimited Contacts** | No limit on emergency contacts | Emergency Screen |
| **Fall Detection** | Automatic fall detection & alerts | Fall Detection Screen |

---

### 🔒 FAMILY PLAN Features (R67.99/month)

All Personal features PLUS:

| Feature | Description | Screen |
|---------|-------------|--------|
| **Family Tracking** | Track up to 5 family members | Map View Screen |
| **Shared Alerts** | Emergency alerts sent to all family | Throughout App |
| **Group Safety Zones** | Create safe zones for family | Map View Screen |
| **Child Safety Features** | Special protections for children | Throughout App |
| **Priority Family Support** | Dedicated family support team | Help & Support |

---

### 🔒 PERSONAL PRO Features (R99.99/month)

All Personal + Family features PLUS:

| Feature | Description | Screen |
|---------|-------------|--------|
| **AI Companion/Therapist** | Chat with AI mental health assistant | Therapist Tab |
| **Advanced Analytics** | Detailed safety analytics dashboard | Health Screen |
| **Extended Offline Maps** | Expanded offline map coverage | Map View Screen |
| **Dedicated Support Line** | Personal dedicated support agent | Help & Support |
| **Health Monitoring** | Advanced health tracking features | Health Screen |

---

## Implementation Details

### How Feature Locking Works

1. **Access Control**: Each feature checks user's subscription tier before allowing access
2. **Upgrade Prompts**: When users try to access locked features, they see an upgrade prompt
3. **Visual Indicators**: Premium features show a 🔒 lock icon badge
4. **Graceful Degradation**: App works fully for free users with their allowed features

### Locked Screens

The following screens show a premium lock screen for non-subscribers:

- **Therapist Tab** - Requires Personal Pro (R99.99/month)
- **AI Safe Routes (in Map View)** - Requires Personal (R49.99/month)
- **Health Monitoring** - Requires Personal Pro (R99.99/month)
- **Fall Detection** - Requires Personal (R49.99/month)

### Free Access Screens

The following screens are always accessible:

- **Home Tab** - Always accessible
- **Newsfeed Tab** - Always accessible
- **SOS Tab** - Always accessible (emergency feature)
- **Learning Tab** - Always accessible (educational content)
- **Emergency Screen** - Always accessible (safety critical)
- **Profile Screen** - Always accessible
- **GBV News** - Always accessible

---

## User Experience

### For Free Users
- Full access to essential safety features
- Can see what premium features are available
- Clear prompts to upgrade when trying premium features
- No interruptions to free features

### For Premium Users
- Unlock advanced AI-powered features
- Priority support access
- Enhanced safety capabilities
- Family tracking and management
- Professional mental health support

---

## Subscription Management

Users can:
- ✅ View all subscription plans
- ✅ Upgrade from any screen showing locked features
- ✅ Manage subscription from Profile → Subscription
- ✅ Compare features between plans
- ✅ Access help and support

---

## Technical Implementation

### Database Schema

The `user_subscriptions` table tracks:
- User email
- Subscription tier (free/personal/family/personal_pro)
- Expiration date
- Active status
- Created/updated timestamps

### Local Caching

- Subscription status cached locally for performance
- Refreshed on app launch and after subscription changes
- Falls back to free tier if check fails

---

## Future Enhancements

Potential additions:
- Annual billing discounts
- Family member invitation system
- Referral rewards program
- Trial periods for premium features
- Seasonal promotions

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
