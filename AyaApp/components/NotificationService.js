// NotificationService.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_STORAGE_KEY = "@saved_notifications";
const LAST_TIP_KEY = "@last_tip_shown";
const LAST_ALERT_CHECK_KEY = "@last_alert_check";
const BACKGROUND_TASK_NAME = "safety-background-task";
const API_BASE_URL = "http://192.168.101.108:3001";

// ==================== FORMAT EXACT TIME ====================
export function formatExactTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

// ==================== FORMAT TIME AGO ====================
export function formatTimeAgo(dateString) {
  if (!dateString) return "Just now";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ==================== NOTIFICATION HANDLER CONFIGURATION ====================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==================== BACKGROUND TASK DEFINITION ====================
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('🔄 Background task running at:', new Date().toLocaleString());
    
    let hasNewData = false;

    // 1. Check and send time-based safety tip (every 6 hours)
    const tipResult = await checkAndSendTimeBasedTip();
    if (tipResult) hasNewData = true;

    // 2. Check for real-time safety alerts
    const alertResult = await checkRealTimeSafetyAlerts();
    if (alertResult) hasNewData = true;

    // 3. Check for crime alerts
    const crimeResult = await checkCrimeAlerts();
    if (crimeResult) hasNewData = true;

    // 4. Check for location-based warnings
    const locationResult = await checkLocationBasedWarnings();
    if (locationResult) hasNewData = true;

    console.log('✅ Background task completed');
    return hasNewData 
      ? BackgroundFetch.BackgroundFetchResult.NewData 
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('❌ Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ==================== REGISTER BACKGROUND FETCH ====================
export async function registerBackgroundFetch() {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 6 * 60 * 60, // 6 hours in seconds (21600 seconds)
        stopOnTerminate: false, // Continue after app termination
        startOnBoot: true, // Start when device boots
      });
      console.log('✅ Background fetch registered for 6-hour intervals');
    }
    
    // Check status
    const status = await BackgroundFetch.getStatusAsync();
    console.log('📱 Background fetch status:', BackgroundFetch.BackgroundFetchStatus[status]);
    
    return true;
  } catch (error) {
    console.error('❌ Error registering background fetch:', error);
    return false;
  }
}

// ==================== UNREGISTER BACKGROUND FETCH ====================
export async function unregisterBackgroundFetch() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    console.log('✅ Background fetch unregistered');
  } catch (error) {
    console.error('Error unregistering background fetch:', error);
  }
}

