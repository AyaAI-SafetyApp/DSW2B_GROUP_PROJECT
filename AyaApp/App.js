import React from "react";
import { StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// Screens
import HomeScreen from "./screens/HomeScreen";
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
import ProfileScreen from "./screens/UserProfile/ProfileScreen.js";

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
  const scrollY = useSharedValue(0);
  const lastOffset = useSharedValue(0);
  const tabVisible = useSharedValue(true);

  const PremiumTabBar = ({ state, descriptors, navigation }) => {
    const tabBarStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: tabVisible.value ? withTiming(0) : withTiming(100) },
      ],
    }));

    return (
      <Animated.View style={[styles.tabBar, tabBarStyle]}>
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
            <Ionicons.Button
              key={route.key}
              name={
                isFocused
                  ? TABS[index].icons.active
                  : TABS[index].icons.inactive
              }
              size={28}
              color={isFocused ? COLORS.ACTIVE : COLORS.INACTIVE}
              backgroundColor="transparent"
              underlayColor="transparent"
              onPress={onPress}
              style={styles.tabItem}
            />
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
        <Tab.Screen key={tab.name} name={tab.name}>
          {(props) => (
            <tab.component
              {...props}
              scrollY={scrollY}
              lastOffset={lastOffset}
              tabVisible={tabVisible}
            />
          )}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="MainTabs"
      >
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
