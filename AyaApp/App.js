import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  AppState,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

// Utils and services
import { getSession } from "./utils/session";
import { initializeAllNotificationServices } from "./components/NotificationService";

// Navigation
import MainTabs from "./navigation/TabsNavigator";

// Debugging (only runs in development mode)
if (__DEV__) {
  import("./utils/reactotron");
  console.log("Development mode enabled - Debugging available");
  if (typeof global !== "undefined") {
    global.XMLHttpRequest = global.originalXMLHttpRequest || global.XMLHttpRequest;
    global.FormData = global.originalFormData || global.FormData;
  }
}

// Screens
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import SubscriptionScreen from "./screens/Subscription/subscriptionScreen";
import HealthScreen from "./screens/HealthScreen";
import ReactionGame from "./screens/Learning/ReactionGame";
import PoliceGame from "./screens/Learning/PoliceGame";
import SafetyGame from "./screens/Learning/SafetyGame";
import NewsFeed from "./screens/GBVNews/NewsFeed";
import ArticleScreen from "./screens/GBVNews/ArticleScreen";
import Safety from "./screens/Learning/SafetyGame";
import ARTrainingScreen from "./screens/Learning/ARTrainingScreen";
import CameraARTrainingScreen from "./screens/Learning/CameraARTrainingScreen";
import EmergencyScreen from "./screens/EmergencyScreen";
import AccountForm from "./screens/Auth/AccountForm";
import GetAssertion from "./screens/Auth/GetAssertion";
import CreateCredential from "./screens/Auth/CreateCredential";
import MapViewScreen from "./screens/MapViewScreen";
import ProfileScreen from "./screens/UserProfile/ProfileScreen";
import AccountDetailsScreen from "./screens/UserProfile/AccountDetailsScreen";
import SafetyPreferencesScreen from "./screens/UserProfile/SafetyPreferencesScreen";
import PrivacySecurityScreen from "./screens/UserProfile/PrivacySecurityScreen";
import HelpSupportScreen from "./screens/UserProfile/HelpSupportScreen";
import AchievementsScreen from "./screens/UserProfile/AchievementsScreen";
import EditProfile from "./screens/UserProfile/EditProfile";
import SubscriptionUpgrade from "./screens/Subscription/SubscriptionUpgrade";
import AboutUsScreen from "./screens/UserProfile/AboutUsScreen";
import ReactivateAccountScreen from "./screens/ReactivateAccountScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("MainTabs");

  useEffect(() => {
    console.log("App.js: App Mounted (similar to onCreate)");

    // App state listener (foreground/background)
    const subscription = AppState.addEventListener("change", (nextState) => {
      console.log(`App.js: App state changed to ${nextState}`);
    });

    // Initialization sequence
    const init = async () => {
      console.log("App.js: Initializing session and notifications...");

      const session = await getSession();
      setInitialRoute(session ? "MainTabs" : "OnboardingScreen");

      try {
        const notificationInit = await initializeAllNotificationServices();
        console.log("App.js: Notification services initialized:", notificationInit);
      } catch (error) {
        console.error("App.js: Notification initialization failed:", error);
      }

      setTimeout(() => setLoading(false), 1800);
    };

    init();

    return () => {
      subscription.remove();
      console.log("App.js: App Unmounted (similar to onDestroy)");
    };
  }, []);

  // Splash screen while initializing
  if (loading) {
    return (
      <View style={styles.splash}>
        <LottieView
          source={require("./assets/animations/Welcome.json")}
          autoPlay
          loop={false}
          style={{ width: 250, height: 250 }}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRoute}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
          <Stack.Screen name="ReactivateAccount" component={ReactivateAccountScreen} />
          <Stack.Screen name="Health" component={HealthScreen} />
          <Stack.Screen name="ReactionGame" component={ReactionGame} />
          <Stack.Screen name="PoliceGame" component={PoliceGame} />
          <Stack.Screen name="SafetyGame" component={SafetyGame} />
          <Stack.Screen name="NewsFeed" component={NewsFeed} />
          <Stack.Screen name="Safety" component={Safety} />
          <Stack.Screen name="ARTraining" component={ARTrainingScreen} />
          <Stack.Screen name="CameraARTraining" component={CameraARTrainingScreen} />
          <Stack.Screen name="ArticleScreen" component={ArticleScreen} />
          <Stack.Screen name="EmergencyScreen" component={EmergencyScreen} />
          <Stack.Screen name="AccountForm" component={AccountForm} />
          <Stack.Screen name="GetAssertion" component={GetAssertion} />
          <Stack.Screen name="CreateCredential" component={CreateCredential} />
          <Stack.Screen name="MapViewScreen" component={MapViewScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="AccountDetailsScreen" component={AccountDetailsScreen} />
          <Stack.Screen name="SafetyPreferencesScreen" component={SafetyPreferencesScreen} />
          <Stack.Screen name="PrivacySecurityScreen" component={PrivacySecurityScreen} />
          <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
          <Stack.Screen name="AchievementsScreen" component={AchievementsScreen} />
          <Stack.Screen name="EditProfileScreen" component={EditProfile} />
          <Stack.Screen name="SubscriptionUpgrade" component={SubscriptionUpgrade} />
          <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});
