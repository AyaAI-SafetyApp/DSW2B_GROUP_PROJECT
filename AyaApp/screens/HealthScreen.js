import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  Image,
  ActivityIndicator,
  Share,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import NfcManager, { Ndef } from "react-native-nfc-manager";

const { width, height } = Dimensions.get("window");

const DigitalSafetyCard = () => {
  const [connected, setConnected] = useState(false);
  const [medicalNumber, setMedicalNumber] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [userInfo, setUserInfo] = useState({
    name: "",
    dob: "",
    gender: "",
    pictureUri: "",
  });
  const [healthInfo, setHealthInfo] = useState({
    bloodType: "",
    allergies: "",
    conditions: "",
    medications: "",
    medicalNotes: "",
  });
  const [contacts, setContacts] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState(false);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const tiltValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: flipped ? 180 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [flipped]);

  useEffect(() => {
    Animated.spring(tiltValue, {
      toValue: tilt ? 1 : 0,
      friction: 8,
      tension: 20,
      useNativeDriver: true,
    }).start();
  }, [tilt]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const tiltInterpolate = tiltValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "10deg"],
  });

  const handleConnect = () => {
    if (!medicalNumber) {
      Alert.alert("Error", "Please enter your Medical ID Number");
      return;
    }
    setShowLoading(true);
    setLoadingStep(1);
    setTimeout(() => setLoadingStep(2), 2000);
    setTimeout(() => setLoadingStep(3), 4000);
    setTimeout(() => {
      setUserInfo({
        name: "William Gates",
        dob: "1955-10-28",
        gender: "Male",
        pictureUri:
          "https://static01.nyt.com/images/2021/05/17/business/14altGates-print/merlin_183135423_1167fa8a-7940-427e-b690-68876010d286-articleLarge.jpg",
      });
      setHealthInfo({
        bloodType: "A+",
        allergies: "Rice",
        conditions: "ADHD",
        medications: "Panado",
        medicalNotes: "Take one Panado daily",
      });
      setContacts([
        {
          name: "Melinda Gates",
          relationship: "Ex-spouse",
          phone: "123-456-7890",
        },
      ]);
      setConnected(true);
      setShowLoading(false);
    }, 6000);
  };

  const handleShare = async () => {
    try {
      const message = `Aya Medical Card\nName: ${userInfo.name}\nDOB: ${userInfo.dob}\nGender: ${userInfo.gender}\nBlood Type: ${healthInfo.bloodType}\nAllergies: ${healthInfo.allergies}\nConditions: ${healthInfo.conditions}\nMedications: ${healthInfo.medications}\nNotes: ${healthInfo.medicalNotes}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert("Error", "Unable to share card");
    }
  };

  const handleCardPress = () => {
    setTilt(true);
    setTimeout(() => setTilt(false), 200);
    setFlipped(!flipped);
  };

  const renderFront = () => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: frontOpacity,
          transform: [
            { rotateY: frontInterpolate },
            { rotateX: tiltInterpolate },
            { perspective: 1000 },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardTouchable}
        activeOpacity={0.9}
        onPress={handleCardPress}
      >
        {userInfo.pictureUri ? (
          <Image source={{ uri: userInfo.pictureUri }} style={styles.userPic} />
        ) : (
          <View style={styles.userPicPlaceholder}>
            <Ionicons name="person" size={60} color="#E91E63" />
          </View>
        )}
        <Text style={styles.cardTitle}>Aya Medical Card</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.cardText}>
            <Text style={styles.label}>Name:</Text> {userInfo.name}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.label}>DOB:</Text> {userInfo.dob}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.label}>Gender:</Text> {userInfo.gender}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.label}>Blood Type:</Text> {healthInfo.bloodType}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.label}>Allergies:</Text> {healthInfo.allergies}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Share Card</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBack = () => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: backOpacity,
          transform: [
            { rotateY: backInterpolate },
            { rotateX: tiltInterpolate },
            { perspective: 1000 },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardTouchable}
        activeOpacity={0.9}
        onPress={handleCardPress}
      >
        <Text style={styles.cardTitle}>Health Details</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <Text style={styles.cardText}>
              <Text style={styles.label}>Conditions:</Text>{" "}
              {healthInfo.conditions}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.label}>Medications:</Text>{" "}
              {healthInfo.medications}
            </Text>
            <Text style={styles.cardText}>
              <Text style={styles.label}>Notes:</Text> {healthInfo.medicalNotes}
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {contacts.map((c, i) => (
              <View key={i} style={styles.contactItem}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color="#374151"
                />
                <Text style={styles.cardText}>
                  {c.name} - {c.relationship} - {c.phone}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Share Card</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderConnect = () => (
    <View style={styles.connectContainer}>
      <Text style={styles.connectTitle}>Connect Aya to Medical Card</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Medical ID Number"
        value={medicalNumber}
        onChangeText={setMedicalNumber}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleConnect}>
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <Modal visible={showLoading} transparent animationType="fade">
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>
          {loadingStep === 1
            ? "Connecting..."
            : loadingStep === 2
            ? "Extracting data..."
            : "Building card..."}
        </Text>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView contentContainerStyle={styles.container}>
        {connected ? (
          <>
            {renderFront()}
            {renderBack()}
          </>
        ) : (
          renderConnect()
        )}
      </ScrollView>
      {renderLoading()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  container: { flexGrow: 1, alignItems: "center", padding: 20 },
  card: {
    width: width - 40,
    minHeight: height * 0.55,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    alignItems: "center",
    backfaceVisibility: "hidden",
  },
  cardTouchable: { width: "100%", alignItems: "center" },
  userPic: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  userPicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1F2937",
  },
  cardText: { fontSize: 16, marginBottom: 8, color: "#374151" },
  label: { fontWeight: "600", color: "#1F2937" },
  infoContainer: { width: "100%", alignItems: "flex-start" },
  infoSection: { width: "100%", marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1F2937",
  },
  contactItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  buttonContainer: { width: "100%", alignItems: "center", marginTop: 15 },
  button: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 5,
  },
  shareButton: {
    backgroundColor: "#9C27B0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  connectContainer: { width: "100%", alignItems: "center", marginTop: 50 },
  connectTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1F2937",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 20, fontSize: 16, color: "white" },
});

export default DigitalSafetyCard;
