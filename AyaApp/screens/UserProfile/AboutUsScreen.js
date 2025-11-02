import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

const teamMembers = [
  {
    id: "1",
    firstName: "Emmanuel",
    lastName: "Starkio",
    commits: 64,
    Role: "Group Leader",
    attendence: 11,
    commitment: "100%",
    features: [
      "Wake word Detection",
    ],
    icon: <Ionicons name="person-circle-outline" size={60} color="#DE0973" />,
  },
  {
    id: "2",
    firstName: "Lethabo Scofield",
    lastName: "Makonto",
    Role: "Project Leader",
    commits: 68,
    attendence: 10,
    features: ["Call AI Agent"],
    icon: <MaterialIcons name="person-pin" size={60} color="#7c3aed" />,
  },
  {
    id: "3",
    firstName: "Masego",
    lastName: "Motsamai",
    Role: "Business Analyst",
    commits: 2,
    attendence: 8,
    commitment: "50%",
    features: ["Real-Time Communication"],
    icon: <FontAwesome name="user-circle-o" size={60} color="#DE0973" />,
  },
  {
    id: "4",
    firstName: "Zamokuhle",
    lastName: "Mazibuko",
    Role: "Database Administrator",
    commits: 24,
    attendence: 11,
    commitment: "100%",
    features: ["Newsfeed/Aya Social Media"],
    icon: <Ionicons name="person-circle-outline" size={60} color="#9333ea" />,
  },
  {
    id: "5",
    firstName: "Mbongeni",
    lastName: "Qwabe",
    Role: "Co-Database Administrator",
    commits: 17,
    attendence: 8,
    commitment: "70%",
    features: ["Computer Vision"],
    icon: <MaterialIcons name="person-pin" size={60} color="#DE0973" />,
  },
  {
    id: "6",
    firstName: "Natalie",
    lastName: "Mashele",
    Role: "UI/UX Designer",
    commits: 10,
    attendence: 11,
    commitment: "100%",
    features: ["Overall Frontend Design"],
    icon: <FontAwesome name="user-circle-o" size={60} color="#8b5cf6" />,
  },
  {
    id: "7",
    firstName: "Ntswaki",
    lastName: "Mphelo",
    Role: "UI/UX Designer & Meeting Scribe",
    commits: 10,
    attendence: 11,
    commitment: "100%",
    features: ["Integrating Games"],
    icon: <Ionicons name="person-circle-outline" size={60} color="#DE0973" />,
  },
  {
    id: "8",
    firstName: "Nkosiyethu",
    lastName: "Ngubane",
    Role: "Security Specialist",
    commits: 20,
    attendence: 11,
    commitment: "100%",
    features: ["Fall detection"],
    icon: <MaterialIcons name="person-pin" size={60} color="#8b5cf6" />,
  },
];

export default function AboutUsScreen({ navigation }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openMemberModal = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedMember(null);
    setModalVisible(false);
  };

  const renderMemberCard = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => openMemberModal(item)}>
      <View style={styles.card}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>{item.icon}</View>
          <Text style={styles.Role}>{item.Role}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.commits}>{item.commits} commits</Text>

          <View style={styles.features}>
            {item.features.slice(0, 3).map((f, i) => (
              <Text key={i} style={styles.featureItem}>
                • {f}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meet the Team</Text>
      </View>

      <Text style={styles.subText}>Contributors, features, commits, and meeting attendance</Text>

      <FlatList
        data={teamMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberCard}
        showsVerticalScrollIndicator={false}
      />

      {/* Custom Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMember && (
              <>
                <View style={styles.modalIcon}>{selectedMember.icon}</View>
                <Text style={styles.modalName}>
                  {selectedMember.firstName} {selectedMember.lastName}
                </Text>
                <Text style={styles.modalRole}>{selectedMember.Role}</Text>

                <Text style={styles.modalText}>
                  Commits: {selectedMember.commits}
                </Text>
                <Text style={styles.modalText}>
                  Attendance: {selectedMember.attendence}
                </Text>
                <Text style={styles.modalText}>
                  Commitment: {selectedMember.commitment}
                </Text>

                <Text style={styles.featureTitle}>Key Features:</Text>
                {selectedMember.features.map((f, index) => (
                  <Text key={index} style={styles.featureItem}>
                    • {f}
                  </Text>
                ))}

                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FF1493" },
  subText: {
    textAlign: "center",
    color: "#6b7280",
    marginVertical: 12,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#DE0973",
  },
  avatarSection: { alignItems: "center", marginRight: 14, width: 100 },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderColor: "#FF1493",
    borderWidth: 1,
  },
  Role: { fontSize: 13, textAlign: "center", color: "#6b7280" },
  infoContainer: { flex: 1 },
  name: { fontSize: 18, fontWeight: "600", color: "#1e293b" },
  commits: { fontSize: 14, fontWeight: "500", color: "#2563eb", marginVertical: 6 },
  features: { marginTop: 4 },
  featureItem: { color: "#374151", fontSize: 14, marginBottom: 2 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",

  },
 
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalIcon: { marginBottom: 10 },
  modalName: { fontSize: 20, fontWeight: "700", color: "#DE0973" },
  modalRole: { fontSize: 16, color: "#555", marginBottom: 8 },
  modalText: { fontSize: 15, color: "#1e293b", marginBottom: 5 },
  featureTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#DE0973",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeText: { color: "#fff", fontWeight: "600" },
});
