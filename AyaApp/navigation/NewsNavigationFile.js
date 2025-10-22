import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import NewsFeed from "../screens/GBVNews/NewsFeed";
import ArticleScreen from "../screens/GBVNews/ArticleScreen";

const Stack = createStackNavigator();

export default function NewsNavigationFile() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="NewsFeed"
          component={NewsFeed}
          options={{ title: "GBV News" }}
        />
        <Stack.Screen
          name="Article"
          component={ArticleScreen}
          options={{ title: "Read More" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
