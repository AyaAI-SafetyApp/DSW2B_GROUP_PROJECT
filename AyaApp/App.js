import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Platform, View, TouchableOpacity, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import CommunityScreen from "./screens/NewsFeed/Newsfeed";
import SOSScreen from "./screens/SosScreen";
import LearningScreen from "./screens/Learning/LearningScreen";
import TherapistScreen from "./screens/TherapistScreen";
import HealthScreen from "./screens/HealthScreen";
import ReactionGame from "./screens/Learning/ReactionGame";
import PoliceGame from "./screens/Learning/PoliceGame";
import Safety from "./screens/Learning/SafetyGame";
import EmergencyScreen from "./screens/EmergencyScreen";
import MapViewScreen from "./screens/MapViewScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import AccountForm from "./screens/Auth/AccountForm";
import GetAssertion from "./screens/Auth/GetAssertion";
import CreateCredential from "./screens/Auth/CreateCredential";
import subscription from "./screens/Subscription/subscriptionScreen.js";
import NewsFeed from "./screens/GBVNews/NewsFeed.js";
import ArticleScreen from "./screens/GBVNews/ArticleScreen.js";
import ProfileScreen from "./screens/UserProfile/ProfileScreen";
import AccountDetailsScreen from "./screens/UserProfile/AccountDetailsScreen";
import SafetyPreferencesScreen from "./screens/UserProfile/SafetyPreferencesScreen";
import PrivacySecurityScreen from "./screens/UserProfile/PrivacySecurityScreen";
import HelpSupportScreen from "./screens/UserProfile/HelpSupportScreen";
import AchievementsScreen from "./screens/UserProfile/AchievementsScreen";
import EditProfile from "./screens/UserProfile/EditProfile";
import SubscriptionUpgrade from "./screens/Subscription/SubscriptionUpgrade.js";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = { ACTIVE: "#de0973ff", INACTIVE: "gray" };
const TABS = [
  {
    name: "Home",
    component: HomeScreen,
    icons: { active: "home", inactive: "home-outline" },
  },
  {
    name: "Newsfeed",
    component: CommunityScreen,
    icons: { active: "newspaper", inactive: "newspaper-outline" },
  },
  {
    name: "SOS",
    component: SOSScreen,
    icons: { active: "alert-circle", inactive: "alert-circle-outline" },
  },
  {
    name: "Learning",
    component: LearningScreen,
    icons: { active: "book", inactive: "book-outline" },
  },
  {
    name: "Therapist",
    component: TherapistScreen,
    icons: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  },
];

const TabsNavigator = () => {
  const tabVisible = useRef(new Animated.Value(1)).current;

  const PremiumTabBar = ({ state, descriptors, navigation }) => {
    return (
      <Animated.View 
        style={[
          styles.tabBar,
          {
            opacity: tabVisible,
            transform: [{
              translateY: tabVisible.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            }],
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented)
              navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Ionicons
                name={
                  isFocused
                    ? TABS[index].icons.active
                    : TABS[index].icons.inactive
                }
                size={28}
                color={isFocused ? COLORS.ACTIVE : COLORS.INACTIVE}
              />
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PremiumTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("OnboardingScreen");

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      // Check if user has an active session
      const sessionData = await AsyncStorage.getItem("@user_session");
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        console.log("✅ Found existing session for:", session.email);
        // User is logged in, go directly to main app
        setInitialRoute("MainTabs");
      } else {
        console.log("❌ No session found, showing onboarding");
        // No session, show onboarding
        setInitialRoute("OnboardingScreen");
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setInitialRoute("OnboardingScreen");
    } finally {
      // Show splash for at least 2.5 seconds
      setTimeout(() => setLoading(false), 2500);
    }
  };

  if (loading) {
    return (
      <View style={styles.splashContainer}>
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
        initialRouteName="SubscriptionUpgrade"
      >
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="subscription" component={subscription} />
        <Stack.Screen name="MainTabs" component={TabsNavigator} />
        <Stack.Screen name="Health" component={HealthScreen} />
        <Stack.Screen name="ReactionGame" component={ReactionGame} />
        <Stack.Screen name="PoliceGame" component={PoliceGame} />
        <Stack.Screen name="NewsFeed" component={NewsFeed} />
        <Stack.Screen name="Safety" component={Safety} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.95)" : "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
