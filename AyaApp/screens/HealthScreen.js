import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  Image,
  Alert,
  Share,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// added minimal imports to save/load card to Supabase (placed in HealthBackend folder)
import { supabase } from "../HealthBackend/supabaseClient";
import { getCardForUser, upsertCardByUser } from "../HealthBackend/healthService";

const { width } = Dimensions.get("window");

const DigitalCard = ({ navigation }) => {
  const [isFlipped, setIsFlipped] = useState(true);
  const flipAnimation = useRef(new Animated.Value(1)).current;

  const [formVisible, setFormVisible] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    name: "",
    dob: "",
    gender: "",
    bloodType: "",
    medicalAid: "",
  });

  const [form, setForm] = useState(cardDetails);

  useEffect(() => {
    flipAnimation.setValue(isFlipped ? 1 : 0);
  }, []);

  // helper: robustly get current signed-in user's id
  const getCurrentUserId = async () => {
    try {
      // supabase-js v2: getSession
      if (typeof supabase.auth?.getSession === "function") {
        const { data } = await supabase.auth.getSession();
        const uid = data?.session?.user?.id ?? null;
        if (uid) return uid;
      }

      // supabase-js v2: getUser
      if (typeof supabase.auth?.getUser === "function") {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id ?? null;
        if (uid) return uid;
      }

      // supabase-js v1: auth.user()
      if (typeof supabase.auth?.user === "function") {
        const u = supabase.auth.user();
        if (u?.id) return u.id;
      }

      // fallback: wait for onAuthStateChange event briefly
      return await new Promise((resolve) => {
        let resolved = false;
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          const id = session?.user?.id ?? null;
          if (!resolved) {
            resolved = true;
            resolve(id);
          }
          listener?.unsubscribe?.();
        });
        // timeout after 1.5s
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            listener?.unsubscribe?.();
            resolve(null);
          }
        }, 1500);
      });
    } catch (e) {
      console.warn("getCurrentUserId error", e);
      return null;
    }
  };

  // load saved card for signed-in user on mount (minimal change)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const uid = await getCurrentUserId();
        if (!uid) return;

        const { data, error } = await getCardForUser(uid);
        if (error) {
          console.warn("getCardForUser error", error);
          return;
        }
        if (data && mounted) {
          const loaded = {
            name: data.name ?? "",
            dob: data.dob ? String(data.dob) : "",
            gender: data.gender ?? "",
            bloodType: data.blood_type ?? "",
            medicalAid: data.medical_aid ?? "",
          };
          setCardDetails(loaded);
          setForm(loaded);
        }
      } catch (e) {
        console.warn("load card error", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const flipCard = () => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      tension: 10,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const handleNFC = () => {
    Alert.alert("NFC", "Card disconnected via NFC.");
  };

  const handleShare = async () => {
    try {
      if (!cardDetails.name) {
        Alert.alert("Missing Info", "Please fill in your card details first.");
        return;
      }

      const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header {
              text-align: center;
              background-color: #de0973;
              color: white;
              padding: 10px;
              border-radius: 10px;
            }
            .section {
              margin-top: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              background-color: #f9f9f9;
            }
            .label { font-weight: bold; color: #de0973; }
            .value { margin-left: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Aya Medical Card</h2>
          </div>
          <div class="section">
            <p><span class="label">Name:</span><span class="value">${cardDetails.name}</span></p>
            <p><span class="label">Date of Birth:</span><span class="value">${cardDetails.dob}</span></p>
            <p><span class="label">Gender:</span><span class="value">${cardDetails.gender}</span></p>
            <p><span class="label">Blood Type:</span><span class="value">${cardDetails.bloodType}</span></p>
            <p><span class="label">Medical Aid:</span><span class="value">${cardDetails.medicalAid}</span></p>
          </div>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html });
      console.log("PDF generated at:", uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Sharing not supported", "Cannot share on this device.");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Something went wrong while creating the PDF.");
    }
  };

  // changed: now upserts to Supabase; UI behavior preserved
  const handleSaveDetails = async () => {
    try {
      // optimistic UI update
      setCardDetails(form);
      setFormVisible(false);

      const uid = await getCurrentUserId();

      if (!uid) {
        Alert.alert("Not signed in", "Please sign in to save card details.");
        return;
      }

      const payload = {
        user_id: uid,
        name: form.name || null,
        dob: form.dob || null,
        gender: form.gender || null,
        blood_type: form.bloodType || null,
        medical_aid: form.medicalAid || null,
      };

      const { data, error } = await upsertCardByUser(payload);
      if (error) {
        console.error("Failed to save card:", error);
        Alert.alert("Save failed", error.message || "Could not save card details.");
        return;
      }

      if (data) {
        setCardDetails({
          name: data.name ?? "",
          dob: data.dob ? String(data.dob) : "",
          gender: data.gender ?? "",
          bloodType: data.blood_type ?? "",
          medicalAid: data.medical_aid ?? "",
        });
      }
    } catch (err) {
      console.error("handleSaveDetails error", err);
      Alert.alert("Error", "An error occurred while saving details.");
    }
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Tap to flip the card</Text>
        </View>

        <TouchableOpacity
          onPress={flipCard}
          activeOpacity={0.9}
          style={styles.cardContainer}
        >
          <Animated.View
            style={[styles.card, styles.backCard, backAnimatedStyle]}
          >
            <View style={styles.pinkSectionBack}>
              <View style={styles.decorativeCircles}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
                <View style={[styles.circle, styles.circle4]} />
                <View style={[styles.circle, styles.circle5]} />
                <View style={[styles.circle, styles.circle6]} />
              </View>

              <View style={styles.logoContainer}>
                <View style={styles.logoWithPlus}>
                  <Image
                    source={require("../assets/Logos/Icon.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.plusSign}>+</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Aya Medical Card</Text>
            </View>
          </Animated.View>

          {/* Front of card */}
          <Animated.View
            style={[styles.card, styles.frontCard, frontAnimatedStyle]}
          >
            <View style={styles.pinkSection}>
              <View style={styles.logoContainer}>
                <View style={styles.logoWithPlus}>
                  <Image
                    source={require("../assets/Logos/Icon.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.plusSign}>+</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.name}>{cardDetails.name}</Text>
              <View style={styles.separator} />
              <View style={styles.detailsList}>
                <Text style={styles.detailItem}>
                  <Text style={styles.detailLabel}>DOB:</Text> {cardDetails.dob}
                </Text>
                <Text style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Gender:</Text>{" "}
                  {cardDetails.gender}
                </Text>
                <Text style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Blood Type:</Text>{" "}
                  {cardDetails.bloodType}
                </Text>
                <Text style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Medical Aid:</Text>{" "}
                  {cardDetails.medicalAid}
                </Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleNFC}>
            <Ionicons name="link-outline" size={20} color="#555" />
            <Text style={styles.iconButtonText}>NFC Sharing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="#555" />
            <Text style={styles.iconButtonText}>Share Card</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.iconButton, { marginTop: 25, backgroundColor: "#de0973" }]}
          onPress={() => setFormVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={[styles.iconButtonText, { color: "#fff" }]}>Add Details</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={formVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Card Details</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {["name", "dob", "gender", "bloodType", "medicalAid"].map((key) => (
                <View key={key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{key.toUpperCase()}</Text>
                  <TextInput
                    style={styles.input}
                    value={form[key]}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, [key]: text }))
                    }
                    placeholder={`Enter ${key}`}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#de0973" }]}
                onPress={handleSaveDetails}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#999" }]}
                onPress={() => setFormVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#f0f0f0" },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 999,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
    gap: 30,
  },
  header: { alignItems: "center", marginBottom: 30, width: "100%" },
  subtitle: { fontSize: 16, color: "#666" },
  cardContainer: { width: width * 0.9, height: 200 },
  card: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: "absolute",
    backfaceVisibility: "hidden",
  },
  frontCard: { backgroundColor: "#f5f5f5" },
  backCard: {
    backgroundColor: "#de0973",
    shadowColor: "#de0973",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  pinkSection: {
    width: 150,
    height: 200,
    backgroundColor: "#de0973",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  pinkSectionBack: {
    width: "100%",
    height: "100%",
    backgroundColor: "#de0973",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  circle1: { width: 80, height: 80, top: 20, right: 20 },
  circle2: { width: 60, height: 60, top: 60, left: 20 },
  circle3: { width: 40, height: 40, bottom: 40, right: 40 },
  circle4: { width: 100, height: 100, top: 100, right: -20 },
  circle5: { width: 50, height: 50, bottom: 20, left: 40 },
  circle6: { width: 30, height: 30, top: 30, left: 50 },
  logoContainer: { alignItems: "center", marginBottom: 10 },
  logoWithPlus: { position: "relative", alignItems: "center", justifyContent: "center" },
  logoImage: { width: 150, height: 150 },
  plusSign: {
    position: "absolute",
    color: "white",
    fontSize: 70,
    fontWeight: "bold",
    top: 60,
    right: 30,
  },
  cardTitle: { color: "white", fontSize: 15, fontWeight: "bold", textAlign: "center" },
  detailsSection: { flex: 1, padding: 20, justifyContent: "center", marginLeft: width * 0.38 },
  name: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 5 },
  separator: { height: 2, backgroundColor: "#de0973", marginBottom: 10, width: "50%" },
  detailsList: { gap: 8 },
  detailItem: { fontSize: 14, color: "#333", lineHeight: 22 },
  detailLabel: { fontWeight: "bold" },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginTop: 20,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ddd",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  iconButtonText: { color: "#555", fontWeight: "600", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "90%",
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  inputGroup: { marginBottom: 10 },
  inputLabel: { fontWeight: "600", color: "#333", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: { color: "#fff", fontWeight: "600" },
});

export default DigitalCard;