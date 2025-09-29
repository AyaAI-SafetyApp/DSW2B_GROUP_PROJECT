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
import { supabase } from "../../lib/supabaseClient";

const { width } = Dimensions.get("window");

const CONFIG = {
  API_BASE_URL: "https://dsw2b-backend.onrender.com",
  DEMO_USER_ID: "demo-user-123",
  REQUEST_TIMEOUT: 10000,
};

const PLANS = {
  monthly: [
    {
      id: "P-1GN061938A031721GNC5CY4Q",
      title: "Personal",
      price: "R350",
      period: "month",
      icon: "user",
      iconColor: "#3B82F6",
      description:
        "Individual safety with premium features and priority support.",
      features: [
        "Real-time alerts & notifications",
        "Offline emergency support",
        "AI-powered safe routes",
        "24/7 priority support",
        "Advanced location sharing",
      ],
    },
    {
      id: "P-5PD448977L069480VNC5CZYY",
      title: "Family",
      price: "R900",
      period: "3 months",
      icon: "users",
      iconColor: "#8B5CF6",
      description:
        "Complete family protection with shared alerts and group features.",
      features: [
        "Up to 5 family members",
        "Shared emergency alerts",
        "Family location tracking",
        "Group safety zones",
        "Priority family support",
      ],
      highlight: true,
    },
  ],
  yearly: [
    {
      id: "P-9U8910582N234330WNC5C2OQ",
      title: "Personal",
      price: "R3,500",
      period: "year",
      icon: "user",
      iconColor: "#3B82F6",
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
      id: "P-9L275883JF591292KNC5CX5I",
      title: "Premium",
      price: "R8,000",
      period: "year",
      icon: "crown",
      iconColor: "#F59E0B",
      description:
        "Premium annual plan with maximum savings and premium support.",
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

// Hook for subscription logic (unchanged backend)
const useSubscription = (navigation) => {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    console.log("Skipping database check - no active subscription");
    setCurrentSubscription(null);
  };

  const createSubscription = async (planId) => {
    if (!planId || planId.trim() === "") {
      Alert.alert("Error", "Please select a valid plan");
      return;
    }
    try {
      setLoading(true);
      const selectedPlan = [...PLANS.monthly, ...PLANS.yearly].find(
        (plan) => plan.id === planId
      );
      setActivePlan(selectedPlan);
      const response = await axios.post(
        `${CONFIG.API_BASE_URL}/create-subscription`,
        { planId, userId: CONFIG.DEMO_USER_ID, billingCycle },
        { timeout: CONFIG.REQUEST_TIMEOUT }
      );
      if (response.data?.approvalUrl) {
        setCheckoutUrl(response.data.approvalUrl);
      } else throw new Error("Invalid response from server - no approval URL");
    } catch (error) {
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
    console.log(
      `Subscription ${status} for plan ${planId} (Database recording skipped)`
    );
    if (status === "ACTIVE") {
      console.log("Subscription is now ACTIVE!");
    }
  };

  const handleWebViewNavigation = useCallback(
    (navState) => {
      const { url } = navState;
      if (url.includes("success")) {
        setCheckoutUrl(null);
        Alert.alert("Success!", "Your subscription has been activated.", [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] }),
          },
        ]);
      } else if (url.includes("cancel")) {
        setCheckoutUrl(null);
        Alert.alert(
          "Subscription Cancelled",
          "You can subscribe again anytime"
        );
      } else if (url.includes("error")) {
        setCheckoutUrl(null);
        Alert.alert("Payment Error", "There was an issue processing payment.");
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
    setCheckoutUrl,
  };
};

// Card Component (UI cleaned)
const PlanCard = ({
  plan,
  onSubscribe,
  loading,
  activePlan,
  currentSubscription,
  index,
}) => {
  const isCurrent = currentSubscription?.plan_id === plan.id;
  const isLoading = loading && activePlan?.id === plan.id;
  const isDisabled = isCurrent || loading;

  const buttonText = isCurrent
    ? "Current Plan"
    : isLoading
    ? "Processing..."
    : "Subscribe Now";

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
      style={[
        styles.planCard,
        plan.highlight && styles.highlightedCard,
        isCurrent && styles.currentPlanCard,
      ]}
    >
      {plan.highlight && (
        <View style={styles.popularBadge}>
          <MaterialIcons name="star" size={14} color="#FFF" />
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      {plan.savings && (
        <View style={styles.savingsBadge}>
          <MaterialIcons name="trending-down" size={14} color="#10B981" />
          <Text style={styles.savingsText}>{plan.savings}</Text>
        </View>
      )}
      <View style={styles.iconWrapper}>
        <FontAwesome5 name={plan.icon} size={28} color={plan.iconColor} />
      </View>
      <Text style={styles.planTitle}>{plan.title}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.planPrice}>{plan.price}</Text>
        <Text style={styles.planPeriod}>/{plan.period}</Text>
      </View>
      <Text style={styles.planDescription}>{plan.description}</Text>
      <View style={styles.divider} />
      {plan.features.map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <MaterialIcons name="check-circle" size={18} color="#10B981" />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
      <TouchableOpacity
        style={[
          styles.subscribeButton,
          plan.highlight && styles.highlightButton,
          isCurrent && styles.currentButton,
          isDisabled && styles.disabledButton,
        ]}
        onPress={() => !isDisabled && onSubscribe(plan.id)}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Text style={styles.buttonText}>{buttonText}</Text>
            {!isCurrent && (
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color="#FFF"
                style={styles.buttonIcon}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
};

// Main Screen
export default function SubscriptionScreen({ navigation }) {
  const {
    checkoutUrl,
    loading,
    activePlan,
    billingCycle,
    currentSubscription,
    setBillingCycle,
    createSubscription,
    handleWebViewNavigation,
    setCheckoutUrl,
  } = useSubscription(navigation);

  if (checkoutUrl) {
    return (
      <View style={styles.webviewContainer}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCheckoutUrl(null)}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.webviewTitle}>Complete Payment</Text>
        </View>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleWebViewNavigation}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading secure payment...</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animatable.View
          animation="fadeInDown"
          duration={800}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
        </Animatable.View>
        <Animatable.View
          animation="fadeIn"
          delay={300}
          duration={600}
          style={styles.toggleWrapper}
        >
          <View style={styles.toggleContainer}>
            {["monthly", "yearly"].map((cycle) => (
              <TouchableOpacity
                key={cycle}
                style={[
                  styles.toggleButton,
                  billingCycle === cycle && styles.toggleActive,
                ]}
                onPress={() => setBillingCycle(cycle)}
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
        <View style={styles.plansWrapper}>
          {PLANS[billingCycle].map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={createSubscription}
              loading={loading}
              activePlan={activePlan}
              currentSubscription={currentSubscription}
              index={i}
            />
          ))}
        </View>
        <Animatable.View animation="fadeIn" delay={900} style={styles.footer}>
          <View style={styles.securityContainer}>
            <MaterialIcons name="lock" size={16} color="#6B7280" />
            <Text style={styles.securityText}>Secure payment with PayPal</Text>
          </View>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

// Theme + Styles (streamlined)
const theme = {
  background: "#FFF",
  text: "#1F2937",
  textLight: "#6B7280",
  primary: "#3B82F6",
  highlight: "#FF0099",
  success: "#10B981",
  border: "#E5E7EB",
  shadow: "rgba(0,0,0,0.08)",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: { alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827" },
  toggleWrapper: { alignItems: "center", marginBottom: 20 },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
    width: width - 80,
    maxWidth: 320,
  },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: "center" },
  toggleActive: { backgroundColor: "#2563EB", borderRadius: 8, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  toggleTextActive: { color: "#FFF", fontWeight: "700" },
  discountTag: {
    position: "absolute",
    top: -6,
    right: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  discountText: { fontSize: 10, fontWeight: "700", color: "#FFF" },
  plansWrapper: { gap: 16 },
  planCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    minHeight: 260,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
    position: "relative",
  },
  highlightedCard: { borderColor: "#FF0099" },
  currentPlanCard: { borderColor: "#10B981", backgroundColor: "#F0FDF4" },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF0099",
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
    marginLeft: 4,
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
    marginLeft: 4,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  priceRow: { flexDirection: "row", justifyContent: "center", marginBottom: 6 },
  planPrice: { fontSize: 28, fontWeight: "800", color: "#2563EB" },
  planPeriod: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
    alignSelf: "flex-end",
  },
  planDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  featureText: { fontSize: 13, color: "#111827", marginLeft: 8 },
  subscribeButton: {
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  highlightButton: { backgroundColor: "#FF0099" },
  currentButton: { backgroundColor: "#10B981" },
  disabledButton: { backgroundColor: "#9CA3AF" },
  buttonText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  buttonIcon: { marginLeft: 6 },
  footer: { alignItems: "center", marginTop: 20 },
  securityContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  securityText: { fontSize: 12, color: "#6B7280" },
  webviewContainer: { flex: 1, backgroundColor: "#FFF" },
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { marginRight: 12 },
  webviewTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  webview: { flex: 1 },
  webviewLoading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
});
