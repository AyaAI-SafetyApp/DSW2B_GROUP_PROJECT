import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <ImageBackground
      source={require('../assets/Welcome.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.bottomContent}>
          <Text style={styles.title}>
            Welcome to Aya
          </Text>

          <TouchableOpacity style={styles.signUpButton} onPress={()=> navigation.navigate('Onboarding')}>
            <Text style={styles.signUpText}>
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end', 
    alignItems: 'center',
    paddingBottom: 50,
    gap: 20 
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 32,
    textAlign: 'center'
  },
  signUpButton: {
    paddingVertical: 12,
    backgroundColor: '#ada1e6',
    borderRadius: 12,
    width: 320,
  },
  signUpText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff'
  },
});
