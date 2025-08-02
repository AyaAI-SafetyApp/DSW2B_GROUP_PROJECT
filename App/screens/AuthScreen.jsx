import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles/AuthScreenStyles';
import animationData from '../assets/Female Character Waving.json';
import { supabase } from '../lib/supabase';
import { checkUniqueFields } from '../lib/userProfile';

const screenWidth = Dimensions.get('window').width;

export default function AuthScreen({ onSuccess }) {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchView = (view) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      setCurrentView(view);
      // Clear form 
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setIdNumber('');
    }, 200);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }

    // validation for signup
    if (currentView === 'signup') {
      if (!firstName || !lastName || !phoneNumber || !idNumber) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);

    try {
      if (currentView === 'login') {
       
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          Alert.alert('Login Error', error.message);
          return;
        }

        Alert.alert('Success', 'Logged in successfully!');
        onSuccess();
      } else if (currentView === 'signup') {
        
        const uniqueCheck = await checkUniqueFields(phoneNumber, idNumber);
        
        if (!uniqueCheck.isUnique) {
          let errorMessage = 'The following information is already registered:\n';
          if (uniqueCheck.phoneExists) errorMessage += '• Phone number\n';
          if (uniqueCheck.idExists) errorMessage += '• ID number\n';
          errorMessage += '\nPlease use different information or login if you already have an account.';
          
          Alert.alert('Registration Error', errorMessage);
          setLoading(false);
          return;
        }

        // Sign up 
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) {
          Alert.alert('Sign Up Error', error.message);
          return;
        }

       
        if (data.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: data.user.id,
                email: email,
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
                id_number: idNumber,
                created_at: new Date().toISOString(),
              }
            ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            Alert.alert('Warning', 'Account created but profile information could not be saved. Please contact support.');
          }
        }

        Alert.alert(
          'Sign Up Successful',
          'Please check your email for verification link!',
          [
            {
              text: 'OK',
              onPress: () => {
                switchView('login');
              },
            },
          ]
        );
      } else if (currentView === 'forgot') {
        // Reset password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'http://localhost:8081/reset-password',
        });

        if (error) {
          Alert.alert('Reset Error', error.message);
          return;
        }

        Alert.alert(
          'Reset Email Sent',
          'Please check your email for password reset instructions!',
          [
            {
              text: 'OK',
              onPress: () => switchView('login'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <View style={styles.form}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>
      
      <TextInput
        placeholder="Email Address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity 
        style={styles.forgotPasswordButton}
        onPress={() => switchView('forgot')}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => switchView('signup')}
      >
        <Text style={styles.switchText}>
          Don't have an account? <Text style={styles.switchTextBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSignupForm = () => (
    <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today!</Text>
        
        <View style={styles.nameRow}>
          <TextInput
            placeholder="First Name"
            style={[styles.input, styles.halfInput]}
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Last Name"
            style={[styles.input, styles.halfInput]}
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="#999"
          />
        </View>
        
        <TextInput
          placeholder="Phone Number"
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
        
        <TextInput
          placeholder="ID Number"
          style={styles.input}
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        
        <TextInput
          placeholder="Email Address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        
        <TextInput
          placeholder="Password (min. 6 characters)"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
        />
        
        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => switchView('login')}
        >
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderForgotPasswordForm = () => (
    <View style={styles.form}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
      
      <TextInput
        placeholder="Email Address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Reset Email'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => switchView('login')}
      >
        <Text style={styles.switchText}>
          Remember your password? <Text style={styles.switchTextBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#2879f2', '#a155f9']}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <LottieView 
          source={animationData} 
          autoPlay 
          loop 
          style={styles.lottie} 
        />

        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          {currentView === 'login' && renderLoginForm()}
          {currentView === 'signup' && renderSignupForm()}
          {currentView === 'forgot' && renderForgotPasswordForm()}
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
