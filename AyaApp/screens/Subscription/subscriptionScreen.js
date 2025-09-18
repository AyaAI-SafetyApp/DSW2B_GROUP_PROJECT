import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import supabase from "../../lib/supabaseClient";

const { width } = Dimensions.get("window");

// Configuration
const CONFIG = {
  API_BASE_URL: "http://172.16.26.108:3000",
  DEMO_USER_ID: "demo-user-123",
  REQUEST_TIMEOUT: 10000,
};

// Custom hook for subscription management
const useSubscription = () => {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Fetch current subscription on mount
  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", CONFIG.DEMO_USER_ID)
        .eq("status", "ACTIVE")
        .single();

      if (!error && data) {
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.log("No active subscription found");
    }
  };

  const createSubscription = async (planId) => {
    if (!planId || planId === "trial") return;

    try {
      setLoading(true);
      setActivePlan(planId);

      const response = await axios.post(
        `${CONFIG.API_BASE_URL}/create-subscription`,
        {
          planId,
          userId: CONFIG.DEMO_USER_ID,
          billingCycle,
        },
        { timeout: CONFIG.REQUEST_TIMEOUT }
      );

      if (response.data?.approvalUrl) {
        setCheckoutUrl(response.data.approvalUrl);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Subscription creation error:", error);

      let errorMessage = "Failed to start subscription.";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your connection.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSubscriptionToSupabase = async (
    planId,
    status,
    subscriptionId = null
  ) => {
    try {
      const subscriptionData = {
        user_id: CONFIG.DEMO_USER_ID,
        plan_id: planId,
        status,
        billing_cycle: billingCycle,
        created_at: new Date().toISOString(),
      };

      if (subscriptionId) {
        subscriptionData.subscription_id = subscriptionId;
      }

      const { error } = await supabase
        .from("subscriptions")
        .upsert(subscriptionData, {
          onConflict: "user_id,plan_id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (status === "ACTIVE") {
        await fetchCurrentSubscription();
      }
    } catch (error) {
      console.error("Failed to save subscription:", error);
    }
  };

  const handleWebViewNavigation = useCallback(
    (navState) => {
      const { url } = navState;

      if (url.includes("success")) {
        setCheckoutUrl(null);
        Alert.alert(
          "Success! 🎉",
          "Your subscription has been activated successfully.",
          [
            {
              text: "OK",
              onPress: () => saveSubscriptionToSupabase(activePlan, "ACTIVE"),
            },
          ]
        );
      } else if (url.includes("cancel")) {
        setCheckoutUrl(null);
        Alert.alert(
          "Subscription Cancelled",
          "You can subscribe again anytime.",
          [
            {
              text: "OK",
              onPress: () =>
                saveSubscriptionToSupabase(activePlan, "CANCELLED"),
            },
          ]
        );
      } else if (url.includes("error")) {
        setCheckoutUrl(null);
        Alert.alert(
          "Payment Error",
          "There was an issue processing your payment."
        );
      }
    },
    [activePlan, billingCycle]
  );

  return {
    checkoutUrl,
    loading,
    activePlan,
    billingCycle,
    currentSubscription,
    setBillingCycle,
    createSubscription,
    handleWebViewNavigation,
  };
};

// Plan data with improved structure
const PLANS = {
  monthly: [
    {
      id: "trial",
      title: "Free Trial",
      price: "R0",
      period: "7 days",
      icon: "gift",
      iconColor: "#ff00a2ff",
      description: "Full access for 7 days. No credit card required.",
      features: ["Real-time alerts", "Basic safety features", "Email support"],
      isTrial: true,
    },
    {
      id: "personal",
      title: "Personal",
      price: "R350",
      period: "month",
      icon: "user",
      iconColor: "#00a6ffff",
      description:
        "Individual safety with premium features and priority support.",
      features: [
        "Real-time alerts & notifications",
        "Offline emergency support",
        "AI-powered safe routes",
        "24/7 priority support",
        "Advanced location sharing",
      ],
      highlight: true,
      savings: null,
    },
    {
      id: "family",
      title: "Family",
      price: "R900",
      period: "3 months",
      icon: "users",
      iconColor: "#ff7b00ff",
      description:
        "Complete family protection with shared alerts and group features.",
      features: [
        "Up to 5 family members",
        "Shared emergency alerts",
        "Family location tracking",
        "Group safety zones",
        "Priority family support",
      ],
      isTrial: false,
    },
  ],
  yearly: [
    {
      id: "trial",
      title: "Free Trial",
      price: "R0",
      period: "7 days",
      icon: "gift",
      iconColor: "#ff00a2ff",
      description: "Full access for 7 days. No credit card required.",
      features: ["Real-time alerts", "Basic safety features", "Email support"],
      isTrial: false,
    },
    {
      id: "personal",
      title: "Personal",
      price: "R3,500",
      period: "year",
      icon: "user",
      iconColor: "#00a6ffff",
      description: "Annual plan with significant savings and premium features.",
      features: [
        "All Personal monthly features",
        "Annual billing discount",
        "Extended offline maps",
        "Advanced analytics",
        "Priority feature access",
      ],
      savings: "Save R700",
    },
    {
      id: "family",
      title: "Family",
      price: "R8,000",
      period: "year",
      icon: "users",
      iconColor: "#ff7b00ff",
      description:
        "Annual family plan with maximum savings and premium support.",
      features: [
        "All Family features",
        "Up to 10 family members",
        "Advanced family analytics",
        "Dedicated family manager",
        "Custom safety zones",
      ],
      highlight: true,
      savings: "Save R2,800",
    },
  ],
};

// Plan Card Component
const PlanCard = ({
  plan,
  onSubscribe,
  loading,
  activePlan,
  currentSubscription,
  index,
}) => {
  const isCurrentPlan = currentSubscription?.plan_id === plan.id;
  const isLoading = loading && activePlan === plan.id;
  const isDisabled = plan.isTrial || isCurrentPlan || loading;

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (plan.isTrial) return "Start Free Trial";
    if (isLoading) return "Processing...";
    return "Subscribe";
  };

  const getButtonStyle = () => {
    if (isCurrentPlan)
      return [styles.subscribeButton, styles.currentPlanButton];
    if (plan.isTrial) return [styles.subscribeButton, styles.trialButton];
    return styles.subscribeButton;
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 150}
      style={[
        styles.planCard,
        plan.highlight && styles.highlighted,
        isCurrentPlan && styles.currentPlanCard,
      ]}
    >
      {plan.highlight && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Most Popular</Text>
        </View>
      )}

      {isCurrentPlan && (
        <View style={[styles.badge, styles.currentBadge]}>
          <Text style={[styles.badgeText, styles.currentBadgeText]}>
            Active
          </Text>
        </View>
      )}

      {plan.savings && (
        <View style={[styles.badge, styles.savingsBadge]}>
          <Text style={[styles.badgeText, styles.savingsBadgeText]}>
            {plan.savings}
          </Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${plan.iconColor}20` },
          ]}
        >
          <FontAwesome5 name={plan.icon} size={24} color={plan.iconColor} />
        </View>
        <Text style={styles.planTitle}>{plan.title}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>/ {plan.period}</Text>
        </View>
      </View>

      <Text style={styles.planDescription}>{plan.description}</Text>

      {plan.features && (
        <View style={styles.featuresContainer}>
          {plan.features.slice(0, 3).map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <MaterialIcons name="check" size={16} color={theme.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {plan.features.length > 3 && (
            <Text style={styles.moreFeatures}>
              +{plan.features.length - 3} more features
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={getButtonStyle()}
        onPress={() => !isDisabled && onSubscribe(plan.id)}
        disabled={isDisabled}
        accessibilityLabel={`Subscribe to ${plan.title} plan`}
        accessibilityHint={`${plan.price} per ${plan.period}`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text
            style={[
              styles.subscribeText,
              isCurrentPlan && styles.currentPlanButtonText,
              plan.isTrial && styles.trialButtonText,
            ]}
          >
            {getButtonText()}
          </Text>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
};

// Main Component
export default function SubscriptionScreen() {
  const {
    checkoutUrl,
    loading,
    activePlan,
    billingCycle,
    currentSubscription,
    setBillingCycle,
    createSubscription,
    handleWebViewNavigation,
  } = useSubscription();

  if (checkoutUrl) {
    return (
      <View style={styles.webviewContainer}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCheckoutUrl(null)}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.webviewTitle}>Complete Purchase</Text>
        </View>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleWebViewNavigation}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Loading payment...</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animatable.View animation="fadeInDown" style={styles.headerContainer}>
        <Text style={styles.subtitle}>
          Advanced safety features for you and your loved ones
        </Text>
      </Animatable.View>

      {/* Billing Cycle Toggle */}
      <Animatable.View
        animation="fadeIn"
        delay={200}
        style={styles.toggleContainer}
      >
        {["monthly", "yearly"].map((cycle) => (
          <TouchableOpacity
            key={cycle}
            style={[
              styles.toggleButton,
              billingCycle === cycle && styles.toggleActive,
            ]}
            onPress={() => setBillingCycle(cycle)}
            accessibilityRole="tab"
            accessibilityState={{ selected: billingCycle === cycle }}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === cycle && styles.toggleTextActive,
              ]}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </Text>
            {cycle === "yearly" && (
              <View style={styles.savingsIndicator}>
                <Text style={styles.savingsText}>Save up to 30%</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Animatable.View>

      {/* Plan Cards */}
      <View style={styles.plansContainer}>
        {PLANS[billingCycle].map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSubscribe={createSubscription}
            loading={loading}
            activePlan={activePlan}
            currentSubscription={currentSubscription}
            index={index}
          />
        ))}
      </View>

      {/* Footer */}
      <Animatable.View animation="fadeIn" delay={800} style={styles.footer}>
        <Text style={styles.footerText}>
          All plans include a 30-day money-back guarantee
        </Text>
        <View style={styles.securityBadge}>
          <MaterialIcons name="security" size={16} color={theme.success} />
          <Text style={styles.securityText}>Secure Payment</Text>
        </View>
      </Animatable.View>
    </ScrollView>
  );
}

// Enhanced Theme
const theme = {
  primary: "#2D2D2D",
  secondary: "#d30c6cff",
  background: "#FFFFFF",
  card: "#F8F9FA",
  text: "#1C1C1C",
  subtitle: "#6E6E6E",
  badge: "#E8F4FD",
  highlight: "#dc0276ff",
  success: "#27AE60",
  error: "#E74C3C",
  warning: "#F39C12",
  border: "#E1E8ED",
  shadow: "#00000010",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 30,
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.text,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.subtitle,
    textAlign: "center",
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    marginBottom: 20,
    padding: 4,
    width: width * 0.8,
    maxWidth: 280,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    position: "relative",
  },
  toggleActive: {
    backgroundColor: theme.background,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.subtitle,
  },
  toggleTextActive: {
    color: theme.text,
    fontWeight: "700",
  },
  savingsIndicator: {
    position: "absolute",
    top: -6,
    right: -4,
    backgroundColor: theme.success,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  savingsText: {
    fontSize: 8,
    color: "white",
    fontWeight: "600",
  },
  plansContainer: {
    width: "100%",
    alignItems: "center",
  },
  planCard: {
    width: width * 0.85,
    maxWidth: 320,
    backgroundColor: theme.card,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  highlighted: {
    borderColor: theme.highlight,
    shadowColor: theme.highlight,
    shadowOpacity: 0.15,
  },
  currentPlanCard: {
    borderColor: theme.success,
    backgroundColor: "#F0FFF4",
  },
  badge: {
    backgroundColor: theme.badge,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.highlight,
  },
  currentBadge: {
    backgroundColor: theme.success,
  },
  currentBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  savingsBadge: {
    backgroundColor: theme.warning,
  },
  savingsBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  planHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.primary,
  },
  planPeriod: {
    fontSize: 14,
    color: theme.subtitle,
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 13,
    color: theme.subtitle,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: theme.text,
    marginLeft: 6,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 11,
    color: theme.highlight,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  subscribeButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  currentPlanButton: {
    backgroundColor: theme.success,
  },
  trialButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.highlight,
  },
  subscribeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  currentPlanButtonText: {
    color: "white",
  },
  trialButtonText: {
    color: theme.highlight,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: theme.subtitle,
    textAlign: "center",
    marginBottom: 8,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  securityText: {
    fontSize: 11,
    color: theme.success,
    fontWeight: "600",
    marginLeft: 4,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    marginRight: 16,
  },
  webviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.subtitle,
  },
});
