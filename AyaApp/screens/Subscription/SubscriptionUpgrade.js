import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUserSubscription, SUBSCRIPTION_TIERS } from "../../utils/subscriptionUtils";
import { scheduleLocalNotification } from "../../components/NotificationService";

// Constants
const { width, height } = Dimensions.get("window");

const CONFIG = {
  API_BASE_URL: "https://dsw2b-backend.onrender.com",
  REQUEST_TIMEOUT: 15000,
};

const PLANS = {
  monthly: [
    {
      id: "free",
      title: "Free",
      price: "R0",
      period: "forever",
      icon: "gift",
      iconColor: "#10B981",
      description: "Basic safety features at no cost",
      features: [
        "Emergency SOS button",
        "Basic location sharing",
        "Up to 3 emergency contacts",
        "Community support",
        "Safety tips & resources",
      ],
      popular: false,
      isFree: true,
    },
    {
      id: "P-1GN061938A031721GNC5CY4Q",
      title: "Personal",
      price: "R350",
      period: "month",
      icon: "user",
      iconColor: "#DE0973",
      description: "Perfect for individual safety with premium features",
      features: [
        "Real-time alerts & notifications",
        "Offline emergency support",
        "AI-powered safe routes",
        "24/7 priority support",
        "Advanced location sharing",
        "Unlimited emergency contacts",
      ],
      popular: false,
    },
    {
      id: "P-5PD448977L069480VNC5CZYY",
      title: "Family",
      price: "R900",
      period: "3 months",
      icon: "users",
      iconColor: "#8B5CF6",
      description: "Complete protection for your entire family",
      features: [
        "Up to 5 family members",
        "Shared emergency alerts",
        "Family location tracking",
        "Group safety zones",
        "Priority family support",
        "Child safety features",
      ],
      popular: true,
      savings: "Save R150",
    },
  ],
  yearly: [
    {
      id: "free",
      title: "Free",
      price: "R0",
      period: "forever",
      icon: "gift",
      iconColor: "#10B981",
      description: "Basic safety features at no cost",
      features: [
        "Emergency SOS button",
        "Basic location sharing",
        "Up to 3 emergency contacts",
        "Community support",
        "Safety tips & resources",
      ],
      popular: false,
      isFree: true,
    },
    {
      id: "P-9U8910582N234330WNC5C2OQ",
      title: "Personal Pro",
      price: "R3,500",
      period: "year",
      icon: "user-shield",
      iconColor: "#10B981",
      description: "Advanced protection with maximum savings",
      features: [
        "All Personal features",
        "Annual billing discount",
        "Extended offline maps",
        "Advanced analytics",
        "Priority feature access",
        "Dedicated support line",
      ],
      popular: false,
      savings: "Save R700",
    },
    {
      id: "P-9L275883JF591292KNC5CX5I",
      title: "Family Premium",
      price: "R8,000",
      period: "year",
      icon: "crown",
      iconColor: "#F59E0B",
      description: "Ultimate family protection package",
      features: [
        "All Family features",
        "Up to 10 family members",
        "Advanced family analytics",
        "Dedicated family manager",
        "Custom safety zones",
        "Premium support 24/7",
      ],
      popular: true,
      savings: "Save R2,800",
    },
  ],
};

