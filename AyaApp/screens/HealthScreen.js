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
  KeyboardAvoidingView,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const DigitalSafetyCard = () => {
  const [activeTab, setActiveTab] = useState("emergency");
  const [isEditMode, setIsEditMode] = useState(false);
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
    name: "Full Name",
    pictureUri: null, // Set to a URI if available, e.g., 'https://example.com/image.jpg'
    dob: "",
    gender: "",
  });
  const [isFlipped, setIsFlipped] = useState(false);

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

  const addContact = () => {
    if (contacts.length >= 3) {
      Alert.alert(
        "Maximum contacts reached",
        "You can only add up to 3 emergency contacts."
      );
      return;
    }
    setContacts([
      ...contacts,
      {
        id: Date.now().toString(),
        firstName: "",
        lastName: "",
        relationship: "",
        primaryPhone: "",
        secondaryPhone: "",
        email: "",
        address: "",
      },
    ]);
  };

  const removeContact = (id) => {
    setContacts(contacts.filter((contact) => contact.id !== id));
  };

  const updateContact = (id, field, value) => {
    setContacts(
      contacts.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
  };

  const updateHealthInfo = (field, value) => {
    setHealthInfo({ ...healthInfo, [field]: value });
  };

  const updateUserInfo = (field, value) => {
    setUserInfo({ ...userInfo, [field]: value });
  };

  const saveCard = () => {
    const validContacts = contacts.filter(
      (contact) => contact.firstName || contact.lastName || contact.primaryPhone
    );
    setContacts(validContacts);
    setIsEditMode(false);
    setIsFlipped(false);
  };

  const editCard = () => {
    setIsEditMode(true);
  };

  const openNfcScreen = () => {
    setShowNfcScreen(true);
  };

  const renderEditMode = () => (
    <View style={styles.editContainer}>
      {activeTab === "emergency" ? (
        <ScrollView style={styles.tabContent}>
          <TouchableOpacity style={styles.addButton} onPress={addContact}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Emergency Contact</Text>
          </TouchableOpacity>

          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactForm}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactTitle}>Emergency Contact</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeContact(contact.id)}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={contact.firstName}
                    onChangeText={(text) =>
                      updateContact(contact.id, "firstName", text)
                    }
                    placeholder="First name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={contact.lastName}
                    onChangeText={(text) =>
                      updateContact(contact.id, "lastName", text)
                    }
                    placeholder="Last name"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  value={contact.relationship}
                  onChangeText={(text) =>
                    updateContact(contact.id, "relationship", text)
                  }
                  placeholder="e.g., Mother, Father, Spouse"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Primary Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={contact.primaryPhone}
                    onChangeText={(text) =>
                      updateContact(contact.id, "primaryPhone", text)
                    }
                    placeholder="(555) 123-4567"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Secondary Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={contact.secondaryPhone}
                    onChangeText={(text) =>
                      updateContact(contact.id, "secondaryPhone", text)
                    }
                    placeholder="Optional"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={contact.email}
                  onChangeText={(text) =>
                    updateContact(contact.id, "email", text)
                  }
                  placeholder="contact@example.com"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={contact.address}
                  onChangeText={(text) =>
                    updateContact(contact.id, "address", text)
                  }
                  placeholder="Street address (optional)"
                />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.tabContent}>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Name (Read-only)</Text>
            <TextInput
              style={styles.input}
              value={userInfo.name}
              editable={false}
              placeholder="Full name"
            />
          </View>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={userInfo.dob}
              onChangeText={(text) => updateUserInfo("dob", text)}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={styles.input}
              value={userInfo.gender}
              onChangeText={(text) => updateUserInfo("gender", text)}
              placeholder="e.g., Male, Female, Other"
            />
          </View>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Blood Type (Read-only)</Text>
            <TextInput
              style={styles.input}
              value={healthInfo.bloodType}
              editable={false}
              placeholder="e.g., O+, A-, B+, AB-"
            />
          </View>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Allergies</Text>
            <TextInput
              style={styles.input}
              value={healthInfo.allergies}
              onChangeText={(text) => updateHealthInfo("allergies", text)}
              placeholder="List any allergies or 'None'"
            />
          </View>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Medical Conditions</Text>
            <TextInput
              style={styles.input}
              value={healthInfo.conditions}
              onChangeText={(text) => updateHealthInfo("conditions", text)}
              placeholder="Any ongoing medical conditions"
            />
          </View>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Current Medications</Text>
            <TextInput
              style={styles.input}
              value={healthInfo.medications}
              onChangeText={(text) => updateHealthInfo("medications", text)}
              placeholder="List current medications"
            />
          </View>
          <View style={styles.healthEntry}>
            <Text style={styles.label}>Emergency Medical Notes</Text>
            <TextInput
              style={styles.input}
              value={healthInfo.medicalNotes}
              onChangeText={(text) => updateHealthInfo("medicalNotes", text)}
              placeholder="Any critical information for first responders"
            />
          </View>
        </ScrollView>
      )}
    </View>
  );

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
      <TouchableOpacity style={styles.editButton} onPress={editCard}>
        <Ionicons name="create" size={16} color="white" />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>

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

        {isEditMode && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "emergency" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("emergency")}
            >
              <Ionicons
                name="warning"
                size={16}
                color={activeTab === "emergency" ? "white" : "#8895aa"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "emergency" && styles.activeTabText,
                ]}
              >
                Emergency Contacts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "health" && styles.activeTab]}
              onPress={() => setActiveTab("health")}
            >
              <Ionicons
                name="medkit"
                size={16}
                color={activeTab === "health" ? "white" : "#8895aa"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "health" && styles.activeTabText,
                ]}
              >
                Health Information
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          style={styles.scrollView}
        >
          {isEditMode ? renderEditMode() : renderCardView()}
        </ScrollView>

        {isEditMode && (
          <View style={styles.fixedButtonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={saveCard}>
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.buttonText}>Save Card</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {renderNfcScreen()}
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#E91E63",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8895aa",
    marginLeft: 6,
  },
  activeTabText: {
    color: "white",
  },
  editContainer: {
    flex: 1,
    width: "100%",
  },
  tabContent: {
    marginBottom: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  contactForm: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#E91E63",
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E91E63",
  },
  removeButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 6,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  healthEntry: {
    marginBottom: 24,
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f39c12",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
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
