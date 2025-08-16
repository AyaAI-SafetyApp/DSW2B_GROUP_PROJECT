import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Card } from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

export default function HealthScreen() {
  const userInfo = {
    name: "John Doe",
    bloodType: "O+",
    allergies: "Peanuts",
    conditions: "Asthma",
    emergencyContact: "+27 82 123 4567",
  };

  const clinics = [
    { name: "Hillbrow Clinic", number: "+27 11 720 2000" },
    { name: "Johannesburg General Hospital", number: "+27 11 488 4911" },
    { name: "Charlotte Maxeke Hospital", number: "+27 11 488 4911" },
  ];

  const callClinic = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Virtual Health Card */}
      <Card className="mb-4 rounded-2xl p-4 bg-blue-100">
        <Text className="text-xl font-bold mb-2">🩺 Virtual Health Card</Text>
        <Text className="text-base">Name: {userInfo.name}</Text>
        <Text className="text-base">Blood Type: {userInfo.bloodType}</Text>
        <Text className="text-base">Allergies: {userInfo.allergies}</Text>
        <Text className="text-base">Conditions: {userInfo.conditions}</Text>
        <Text className="text-base">
          Emergency Contact: {userInfo.emergencyContact}
        </Text>
      </Card>

      {/* Clinic Emergency Numbers */}
      <Card className="mb-4 rounded-2xl p-4 bg-red-100">
        <Text className="text-xl font-bold mb-3">🏥 Nearby Clinics</Text>
        {clinics.map((clinic, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => callClinic(clinic.number)}
            className="flex-row items-center p-3 mb-2 bg-white rounded-xl shadow"
          >
            <Ionicons name="call" size={22} color="red" />
            <Text className="ml-3 text-lg">{clinic.name}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Mental Health Doctor */}
      <Card className="mb-4 rounded-2xl p-4 bg-green-100">
        <Text className="text-xl font-bold mb-2">
          🧠 Mental Health Doctor (AI)
        </Text>
        <Text className="mb-3 text-base">
          Talk to Aya's AI-powered mental health assistant. Supports text and
          voice.
        </Text>
        <TouchableOpacity
          onPress={() => alert("Launching AI Mental Health Assistant...")}
          className="flex-row items-center p-3 bg-white rounded-xl shadow"
        >
          <MaterialCommunityIcons name="robot" size={24} color="green" />
          <Text className="ml-3 text-lg">Start Conversation</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}
