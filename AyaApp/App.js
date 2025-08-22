import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

// Import your screens
import HomeScreen from "./screens/HomeScreen";
import CommunityScreen from "./screens/CommunityScreen";
import SOSScreen from "./screens/SosScreen";
import LearningScreen from "./screens/Learning/LearningScreen";
import TherapistScreen from "./screens/TherapistScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Newsfeed") {
              iconName = focused ? "newspaper" : "newspaper-outline";
            } else if (route.name === "SOS") {
              iconName = focused ? "alert-circle" : "alert-circle-outline";
            } else if (route.name === "Learning") {
              iconName = focused ? "book" : "book-outline";
            } else if (route.name === "Therapist") {
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#de0973ff", // Pink when active
          tabBarInactiveTintColor: "gray", // Gray when inactive
          tabBarStyle: {
            backgroundColor: "#fff",
            height: 60,
            paddingBottom: 5,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: "absolute",
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 5,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Newsfeed" component={CommunityScreen} />
        <Tab.Screen name="SOS" component={SOSScreen} />
        <Tab.Screen name="Learning" component={LearningScreen} />
        <Tab.Screen name="Therapist" component={TherapistScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
