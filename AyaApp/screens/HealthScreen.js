import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
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

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: flipped ? 180 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [flipped]);

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
      // Dummy data
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
      const message = `Aya Medical Card\nName: ${userInfo.name}\nDOB: ${userInfo.dob}\nBlood Type: ${healthInfo.bloodType}\nAllergies: ${healthInfo.allergies}\nMedications: ${healthInfo.medications}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert("Error", "Unable to share card");
    }
  };

  const renderFront = () => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: frontOpacity,
          transform: [{ rotateY: frontInterpolate }],
        },
      ]}
    >
      {userInfo.pictureUri ? (
        <Image source={{ uri: userInfo.pictureUri }} style={styles.userPic} />
      ) : (
        <View style={styles.userPicPlaceholder}>
          <Ionicons name="person" size={60} color="#E91E63" />
        </View>
      )}
      <Text style={styles.cardTitle}>Aya Medical Card</Text>
      <Text style={styles.cardText}>Name: {userInfo.name}</Text>
      <Text style={styles.cardText}>DOB: {userInfo.dob}</Text>
      <Text style={styles.cardText}>Blood Type: {healthInfo.bloodType}</Text>
      <Text style={styles.cardText}>Allergies: {healthInfo.allergies}</Text>

      <TouchableOpacity style={styles.button} onPress={() => setFlipped(true)}>
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share" size={20} color="white" />
        <Text style={styles.buttonText}>Share Card</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBack = () => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: backOpacity,
          transform: [{ rotateY: backInterpolate }],
        },
      ]}
    >
      <Text style={styles.cardTitle}>Health Details</Text>
      <Text style={styles.cardText}>Medical Conditions: {healthInfo.conditions}</Text>
      <Text style={styles.cardText}>Medications: {healthInfo.medications}</Text>
      <Text style={styles.cardText}>Notes: {healthInfo.medicalNotes}</Text>

      <Text style={styles.cardTitle}>Emergency Contacts</Text>
      {contacts.map((c, i) => (
        <Text key={i} style={styles.cardText}>
          {c.name} - {c.relationship} - {c.phone}
        </Text>
      ))}

      <TouchableOpacity style={styles.button} onPress={() => setFlipped(false)}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share" size={20} color="white" />
        <Text style={styles.buttonText}>Share Card</Text>
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
    minHeight: height * 0.5,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
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
  cardTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  cardText: { fontSize: 16, marginBottom: 6, textAlign: "center" },
  button: {
    marginTop: 15,
    backgroundColor: "#E91E63",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "600", marginLeft: 5 },
  shareButton: {
    marginTop: 10,
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
  connectTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 20, fontSize: 16, color: "white" },
});

export default DigitalSafetyCard;
