import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LottieView from "lottie-react-native";
import { getSession } from "./utils/session";
import MainTabs from "./navigation/TabsNavigator";

// Screens
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import SubscriptionScreen from "./screens/Subscription/SubscriptionScreen";
import HealthScreen from "./screens/HealthScreen";
import ReactionGame from "./screens/Learning/ReactionGame";
import PoliceGame from "./screens/Learning/PoliceGame";
import SafetyGame from "./screens/Learning/SafetyGame";
import NewsFeed from "./screens/GBVNews/NewsFeed";
import ArticleScreen from "./screens/GBVNews/ArticleScreen";
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
import SubscriptionUpgrade from "./screens/Subscription/SubscriptionUpgrade.js";

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("OnboardingScreen");

  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      setInitialRoute(session ? "MainTabs" : "OnboardingScreen");
      setTimeout(() => setLoading(false), 1800);
    };
    init();
  }, []);

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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen
          name="SubscriptionScreen"
          component={SubscriptionScreen}
        />
        {/* <Stack.Screen name="MainTabs" component={MainTabs} /> */}
        <Stack.Screen name="Health" component={HealthScreen} />
        <Stack.Screen name="ReactionGame" component={ReactionGame} />
        <Stack.Screen name="PoliceGame" component={PoliceGame} />
        <Stack.Screen name="SafetyGame" component={SafetyGame} />
        <Stack.Screen name="NewsFeed" component={NewsFeed} />
        <Stack.Screen name="ArticleScreen" component={ArticleScreen} />
        <Stack.Screen name="EmergencyScreen" component={EmergencyScreen} />
        <Stack.Screen name="AccountForm" component={AccountForm} />
        <Stack.Screen name="GetAssertion" component={GetAssertion} />
        <Stack.Screen name="CreateCredential" component={CreateCredential} />
        <Stack.Screen name="MapViewScreen" component={MapViewScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen
          name="AccountDetailsScreen"
          component={AccountDetailsScreen}
        />
        <Stack.Screen
          name="SafetyPreferencesScreen"
          component={SafetyPreferencesScreen}
        />
        <Stack.Screen
          name="PrivacySecurityScreen"
          component={PrivacySecurityScreen}
        />
        <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
        <Stack.Screen name="AchievementsScreen" component={AchievementsScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfile} />
        <Stack.Screen name="SubscriptionUpgrade" component={SubscriptionUpgrade} />
      </Stack.Navigator>
    </NavigationContainer>
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
