import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import MaskedView from "@react-native-masked-view/masked-view";

import LoginScreen from "./screens/LoginScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignUpScreen from "./screens/SignUpScreen";
import EmergencyScreen from "./screens/EmergencyScreen";
import LearningScreen from "./screens/LearningScreen";
import CommunityScreen from "./screens/CommunityScreen";
import HomeScreen from "./screens/HomeScreen";
import HealthScreen from "./screens/HealthScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import GeminiChatScreen from "./screens/GeminiChatScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Water Fill Icon
const WaterIcon = ({ name, focused, size }) => {
  const fill = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(focused ? 1 : 0, {
      duration: 600,
      easing: Easing.out(Easing.exp),
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 20 * (1 - fill.value) }],
  }));

  return (
    <MaskedView
      style={{ width: size, height: size }}
      maskElement={<Ionicons name={name} size={size} color="black" />}
    >
      <Animated.View
        style={[{ flex: 1, backgroundColor: "#E91E63" }, animatedStyle]}
      />
      <Ionicons
        name={name}
        size={size}
        color="#ccc"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </MaskedView>
  );
};

// Custom Header
const CustomHeader = ({ title }) => (
  <View style={styles.header}>
    <Image
      source={require("./assets/Logos/Aya_AI_Logo.png")}
      style={styles.logo}
    />
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerIcons}>
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="notifications-outline" size={24} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="settings-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  </View>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <CustomHeader title={route.name} />,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Network":
              iconName = "people";
              break;
            case "SOS":
              iconName = "alert";
              break;
            case "Learning":
              iconName = "book";
              break;
            case "Health":
              iconName = "heart";
              break;
            default:
              iconName = "ellipse";
          }
          return <WaterIcon name={iconName} focused={focused} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Network" component={CommunityScreen} />
      <Tab.Screen name="SOS" component={EmergencyScreen} />
      <Tab.Screen name="Learning" component={LearningScreen} />
      <Tab.Screen name="Health" component={HealthScreen} />
      <Tab.Screen name="Gemini Chat" component={GeminiChatScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Landing" component={MainTabs} />
        <Stack.Screen name="GeminiChat" component={GeminiChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  logo: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  headerIcons: { flexDirection: "row" },
  iconButton: { marginLeft: 15 },
  tabBar: {
    position: "absolute",
    left: 15,
    right: 15,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 10,
  },
});
