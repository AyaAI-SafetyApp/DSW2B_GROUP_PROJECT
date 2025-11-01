import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';

export default function ReactivateAccountScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Generate random 6-digit code
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Start resend cooldown timer
  const startCooldown = () => {
    setResendCooldown(60); // 60 seconds cooldown
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async (isResend = false) => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);

      // Check if account exists and is deactivated
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('email, is_active, full_name')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (profileError) {
        console.error('Profile check error:', profileError);
        Alert.alert('Error', 'Failed to check account status');
        return;
      }

      if (!profile) {
        Alert.alert('Error', 'No account found with this email address');
        return;
      }

      if (profile.is_active === true) {
        Alert.alert(
          'Account Active',
          'Your account is already active. You can login normally.',
          [{ text: 'Go to Login', onPress: () => navigation.navigate('LoginScreen') }]
        );
        return;
      }

      // If resending, invalidate all previous unused codes for this email
      if (isResend) {
        await supabase
          .from('reactivation_codes')
          .update({ is_used: true })
          .eq('user_email', email.toLowerCase())
          .eq('is_used', false);
        
        console.log('♻️ Previous codes invalidated for resend');
      }

      // Generate reactivation code
      const reactivationCode = generateCode();

      // Save code to database
      const { error: codeError } = await supabase
        .from('reactivation_codes')
        .insert([
          {
            user_email: email.toLowerCase(),
            code: reactivationCode,
            is_used: false,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          },
        ]);

      if (codeError) {
        console.error('Code save error:', codeError);
        Alert.alert('Error', 'Failed to generate reactivation code');
        return;
      }

      // Send reactivation code via email using Supabase Edge Function
      try {
        // Get email from the profile or use the entered email
        const emailToUse = profile.email || email.toLowerCase();
        
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('dynamic-api', {
          body: {
            email: emailToUse,
            code: reactivationCode,
            userName: profile.full_name || profile.name || 'User',
            isReactivation: true,
          },
        });

        if (emailError || !emailResult?.success) {
          console.warn('⚠️ Email sending failed:', emailError || emailResult?.error);
          // Still show the code in development mode if email fails
          Alert.alert(
            'Code Generated',
            `Email service unavailable. Here's your code:\n\n${reactivationCode}\n\nDeploy the Supabase Edge Function to enable emails.`,
            [{ text: 'OK' }]
          );
        } else {
          console.log('✅ Reactivation email sent successfully');
          Alert.alert(
            isResend ? 'New Code Sent' : 'Code Sent',
            isResend 
              ? `A new 6-digit code has been sent to ${email}.\n\n⚠️ Previous codes are now invalid.`
              : `A 6-digit reactivation code has been sent to ${email}.\n\nPlease check your email (including spam folder).`,
            [{ text: 'OK' }]
          );
        }
      } catch (emailError) {
        console.error('❌ Email service error:', emailError);
        // Fallback: show code in alert for development
        Alert.alert(
          'Code Generated',
          `⚠️ Email service unavailable.\n\nDevelopment Mode - Your code: ${reactivationCode}`,
          [{ text: 'OK' }]
        );
      }

      // Start cooldown timer to prevent spam
      startCooldown();
      
      setStep(2);
    } catch (error) {
      console.error('Send code error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    try {
      setLoading(true);

      // Verify code
      const { data: codeRecord, error: codeError } = await supabase
        .from('reactivation_codes')
        .select('*')
        .eq('user_email', email.toLowerCase())
        .eq('code', code)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (codeError) {
        console.error('Code verification error:', codeError);
        Alert.alert('Error', 'Failed to verify code');
        return;
      }

      if (!codeRecord) {
        Alert.alert('Invalid Code', 'The code is invalid or has expired. Please request a new code.');
        return;
      }

      // Mark code as used
      const { error: updateCodeError } = await supabase
        .from('reactivation_codes')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq('id', codeRecord.id);

      if (updateCodeError) {
        console.error('Update code error:', updateCodeError);
      }

      // Reactivate the account
      const { error: reactivateError } = await supabase
        .from('user_profiles')
        .update({
          is_active: true,
          deactivated_at: null,
          last_login_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase());

      if (reactivateError) {
        console.error('Reactivation error:', reactivateError);
        Alert.alert('Error', 'Failed to reactivate account');
        return;
      }

      Alert.alert(
        'Success',
        'Your account has been reactivated! You can now login.',
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.navigate('LoginScreen'),
          },
        ]
      );
    } catch (error) {
      console.error('Verify code error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reactivate Account</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="refresh-circle" size={80} color="#FFFFFF" />
            </View>

            {step === 1 ? (
              <>
                <Text style={styles.title}>Reactivate Your Account</Text>
                <Text style={styles.subtitle}>
                  Enter your email address to receive a reactivation code
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Send Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Enter Verification Code</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit code to{'\n'}
                  {email}
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#9CA3AF"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Reactivate</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setStep(1)}
                  disabled={loading}
                >
                  <Text style={styles.linkText}>Use different email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.linkButton, resendCooldown > 0 && styles.disabledLink]}
                  onPress={() => handleSendCode(true)}
                  disabled={loading || resendCooldown > 0}
                >
                  <Text style={[styles.linkText, resendCooldown > 0 && styles.disabledText]}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disabledLink: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
    textDecorationLine: 'none',
  },
});
