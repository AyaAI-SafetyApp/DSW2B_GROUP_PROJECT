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

const LAST_TIP_KEY = "@last_tip_shown";
const API_BASE_URL = "http://10.246.164.187:3001";

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
    console.log("✅ Local notification scheduled");
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

// ==================== LOAD AND NOTIFY TIME TIP ====================
export async function loadAndNotifyTimeTip() {
  try {
    const tips = await fetchTimeBasedSafetyTips();
    if (tips.length === 0) return null;

    const now = new Date();
    const hour = now.getHours();
    const selected = pickTipForHour(tips, hour);
    
    if (!selected) return null;

    // Check if we've already shown this tip
    const last = await AsyncStorage.getItem(LAST_TIP_KEY);
    const selectedId = String(
      selected.id ?? selected.time_range ?? selected.hour_start
    );
    
    if (last === selectedId) {
      console.log("ℹ️ Tip already shown today");
      return null;
    }

    const message = `${selected.awareness}: ${selected.tip}`;
    
    // Schedule local notification
    await scheduleLocalNotification("Safety Tip", message, {
      type: "safety_tip",
      tipId: selectedId,
    });

    // Save that we've shown this tip
    await AsyncStorage.setItem(LAST_TIP_KEY, selectedId);
    
    console.log("✅ Time-based tip notification sent");
    return message;
  } catch (error) {
    console.warn("⚠️ Error loading time tip:", error);
    return null;
  }
}

// ==================== FETCH NOTIFICATIONS FROM BACKEND ====================
export async function fetchNotificationsFromBackend() {
  const endpoints = [
    `${API_BASE_URL}/api/notifications`,
    `${API_BASE_URL}/api/time-based-safety-tips`,
    `${API_BASE_URL}/api/notifications-log`,
    `${API_BASE_URL}/api/notifications_all`,
  ];

  let items = [];
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        items = json;
        break;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      continue;
    }
  }

  return formatNotifications(items);
}

// ==================== FORMAT NOTIFICATIONS ====================
function formatNotifications(items) {
  const formatted = [];
  
  if (!Array.isArray(items) || items.length === 0) {
    return formatted;
  }

  for (const item of items) {
    if (!item) continue;
    
    // If it's already a string
    if (typeof item === "string") {
      formatted.push(item);
      continue;
    }

    // Extract body
    const body =
      item.message ??
      item.body ??
      item.tip ??
      item.notification ??
      item.text ??
      item.payload ??
      "";

    // Extract title
    const title =
      item.title ??
      item.awareness ??
      item.type ??
      item.time_range ??
      item.category ??
      "";

    // Create display text
    const display =
      title && body
        ? `${title}: ${body}`
        : body || title || JSON.stringify(item);
    
    formatted.push(display);
  }

  return formatted;
}

// ==================== SETUP NOTIFICATION LISTENERS ====================
export function setupNotificationListeners(
  onNotificationReceived,
  onNotificationResponse
) {
  // Listener for when notification is received
  const receivedListener =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("📬 Notification received:", notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

  // Listener for when user taps notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notification tapped:", response);
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

// ==================== CLEAR ALL NOTIFICATIONS ====================
export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
    console.log("✅ All notifications cleared");
  } catch (error) {
    console.warn("Error clearing notifications:", error);
  }
}