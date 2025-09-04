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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const GOOGLE_API_KEY = "YOUR_GOOGLE_PLACES_API_KEY";
const TOTAL_STEPS = 3;
const PRIMARY_COLOR = "#DE0973";
const GREY_COLOR = "#C4C4C4";
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PremiumMultiStepForm() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userID } = route.params;

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const ayaBounceAnim = useRef(new Animated.Value(0)).current;

  const stepCheckAnims = useRef(
    [...Array(TOTAL_STEPS)].map(() => new Animated.Value(0))
  ).current;
  const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

  // ---------------- Aya logo bounce ----------------
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ayaBounceAnim, {
          toValue: -8,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(ayaBounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ---------------- Image Upload ----------------
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

  useEffect(() => {
    const loadCachedImage = async () => {
      const cached = await AsyncStorage.getItem("profilePic");
      if (cached) setProfilePic(cached);
    };
    loadCachedImage();
  }, []);

  // ---------------- Google Places Autocomplete ----------------
  const fetchLocationSuggestions = async (input) => {
    if (!input) return setLocationSuggestions([]);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&types=(cities)&components=country:za&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.predictions)
        setLocationSuggestions(data.predictions.map((p) => p.description));
    } catch (err) {
      console.log(err);
    }
  };

  const handleLocationChange = (text) => {
    setLocation(text);
    fetchLocationSuggestions(text);
  };

  const selectLocation = (place) => {
    setLocation(place);
    setLocationSuggestions([]);
  };

  // ---------------- Validation ----------------
  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!fullName.trim()) newErrors.fullName = "Full name required";
      if (!username.trim()) newErrors.username = "Username required";
      if (username.length < 3) newErrors.username = "Username min 3 chars";
    } else if (step === 1) {
      if (!phone.trim()) newErrors.phone = "Phone required";
      if (!location.trim()) newErrors.location = "Location required";
      if (!age || isNaN(age) || age < 13) newErrors.age = "Valid age (13+)";
    } else if (step === 2) {
      if (!gender) newErrors.gender = "Please select gender";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- Step animations ----------------
  const animateTransition = (direction = 1) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * SCREEN_WIDTH,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handleNext = () => {
    if (validateStep()) {
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
    setLoading(true);
    try {
      const accountData = {
        fullName,
        username,
        age,
        gender,
        phone,
        location,
        profilePic,
      };
      await axios.post(`http://172.16.26.108:3000/account`, {
        userID,
        account: accountData,
      });
      animateStepCompletion(step);
      navigation.navigate("GetAssertion", { userID });
    } catch (err) {
      setErrors({ submit: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () =>
    Object.keys(errors).length === 0 &&
    ((step === 0 && fullName && username) ||
      (step === 1 && phone && location && age) ||
      (step === 2 && gender));

  // ---------------- Step icons + progress bar ----------------
  const renderStepIcons = () => {
    const icons = [
      <Ionicons name="person" size={20} color="#fff" />,
      <Ionicons name="call" size={20} color="#fff" />,
      <Ionicons name="male" size={20} color="#fff" />,
    ];
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 24,
          paddingHorizontal: 24,
        }}
      >
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
                  outputRange: [GREY_COLOR, PRIMARY_COLOR],
                }),
              }}
            >
              {stepCheckAnims[index].__getValue() === 1 ? (
                <Ionicons name="checkmark" size={20} color="#fff" />
              ) : (
                icon
              )}
            </Animated.View>
          </View>
        ))}
      </View>
    );
  };

  const renderProgressBar = () => (
    <View
      style={{
        height: 6,
        backgroundColor: "#E5E5E5",
        borderRadius: 3,
        marginHorizontal: 24,
        marginBottom: 24,
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
          backgroundColor: PRIMARY_COLOR,
          borderRadius: 3,
        }}
      />
    </View>
  );

  // ---------------- Step content ----------------
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Pressable style={styles.profileContainer} onPress={pickImage}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <MaterialIcons name="camera-alt" size={30} color="#C4C4C4" />
                  <Text style={{ color: "#C4C4C4", marginTop: 4 }}>Upload</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#C4C4C4"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, errors.fullName && styles.inputError]}
              />
            </View>
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
            <View style={styles.inputWithIcon}>
              <FontAwesome5
                name="user-alt"
                size={20}
                color="#C4C4C4"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={[styles.input, errors.username && styles.inputError]}
              />
            </View>
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </>
        );
      case 1:
        return (
          <>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#C4C4C4"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[styles.input, errors.phone && styles.inputError]}
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#C4C4C4"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Location"
                value={location}
                onChangeText={handleLocationChange}
                style={[styles.input, errors.location && styles.inputError]}
              />
            </View>
            {locationSuggestions.length > 0 && (
              <FlatList
                data={locationSuggestions}
                keyExtractor={(item, i) => i.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => selectLocation(item)}
                    style={styles.suggestionItem}
                  >
                    <Text>{item}</Text>
                  </Pressable>
                )}
                style={{
                  maxHeight: 150,
                  backgroundColor: "#fff",
                  marginBottom: 8,
                }}
              />
            )}
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#C4C4C4"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                style={[styles.input, errors.age && styles.inputError]}
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
              {genders.map((g, i) => (
                <Pressable
                  key={i}
                  style={[
                    styles.genderOption,
                    gender === g && { backgroundColor: PRIMARY_COLOR },
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      gender === g && { color: "#fff" },
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.gender && (
              <Text style={styles.errorText}>{errors.gender}</Text>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY: ayaBounceAnim }],
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Image
          source={require("../../assets/Logos/Aya_AI_Logo.png")}
          style={{ width: 80, height: 80 }}
        />
      </Animated.View>
      {renderStepIcons()}
      {renderProgressBar()}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}
          >
            {renderStepContent()}
          </Animated.View>
          <Pressable
            style={{
              ...styles.nextButton,
              backgroundColor: isStepValid() ? PRIMARY_COLOR : GREY_COLOR,
            }}
            onPress={step === TOTAL_STEPS - 1 ? handleSubmit : handleNext}
            disabled={!isStepValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={28} color="#fff" />
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  profileContainer: { alignSelf: "center", marginVertical: 3 },
  profilePic: { width: 100, height: 100, borderRadius: 50 },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#C4C4C4",
    justifyContent: "center",
    alignItems: "center",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, height: 50 },
  inputError: { borderColor: "#FF3B30" },
  errorText: { color: "#FF3B30", fontSize: 13, marginBottom: 4 },
  genderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 12,
  },
  genderOption: {
    flex: 1,
    minWidth: "45%",
    height: 48,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  genderOptionText: { fontSize: 15, color: "#1C1C1E" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 20,
  },
});
