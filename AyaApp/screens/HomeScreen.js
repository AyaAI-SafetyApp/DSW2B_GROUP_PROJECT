import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const userName = 'User';
  const actions = [
    { name: 'SOS', icon: 'alert-circle', route: 'SOS' },
    { name: 'Routes', icon: 'map', route: 'Routes' },
    { name: 'Community', icon: 'people', route: 'Community' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Aya</Text>
        <Ionicons name="person-circle-outline" size={32} color="#007AFF" />
      </View>
      <Text style={styles.greeting}>Welcome back, {userName}</Text>

      <View style={styles.actionsContainer}>
        {actions.map(action => (
          <TouchableOpacity key={action.name} style={styles.actionButton}>
            <Ionicons name={action.icon} size={28} color="#fff" />
            <Text style={styles.actionText}>{action.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Alerts handled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Safe trips</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  greeting: {
    fontSize: 20,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
});
