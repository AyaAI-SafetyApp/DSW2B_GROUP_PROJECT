import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import axios from "axios";

const BACKEND_URL = "http://172.16.26.108:3000";

export default function AIOrbScreen() {
  const [listening, setListening] = useState(false);
  const [aiResponse, setAIResponse] = useState("");
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(false);

  const glowAnim = useRef(new Animated.Value(0)).current;

  // Glow animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setListening(true);
    } catch (e) {
      console.error("Recording failed", e);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setListening(false);
      sendAudioToAI(uri);
    } catch (e) {
      console.error(e);
    }
  };

  const sendAudioToAI = async (uri) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", { uri, type: "audio/m4a", name: "voice.m4a" });
      const res = await axios.post(`${BACKEND_URL}/chat-audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleAIResponse(res.data.reply);
    } catch (e) {
      console.error(e);
      setAIResponse("Error: Could not get AI response.");
    } finally {
      setLoading(false);
    }
  };

  const sendTextToAI = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/chat`, { message });
      handleAIResponse(res.data.reply);
      setMessage("");
    } catch (e) {
      console.error(e);
      setAIResponse("Error: Could not get AI response.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIResponse = (text) => {
    setAIResponse(text);
    Speech.speak(text);
  };

  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,182,193,0.3)", "rgba(255,20,147,0.8)"], // Pink nebula glow
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.inner}>
          {/* AI Orb */}
          <Animated.View
            style={[
              styles.orb,
              {
                shadowColor: glowInterpolation,
                shadowRadius: listening ? 35 : 20,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.touchArea}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.7}
            />
          </Animated.View>

          {/* AI Response */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF69B4"
              style={{ marginTop: 25 }}
            />
          ) : (
            <Text style={styles.aiText}>{aiResponse}</Text>
          )}

          {/* Text input fallback */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type here if you can't talk..."
              placeholderTextColor="#888"
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={sendTextToAI}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendTextToAI}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  orb: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FF69B4",
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  touchArea: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
  },
  aiText: {
    color: "#333",
    fontSize: 18,
    marginTop: 30,
    textAlign: "center",
    lineHeight: 24,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 25,
    width: "100%",
  },
  input: {
    flex: 1,
    backgroundColor: "#eee",
    color: "#333",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 50,
  },
  sendBtn: {
    backgroundColor: "#FF69B4",
    marginLeft: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
});