// ==================== CHECK REAL-TIME SAFETY ALERTS ====================
export async function checkRealTimeSafetyAlerts() {
  try {
    console.log('🔍 Checking real-time safety alerts...');
    
    const response = await fetch(`${API_BASE_URL}/api/safety-alerts/active`);
    
    if (response.ok) {
      const alerts = await response.json();
      
      if (Array.isArray(alerts) && alerts.length > 0) {
        const newAlerts = await filterNewAlerts(alerts, 'safety_alerts');
        
        for (const alert of newAlerts) {
          await scheduleLocalNotification(
            alert.title || "Safety Alert",
            alert.message,
            {
              type: 'safety_alert',
              alertId: alert.id,
              priority: alert.priority || 'high',
              area: alert.area
            }
          );
          
          // Save to local storage
          await saveNotification({
            request: {
              identifier: `alert_${alert.id}`,
              content: {
                title: alert.title || "Safety Alert",
                body: alert.message,
                data: {
                  type: 'safety_alert',
                  alertId: alert.id,
                  priority: alert.priority || 'high'
                }
              }
            }
          });
        }
        
        console.log(`✅ Sent ${newAlerts.length} real-time safety alerts`);
        return newAlerts.length > 0;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking real-time alerts:', error);
    return false;
  }
}

// ==================== CHECK CRIME ALERTS ====================
export async function checkCrimeAlerts() {
  try {
    console.log('🔍 Checking crime alerts...');
    
    const response = await fetch(`${API_BASE_URL}/api/crime-alerts/recent`);
    
    if (response.ok) {
      const crimes = await response.json();
      
      if (Array.isArray(crimes) && crimes.length > 0) {
        const newCrimes = await filterNewAlerts(crimes, 'crime_alerts');
        
        for (const crime of newCrimes) {
          await scheduleLocalNotification(
            "Crime Alert",
            `${crime.type} reported in ${crime.area}. Stay vigilant.`,
            {
              type: 'crime_alert',
              crimeId: crime.id,
              priority: 'high',
              area: crime.area,
              crimeType: crime.type
            }
          );
          
          await saveNotification({
            request: {
              identifier: `crime_${crime.id}`,
              content: {
                title: "Crime Alert",
                body: `${crime.type} reported in ${crime.area}. Stay vigilant.`,
                data: {
                  type: 'crime_alert',
                  crimeId: crime.id,
                  priority: 'high'
                }
              }
            }
          });
        }
        
        console.log(`✅ Sent ${newCrimes.length} crime alerts`);
        return newCrimes.length > 0;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking crime alerts:', error);
    return false;
  }
}

// ==================== CHECK LOCATION-BASED WARNINGS ====================
export async function checkLocationBasedWarnings() {
  try {
    console.log('🔍 Checking location-based warnings...');
    
    // Get last known location from storage
    const lastLocation = await AsyncStorage.getItem('@last_known_location');
    
    if (lastLocation) {
      const { latitude, longitude, timestamp } = JSON.parse(lastLocation);
      
      // Check if location is recent (less than 1 hour old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const locationTime = new Date(timestamp);
      
      if (locationTime > oneHourAgo) {
        const response = await fetch(
          `${API_BASE_URL}/api/location-warnings/${latitude}/${longitude}`
        );
        
        if (response.ok) {
          const warnings = await response.json();
          
          if (Array.isArray(warnings) && warnings.length > 0) {
            const newWarnings = await filterNewAlerts(warnings, 'location_warnings');
            
            for (const warning of newWarnings) {
              await scheduleLocalNotification(
                "Area Warning",
                warning.message,
                {
                  type: 'location_warning',
                  warningId: warning.id,
                  priority: warning.priority || 'medium',
                  radius: warning.radius
                }
              );
              
              await saveNotification({
                request: {
                  identifier: `warning_${warning.id}`,
                  content: {
                    title: "Area Warning",
                    body: warning.message,
                    data: {
                      type: 'location_warning',
                      warningId: warning.id
                    }
                  }
                }
              });
            }
            
            console.log(`✅ Sent ${newWarnings.length} location warnings`);
            return newWarnings.length > 0;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking location warnings:', error);
    return false;
  }
}

// ==================== FILTER NEW ALERTS ====================
async function filterNewAlerts(alerts, alertType) {
  try {
    const lastCheckKey = `${LAST_ALERT_CHECK_KEY}_${alertType}`;
    const lastCheck = await AsyncStorage.getItem(lastCheckKey);
    const lastCheckTime = lastCheck ? new Date(lastCheck) : new Date(0);
    
    const newAlerts = alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp || alert.created_at || alert.date);
      return alertTime > lastCheckTime;
    });
    
    // Update last check time
    if (newAlerts.length > 0) {
      await AsyncStorage.setItem(lastCheckKey, new Date().toISOString());
    }
    
    return newAlerts;
  } catch (error) {
    console.error('Error filtering alerts:', error);
    return alerts;
  }
}

// ==================== ENHANCED TIME-BASED TIPS ====================
export async function checkAndSendTimeBasedTip() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check if current hour matches our 6-hour schedule (00, 06, 12, 18)
    const isScheduledHour = [0, 6, 12, 18].includes(currentHour);
    
    if (!isScheduledHour) {
      console.log(`ℹ️ Not a scheduled hour (current: ${currentHour})`);
      return null;
    }
    
    console.log(`✅ It's scheduled hour ${currentHour}, checking for safety tip...`);
    
    const tips = await fetchTimeBasedSafetyTips();
    if (tips.length === 0) {
      console.log("ℹ️ No tips available");
      return null;
    }

    const selected = pickTipForHour(tips, currentHour);
    if (!selected) {
      console.log("ℹ️ No tip selected for current hour");
      return null;
    }

    // Check if we've already shown a tip in this 6-hour window
    const lastTipKey = `${LAST_TIP_KEY}_${currentHour}`;
    const lastShown = await AsyncStorage.getItem(lastTipKey);
    
    if (lastShown) {
      const lastShownTime = new Date(lastShown);
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      
      if (lastShownTime > sixHoursAgo) {
        console.log("ℹ️ Tip already shown in this time window");
        return null;
      }
    }

    const message = `${selected.awareness}: ${selected.tip}`;
    
    // Schedule local notification
    await scheduleLocalNotification("Safety Tip", message, {
      type: "safety_tip",
      tipId: selected.id,
      hour: currentHour,
    });

    // Save notification to storage
    await saveNotification({
      request: {
        identifier: `tip_${selected.id}_${currentHour}`,
        content: {
          title: "Safety Tip",
          body: message,
          data: {
            type: "safety_tip",
            tipId: selected.id,
            hour: currentHour,
          }
        }
      }
    });

    // Save that we've shown this tip for this time slot
    await AsyncStorage.setItem(lastTipKey, new Date().toISOString());
    
    console.log(`✅ Time-based tip sent for hour ${currentHour}:`, message);
    return message;
    
  } catch (error) {
    console.error("Error in checkAndSendTimeBasedTip:", error);
    return null;
  }
}

// ==================== MANUAL BACKGROUND TASK TRIGGER ====================
export async function manualBackgroundTask() {
  console.log('🔄 Manually triggering background task...');
  try {
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)) {
      await BackgroundFetch.triggerTask(BACKGROUND_TASK_NAME);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error triggering background task:', error);
    return false;
  }
}

// ==================== BACKGROUND TASK STATUS ====================
export async function getBackgroundTaskStatus() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    
    return {
      status: BackgroundFetch.BackgroundFetchStatus[status],
      isRegistered,
      taskName: BACKGROUND_TASK_NAME
    };
  } catch (error) {
    console.error('Error getting background task status:', error);
    return { status: 'Unknown', isRegistered: false };
  }
}