// Custom Hook
const useSubscription = (navigation, userID) => {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePlanSelect = useCallback((plan) => {
    setSelectedPlan((current) => (current?.id === plan.id ? null : plan));
  }, []);

  const createSubscription = async () => {
    if (!selectedPlan) {
      Alert.alert("Selection Required", "Please select a subscription plan to continue");
      return;
    }
    
    // Handle free plan - skip payment and go directly to app
    if (selectedPlan.isFree) {
      // Verify session exists before navigating
      const sessionData = await AsyncStorage.getItem("@user_session");
      if (!sessionData) {
        console.error('❌ No session found when trying to access app');
        Alert.alert("Error", "Session not found. Please log in again.");
        return;
      }
      
      // Update subscription to FREE tier (no expiration)
      const updated = await updateUserSubscription(SUBSCRIPTION_TIERS.FREE, null);
      
      if (!updated) {
        console.warn('Failed to update free subscription in database');
      }
      
      console.log('✅ Session verified, navigating to app');
      Alert.alert(
        "Welcome to Aya App! 🎉",
        "You've selected the Free plan. You now have access to basic safety features.",
        [
          {
            text: "Get Started",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              });
            },
          },
        ]
      );
      return;
    }
    
    // For paid plans, get userID from session if not provided
    let currentUserID = userID;
    if (!currentUserID) {
      try {
        const sessionData = await AsyncStorage.getItem("@user_session");
        if (sessionData) {
          const { email } = JSON.parse(sessionData);
          currentUserID = email; // Use email as userID
        }
      } catch (error) {
        console.error("Error getting session:", error);
      }
    }
    
    if (!currentUserID) {
      Alert.alert("Authentication Error", "User authentication required. Please log in again.");
      return;
    }
    
    try {
      setLoading(true);

      const response = await axios.post(
        `${CONFIG.API_BASE_URL}/create-subscription`,
        {
          planId: selectedPlan.id,
          userId: currentUserID,
          billingCycle,
          planName: selectedPlan.title,
          amount: selectedPlan.price,
        },
        {
          timeout: CONFIG.REQUEST_TIMEOUT,
          headers: { 
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.approvalUrl) {
        setCheckoutUrl(response.data.approvalUrl);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Subscription Error:", error);
      Alert.alert(
        "Subscription Error",
        "Failed to process subscription. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigation = useCallback(
    (navState) => {
      const { url } = navState;
      
      if (!url) return;

      if (url.includes("success")) {
        setCheckoutUrl(null);
        setTimeout(async () => {
          // Verify session exists before navigating
          const sessionData = await AsyncStorage.getItem("@user_session");
          if (!sessionData) {
            console.error('❌ No session found after payment');
            Alert.alert("Error", "Session not found. Please log in again.");
            return;
          }
          
          console.log('✅ Session verified after payment, navigating to app');
          
          // Map plan to subscription tier
          let subscriptionTier = SUBSCRIPTION_TIERS.FREE;
          if (selectedPlan?.title.toLowerCase().includes('personal pro') || selectedPlan?.title.toLowerCase().includes('premium')) {
            subscriptionTier = SUBSCRIPTION_TIERS.PERSONAL_PRO;
          } else if (selectedPlan?.title.toLowerCase().includes('family')) {
            subscriptionTier = SUBSCRIPTION_TIERS.FAMILY;
          } else if (selectedPlan?.title.toLowerCase().includes('personal')) {
            subscriptionTier = SUBSCRIPTION_TIERS.PERSONAL;
          }
          
          // Calculate expiration date (30 days for monthly, 365 for yearly)
          const expiresAt = new Date();
          if (billingCycle === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setDate(expiresAt.getDate() + 30);
          }
          
          // Update subscription in database
          const updated = await updateUserSubscription(subscriptionTier, expiresAt.toISOString());
          
          if (!updated) {
            console.warn('Failed to update subscription in database');
          }
          
          // Send notification for subscription upgrade
          await scheduleLocalNotification(
            "Subscription Upgraded! 🎉",
            `Your ${selectedPlan?.title} plan is now active. Enjoy all premium features!`,
            { 
              type: "subscription_upgrade", 
              tier: subscriptionTier,
              expiresAt: expiresAt.toISOString()
            }
          );
          
          Alert.alert(
            "Subscription Successful!",
            `Your ${selectedPlan?.title} plan has been activated.`,
            [
              {
                text: "OK",
                onPress: () =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "MainTabs" }],
                  }),
              },
            ]
          );
        }, 300);
      } else if (url.includes("cancel")) {
        setCheckoutUrl(null);
        Alert.alert("Cancelled", "Subscription was cancelled.");
      }
    },
    [navigation, selectedPlan, billingCycle]
  );

  const resetCheckout = useCallback(() => {
    setCheckoutUrl(null);
    setLoading(false);
  }, []);

  return {
    checkoutUrl,
    loading,
    billingCycle,
    selectedPlan,
    setBillingCycle,
    createSubscription,
    handleWebViewNavigation,
    setCheckoutUrl: resetCheckout,
    handlePlanSelect,
  };
};

