import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatTimeAgo, formatExactTime } from "./NotificationService";

const { width } = Dimensions.get("window");
const PRIMARY = "#D81B60";

export default function NotificationModal({
  visible,
  notifications,
  loading,
  onClose,
  onClearAll,
  onMarkAsRead,
  onMarkAllAsRead,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} accessibilityViewIsModal>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={24} color={PRIMARY} />
              <Text style={styles.modalTitle}>Notifications</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              accessibilityLabel="Close notifications"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <>
              {/* Notification List */}
              <ScrollView
                style={styles.notificationsList}
                showsVerticalScrollIndicator={false}
              >
                {notifications.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="notifications-off-outline"
                      size={48}
                      color="#D1D5DB"
                    />
                    <Text style={styles.emptyText}>No notifications</Text>
                    <Text style={styles.emptySubtext}>
                      You're all caught up!
                    </Text>
                  </View>
                ) : (
                  notifications.map((notification, index) => {
                    // Handle both string and object notifications
                    const message = typeof notification === 'string' 
                      ? notification 
                      : notification.message;
                    const timestamp = typeof notification === 'object' 
                      ? notification.timestamp 
                      : new Date().toISOString();
                    const priority = typeof notification === 'object'
                      ? notification.priority
                      : 'normal';
                    const isRead = typeof notification === 'object'
                      ? notification.isRead
                      : false;

                    return (
                      <TouchableOpacity
                        key={notification.id ?? index}
                        activeOpacity={0.7}
                        style={[
                          styles.notificationItem,
                          isRead 
                            ? styles.notificationItemRead 
                            : styles.notificationItemUnread
                        ]}
                      >
                        <View style={[
                          styles.notificationDot,
                          isRead && styles.notificationDotRead,
                          priority === 'high' && !isRead && styles.notificationDotHigh
                        ]} />
                        <View style={styles.notificationContent}>
                          <Text style={[
                            styles.notificationText,
                            isRead && styles.notificationTextRead
                          ]}>
                            {message}
                          </Text>
                          <View style={styles.notificationMeta}>
                            <Ionicons 
                              name="time-outline" 
                              size={12} 
                              color={isRead ? "#D1D5DB" : "#9CA3AF"} 
                            />
                            <Text style={[
                              styles.notificationTime,
                              isRead && styles.notificationTimeRead
                            ]}>
                              {formatTimeAgo(timestamp)}
                            </Text>
                            {formatExactTime(timestamp) && (
                              <>
                                <Text style={[
                                  styles.timeSeparator,
                                  isRead && styles.timeSeparatorRead
                                ]}>•</Text>
                                <Text style={[
                                  styles.notificationExactTime,
                                  isRead && styles.notificationExactTimeRead
                                ]}>
                                  {formatExactTime(timestamp)}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                        {!isRead && (
                          <View style={styles.unreadIndicator}>
                            <View style={styles.unreadBadge} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {notifications.length > 0 && onClearAll && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onClearAll();
                    }}
                    accessibilityLabel="Clear all notifications"
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.closeActionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onClose();
                  }}
                  accessibilityLabel="Close"
                >
                  <Text style={styles.closeActionButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 10,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  notificationsList: {
    maxHeight: 400,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  notificationItemRead: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  notificationItemUnread: {
    backgroundColor: "#FEF3F2",
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6B7280",
    marginTop: 6,
    marginRight: 12,
    flexShrink: 0,
  },
  notificationDotRead: {
    backgroundColor: "#D1D5DB",
  },
  notificationDotHigh: {
    backgroundColor: "#EF4444",
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
    marginBottom: 6,
    fontWeight: "500",
  },
  notificationTextRead: {
    color: "#6B7280",
    fontWeight: "400",
  },
  notificationMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  notificationTimeRead: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  timeSeparator: {
    fontSize: 12,
    color: "#D1D5DB",
    marginHorizontal: 6,
  },
  timeSeparatorRead: {
    color: "#E5E7EB",
  },
  notificationExactTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  notificationExactTimeRead: {
    color: "#D1D5DB",
  },
  unreadIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  clearButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  closeActionButton: {
    flex: 1,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});