// ==================== PUSH TOKEN REGISTRATION ====================
export async function registerForPushNotifications() {
  let token;
  
  if (!Device.isDevice) {
    Alert.alert(
      "Physical device required",
      "Push notifications don't work on emulators."
    );
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission required",
        "Push notifications need permission to keep you safe."
      );
      return null;
    }

    // Get push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("✅ Expo Push Token:", token);

    // Android: set notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Safety Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D81B60",
        sound: "default",
      });
    }

    return token;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

// ==================== SEND TOKEN TO BACKEND ====================
export async function sendTokenToBackend(token) {
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/save-push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        token,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      }),
    });

    if (response.ok) {
      console.log("✅ Push token registered with backend");
    } else {
      console.warn("⚠️ Failed to register token with backend");
    }
  } catch (error) {
    console.error("❌ Error sending token to backend:", error);
  }
}

// ==================== SAVE NOTIFICATION TO STORAGE ====================
export async function saveNotification(notification) {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const newNotification = {
      id: notification.request?.identifier || Date.now().toString(),
      message: notification.request?.content?.title 
        ? `${notification.request.content.title}: ${notification.request.content.body}`
        : notification.request?.content?.body || "New notification",
      timestamp: new Date().toISOString(),
      priority: notification.request?.content?.data?.priority || "normal",
      isRead: false,
      data: notification.request?.content?.data || {},
    };
    
    // Add to beginning of array (newest first)
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    const trimmed = notifications.slice(0, 50);
    
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(trimmed));
    console.log("✅ Notification saved to storage");
    
    return trimmed;
  } catch (error) {
    console.error("Error saving notification:", error);
    return [];
  }
}

