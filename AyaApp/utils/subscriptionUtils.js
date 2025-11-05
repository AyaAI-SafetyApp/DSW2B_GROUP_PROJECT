
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PERSONAL: 'personal',
  FAMILY: 'family',
  PERSONAL_PRO: 'personal_pro',
};

export const FEATURES = {

  EMERGENCY_SOS: 'emergency_sos',
  BASIC_LOCATION: 'basic_location',
  THREE_CONTACTS: 'three_contacts',
  COMMUNITY_SUPPORT: 'community_support',
  SAFETY_TIPS: 'safety_tips',
  GBV_NEWS: 'gbv_news',
  LEARNING_GAMES: 'learning_games',

  REAL_TIME_ALERTS: 'real_time_alerts',
  OFFLINE_SUPPORT: 'offline_support',
  AI_SAFE_ROUTES: 'ai_safe_routes',
  PRIORITY_SUPPORT: 'priority_support',
  ADVANCED_LOCATION: 'advanced_location',
  UNLIMITED_CONTACTS: 'unlimited_contacts',
  FALL_DETECTION: 'fall_detection',

  FAMILY_TRACKING: 'family_tracking',
  SHARED_ALERTS: 'shared_alerts',
  GROUP_SAFETY_ZONES: 'group_safety_zones',
  CHILD_SAFETY: 'child_safety',
  FAMILY_SUPPORT: 'family_support',

  AI_COMPANION: 'ai_companion',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  EXTENDED_MAPS: 'extended_maps',
  DEDICATED_SUPPORT: 'dedicated_support',
  THERAPIST_ACCESS: 'therapist_access',
  HEALTH_MONITORING: 'health_monitoring',
};

const FEATURE_ACCESS = {

  [FEATURES.EMERGENCY_SOS]: [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.BASIC_LOCATION]: [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.THREE_CONTACTS]: [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.COMMUNITY_SUPPORT]: [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.SAFETY_TIPS]: [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.GBV_NEWS]: [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.LEARNING_GAMES]: [SUBSCRIPTION_TIERS.FREE, SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],

  [FEATURES.REAL_TIME_ALERTS]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.OFFLINE_SUPPORT]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.AI_SAFE_ROUTES]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.PRIORITY_SUPPORT]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.ADVANCED_LOCATION]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.UNLIMITED_CONTACTS]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.FALL_DETECTION]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],

  [FEATURES.FAMILY_TRACKING]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.SHARED_ALERTS]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.GROUP_SAFETY_ZONES]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.CHILD_SAFETY]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.FAMILY_SUPPORT]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],

  [FEATURES.AI_COMPANION]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.ADVANCED_ANALYTICS]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.EXTENDED_MAPS]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.DEDICATED_SUPPORT]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.THERAPIST_ACCESS]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
  [FEATURES.HEALTH_MONITORING]: [SUBSCRIPTION_TIERS.PERSONAL, SUBSCRIPTION_TIERS.FAMILY, SUBSCRIPTION_TIERS.PERSONAL_PRO],
};

/**

 * @returns {Promise<string>}
 */
export const getUserSubscriptionTier = async () => {
  try {

    const sessionData = await AsyncStorage.getItem('@user_session');
    if (!sessionData) {
      console.log('❌ No session found, returning FREE tier');
      return SUBSCRIPTION_TIERS.FREE;
    }

    const { email } = JSON.parse(sessionData);
    console.log('Checking subscription for user:', email);

    const userCacheKey = `@user_subscription_${email}`;
    const cachedSub = await AsyncStorage.getItem(userCacheKey);
    
    if (cachedSub) {
      const { tier, expiresAt, userEmail } = JSON.parse(cachedSub);
      

      if (userEmail === email) {

        if (!expiresAt || new Date(expiresAt) > new Date()) {
          console.log('Using cached subscription for', email, ':', { tier, expiresAt });
          return tier;
        } else {
          console.log('Cached subscription expired for', email);
        }
      } else {
        console.log('🔄 Cache is for different user, clearing...');
        await AsyncStorage.removeItem(userCacheKey);
      }
    }
    console.log('🔍 Fetching subscription for email:', email);
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('subscription_tier, expires_at, is_active')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase error:', error);
      return SUBSCRIPTION_TIERS.FREE;
    }

    if (!data) {
      console.log('📭 No subscription found or error, returning FREE tier');
      return SUBSCRIPTION_TIERS.FREE;
    }

    console.log('✅ Subscription found:', data);

    await AsyncStorage.setItem(userCacheKey, JSON.stringify({
      tier: data.subscription_tier,
      expiresAt: data.expires_at,
      userEmail: email, 
    }));

    return data.subscription_tier || SUBSCRIPTION_TIERS.FREE;
  } catch (error) {
    console.error('Error getting subscription tier:', error);
    return SUBSCRIPTION_TIERS.FREE;
  }
};

/**

 * @param {string} feature
 * @returns {Promise<boolean>} 
 */