// Plan Card Component
const PlanCard = React.memo(({ plan, selectedPlan, onSelectPlan, index }) => {
  const isSelected = selectedPlan?.id === plan.id;

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 200}
      duration={800}
      useNativeDriver
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onSelectPlan(plan)}
        style={[
          styles.planCard,
          plan.popular && styles.popularCard,
          isSelected && styles.selectedCard,
        ]}
      >
        {isSelected && (
          <View style={styles.tickContainer}>
            <Ionicons name="checkmark-circle" size={22} color="#DE0973" />
          </View>
        )}

        {plan.popular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={14} color="#FFF" />
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        {plan.savings && (
          <View style={styles.savingsBadge}>
            <Ionicons name="pricetag" size={12} color="#10B981" />
            <Text style={styles.savingsText}>{plan.savings}</Text>
          </View>
        )}

        <View style={styles.iconContainer}>
          <FontAwesome5 name={plan.icon} size={32} color={plan.iconColor} />
        </View>

        <Text style={styles.planTitle}>{plan.title}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>/{plan.period}</Text>
        </View>

        <Text style={styles.planDescription}>{plan.description}</Text>

        <View style={styles.divider} />

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
});

// Main Component
export default function SubscriptionScreen({ navigation, route }) {
  const { userID } = route.params || {};
  
  const {
    checkoutUrl,
    loading,
    billingCycle,
    selectedPlan,
    setBillingCycle,
    createSubscription,
    handleWebViewNavigation,
    setCheckoutUrl,
    handlePlanSelect,
  } = useSubscription(navigation, userID);

  const plans = useMemo(() => PLANS[billingCycle], [billingCycle]);

 
  if (checkoutUrl) {
    return (
      <SafeAreaView style={styles.webviewContainer}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={setCheckoutUrl}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.webviewTitle}>Complete Payment</Text>
          <View style={styles.lockContainer}>
            <Ionicons name="lock-closed" size={16} color="#6B7280" />
          </View>
        </View>
        
        {/* WebView - Takes remaining space */}
        <View style={styles.webviewWrapper}>
          <WebView
            source={{ uri: checkoutUrl }}
            onNavigationStateChange={handleWebViewNavigation}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            )}
          />
        </View>

        {/* Fixed Footer  */}
        <View style={styles.paypalFooter}>
          <Ionicons name="lock-closed" size={14} color="#6B7280" />
          <Text style={styles.footerText}>Secure payments with PayPal</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
          <Text style={styles.title}>Choose Your Safety Plan</Text>
          <Text style={styles.subtitle}>
            Select a subscription plan to continue. Subscription is required to
            use the application.
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={400} duration={800} style={styles.toggleSection}>
          <Text style={styles.toggleLabel}>Billing Cycle</Text>
          <View style={styles.toggleContainer}>
            {["monthly", "yearly"].map((cycle) => (
              <TouchableOpacity
                key={cycle}
                style={[
                  styles.toggleButton,
                  billingCycle === cycle && styles.toggleActive,
                ]}
                onPress={() => setBillingCycle(cycle)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.toggleText,
                    billingCycle === cycle && styles.toggleTextActive,
                  ]}
                >
                  {cycle === "monthly" ? "Monthly" : "Yearly"}
                </Text>
                {cycle === "yearly" && (
                  <View style={styles.discountTag}>
                    <Text style={styles.discountText}>Save 30%</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selectedPlan={selectedPlan}
              onSelectPlan={handlePlanSelect}
              index={index}
            />
          ))}
        </View>

        {selectedPlan && (
          <Animatable.View animation="fadeInUp" duration={600} style={styles.paymentSection}>
            <View style={styles.selectedPlanSummary}>
              <Text style={styles.selectedPlanTitle}>Selected Plan:</Text>
              <Text style={styles.selectedPlanName}>{selectedPlan.title}</Text>
              <Text style={styles.selectedPlanPrice}>
                {selectedPlan.price}/{selectedPlan.period}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.proceedButton,
                loading && styles.proceedButtonDisabled,
                selectedPlan.isFree && styles.freeButton,
              ]}
              onPress={createSubscription}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.proceedButtonText}>
                    {selectedPlan.isFree ? "Continue with Free Plan" : "Proceed to Payment"}
                  </Text>
                  {selectedPlan.isFree ? (
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  ) : (
                    <Ionicons name="lock-closed" size={20} color="#FFF" />
                  )}
                </>
              )}
            </TouchableOpacity>

            {/* Simple Footer */}
            {!selectedPlan.isFree && (
              <View style={styles.footer}>
                <Ionicons name="lock-closed" size={14} color="#6B7280" />
                <Text style={styles.footerText}>Secure payments with PayPal</Text>
              </View>
            )}
          </Animatable.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F9FAFB" 
  },
  
  scrollView: { 
    flex: 1 
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  header: { 
    alignItems: "center", 
    marginBottom: 30 
  },
  
  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#111827", 
    marginBottom: 8 
  },
  
  subtitle: { 
    fontSize: 16, 
    color: "#6B7280", 
    textAlign: "center" 
  },

  toggleSection: { 
    alignItems: "center", 
    marginBottom: 20 
  },
  
  toggleLabel: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#1F2937", 
    marginBottom: 12 
  },
  
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
    width: width - 80,
    maxWidth: 320,
  },
  
  toggleButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: "center" 
  },
  
  toggleActive: { 
    backgroundColor: "#DE0973", 
    borderRadius: 8 
  },
  
  toggleText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#6B7280" 
  },
  
  toggleTextActive: { 
    color: "#FFF", 
    fontWeight: "700" 
  },
  
  discountTag: {
    position: "absolute",
    top: -6,
    right: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  
  discountText: { 
    fontSize: 10, 
    fontWeight: "700", 
    color: "#FFF" 
  },

  plansContainer: { 
    gap: 16 
  },
  
  planCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  
  popularCard: { 
    borderColor: "#DE0973" 
  },
  
  selectedCard: { 
    borderColor: "#DE0973", 
    backgroundColor: "#FDF2F8" 
  },

  tickContainer: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 3,
  },

  popularBadge: {
    position: "absolute",
    top: 32,
    right: 12,
    backgroundColor: "#DE0973",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  
  popularText: { 
    fontSize: 10, 
    fontWeight: "700", 
    color: "#FFF", 
    marginLeft: 4 
  },

  savingsBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  
  savingsText: { 
    fontSize: 10, 
    fontWeight: "700", 
    color: "#10B981", 
    marginLeft: 4 
  },

  iconContainer: { 
    alignItems: "center", 
    marginBottom: 10 
  },
  
  planTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#1F2937", 
    textAlign: "center" 
  },
  
  priceContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "flex-end" 
  },
  
  planPrice: { 
    fontSize: 26, 
    fontWeight: "800", 
    color: "#DE0973" 
  },
  
  planPeriod: { 
    fontSize: 14, 
    color: "#6B7280", 
    marginLeft: 4 
  },
  
  planDescription: { 
    fontSize: 14, 
    color: "#6B7280", 
    textAlign: "center" 
  },
  
  divider: { 
    height: 1, 
    backgroundColor: "#E5E7EB", 
    marginVertical: 10 
  },
  
  featuresContainer: { 
    gap: 8 
  },
  
  featureItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  
  featureText: { 
    fontSize: 14, 
    color: "#374151" 
  },

  paymentSection: { 
    marginTop: 20, 
    alignItems: "center" 
  },
  
  selectedPlanSummary: { 
    alignItems: "center", 
    marginBottom: 16 
  },
  
  selectedPlanTitle: { 
    fontSize: 14, 
    color: "#6B7280" 
  },
  
  selectedPlanName: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#111827" 
  },
  
  selectedPlanPrice: { 
    fontSize: 16, 
    color: "#DE0973", 
    fontWeight: "700" 
  },
  
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DE0973",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    gap: 8,
  },
  
  freeButton: {
    backgroundColor: "#10B981",
  },
  
  proceedButtonDisabled: { 
    opacity: 0.7 
  },
  
  proceedButtonText: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#FFF" 
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  
  footerText: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Fixed WebView Styles
  webviewContainer: { 
    flex: 1, 
    backgroundColor: "#FFF" 
  },
  
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    height: 60, 
  },
  
  backButton: { 
    marginRight: 12,
    padding: 4,
  },
  
  webviewTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
  },
  
  lockContainer: {
    marginLeft: 8,
    width: 24, 
  },
  
  webviewWrapper: {
    flex: 1, 
  },
  
  webview: { 
    flex: 1 
  },
  
  webviewLoading: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },

  paypalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    height: 50,
  },
});