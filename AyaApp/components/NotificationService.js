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

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_STORAGE_KEY = "@saved_notifications";
const API_BASE_URL = "https://ayabackgroundservices-production.up.railway.app";

// ==================== NOTIFICATION HANDLER CONFIGURATION ====================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
    // Get user session from AsyncStorage
    const sessionData = await AsyncStorage.getItem("@user_session");
    let userId = "anonymous";
    if (sessionData) {
      const user = JSON.parse(sessionData);
      userId = user.id || user.user_id || user.email || "anonymous";
    }

    const response = await fetch(`${API_BASE_URL}/save-push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        token,
        platform: Platform.OS,
        userId: userId
      }),
    });

    if (response.ok) {
      console.log("Push token registered with backend");
    } else {
      console.warn("Failed to register token with backend");
    }
  } catch (error) {
    console.error("Error sending token to backend:", error);
  }
}

//   ========== SCHEDULE LOCAL NOTIFICATION ================
export async function scheduleLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, 
    });
    console.log("Local notification scheduled:", title);
  } catch (error) {
    console.warn("Failed to schedule notification:", error);
  }
}

// ========= NOTIFICATION STORAGE FUNCTIONS ================

// Save notification to local storage
export async function saveNotification(notification) {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const newNotification = {
      id: notification.request?.identifier || Date.now().toString(),
      title: notification.request?.content?.title || "Notification",
      message: notification.request?.content?.body || "New notification",
      timestamp: new Date().toISOString(),
      isRead: false,
      data: notification.request?.content?.data || {},
      deviceId: Constants.deviceId,
    };
    
    // Add to beginning of array 
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

// Get stored notifications for current device only
export async function getStoredNotifications() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Filter notifications to only show those from current device
    const deviceNotifications = allNotifications.filter(
      notification => notification.deviceId === Constants.deviceId
    );
    
    return deviceNotifications;
  } catch (error) {
    console.error("Error getting stored notifications:", error);
    return [];
  }
}

// Mark notification as read (only if it belongs to current device)
export async function markNotificationAsRead(notificationId) {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const updated = notifications.map(n => 
      n.id === notificationId && n.deviceId === Constants.deviceId 
        ? { ...n, isRead: true } 
        : n
    );
    
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    console.log("✅ Notification marked as read");
    
    return updated.filter(n => n.deviceId === Constants.deviceId);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return [];
  }
}

// Mark all notifications as read for current device only
export async function markAllNotificationsAsRead() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const updated = notifications.map(n => 
      n.deviceId === Constants.deviceId ? { ...n, isRead: true } : n
    );
    
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    console.log("✅ All notifications marked as read for this device");
    
    return updated.filter(n => n.deviceId === Constants.deviceId);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return [];
  }
}

// Get unread count for current device only
export async function getUnreadCount() {
  try {
    const notifications = await getStoredNotifications();
    return notifications.filter(n => !n.isRead).length;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
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
      
      // Save notification to storage with device ID
      await saveNotification(notification);
      
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

  // Listener for when user taps notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log(" Notification tapped:", response);
      
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
    if (receivedListener) {
      receivedListener.remove();
    }
    if (responseListener) {
      responseListener.remove();
    }
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

// ==================== CLEAR ALL NOTIFICATIONS FOR CURRENT DEVICE ====================
export async function clearAllNotifications() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Keep only notifications from other devices
    const filteredNotifications = allNotifications.filter(
      notification => notification.deviceId !== Constants.deviceId
    );
    
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filteredNotifications));
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
    console.log("✅ All notifications cleared for this device");
  } catch (error) {
    console.warn("Error clearing notifications:", error);
  }
}

//          ===== DELETE SINGLE NOTIFICATION ======
export async function deleteNotification(notificationId) {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Remove only if it belongs to current device
    const filteredNotifications = allNotifications.filter(
      notification => !(notification.id === notificationId && notification.deviceId === Constants.deviceId)
    );
    
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filteredNotifications));
    console.log("✅ Notification deleted for this device");
    
    return filteredNotifications.filter(n => n.deviceId === Constants.deviceId);
  } catch (error) {
    console.warn("Error deleting notification:", error);
    return [];
  }
}

//   ========= INITIALIZE ALL NOTIFICATION SERVICES ===========
export async function initializeAllNotificationServices() {
  try {
    console.log('🚀 Initializing all notification services...');
    
    // Clear any existing scheduled notifications to prevent defaults
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    
    // 1. Register for push notifications
    const token = await registerForPushNotifications();
    if (token) {
      await sendTokenToBackend(token);
    }
    
    console.log('All notification services initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing notification services:', error);
    return false;
  }
}

// ==================== LOCATION RISK NOTIFICATION ====================
export async function sendLocationRiskNotification(location, crimeProbability, riskLevel, dangerPercentage) {
  try {
    let title, body, priority;
    
    // Customize notification based on risk level
    if (riskLevel === 'High Risk') {
      title = 'High Crime Risk Alert';
      body = `You are currently in ${location}. An area with ${dangerPercentage}% crime rate - ${riskLevel} area. Stay vigilant!`;
      priority = 'high';
    } else if (riskLevel === 'Moderate Risk') {
      title = 'Moderate Crime Risk';
      body = `You are currently in ${location}. An area with ${dangerPercentage}% crime rate - ${riskLevel} area. Be cautious.`;
      priority = 'medium';
    } else {
      title = 'Low Crime Risk';
      body = `You are  currently in  ${location}. An area with ${dangerPercentage}% crime rate - ${riskLevel} area. Stay safe!`;
      priority = 'low';
    }

    await scheduleLocalNotification(title, body, {
      type: 'location_risk',
      location: location,
      crimeProbability: crimeProbability,
      riskLevel: riskLevel,
      dangerPercentage: dangerPercentage,
      timestamp: new Date().toISOString()
    });

    console.log(`📍 Location risk notification sent: ${location} - ${riskLevel}`);
    return true;
  } catch (error) {
    console.error('Error sending location risk notification:', error);
    return false;
  }
}