// ==================== GET STORED NOTIFICATIONS ====================
export async function getStoredNotifications() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error getting stored notifications:", error);
    return [];
  }
}

// ==================== MARK NOTIFICATION AS READ ====================
export async function markNotificationAsRead(notificationId) {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    console.log("✅ Notification marked as read");
    
    return updated;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return [];
  }
}

// ==================== MARK ALL NOTIFICATIONS AS READ ====================
export async function markAllNotificationsAsRead() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    console.log("✅ All notifications marked as read");
    
    return updated;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return [];
  }
}

// ==================== CLEAR ALL NOTIFICATIONS ====================
export async function clearAllNotifications() {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
    console.log("✅ All notifications cleared");
  } catch (error) {
    console.warn("Error clearing notifications:", error);
  }
}

// ==================== SCHEDULE LOCAL NOTIFICATION ====================
export async function scheduleLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // immediate
    });
    console.log("✅ Local notification scheduled:", title);
  } catch (error) {
    console.warn("⚠️ Failed to schedule notification:", error);
  }
}

// ==================== FETCH TIME-BASED SAFETY TIPS ====================
export async function fetchTimeBasedSafetyTips() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/time-based-safety-tips`);
    if (!response.ok) return [];
    
    const tips = await response.json();
    return Array.isArray(tips) ? tips : [];
  } catch (error) {
    console.error("Error fetching time-based tips:", error);
    return [];
  }
}

// ==================== PICK TIP FOR CURRENT HOUR ====================
function pickTipForHour(tips, hour) {
  if (!Array.isArray(tips) || tips.length === 0) return null;
  
  const exact = tips.find(
    (t) => Number(t.hour_start) <= hour && hour < Number(t.hour_end)
  );
  
  return exact || tips[0] || null;
}

// ==================== SETUP NOTIFICATION LISTENERS ====================
export function setupNotificationListeners(
  onNotificationReceived,
  onNotificationResponse
) {
  // Listener for when notification is received
  const receivedListener =
    Notifications.addNotificationReceivedListener(async (notification) => {
      console.log("📬 Notification received:", notification);
      
      // Save notification to storage
      await saveNotification(notification);
      
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

  // Listener for when user taps notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log("👆 Notification tapped:", response);
      
      // Mark as read when tapped
      const notificationId = response.notification.request?.identifier;
      if (notificationId) {
        await markNotificationAsRead(notificationId);
      }
      
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

  // Return cleanup function
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}

// ==================== GET NOTIFICATION BADGE COUNT ====================
export async function getBadgeCount() {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.warn("Error getting badge count:", error);
    return 0;
  }
}

// ==================== SET NOTIFICATION BADGE COUNT ====================
export async function setBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.warn("Error setting badge count:", error);
  }
}

// ==================== GET UNREAD COUNT ====================
export async function getUnreadCount() {
  try {
    const notifications = await getStoredNotifications();
    return notifications.filter(n => !n.isRead).length;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

// ==================== INITIALIZE ALL NOTIFICATION SERVICES ====================
export async function initializeAllNotificationServices() {
  try {
    console.log('🚀 Initializing all notification services...');
    
    // 1. Register for push notifications
    const token = await registerForPushNotifications();
    if (token) {
      await sendTokenToBackend(token);
    }
    
    // 2. Register background fetch for automatic 6-hour notifications
    await registerBackgroundFetch();
    
    // 3. Run immediate check for current alerts and tips
    await manualBackgroundTask();
    
    // 4. Check and log background task status
    const bgStatus = await getBackgroundTaskStatus();
    console.log('📊 Background task status:', bgStatus);
    
    console.log('✅ All notification services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing notification services:', error);
    return false;
  }
}

// ==================== STORE LAST KNOWN LOCATION ====================
export async function storeLastKnownLocation(latitude, longitude) {
  try {
    const locationData = {
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    };
    await AsyncStorage.setItem('@last_known_location', JSON.stringify(locationData));
    console.log('📍 Last known location stored');
  } catch (error) {
    console.error('Error storing location:', error);
  }
}