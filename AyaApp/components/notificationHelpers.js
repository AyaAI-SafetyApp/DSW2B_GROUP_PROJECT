/**
 * Notification Helper Functions
 * Utility functions for working with notifications
 */

// ==================== CREATE NOTIFICATION OBJECT ====================
/**
 * Creates a standardized notification object
 @param {string} message - The notification message
 @param {Object} options - Additional options
 @returns {Object} Notification object

export function createNotification(message, options = {}) {
  return {
    id: options.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: message,
    timestamp: options.timestamp || new Date().toISOString(),
    isRead: options.isRead || false,
    priority: options.priority || "normal", 
    type: options.type || "general", 
    data: options.data || {},
  };
}

// ==================== GROUP NOTIFICATIONS BY DATE ====================
/**
 * Groups notifications by date (Today, Yesterday, This Week, etc.)
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Grouped notifications
 */
export function groupNotificationsByDate(notifications) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.timestamp);
    const notifDay = new Date(
      notifDate.getFullYear(),
      notifDate.getMonth(),
      notifDate.getDate()
    );

    if (notifDay.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else if (notifDate >= weekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
}

// ==================== SORT NOTIFICATIONS ====================
/**
 * Sorts notifications by timestamp (newest first)
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Sorted notifications
 */
export function sortNotifications(notifications) {
  return [...notifications].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA; // Newest first
  });
}

// ==================== FILTER UNREAD NOTIFICATIONS ====================
/**
 * Filters notifications to only unread ones
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Unread notifications
 */
export function getUnreadNotifications(notifications) {
  return notifications.filter((n) => !n.isRead);
}

// ==================== MARK NOTIFICATION AS READ ====================
/**
 * Marks a notification as read
 * @param {Array} notifications - Array of notification objects
 * @param {string} notificationId - ID of notification to mark as read
 * @returns {Array} Updated notifications
 */
export function markAsRead(notifications, notificationId) {
  return notifications.map((n) =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
}

// ==================== MARK ALL AS READ ====================
/**
 * Marks all notifications as read
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Updated notifications
 */
export function markAllAsRead(notifications) {
  return notifications.map((n) => ({ ...n, isRead: true }));
}

// ==================== GET NOTIFICATION PRIORITY COLOR ====================
/**
 * Gets color based on notification priority
 * @param {string} priority - Notification priority
 * @returns {string} Color hex code
 */
export function getPriorityColor(priority) {
  const colors = {
    low: "#6B7280",
    normal: "#3B82F6",
    high: "#EF4444",
  };
  return colors[priority] || colors.normal;
}

// ==================== GET NOTIFICATION ICON ====================
/**
 * Gets icon name based on notification type
 * @param {string} type - Notification type
 * @returns {string} Ionicon name
 */
export function getNotificationIcon(type) {
  const icons = {
    safety_tip: "shield-checkmark",
    alert: "warning",
    general: "information-circle",
    news: "newspaper",
    emergency: "alert-circle",
  };
  return icons[type] || icons.general;
}

// ==================== VALIDATE NOTIFICATION ====================
/**
 * Validates if a notification object is valid
 * @param {Object} notification - Notification object
 * @returns {boolean} True if valid
 */
export function isValidNotification(notification) {
  return (
    notification &&
    typeof notification === "object" &&
    notification.id &&
    notification.message &&
    notification.timestamp
  );
}

// ==================== REMOVE OLD NOTIFICATIONS ====================
/**
 * Removes notifications older than specified days
 * @param {Array} notifications - Array of notification objects
 * @param {number} days - Number of days to keep
 * @returns {Array} Filtered notifications
 */
export function removeOldNotifications(notifications, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return notifications.filter((n) => {
    const notifDate = new Date(n.timestamp);
    return notifDate >= cutoffDate;
  });
}

// ==================== GET NOTIFICATION STATS ====================
/**
 * Gets statistics about notifications
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Statistics
 */
export function getNotificationStats(notifications) {
  const unread = getUnreadNotifications(notifications);
  const highPriority = notifications.filter((n) => n.priority === "high");

  return {
    total: notifications.length,
    unread: unread.length,
    highPriority: highPriority.length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {}),
  };
}

// ==================== SEARCH NOTIFICATIONS ====================
/**
 * Searches notifications by message content
 * @param {Array} notifications - Array of notification objects
 * @param {string} query - Search query
 * @returns {Array} Matching notifications
 */
export function searchNotifications(notifications, query) {
  if (!query || query.trim() === "") return notifications;

  const lowerQuery = query.toLowerCase();
  return notifications.filter((n) =>
    n.message.toLowerCase().includes(lowerQuery)
  );
}

// ==================== DEDUPLICATE NOTIFICATIONS ====================
/**
 * Removes duplicate notifications based on ID
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Deduplicated notifications
 */
export function deduplicateNotifications(notifications) {
  const seen = new Set();
  return notifications.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

// ==================== MERGE NOTIFICATION ARRAYS ====================
/**
 * Merges two notification arrays without duplicates
 * @param {Array} existing - Existing notifications
 * @param {Array} incoming - New notifications
 * @returns {Array} Merged notifications
 */
export function mergeNotifications(existing, incoming) {
  const merged = [...incoming, ...existing];
  return deduplicateNotifications(sortNotifications(merged));
}