import React, { useRef, useEffect } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { TABS } from "../constants/tabs";

const { width } = Dimensions.get("window");
const Tab = createBottomTabNavigator();

const AnimatedTabBar = React.memo(({ state, navigation, scrollY }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  // Animate tab bar based on scroll direction
  useEffect(() => {
    if (!scrollY) return;
    let lastOffset = 0;

    const listener = scrollY.addListener(({ value }) => {
      if (value > lastOffset + 5) {
        // Scroll down -> hide
        Animated.spring(translateY, {
          toValue: 100,
          useNativeDriver: true,
        }).start();
      } else if (value < lastOffset - 5) {
        // Scroll up -> show
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
      lastOffset = value;
    });

    return () => scrollY.removeListener(listener);
  }, [scrollY]);

  return (
    <Animated.View style={[styles.tabWrapper, { transform: [{ translateY }] }]}>
      <BlurView
        intensity={Platform.OS === "ios" ? 80 : 30}
        tint="light"
        style={styles.tabBar}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const icon = isFocused
            ? TABS[index].icons.active
            : TABS[index].icons.inactive;

          const handlePress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
            });
            if (!isFocused && !event.defaultPrevented)
              navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={handlePress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                ]}
              >
                <Ionicons
                  name={icon}
                  size={26}
                  color={isFocused ? "#111" : "#777"}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </Animated.View>
  );
});

export default function MainTabs({ scrollY }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <AnimatedTabBar {...props} scrollY={scrollY} />}
    >
      {TABS.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabWrapper: {
    position: "absolute",
    bottom: 20,
    left: width * 0.05,
    right: width * 0.05,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 40,
    overflow: "hidden",
    height: 70,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerActive: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
});
