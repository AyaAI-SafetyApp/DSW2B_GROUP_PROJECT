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
    StatusBar,
} from 'react-native';
import { Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { checkUniqueFields } from '../lib/userProfile';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AuthScreen({ onSuccess }) {
    const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'forgot'
    const [signupStep, setSignupStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const stepAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, []);

    const switchView = (view) => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            setCurrentView(view);
            setSignupStep(1); // Reset signup step
            // Clear form fields
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setPhoneNumber('');
            setIdNumber('');
            setShowPassword(false);
            setShowConfirmPassword(false);
        }, 150);
    };

    const nextSignupStep = () => {
        // Validate current step
        if (signupStep === 1) {
            if (!firstName.trim() || !lastName.trim()) {
                Alert.alert('Error', 'Please enter your first and last name');
                return;
            }
        } else if (signupStep === 2) {
            if (!phoneNumber.trim() || !idNumber.trim()) {
                Alert.alert('Error', 'Please enter your phone number and ID number');
                return;
            }
        }

        // Animate to next step
        Animated.sequence([
            Animated.timing(stepAnim, {
                toValue: -1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(stepAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            setSignupStep(signupStep + 1);
        }, 200);
    };

    const prevSignupStep = () => {
        Animated.sequence([
            Animated.timing(stepAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(stepAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            setSignupStep(signupStep - 1);
        }, 200);
    };

    const handleSocialLogin = (provider) => {
        Alert.alert(
            'Social Login',
            `${provider} login will be implemented soon!`,
            [{ text: 'OK' }]
        );
    };

    const handleSubmit = async () => {
        if (currentView === 'login') {
            if (!email || !password) {
                Alert.alert('Error', 'Please fill in email and password');
                return;
            }
        } else if (currentView === 'signup') {
            // Final validation for signup
            if (!email || !password || !confirmPassword) {
                Alert.alert('Error', 'Please fill in all password fields');
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
        } else if (currentView === 'forgot') {
            if (!email) {
                Alert.alert('Error', 'Please enter your email address');
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
                            onPress: () => switchView('login'),
                        },
                    ]
                );
            } else if (currentView === 'forgot') {
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

    const SocialLoginButton = ({ provider, icon, color, onPress }) => (
        <TouchableOpacity
            style={[styles.socialButton, { borderColor: color }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image source={{ uri: 'https://example.com/logo.png' }} />

            <Text style={[styles.socialButtonText, { color }]}>{provider}</Text>
        </TouchableOpacity>
    );

    const CustomInput = ({
        placeholder,
        value,
        onChangeText,
        secureTextEntry = false,
        keyboardType = 'default',
        autoCapitalize = 'sentences',
        showToggle = false,
        isPasswordVisible = false,
        onTogglePassword,
        style = {}
    }) => (
        <View style={[styles.inputContainer, style]}>
            <TextInput
                placeholder={placeholder}
                style={styles.textInput}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !isPasswordVisible}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                placeholderTextColor="#9CA3AF"
            />
            {showToggle && (
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={onTogglePassword}
                >
                    <Image source={{ uri: 'https://example.com/logo.png' }} />

                </TouchableOpacity>
            )}
        </View>
    );

    const ProgressIndicator = ({ currentStep, totalSteps }) => (
        <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
                <View key={index} style={styles.progressDotContainer}>
                    <View
                        style={[
                            styles.progressDot,
                            index + 1 <= currentStep ? styles.progressDotActive : styles.progressDotInactive
                        ]}
                    />
                    {index < totalSteps - 1 && (
                        <View
                            style={[
                                styles.progressLine,
                                index + 1 < currentStep ? styles.progressLineActive : styles.progressLineInactive
                            ]}
                        />
                    )}
                </View>
            ))}
        </View>
    );

    const renderLoginForm = () => (
        <Animated.View style={[styles.formContent, { opacity: fadeAnim }]}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
                <View style={styles.logoPlaceholder}>
                    <Image source={{ uri: 'https://site.rapdasa.org/wp-content/uploads/2016/12/UJ-logo-1.jpg' }} />

                </View>
                <Text style={styles.appName}>SOS APP</Text>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.subtitleText}>Sign in to continue</Text>
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
                <SocialLoginButton
                    provider="Google"
                    icon="logo-google"
                    color="#DB4437"
                    onPress={() => handleSocialLogin('Google')}
                />
                <SocialLoginButton
                    provider="Facebook"
                    icon="logo-facebook"
                    color="#4267B2"
                    onPress={() => handleSocialLogin('Facebook')}
                />
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* Email and Password Inputs */}
            <View style={styles.inputSection}>
                <CustomInput
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <CustomInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    showToggle={true}
                    isPasswordVisible={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                />

                <TouchableOpacity
                    style={styles.forgotButton}
                    onPress={() => switchView('forgot')}
                >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </Text>
            </TouchableOpacity>

            {/* Switch to Sign Up */}
            <TouchableOpacity
                style={styles.switchViewButton}
                onPress={() => switchView('signup')}
            >
                <Text style={styles.switchViewText}>
                    Don't have an account? <Text style={styles.switchViewTextBold}>Sign up</Text>
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderSignupStep1 = () => (
        <Animated.View style={[styles.stepContainer, {
            opacity: fadeAnim,
            transform: [{
                translateX: stepAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-screenWidth, 0, screenWidth],
                })
            }]
        }]}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Let's get started!</Text>
                <Text style={styles.stepSubtitle}>Tell us your name</Text>
            </View>

            <View style={styles.inputSection}>
                <CustomInput
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                />
                <CustomInput
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                />
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={nextSignupStep}
                activeOpacity={0.8}
            >
                <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.switchViewButton}
                onPress={() => switchView('login')}
            >
                <Text style={styles.switchViewText}>
                    Already have an account? <Text style={styles.switchViewTextBold}>Sign in</Text>
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderSignupStep2 = () => (
        <Animated.View style={[styles.stepContainer, {
            opacity: fadeAnim,
            transform: [{
                translateX: stepAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-screenWidth, 0, screenWidth],
                })
            }]
        }]}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Contact details</Text>
                <Text style={styles.stepSubtitle}>We need your phone and ID number</Text>
            </View>

            <View style={styles.inputSection}>
                <CustomInput
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />
                <CustomInput
                    placeholder="ID number"
                    value={idNumber}
                    onChangeText={setIdNumber}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.stepButtonContainer}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={prevSignupStep}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, styles.flexButton]}
                    onPress={nextSignupStep}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderSignupStep3 = () => (
        <Animated.View style={[styles.stepContainer, {
            opacity: fadeAnim,
            transform: [{
                translateX: stepAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-screenWidth, 0, screenWidth],
                })
            }]
        }]}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Almost done!</Text>
                <Text style={styles.stepSubtitle}>Create your login credentials</Text>
            </View>

            <View style={styles.inputSection}>
                <CustomInput
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <CustomInput
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    showToggle={true}
                    isPasswordVisible={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                />
                <CustomInput
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    showToggle={true}
                    isPasswordVisible={showConfirmPassword}
                    onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />
            </View>

            <View style={styles.stepButtonContainer}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={prevSignupStep}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, styles.flexButton, loading && styles.primaryButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderSignupForm = () => (
        <Animated.View style={[styles.formContent, { opacity: fadeAnim }]}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
                <View style={styles.logoPlaceholder}>
                    <Image source={{ uri: 'https://example.com/logo.png' }} />

                </View>
                <Text style={styles.appName}>YourApp</Text>
            </View>

            {/* Progress Indicator */}
            <ProgressIndicator currentStep={signupStep} totalSteps={3} />

            {/* Step Content */}
            <View style={styles.stepContentContainer}>
                {signupStep === 1 && renderSignupStep1()}
                {signupStep === 2 && renderSignupStep2()}
                {signupStep === 3 && renderSignupStep3()}
            </View>
        </Animated.View>
    );

    const renderForgotPasswordForm = () => (
        <Animated.View style={[styles.formContent, { opacity: fadeAnim }]}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
                <View style={styles.logoPlaceholder}>
                    <Image source={{ uri: 'https://example.com/logo.png' }} />
                </View>
                <Text style={styles.appName}>YourApp</Text>
                <Text style={styles.welcomeText}>Reset Password</Text>
                <Text style={styles.subtitleText}>Enter your email to receive reset instructions</Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputSection}>
                <CustomInput
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            {/* Send Reset Button */}
            <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Text style={styles.primaryButtonText}>
                    {loading ? 'Sending...' : 'Send Reset Email'}
                </Text>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
                style={styles.switchViewButton}
                onPress={() => switchView('login')}
            >
                <Text style={styles.switchViewText}>
                    Remember your password? <Text style={styles.switchViewTextBold}>Sign in</Text>
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[
                            styles.mainContainer,
                            {
                                transform: [{
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                    })
                                }]
                            }
                        ]}
                    >
                        {currentView === 'login' && renderLoginForm()}
                        {currentView === 'signup' && renderSignupForm()}
                        {currentView === 'forgot' && renderForgotPasswordForm()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        minHeight: screenHeight,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    formContent: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 40,
        minHeight: screenHeight - 80,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    inputSection: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 15,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    primaryButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        flex: 0.3,
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    flexButton: {
        flex: 0.65,
    },
    switchViewButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    switchViewText: {
        fontSize: 16,
        color: '#6B7280',
    },
    switchViewTextBold: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    // Progress Indicator Styles
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 40,
    },
    progressDotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    progressDotActive: {
        backgroundColor: '#3B82F6',
    },
    progressDotInactive: {
        backgroundColor: '#E5E7EB',
    },
    progressLine: {
        width: 40,
        height: 2,
        marginHorizontal: 8,
    },
    progressLineActive: {
        backgroundColor: '#3B82F6',
    },
    progressLineInactive: {
        backgroundColor: '#E5E7EB',
    },
    // Step Styles
    stepContentContainer: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    stepButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
};