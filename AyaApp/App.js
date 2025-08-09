import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import EmergencyScreen from "./screens/EmergencyScreen";
// import RoutesScreen from "./screens/RoutesScreen";
import CommunityScreen from "./screens/CommunityScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case "Home":
                iconName = focused ? "home" : "home-outline";
                break;
              case "SOS":
                iconName = focused ? "alert" : "alert-outline";
                break;
              case "Routes":
                iconName = focused ? "map" : "map-outline";
                break;
              case "Community":
                iconName = focused ? "people" : "people-outline";
                break;
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#E91E63",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="SOS" component={EmergencyScreen} />
        <Tab.Screen name="Routes" component={HomeScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
