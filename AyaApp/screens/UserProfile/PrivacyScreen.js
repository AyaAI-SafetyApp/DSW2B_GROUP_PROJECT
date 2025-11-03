import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function PrivacyScreen() {
  const navigation = useNavigation();

  const privacyText = `
  <h1>AyaAi Privacy Policy</h1>
  <p><strong>Last Updated:</strong> May 20, 2025</p>
  <p>At AyaAi, we value your privacy and are committed to protecting your personal information. 
  This Privacy Policy outlines how we collect, use, and safeguard your data when you interact 
  with our website, services, and platforms.</p>
  <h2>Information We Collect:</h2>
  <ul>
    <li>Contact Information: Name, email address, and other contact details.</li>
    <li>Device Information: IP address, browser/device information.</li>
    <li>Usage Data: Data related to your interactions with our services.</li>
  </ul>
  <h2>How We Use Your Data:</h2>
  <ul>
    <li>Responding to your inquiries.</li>
    <li>Providing and maintaining our website and services.</li>
    <li>Improving site performance and user experience.</li>
    <li>Complying with legal and regulatory obligations.</li>
  </ul>
  <h2>Data Sharing:</h2>
  <p>We do not sell or lease your personal data to third parties. We may share your data 
  with trusted service providers who assist us in operating our website and services, 
  subject to data protection agreements.</p>
  <h2>Data Retention:</h2>
  <p>We retain personal data only for as long as necessary to fulfill the purposes for 
  which it was collected, including to comply with legal obligations.</p>
  <h2>Your Rights:</h2>
  <p>You have the right to access, correct, or delete your data, withdraw consent, 
  and object to processing under applicable laws.</p>
  <h2>Data Security:</h2>
  <p>We implement technical and organizational measures to protect your data from 
  unauthorized access, alteration, disclosure, or destruction.</p>
  <h2>Changes to This Policy:</h2>
  <p>We may update this Privacy Policy from time to time. All updates will be posted on this page.</p>
  <h2>Contact Us:</h2>
  <p>Email: info@ayadata.ai</p>
  <p>Contact Page: https://www.ayadata.ai/contact-us/</p>
  `;

  const handleDownload = async () => {
    try {
      const { uri } = await Print.printToFileAsync({
        html: privacyText,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF Generated", "File saved at: " + uri);
      }
    } catch (error) {
      console.error("PDF error:", error);
      Alert.alert("Error", "Unable to generate PDF file.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.title}>AyaAi Privacy Policy</Text>
        <Text style={styles.paragraph}>
          At AyaAi, we value your privacy and are committed to protecting your
          personal information. Below you can review our full Privacy Policy.
          You may also download a PDF copy for your records.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect:</Text>
        <Text style={styles.paragraph}>
          - Contact Information: Name, email address, and other contact details.
          {"\n"}- Device Information: IP address, browser/device information.
          {"\n"}- Usage Data: Data related to your interactions with our
          services.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Data:</Text>
        <Text style={styles.paragraph}>
          - Responding to your inquiries.{"\n"}- Providing and maintaining our
          website and services.{"\n"}- Improving site performance and user
          experience.{"\n"}- Complying with legal and regulatory obligations.
        </Text>

        <Text style={styles.sectionTitle}>Data Sharing:</Text>
        <Text style={styles.paragraph}>
          We do not sell or lease your personal data to third parties. We may
          share your data with trusted service providers who assist us in
          operating our website and services, subject to data protection
          agreements.
        </Text>

        <Text style={styles.sectionTitle}>Data Retention:</Text>
        <Text style={styles.paragraph}>
          We retain personal data only for as long as necessary to fulfill the
          purposes for which it was collected, including to comply with legal
          obligations.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights:</Text>
        <Text style={styles.paragraph}>
          You have the right to access, correct, or delete your data, withdraw
          consent, and object to processing under applicable laws.
        </Text>

        <Text style={styles.sectionTitle}>Data Security:</Text>
        <Text style={styles.paragraph}>
          We implement technical and organizational measures to protect your
          data from unauthorized access, alteration, disclosure, or destruction.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy:</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. All updates will
          be posted on this page.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us:</Text>
        <Text style={styles.paragraph}>
          Email: info@ayadata.ai{"\n"}
          Contact Page: https://www.ayadata.ai/contact-us/
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleDownload}>
          <Text style={styles.buttonText}>Download Privacy Policy (PDF)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF1493",
  },

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FF1493",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    color: "black",
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
    color: "#333",
  },
  button: {
    backgroundColor: "#FF1493",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 40,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});