import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Simple test component to isolate navigation issues
function SimpleApp() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🥋 Self-Defense Training App</Text>
          <Text style={styles.subtitle}>Testing basic functionality...</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>✅ App Loading Successfully</Text>
            <Text style={styles.statusText}>✅ SafeAreaView Working</Text>
            <Text style={styles.statusText}>✅ No Runtime Errors</Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF0F1',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    color: '#27AE60',
    marginBottom: 5,
  },
});

export default SimpleApp;