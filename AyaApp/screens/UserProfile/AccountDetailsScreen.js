import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AccountDetailsScreen({ navigation }) {
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    username: "",
    phone: "",
    location: "",
    age: "",
    gender: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const shimmerAnim = new Animated.Value(0);

  const startShimmer = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      startShimmer();
      const sessionData = await AsyncStorage.getItem("@user_session");
      if (sessionData) {
        const user = JSON.parse(sessionData);
        setUserData({
          fullName: user.fullName || user.name || "",
          email: user.email || "",
          username: user.username || "",
          phone: user.phone || "",
          location: user.location || "",
          age: user.age?.toString() || "",
          gender: user.gender || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const sessionData = await AsyncStorage.getItem("@user_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        await AsyncStorage.setItem(
          "@user_session",
          JSON.stringify({ ...session, ...userData })
        );
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    label,
    value,
    field,
    icon,
    editable = true,
    keyboardType = "default"
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Ionicons name={icon} size={20} color="#FF1493" />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing && editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setUserData({ ...userData, [field]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#aaa"
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || "Not set"}</Text>
      )}
    </View>
  );

  if (loading && !isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.skeleton,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        ))}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Details</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          {renderField(
            "Full Name",
            userData.fullName,
            "fullName",
            "person-outline"
          )}
          {renderField("Username", userData.username, "username", "at-outline")}
          {renderField("Email", userData.email, "email", "mail-outline", false)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {renderField(
            "Phone",
            userData.phone,
            "phone",
            "call-outline",
            true,
            "phone-pad"
          )}
          {renderField(
            "Location",
            userData.location,
            "location",
            "location-outline"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional</Text>
          {renderField(
            "Age",
            userData.age,
            "age",
            "calendar-outline",
            true,
            "numeric"
          )}
          {renderField("Gender", userData.gender, "gender", "person-outline")}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsEditing(false);
              loadUserData();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#FF1493" },
  editButtonText: { fontSize: 16, fontWeight: "600", color: "#FF1493" },
  content: { flex: 1, paddingHorizontal: 20 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  fieldContainer: { marginBottom: 15 },
  fieldHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  fieldValue: { fontSize: 15, color: "#555", paddingLeft: 28 },
  input: {
    fontSize: 15,
    color: "#111",
    paddingLeft: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#FFB6D9",
    paddingVertical: 6,
  },
  cancelButton: {
    backgroundColor: "#FFE6F0",
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF1493",
  },
  skeleton: {
    height: 40,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 6,
  },
});
