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

const BACKEND_URL = "https://dsw2b-backend.onrender.com";

export default function AyaTherapistScreen() {
  const [listening, setListening] = useState(false);
  const [aiResponse, setAIResponse] = useState("");
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("neutral");

  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Orb glow animation loop
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

  // Fade-out animation for AI response
  const showAIResponse = async (text, audioUrl) => {
    setAIResponse(text);
    fadeAnim.setValue(1);

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();

      // Animate fade-out after speech
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }).start(() => setAIResponse(""));
        }
      });
    } catch (e) {
      console.error("Audio playback failed", e);
      // fallback to speech
      Speech.speak(text, {
        onDone: () => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }).start(() => setAIResponse(""));
        },
      });
    }
  };

  // Recording functions
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

  // Send user voice to backend
  const sendAudioToAI = async (uri) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", { uri, type: "audio/m4a", name: "voice.m4a" });

      const res = await axios.post(`${BACKEND_URL}/therapist/chat-audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { transcription, reply } = res.data;
      setEmotion("supportive"); // Default emotion for therapist
      showAIResponse(reply, null);
    } catch (e) {
      console.error(e);
      showAIResponse("I’m having trouble responding right now.", null);
    } finally {
      setLoading(false);
    }
  };

  // Send text fallback to backend
  const sendTextToAI = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/therapist/chat`, {
        message,
      });
      const { reply } = res.data;
      setEmotion("supportive");
      showAIResponse(reply, null);
      setMessage("");
    } catch (e) {
      console.error(e);
      showAIResponse("I’m having trouble responding right now.", null);
    } finally {
      setLoading(false);
    }
  };

  // Orb glow color based on emotion
  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange:
      emotion === "calm"
        ? ["rgba(100,200,255,0.3)", "rgba(50,150,255,0.8)"]
        : emotion === "happy"
        ? ["rgba(255,220,100,0.3)", "rgba(255,180,50,0.8)"]
        : ["rgba(255,182,193,0.3)", "rgba(255,20,147,0.8)"],
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
          {loading && (
            <ActivityIndicator
              size="large"
              color="#FF69B4"
              style={{ marginTop: 25 }}
            />
          )}
          {!loading && aiResponse ? (
            <Animated.View style={{ opacity: fadeAnim, marginTop: 25 }}>
              <Text style={styles.aiText}>{aiResponse}</Text>
            </Animated.View>
          ) : null}

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
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#d9006dff",
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  touchArea: { width: "100%", height: "100%", borderRadius: 80 },
  aiText: {
    color: "#333",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#FF69B4",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  inputRow: { flexDirection: "row", marginTop: 30, width: "100%" },
  input: {
    flex: 1,
    backgroundColor: "#dcdcdcff",
    color: "#000",
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    height: 50,
  },
  sendBtn: {
    backgroundColor: "#dc006eff",
    marginLeft: 12,
    paddingHorizontal: 22,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
});
