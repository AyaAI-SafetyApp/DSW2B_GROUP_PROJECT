import 'react-native-get-random-values';
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  Animated,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { encryptData } from "../../utils/encryption"; // <-- added import

const TOTAL_STEPS = 3;
const PRIMARY_COLOR = "#DE0973";
const GREY_COLOR = "#C4C4C4";
const SCREEN_WIDTH = Dimensions.get("window").width;
const MINIMUM_AGE = 13; 

export default function PremiumMultiStepForm() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userID, initialFullName, userEmail } = route.params;

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(initialFullName || "");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const ayaBounceAnim = useRef(new Animated.Value(0)).current;
  const stepCheckAnims = useRef([...Array(TOTAL_STEPS)].map(() => new Animated.Value(0))).current;
  const locationTimeoutRef = useRef(null);

  const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

  // ---------- Aya logo bounce ----------
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ayaBounceAnim, { toValue: -8, duration: 500, useNativeDriver: true }),
        Animated.timing(ayaBounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ---------- Clear gender errors ----------
  useEffect(() => {
    if (gender && step === 2) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors.gender;
        return newErrors;
      });
    }
  }, [gender, step]);

  // ---------- Image Upload with Remove Functionality ----------
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
      await AsyncStorage.setItem("profilePic", uri);
    }
  };

  const removeImage = async () => {
    setProfilePic(null);
    await AsyncStorage.removeItem("profilePic");
  };

  useEffect(() => {
    const loadCachedImage = async () => {
      const cached = await AsyncStorage.getItem("profilePic");
      if (cached) setProfilePic(cached);
    };
    loadCachedImage();
  }, []);

  // ---------- Comprehensive South Africa Location Search ----------
  const fetchLocationSuggestions = async (input) => {
    if (!input || input.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setLoadingLocations(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=za&featureType=city,town,village,suburb&limit=15&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('OpenStreetMap API Response:', data);
      
      if (data && data.length > 0) {
        const suggestions = data.map((place, index) => {
          const address = place.address;
          let mainText = place.name || place.display_name?.split(',')[0] || 'Unknown Location';
          let secondaryText = '';
          
          const locationParts = [];
          if (address?.city) locationParts.push(address.city);
          if (address?.town) locationParts.push(address.town);
          if (address?.village) locationParts.push(address.village);
          if (address?.suburb) locationParts.push(address.suburb);
          if (address?.state) locationParts.push(address.state);
          if (address?.country) locationParts.push(address.country);
          
          secondaryText = locationParts.join(', ');
          
          if (!secondaryText && place.display_name) {
            const parts = place.display_name.split(',');
            secondaryText = parts.slice(1, Math.min(3, parts.length)).join(',').trim();
          }
          
          return {
            id: place.place_id || `location-${index}-${Date.now()}`,
            description: place.display_name,
            mainText: mainText,
            secondaryText: secondaryText,
            type: place.type,
            importance: place.importance
          };
        });
      
        suggestions.sort((a, b) => (b.importance || 0) - (a.importance || 0));
        setLocationSuggestions(suggestions);
      } else {
        await fetchBroaderLocationSuggestions(input);
      }
    } catch (err) {
      console.log("Location fetch error:", err);
      await fetchBroaderLocationSuggestions(input);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchBroaderLocationSuggestions = async (input) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}+South+Africa&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const suggestions = data.map((place, index) => ({
            id: place.place_id || `location-${index}-${Date.now()}`,
            description: place.display_name,
            mainText: place.name || place.display_name?.split(',')[0] || 'Location',
            secondaryText: place.display_name?.split(',').slice(1, 3).join(',').trim() || 'South Africa',
            type: place.type
          }));
          setLocationSuggestions(suggestions);
        } else {
          setLocationSuggestions([]);
        }
      }
    } catch (error) {
      console.log("Broader location search error:", error);
      setLocationSuggestions([]);
    }
  };

  const handleLocationChange = (text) => {
    setLocation(text);
    if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
    locationTimeoutRef.current = setTimeout(() => fetchLocationSuggestions(text), 400);
  };

  const selectLocation = (place) => {
    setLocation(place.description);
    setLocationSuggestions([]);
  };

  useEffect(() => {
    return () => {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
    };
  }, []);

  // ---------- Detect Current Location ----------
  const detectCurrentLocation = async () => {
    try {
      setGettingCurrentLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied.");
        setGettingCurrentLocation(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = current.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setLocation(data.display_name);
          setLocationSuggestions([]);
        } else {
          setLocation(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        }
      }
    } catch (error) {
      console.log("Geolocation error:", error);
      alert("Unable to fetch your current location. Please check your internet connection.");
    } finally {
      setGettingCurrentLocation(false);
    }
  };

  // ---------- Validation ----------
  const validateStep = () => {
    const newErrors = {};

    if (step === 0) {
      if (!fullName.trim()) newErrors.fullName = "Full name required";
      if (!username.trim()) newErrors.username = "Username required";
      else if (username.trim().length < 3)
        newErrors.username = "Username must be at least 3 characters";
    }

    if (step === 1) {
      const saPhoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
      if (!phone.trim()) newErrors.phone = "Phone required";
      else if (!saPhoneRegex.test(phone.trim().replace(/\s/g, "")))
        newErrors.phone = "Please enter a valid South African phone number";

      if (!location.trim()) newErrors.location = "Location required";
      if (!age.trim()) newErrors.age = "Age required";
      else if (isNaN(age) || parseInt(age) < MINIMUM_AGE)
        newErrors.age = `Must be ${MINIMUM_AGE} years or older`;
    }

    if (step === 2) {
      if (!gender) newErrors.gender = "Please select gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepFilled = () => {
    if (step === 0) return fullName.trim() && username.trim();
    if (step === 1) return phone.trim() && location.trim() && age.trim();
    if (step === 2) return gender;
    return false;
  };

  // ---------- Age Verification ----------
  const verifyAgeAndProceed = () => {
    const userAge = parseInt(age);
    if (isNaN(userAge) || userAge < MINIMUM_AGE) {
      Alert.alert(
        "Age Restriction",
        `You must be ${MINIMUM_AGE} years or older to use this app.`,
        [
          {
            text: "Exit App",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "AgeRestriction" }]
              });
            },
            style: "destructive"
          }
        ]
      );
      return false;
    }
    return true;
  };

  // ---------- Step Animations ----------
  const animateTransition = (direction = 1) => {
    slideAnim.setValue(direction * SCREEN_WIDTH);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = () => {
    if (validateStep()) {
      // Check age when moving from step 1 to step 2
      if (step === 1 && !verifyAgeAndProceed()) {
        return; // Stop navigation if age verification fails
      }
      
      animateStepCompletion(step);
      if (step < TOTAL_STEPS - 1) {
        setStep(step + 1);
        Animated.timing(progressAnim, {
          toValue: (step + 1) / TOTAL_STEPS,
          duration: 300,
          useNativeDriver: false,
        }).start();
        animateTransition(1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      Animated.timing(progressAnim, {
        toValue: (step - 1) / TOTAL_STEPS,
        duration: 300,
        useNativeDriver: false,
      }).start();
      animateTransition(-1);
      setErrors({});
    } else {
      navigation.navigate("CreateCredential");
    }
  };

  const animateStepCompletion = (stepIndex) => {
    Animated.timing(stepCheckAnims[stepIndex], {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    // Final age verification before submission
    if (!verifyAgeAndProceed()) {
      return;
    }
    
    setLoading(true);
    try {
      // Plain object for local/session usage
      const accountData = { fullName, username, age, gender, phone, location, profilePic };

      // Encrypt selected sensitive fields before sending to backend and Supabase
      const encryptedAccount = {
        // keep username, age, gender unencrypted for app logic / uniqueness constraints
        username,
        age: parseInt(age),
        gender,
        // encrypt user-entered sensitive fields
        fullName: fullName,
        phone: encryptData(phone),
        location: encryptData(location),
        profilePic: profilePic ? encryptData(profilePic) : null,
      };

      // Send encrypted payload to your backend API
      await axios.post(`https://dsw2b-backend.onrender.com/account`, {
        userID,
        account: encryptedAccount,
      });

      // Save to Supabase (encrypt fields as well) — profileService will store values you pass
      const { saveUserProfile } = require('../../lib/profileService');
      const savedProfile = await saveUserProfile({
        userId: userID,
        email: userID,
        fullName: encryptedAccount.fullName, // encrypted
        username: username, // kept plaintext for lookup/display (change if you want encrypted)
        phone: encryptedAccount.phone, // encrypted
        location: encryptedAccount.location, // encrypted
        age: encryptedAccount.age,
        gender: encryptedAccount.gender,
        profilePicUri: encryptedAccount.profilePic,
        provider: 'email'
      });

      // Create and save user session (store readable values locally)
      const userData = {
        email: userID,
        userId: userID,
        name: fullName,
        provider: 'email',
        loginTime: new Date().toISOString(),
        fullName: fullName,
        phone: phone,
        location: location,
        age: age,
        gender: gender,
        profilePicture: savedProfile?.profile_picture_url || null,
        username: username,
      };
      
      console.log('💾 Saving session after profile creation:', userData);
      await AsyncStorage.setItem("@user_session", JSON.stringify(userData));
      
      animateStepCompletion(step);
      // Navigate to passkey creation first (before subscription)
      navigation.navigate("CreateCredential", { 
        userID,
        initialFullName: fullName,
        userEmail: userEmail
      });
    } catch (err) {
      console.error('Account creation error:', err);
      setErrors({ submit: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render Step Icons and Progress Bar ----------
  const renderStepIcons = () => {
    const icons = [
      <Ionicons name="person" size={20} color="#fff" />,
      <Ionicons name="call" size={20} color="#fff" />,
      <Ionicons name="male" size={20} color="#fff" />,
    ];
    
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingHorizontal: 24 }}>
        {icons.map((icon, index) => (
          <View key={index} style={{ alignItems: "center", flex: 1 }}>
            <Animated.View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: stepCheckAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [GREY_COLOR, PRIMARY_COLOR]
                }),
              }}
            >
              {stepCheckAnims[index].__getValue() === 1 ? 
                <Ionicons name="checkmark" size={20} color="#fff" /> : icon
              }
            </Animated.View>
            <Text style={{ marginTop: 8, fontSize: 12, color: step === index ? PRIMARY_COLOR : GREY_COLOR }}>
              {index === 0 ? 'Profile' : index === 1 ? 'Details' : 'Gender'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderProgressBar = () => (
    <View style={{ height: 6, backgroundColor: "#E5E5E5", borderRadius: 3, marginHorizontal: 24, marginBottom: 24 }}>
      <Animated.View
        style={{
          height: "100%",
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"]
          }),
          backgroundColor: PRIMARY_COLOR,
          borderRadius: 3,
        }}
      />
    </View>
  );

  // ---------- Render Location Suggestions ----------
  const renderLocationSuggestions = () => {
    if (loadingLocations) {
      return (
        <View style={styles.suggestionItem}>
          <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          <Text style={styles.suggestionLoadingText}>Searching locations in South Africa...</Text>
        </View>
      );
    }

    if (locationSuggestions.length > 0) {
      return (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>
            Locations in South Africa ({locationSuggestions.length})
          </Text>
          <FlatList
            data={locationSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => selectLocation(item)}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  pressed && styles.suggestionItemPressed,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={PRIMARY_COLOR}
                  style={{ marginRight: 10 }}
                />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMainText}>{item.mainText}</Text>
                  {item.secondaryText ? (
                    <Text style={styles.suggestionSecondaryText}>
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: 250 }}
            showsVerticalScrollIndicator={true}
          />
        </View>
      );
    }

    return null;
  };

  // ---------- Render Profile Picture with Remove Option ----------
  const renderProfilePicture = () => (
    <View style={styles.profileContainer}>
      <Pressable onPress={pickImage}>
        {profilePic ? (
          <View style={styles.profilePicContainer}>
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
            <Pressable style={styles.removeImageButton} onPress={removeImage}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.profilePlaceholder}>
            <MaterialIcons name="camera-alt" size={30} color="#C4C4C4" />
            <Text style={{ color: "#C4C4C4", marginTop: 4 }}>Upload Photo</Text>
          </View>
        )}
      </Pressable>
    </View>
  );

  // ---------- Render Step Content ----------
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            {renderProfilePicture()}

            <View style={styles.inputWithIcon}>
              <Ionicons name="person-outline" size={20} color="#C4C4C4" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholderTextColor="#999"
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            <View style={styles.inputWithIcon}>
              <FontAwesome5 name="user-alt" size={20} color="#C4C4C4" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={[styles.input, errors.username && styles.inputError]}
                placeholderTextColor="#999"
              />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </>
        );

      case 1:
        return (
          <>
            <View style={styles.inputWithIcon}>
              <Ionicons name="call-outline" size={20} color="#C4C4C4" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Phone (e.g., 0831234567 or +27831234567)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[styles.input, errors.phone && styles.inputError]}
                placeholderTextColor="#999"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {/* Location input with 'Use My Location' button */}
            <View style={styles.locationContainer}>
              <View style={[styles.inputWithIcon, { flex: 1, marginBottom: 0 }]}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#C4C4C4"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="Search locations in South Africa..."
                  value={location}
                  onChangeText={handleLocationChange}
                  style={[styles.input, errors.location && styles.inputError]}
                  autoCapitalize="words"
                  placeholderTextColor="#999"
                />
              </View>

              <Pressable
                onPress={detectCurrentLocation}
                style={({ pressed }) => [
                  styles.locationButton,
                  pressed && styles.locationButtonPressed,
                  gettingCurrentLocation && styles.locationButtonDisabled
                ]}
                disabled={gettingCurrentLocation}
              >
                {gettingCurrentLocation ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="locate" size={20} color="#fff" />
                )}
              </Pressable>
            </View>

            {renderLocationSuggestions()}
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

            <View style={styles.inputWithIcon}>
              <Ionicons name="calendar-outline" size={20} color="#C4C4C4" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={[styles.input, errors.age && styles.inputError]}
                placeholderTextColor="#999"
              />
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.sectionTitle}>Select Gender</Text>
            <View style={styles.genderGrid}>
              {/* First Row */}
              <View style={styles.genderRow}>
                <Pressable
                  style={[styles.genderOption, gender === "Male" && styles.genderOptionSelected]}
                  onPress={() => setGender("Male")}
                >
                  <Text style={[styles.genderOptionText, gender === "Male" && styles.genderOptionTextSelected]}>
                    Male
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.genderOption, gender === "Female" && styles.genderOptionSelected]}
                  onPress={() => setGender("Female")}
                >
                  <Text style={[styles.genderOptionText, gender === "Female" && styles.genderOptionTextSelected]}>
                    Female
                  </Text>
                </Pressable>
              </View>
              
              {/* Second Row */}
              <View style={styles.genderRow}>
                <Pressable
                  style={[styles.genderOption, gender === "Non-binary" && styles.genderOptionSelected]}
                  onPress={() => setGender("Non-binary")}
                >
                  <Text style={[styles.genderOptionText, gender === "Non-binary" && styles.genderOptionTextSelected]}>
                    Non-binary
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.genderOption, gender === "Prefer not to say" && styles.genderOptionSelected]}
                  onPress={() => setGender("Prefer not to say")}
                >
                  <Text style={[styles.genderOptionText, gender === "Prefer not to say" && styles.genderOptionTextSelected]}>
                    Prefer not to say
                  </Text>
                </Pressable>
              </View>
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "ios" ? 50 : 20 }}>
      <Animated.View style={{ transform: [{ translateY: ayaBounceAnim }], alignItems: "center", marginBottom: 16 }}>
        <Image source={require("../../assets/Logos/Aya_AI_Logo.png")} style={{ width: 80, height: 80 }} />
      </Animated.View>

      {/* Step Icons and Progress Bar */}
      {renderStepIcons()}
      {renderProgressBar()}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
            {renderStepContent()}
          </Animated.View>

          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.navButton, styles.backButton]} 
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>

            <Pressable
              style={[
                styles.navButton, 
                styles.nextButton, 
                { backgroundColor: isStepFilled() ? PRIMARY_COLOR : GREY_COLOR }
              ]}
              onPress={step === TOTAL_STEPS - 1 ? handleSubmit : handleNext}
              disabled={loading || !isStepFilled()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons 
                  name={step === TOTAL_STEPS - 1 ? "checkmark" : "arrow-forward"} 
                  size={24} 
                  color="#fff" 
                />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  profileContainer: { 
    alignSelf: "center", 
    marginVertical: 20,
    alignItems: 'center'
  },
  profilePicContainer: {
    position: 'relative',
  },
  profilePic: { 
    width: 120, 
    height: 120, 
    borderRadius: 60,
    borderWidth: 3,
    borderColor: PRIMARY_COLOR
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#C4C4C4",
    borderStyle: 'dashed',
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F9F9F9'
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  input: { 
    flex: 1, 
    fontSize: 16,
    color: "#1C1C1E",
    padding: 0,
  },
  inputError: { 
    borderColor: "#FF3B30",
    backgroundColor: '#FFF5F5'
  },
  errorText: { 
    color: "#FF3B30", 
    marginTop: -10, 
    marginBottom: 16,
    fontSize: 13,
    marginLeft: 8,
  },
  sectionTitle: { 
    fontWeight: "600", 
    marginBottom: 16, 
    fontSize: 18,
    color: "#1C1C1E",
  },
  genderGrid: { 
    flexDirection: "column",
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  genderOption: {
    flex: 1,
    height: 60,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginHorizontal: 4,
  },
  genderOptionSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  genderOptionText: { 
    color: "#1C1C1E", 
    fontSize: 16,
    fontWeight: "500",
    textAlign: 'center',
  },
  genderOptionTextSelected: { 
    color: "#FFFFFF", 
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    alignItems: "center",
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  nextButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  locationButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }]
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    maxHeight: 250,
    overflow: 'hidden',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionItemPressed: {
    backgroundColor: "#f8f8f8",
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '500',
    color: "#1C1C1E",
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: "#666666",
  },
  suggestionLoadingText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
});