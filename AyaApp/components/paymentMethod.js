import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "./lib/supabaseClient"; // supebase client

import { Platform } from "react-native";

const LOCAL_IP = "192.168.101.106";
const API_BASE_URL =
  Platform.OS === "android"
    ? `http://${LOCAL_IP}:3001` 
    : `http://localhost:3001`; 

export default function PaymentMethod() {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  const createSubscription = async (planId) => {
    try {
      setLoading(true);
      setActivePlan(planId);

  const response = await axios.post(`${API_BASE_URL}/create-subscription`, 
        {
          planId: planId,
          userId: "demo-user-123", // we will replace this with the authenticated user later
        }
      );
      setCheckoutUrl(response.data.approvalUrl);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to start subscription.");
    } finally {
      setLoading(false);
    }
  };

  const saveSubscriptionToSupabase = async (planId, status) => {
    const { error } = await supabase.from("subscriptions").insert([
      {
        user_id: "demo-user-123", //we will replace this with the authenticated user later
        plan_id: planId,
        status: status,
      },
    ]);
    if (error) {
      console.error("Supabase error:", error);
    } else {
      console.log("✅ Subscription saved in Supabase");
    }
  };

  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={(navState) => {
          if (navState.url.includes("success")) {
            setCheckoutUrl(null);
            Alert.alert("Success", "Subscription successful ✅");
            saveSubscriptionToSupabase(activePlan, "ACTIVE");
          }
          if (navState.url.includes("cancel")) {
            setCheckoutUrl(null);
            Alert.alert("Cancelled", "Subscription cancelled ❌");
            saveSubscriptionToSupabase(activePlan, "CANCELLED");
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
  <Text style={styles.header}>Aya Premium ✨</Text>
  <Text style={styles.subtitle}>Choose a plan to unlock premium features</Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.planList}>
          
          <TouchableOpacity
            style={[styles.planCard, { borderColor: theme.primary }]}
            onPress={() => createSubscription("P-9L275883JF591292KNC5CX5I")}
          >
            <FontAwesome5
              name="calendar-week"
              size={30}
              color={theme.primary}
              style={styles.icon}
            />
            <Text style={styles.planTitle}>Weekly</Text>
            <Text style={styles.planPrice}>$5 / week</Text>
          </TouchableOpacity>

          
          <TouchableOpacity
            style={[styles.planCard, { borderColor: theme.primary }]}
            onPress={() => createSubscription("P-1GN061938A031721GNC5CY4Q")}
          >
            <MaterialIcons
              name="date-range"
              size={30}
              color={theme.primary}
              style={styles.icon}
            />
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.planPrice}>$10 / month</Text>
          </TouchableOpacity>

          
          <TouchableOpacity
            style={[styles.planCard, { borderColor: theme.primary }]}
            onPress={() => createSubscription("P-5PD448977L069480VNC5CZYY")}
          >
            <FontAwesome5
              name="chart-line"
              size={30}
              color={theme.primary}
              style={styles.icon}
            />
            <Text style={styles.planTitle}>Quarterly</Text>
            <Text style={styles.planPrice}>$25 / 3 months</Text>
          </TouchableOpacity>

          
          <TouchableOpacity
            style={[styles.planCard, { borderColor: theme.primary }]}
            onPress={() => createSubscription("P-9U8910582N234330WNC5C2OQ")}
          >
            <FontAwesome5
              name="crown"
              size={30}
              color={theme.primary}
              style={styles.icon}
            />
            <Text style={styles.planTitle}>Yearly</Text>
            <Text style={styles.planPrice}>$100 / year</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const theme = {
  primary: "#FF69B4",
  secondary: "#FFB6C1", 
  background: "#FFF0F5",
  card: "#FFFFFF",
  text: "#2D2D2D",
  subtitle: "#666666",
  accent: "#FF1493",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 34,
    fontWeight: "bold",
    color: theme.primary,
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: theme.secondary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: theme.subtitle,
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "500",
    fontStyle: "italic",
  },
  planList: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  planCard: {
    backgroundColor: theme.card,
    width: "47%",
    minWidth: 160,
    padding: 24,
    marginVertical: 8,
    borderRadius: 20,
    shadowColor: theme.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.secondary,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: {
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 17,
    color: theme.primary,
    marginTop: 6,
    fontWeight: "600",
  },
});