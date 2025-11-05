import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const teamMembers = [
  {
    id: "1",
    firstName: "Emmanuel",
    lastName: "Starkio",
    contribution: Math.round((74 / 217) * 100),
    Role: "Group Leader",
    attendence: 11,
    commitment: "100%",
    features: ["Wake word Detection"],
    image: "https://media.licdn.com/dms/image/v2/D4D03AQFW8YUejsz3XQ/profile-displayphoto-shrink_800_800/B4DZYnWpB0GwAg-/0/1744416970318?e=1764201600&v=beta&t=yaRlWXNdpPlV3Y3M2fjSfTsBEa-oALNaUuzuxchkLhs", // Example LinkedIn photo URL
  },
  {
    id: "2",
    firstName: "Lethabo Scofield",
    lastName: "Makonto",
    Role: "Project Leader",
    contribution: Math.round((72 / 217) * 100),
    attendence: 10,
    features: ["Call AI Agent"],
    image: "https://media.licdn.com/dms/image/v2/D4D03AQFsYGNn5Qh0sA/profile-displayphoto-crop_800_800/B4DZn7B2.2G8AI-/0/1760853193668?e=1764201600&v=beta&t=U7OaAVYjmzGahvGFsqW1Pm4ZhFUdaVJbXwTVdepSknk",
  },
  {
    id: "3",
    firstName: "Masego",
    lastName: "Motsamai",
    Role: "Business Analyst",
    contribution: Math.round((2 / 217) * 100),
    attendence: 8,
    commitment: "50%",
    features: ["Real-Time Communication"],
    image: "https://media.licdn.com/dms/image/v2/D4D03AQFwD0IxL04n6Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1718271518207?e=1764201600&v=beta&t=NcqaehEOIv1C-RjIhsdNoJBOG0bEg4T-R8OBPeIbPmw",
  },
  {
    id: "4",
    firstName: "Zamokuhle",
    lastName: "Mazibuko",
    Role: "Database Administrator",
    contribution: Math.round((34 / 217) * 100),
    attendence: 11,
    commitment: "100%",
    features: ["Newsfeed/Aya Social Media"],
    image: "https://media.licdn.com/dms/image/v2/D4D35AQGowALcCn3tjg/profile-framedphoto-shrink_800_800/B4DZjjplQcHwAg-/0/1756165985646?e=1762966800&v=beta&t=fAKI5e1rltjakIr8AVBZO_n-CRRyA0lIQwq9NJ--Dd8",
  },
  {
    id: "5",
    firstName: "Mbongeni",
    lastName: "Qwabe",
    Role: "Co-Database Administrator",
    contribution: Math.round((17 / 217) * 100),
    attendence: 8,
    commitment: "70%",
    features: ["Computer Vision"],
    image: "https://media.licdn.com/dms/image/v2/D5603AQGA7NcHFrxS5w/profile-displayphoto-crop_800_800/B56Zgi.6WqG4AM-/0/1752933579945?e=1764201600&v=beta&t=TQ8GpMJaTXBg_bMMO_rHSEt6ou8B3LvDB5LwcwPfI_E",
  },
  {
    id: "6",
    firstName: "Natalie",
    lastName: "Mashele",
    Role: "UI/UX Designer",
    contribution: Math.round((17 / 217) * 100),
    attendence: 11,
    commitment: "100%",
    features: ["Overall Frontend Design"],
    image: "https://media.licdn.com/dms/image/v2/D5603AQHDfERxAH341w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723582099688?e=1764201600&v=beta&t=6FmIPeqSFoGGGhOYqapxAUJqHxWE3hnJn5yE9ZhCMRw",
  },
  {
    id: "7",
    firstName: "Ntswaki",
    lastName: "Mphelo",
    Role: "UI/UX Designer & Meeting Scribe",
    contribution: Math.round((12 / 217) * 100),
    attendence: 11,
    commitment: "100%",
    features: ["Integrating Games"],
    image: "https://media.licdn.com/dms/image/v2/D4E03AQFnhHGTZdTJzw/profile-displayphoto-crop_800_800/B4EZjOWyAnGwAY-/0/1755808736499?e=1764201600&v=beta&t=dM60SnUAMksRyeglFq8GUUYFsrSiBOoZzh_LwyjN8u0",
  },
  {
    id: "8",
    firstName: "Nkosiyethu",
    lastName: "Ngubane",
    Role: "Security Specialist",
    contribution: Math.round((20 / 217) * 100),
    attendence: 11,
    commitment: "100%",
    features: ["Fall detection"],
    image: "https://media.licdn.com/dms/image/v2/D4D03AQFSGdovz0mxgA/profile-displayphoto-crop_800_800/B4DZpU7yukGgAM-/0/1762361553423?e=1764201600&v=beta&t=yMC2P3ykV2XoEXynqiznuDjGyZL8d1OSPFgem9YplnE",
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
          <Image source={{ uri: item.image }} style={styles.avatarImage} />
          <Text style={styles.Role}>{item.Role}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>
            {item.firstName} {item.lastName}
          </Text>

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
                <Image source={{ uri: selectedMember.image }} style={styles.modalImage} />
                <Text style={styles.modalName}>
                  {selectedMember.firstName} {selectedMember.lastName}
                </Text>
                <Text style={styles.modalRole}>{selectedMember.Role}</Text>

                <Text style={styles.modalText}>
                  Contribution: {selectedMember.contribution}%
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#FF1493",
    marginBottom: 6,
  },
  Role: { fontSize: 13, textAlign: "center", color: "#6b7280" },
  infoContainer: { flex: 1 },
  name: { fontSize: 18, fontWeight: "600", color: "#1e293b" },
  features: { marginTop: 4 },
  featureItem: { color: "#374151", fontSize: 14, marginBottom: 2 },

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
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: "#DE0973",
    borderWidth: 2,
    marginBottom: 10,
  },
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
