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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const DigitalSafetyCard = () => {
  const [activeTab, setActiveTab] = useState("emergency");
  const [contacts, setContacts] = useState([]);
  const [showNfcScreen, setShowNfcScreen] = useState(false);
  const [healthInfo, setHealthInfo] = useState({
    bloodType: "",
    allergies: "",
    conditions: "",
    medications: "",
    medicalNotes: "",
  });
  const [userInfo, setUserInfo] = useState({
    name: "",
    pictureUri: "",
    dob: "",
    gender: "",
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [medicalNumber, setMedicalNumber] = useState("");
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFlipped ? 180 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  useEffect(() => {
    if (showNfcScreen) {
      const animateWave = (anim) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      animateWave(waveAnim1).start();
      setTimeout(() => animateWave(waveAnim2).start(), 300);
      setTimeout(() => animateWave(waveAnim3).start(), 600);

      const timer = setTimeout(() => setShowNfcScreen(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showNfcScreen]);

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

  const openNfcScreen = () => {
    setShowNfcScreen(true);
  };

  const handleConnect = () => {
    if (!medicalNumber) {
      Alert.alert("Error", "Please enter your Medical ID Number");
      return;
    }
    setShowLoadingModal(true);
    setLoadingStep(1);
    setTimeout(() => setLoadingStep(2), 2000);
    setTimeout(() => setLoadingStep(3), 4000);
    setTimeout(() => {
      // Populate with dummy data
      setUserInfo({
        name: "William Gates",
        pictureUri:
          "https://static01.nyt.com/images/2021/05/17/business/14altGates-print/merlin_183135423_1167fa8a-7940-427e-b690-68876010d286-articleLarge.jpg?quality=75&auto=webp&disable=upscale",
        dob: "1955-10-28",
        gender: "Male",
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
          firstName: "Melinda",
          lastName: "Gates",
          relationship: "Ex-spouse",
          primaryPhone: "123-456-7890",
          secondaryPhone: "098-765-4321",
          email: "melinda@example.com",
          address: "123 Example St, Seattle, WA",
        },
      ]);
      setIsConnected(true);
      setShowLoadingModal(false);
    }, 6000);
  };

  const renderFrontCard = () => (
    <Animated.View
      style={[
        styles.cardFront,
        {
          opacity: frontOpacity,
          transform: [{ rotateY: frontInterpolate }],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        {userInfo.pictureUri ? (
          <Image
            source={{ uri: userInfo.pictureUri }}
            style={styles.userPicture}
          />
        ) : (
          <View style={styles.profileIconLarge}>
            <Ionicons name="person" size={60} color="#E91E63" />
          </View>
        )}
        <Text style={styles.cardTitle}>Aya Medical Card</Text>
      </View>
      <View style={styles.summaryInfo}>
        <Text style={styles.summaryText}>Name: {userInfo.name}</Text>
        <Text style={styles.summaryText}>DOB: {userInfo.dob || "Not set"}</Text>
        <Text style={styles.summaryText}>
          Blood Type: {healthInfo.bloodType || "Not set"}
        </Text>
        <Text style={styles.summaryText}>
          Allergies: {healthInfo.allergies || "None"}
        </Text>
        <Text style={styles.summaryText}>
          Emergency Contacts: {contacts.length}
        </Text>
      </View>
      <TouchableOpacity style={styles.shareButton} onPress={openNfcScreen}>
        <Ionicons name="share" size={20} color="white" />
        <Text style={styles.buttonText}>Share Card</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBackCard = () => (
    <Animated.View
      style={[
        styles.cardBack,
        {
          opacity: backOpacity,
          transform: [{ rotateY: backInterpolate }],
        },
      ]}
    >
      <View style={styles.displaySection}>
        <View style={styles.displayTitle}>
          <View style={styles.displayIcon}>
            <Ionicons name="warning" size={16} color="white" />
          </View>
          <Text style={styles.displayTitleText}>Emergency Contacts</Text>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={40} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              No emergency contacts added
            </Text>
          </View>
        ) : (
          contacts.map((contact, index) => {
            const fullName =
              `${contact.firstName} ${contact.lastName}`.trim() ||
              "Unnamed Contact";
            return (
              <View key={index} style={styles.contactDisplay}>
                <Text style={styles.contactName}>{fullName}</Text>
                {contact.relationship && (
                  <Text style={styles.contactDetail}>
                    <Text style={styles.detailLabel}>Relationship:</Text>{" "}
                    {contact.relationship}
                  </Text>
                )}
                {contact.primaryPhone && (
                  <Text style={styles.contactDetail}>
                    <Text style={styles.detailLabel}>Primary Phone:</Text>{" "}
                    {contact.primaryPhone}
                  </Text>
                )}
                {contact.secondaryPhone && (
                  <Text style={styles.contactDetail}>
                    <Text style={styles.detailLabel}>Secondary Phone:</Text>{" "}
                    {contact.secondaryPhone}
                  </Text>
                )}
                {contact.email && (
                  <Text style={styles.contactDetail}>
                    <Text style={styles.detailLabel}>Email:</Text>{" "}
                    {contact.email}
                  </Text>
                )}
                {contact.address && (
                  <Text style={styles.contactDetail}>
                    <Text style={styles.detailLabel}>Address:</Text>{" "}
                    {contact.address}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.displaySection}>
        <View style={styles.displayTitle}>
          <View style={styles.displayIcon}>
            <Ionicons name="medkit" size={16} color="white" />
          </View>
          <Text style={styles.displayTitleText}>Health Information</Text>
        </View>

        {!healthInfo.bloodType &&
        !healthInfo.allergies &&
        !healthInfo.conditions &&
        !healthInfo.medications &&
        !healthInfo.medicalNotes ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical" size={40} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              No health information added
            </Text>
          </View>
        ) : (
          <View style={styles.healthDisplay}>
            {healthInfo.bloodType && (
              <View style={styles.healthDetail}>
                <Text style={styles.healthLabel}>Blood Type:</Text>
                <Text style={styles.healthValue}>{healthInfo.bloodType}</Text>
              </View>
            )}
            {healthInfo.allergies && (
              <View style={styles.healthDetail}>
                <Text style={styles.healthLabel}>Allergies:</Text>
                <Text style={styles.healthValue}>{healthInfo.allergies}</Text>
              </View>
            )}
            {healthInfo.conditions && (
              <View style={styles.healthDetail}>
                <Text style={styles.healthLabel}>Medical Conditions:</Text>
                <Text style={styles.healthValue}>{healthInfo.conditions}</Text>
              </View>
            )}
            {healthInfo.medications && (
              <View style={styles.healthDetail}>
                <Text style={styles.healthLabel}>Medications:</Text>
                <Text style={styles.healthValue}>{healthInfo.medications}</Text>
              </View>
            )}
            {healthInfo.medicalNotes && (
              <View style={styles.healthDetail}>
                <Text style={styles.healthLabel}>Emergency Notes:</Text>
                <Text style={styles.healthValue}>
                  {healthInfo.medicalNotes}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderCardView = () => (
    <TouchableOpacity
      style={styles.flipCardContainer}
      activeOpacity={1}
      onPress={() => setIsFlipped(!isFlipped)}
    >
      {renderFrontCard()}
      {renderBackCard()}
    </TouchableOpacity>
  );

  const renderConnect = () => (
    <View style={styles.connectContainer}>
      <Text style={styles.connectTitle}>Connect Aya to Medical Card</Text>
      <Text style={styles.connectText}>
        Enter your Medical ID Number to connect and load your information from
        the Department of Home Affairs.
      </Text>
      <TextInput
        style={styles.input}
        value={medicalNumber}
        onChangeText={setMedicalNumber}
        placeholder="Enter Medical ID Number"
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleConnect}>
        <Ionicons name="link" size={20} color="white" />
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingModal = () => (
    <Modal
      visible={showLoadingModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.loadingModalContainer}>
        <View style={styles.loadingModalContent}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>
            {loadingStep === 1
              ? "Connecting to Department of Home Affairs..."
              : loadingStep === 2
              ? "Extracting data..."
              : "Building card..."}
          </Text>
        </View>
      </View>
    </Modal>
  );

  const renderNfcScreen = () => (
    <Modal
      visible={showNfcScreen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNfcScreen(false)}
    >
      <View style={styles.nfcModalContainer}>
        <View style={styles.nfcModalContent}>
          <TouchableOpacity
            style={styles.nfcCloseButton}
            onPress={() => setShowNfcScreen(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.nfcAnimation}>
            <Animated.View
              style={[
                styles.nfcWave,
                {
                  transform: [
                    {
                      scale: waveAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      }),
                    },
                  ],
                  opacity: waveAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.nfcWave,
                {
                  transform: [
                    {
                      scale: waveAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      }),
                    },
                  ],
                  opacity: waveAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.nfcWave,
                {
                  transform: [
                    {
                      scale: waveAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      }),
                    },
                  ],
                  opacity: waveAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0],
                  }),
                },
              ]}
            />
            <Ionicons name="wifi" size={80} color="white" />
          </View>

          <Text style={styles.nfcModalTitle}>Searching for NFC Reader</Text>
          <Text style={styles.nfcModalText}>
            Hold your device near an NFC reader to share your medical card
          </Text>

          <View style={styles.nfcCardPreview}>
            <View style={styles.nfcCardHeader}>
              <Ionicons name="person" size={24} color="#E91E63" />
              <Text style={styles.nfcCardName}>{userInfo.name}</Text>
            </View>
            <Text style={styles.nfcCardInfo}>Aya Medical Card</Text>
          </View>

          <Text style={styles.nfcFooter}>
            Sharing emergency contact and health information
          </Text>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerName}>Aya Medical Card</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.nfcIconButton}
              onPress={openNfcScreen}
            >
              <View style={styles.nfcIcon}>
                <Ionicons name="wifi" size={20} color="#E91E63" />
              </View>
            </TouchableOpacity>
            {userInfo.pictureUri ? (
              <Image
                source={{ uri: userInfo.pictureUri }}
                style={styles.profileIcon}
              />
            ) : (
              <View style={styles.profileIcon}>
                <Ionicons name="person" size={20} color="#E91E63" />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          style={styles.scrollView}
        >
          {isConnected ? renderCardView() : renderConnect()}
        </ScrollView>
      </View>

      {renderNfcScreen()}
      {renderLoadingModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userPicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  nfcIconButton: {
    padding: 4,
  },
  nfcIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  connectContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 50,
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  connectText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "white",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModalContent: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    width: "100%",
  },
  flipCardContainer: {
    width: width - 40,
    height: height * 0.6,
    perspective: 1000,
    marginTop: 20,
  },
  cardFront: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: "hidden",
  },
  cardBack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: "hidden",
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 10,
  },
  summaryInfo: {
    width: "100%",
    alignItems: "flex-start",
  },
  summaryText: {
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 10,
  },
  displaySection: {
    marginBottom: 20,
  },
  displayTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  displayIcon: {
    width: 20,
    height: 20,
    backgroundColor: "#E91E63",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  displayTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    color: "#9CA3AF",
    marginTop: 16,
    fontSize: 14,
  },
  contactDisplay: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#E91E63",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E91E63",
    marginBottom: 8,
  },
  contactDetail: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: "600",
  },
  healthDisplay: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#E91E63",
  },
  healthDetail: {
    flexDirection: "row",
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E91E63",
    minWidth: 120,
  },
  healthValue: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
  },
  nfcModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  nfcModalContent: {
    width: width * 0.9,
    backgroundColor: "#1F2937",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    position: "relative",
  },
  nfcCloseButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  nfcAnimation: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
    overflow: "hidden",
  },
  nfcWave: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  nfcModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
  nfcModalText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  nfcCardPreview: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nfcCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  nfcCardName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 10,
  },
  nfcCardInfo: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  nfcFooter: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
});

export default DigitalSafetyCard;