export const hasFeatureAccess = async (feature) => {
  try {
    const userTier = await getUserSubscriptionTier();
    const allowedTiers = FEATURE_ACCESS[feature] || [];
    const hasAccess = allowedTiers.includes(userTier);
    
    console.log(`🔐 Feature Access Check:`, {
      feature,
      userTier,
      allowedTiers,
      hasAccess
    });
    

    if (!hasFeatureAccess._lastTierLogged || hasFeatureAccess._lastTierLogged !== userTier) {
      getAvailableFeaturesForTier(userTier);
      hasFeatureAccess._lastTierLogged = userTier;
    }
    
    return hasAccess;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
};

/**

 * @param {object} navigation
 * @param {string} featureName 
 */
export const showUpgradePrompt = (navigation, featureName = 'this feature') => {
  const { Alert } = require('react-native');
  
  Alert.alert(
    '🔒 Premium Feature',
    `${featureName} is only available for premium subscribers. Upgrade now to unlock this and many more features!`,
    [
      {
        text: 'Maybe Later',
        style: 'cancel',
      },
      {
        text: 'View Plans',
        onPress: () => {
          if (navigation) {
            navigation.navigate('SubscriptionScreen');
          }
        },
      },
    ]
  );
};

/**

 * @param {string} tier
 * @param {string} expiresAt
 */
export const updateUserSubscription = async (tier, expiresAt = null) => {
  try {
    const sessionData = await AsyncStorage.getItem('@user_session');
    if (!sessionData) {
      throw new Error('No user session found');
    }

    const { email } = JSON.parse(sessionData);

    console.log(`💾 Updating subscription for ${email}:`, { tier, expiresAt });


    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        email,
        subscription_tier: tier,
        expires_at: expiresAt,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    const userCacheKey = `@user_subscription_${email}`;
    await AsyncStorage.setItem(userCacheKey, JSON.stringify({
      tier,
      expiresAt,
      userEmail: email,
    }));

    console.log('✅ Subscription updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return false;
  }
};

export const clearSubscriptionCache = async () => {
  try {

    const sessionData = await AsyncStorage.getItem('@user_session');
    if (sessionData) {
      const { email } = JSON.parse(sessionData);
      const userCacheKey = `@user_subscription_${email}`;
      await AsyncStorage.removeItem(userCacheKey);
      console.log(`🗑️ Subscription cache cleared for user: ${email}`);
    } else {

      await AsyncStorage.removeItem('@user_subscription');
      console.log('🗑️ Global subscription cache cleared');
    }
  } catch (error) {
    console.error('Error clearing subscription cache:', error);
  }
};

export const clearAllSubscriptionCaches = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const subscriptionKeys = keys.filter(key => 
      key.startsWith('@user_subscription') || key === '@user_subscription'
    );
    
    if (subscriptionKeys.length > 0) {
      await AsyncStorage.multiRemove(subscriptionKeys);
      console.log(`🗑️ Cleared ${subscriptionKeys.length} subscription caches`);
    }
  } catch (error) {
    console.error('Error clearing all subscription caches:', error);
  }
};

export const getAvailableFeaturesForTier = (tier) => {
  const features = [];
  for (const [featureKey, allowedTiers] of Object.entries(FEATURE_ACCESS)) {
    if (allowedTiers.includes(tier)) {
      features.push(featureKey);
    }
  }
  console.log(`🎯 Features available for ${tier} tier:`, features);
  return features;
};

export const debugCacheState = async () => {
  try {
    const sessionData = await AsyncStorage.getItem('@user_session');
    if (!sessionData) {
      console.log('❌ No session - cannot check cache');
      return;
    }

    const { email } = JSON.parse(sessionData);
    const userCacheKey = `@user_subscription_${email}`;
    const cachedSub = await AsyncStorage.getItem(userCacheKey);
    
    console.log('\n🔍 === CACHE DEBUG ===');
    console.log('👤 Current user:', email);
    console.log('🔑 Cache key:', userCacheKey);
    
    if (cachedSub) {
      const cache = JSON.parse(cachedSub);
      console.log('📦 Cached data:', cache);
      console.log('✅ Cache exists for this user');
      
      if (cache.userEmail !== email) {
        console.log('⚠️  WARNING: Cache email mismatch!');
        console.log('   Cache email:', cache.userEmail);
        console.log('   Current user:', email);
      }
    } else {
      console.log('📭 No cache found for this user');
    }
    

    const oldCache = await AsyncStorage.getItem('@user_subscription');
    if (oldCache) {
      console.log('⚠️  Old global cache still exists:', JSON.parse(oldCache));
      console.log('   This should be cleared!');
    }
    console.log('====================\n');
  } catch (error) {
    console.error('Cache debug error:', error);
  }
};

/**

 * @param {string} feature
 * @returns {object}
 */
export const getFeatureInfo = (feature) => {
  const featureInfo = {
    [FEATURES.FALL_DETECTION]: {
      name: 'Fall Detection',
      description: 'Automatically detect falls and alert emergency contacts',
      requiredTier: 'Personal (R49.99/month)',
    },
    [FEATURES.AI_COMPANION]: {
      name: 'AI Companion',
      description: 'Chat with your personal AI safety assistant',
      requiredTier: 'Personal Pro (R99.99/month)',
    },
    [FEATURES.THERAPIST_ACCESS]: {
      name: 'Therapist Access',
      description: 'Connect with professional therapists and counselors',
      requiredTier: 'Personal Pro (R99.99/month)',
    },
    [FEATURES.HEALTH_MONITORING]: {
      name: 'Health Monitoring',
      description: 'Track and monitor your health metrics',
      requiredTier: 'Personal Pro (R99.99/month)',
    },
    [FEATURES.ADVANCED_LOCATION]: {
      name: 'Advanced Location Sharing',
      description: 'Share your precise location with unlimited contacts',
      requiredTier: 'Personal (R49.99/month)',
    },
    [FEATURES.FAMILY_TRACKING]: {
      name: 'Family Location Tracking',
      description: 'Track all your family members in real-time',
      requiredTier: 'Family (R67.99/month)',
    },
  };

  return featureInfo[feature] || {
    name: 'Premium Feature',
    description: 'This feature requires a premium subscription',
    requiredTier: 'Premium Plan',
  };
};
