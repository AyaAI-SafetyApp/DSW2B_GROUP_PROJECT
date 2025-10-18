import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// Ionicons removed. Use emoji for tab icons.
import { View, StyleSheet, Text } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import LessonSelectionScreen from '../screens/LessonSelectionScreen';
import ComputerVisionModeScreen from '../screens/ComputerVisionModeScreen';
import ARVRModeScreen from '../screens/ARVRModeScreen';
import ProgressDashboardScreen from '../screens/ProgressDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Lesson Modes
function LessonStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2C3E50' },
        headerTintColor: '#ECF0F1',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Stack.Screen 
        name="LessonSelection" 
        component={LessonSelectionScreen}
        options={{ title: 'Self-Defense Lessons' }}
      />
      <Stack.Screen 
        name="ComputerVisionMode" 
        component={ComputerVisionModeScreen}
        options={{ title: 'CV Training Mode' }}
      />
      <Stack.Screen 
        name="ARVRMode" 
        component={ARVRModeScreen}
        options={{ title: 'AR/VR Training Mode' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let emoji = '❓';
            if (route.name === 'Home') {
              emoji = '🏠';
            } else if (route.name === 'Lessons') {
              emoji = '📚';
            } else if (route.name === 'Progress') {
              emoji = '📈';
            } else if (route.name === 'Profile') {
              emoji = '👤';
            }
            return (
              <View style={styles.iconContainer}>
                <Text style={{ fontSize: size }}>
                  {emoji}
                </Text>
              </View>
            );
          },
          tabBarActiveTintColor: '#E74C3C',
          tabBarInactiveTintColor: '#7F8C8D',
          tabBarStyle: {
            backgroundColor: '#34495E',
            borderTopColor: '#2C3E50',
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen 
          name="Lessons" 
          component={LessonStack}
          options={{ tabBarLabel: 'Lessons' }}
        />
        <Tab.Screen 
          name="Progress" 
          component={ProgressDashboardScreen}
          options={{ tabBarLabel: 'Progress' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ tabBarLabel: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppNavigator;