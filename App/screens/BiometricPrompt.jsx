import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from '../styles/BiometricPromptStyles';

export default function BiometricPrompt({ onDone }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/face-id.png')}
        style={styles.icon}
      />
      <Text style={styles.title}>Enable Biometric Login</Text>
      <Text style={styles.subtitle}>
        Use Face ID or Fingerprint next time you login
      </Text>

      <TouchableOpacity style={styles.button} onPress={onDone}>
        <Text style={styles.buttonText}>Enable</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDone}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}
