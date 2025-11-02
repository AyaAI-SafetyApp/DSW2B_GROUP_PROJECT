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
  Modal,
  ScrollView,
} from "react-native";
import LottieView from "lottie-react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { hasFeatureAccess, showUpgradePrompt, FEATURES } from "../utils/subscriptionUtils";
import { useNavigation } from "@react-navigation/native";

const BACKEND_URL = "https://dsw2b-backend.onrender.com";

export default function AyaTherapistScreen() {
  const navigation = useNavigation();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [listening, setListening] = useState(false);
  const [aiResponse, setAIResponse] = useState("");
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("neutral");
  const [speaking, setSpeaking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const lottieRef = useRef(null);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fake conversation history
  const conversationHistory = [
    {
      id: 1,
      sender: "Natalie",
      message:
        "I don't know where to start... things at home have been really difficult lately.",
      timestamp: "2 days ago",
    },
    {
      id: 2,
      sender: "AYA",
      message:
        "I'm here to listen, Natalie. You're in a safe space. Take your time and share whatever feels right.",
      timestamp: "2 days ago",
    },
    {
      id: 3,
      sender: "Natalie",
      message:
        "My partner gets angry so easily. Last night he threw things and I was so scared.",
      timestamp: "2 days ago",
    },
    {
      id: 4,
      sender: "AYA",
      message:
        "I'm so sorry you're experiencing this. What you're describing sounds like abuse, and no one deserves to feel scared in their own home. Your safety is the most important thing. Have you been able to tell anyone else about this?",
      timestamp: "2 days ago",
    },
    {
      id: 5,
      sender: "Natalie",
      message:
        "No... I'm embarrassed. My family likes him and I'm afraid they won't believe me.",
      timestamp: "2 days ago",
    },
    {
      id: 6,
      sender: "AYA",
      message:
        "Your feelings are completely valid. Many survivors feel this way. Remember, abuse is never your fault. Would you like to talk about safety planning or resources that might help?",
      timestamp: "2 days ago",
    },
    {
      id: 7,
      sender: "Natalie",
      message:
        "I think I need help but I don't know how to leave. Where would I even go?",
      timestamp: "1 day ago",
    },
    {
      id: 8,
      sender: "AYA",
      message:
        "That's a brave step to acknowledge. There are safe shelters and organizations that can help. You don't have to figure this out alone. The GBV Command Centre can provide immediate support: 0800 428 428. They're available 24/7.",
      timestamp: "1 day ago",
    },
  ];

  // Check feature access
  useEffect(() => {
    checkAccess();
  }, []);

  // Re-check access when screen gains focus (after returning from subscription)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkAccess();
    });
    return unsubscribe;
  }, [navigation]);

  const checkAccess = async () => {
    try {
      const access = await hasFeatureAccess(FEATURES.THERAPIST_ACCESS);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  // Reactive Lottie glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange:
      emotion === "calm"
        ? ["rgba(100,200,255,0.3)", "rgba(50,150,255,0.8)"]
        : emotion === "happy"
        ? ["rgba(255,220,100,0.3)", "rgba(255,180,50,0.8)"]
        : ["rgba(255,182,193,0.3)", "rgba(255,20,147,0.8)"],
  });

  const showAIResponse = async (text, audioUrl) => {
    setAIResponse(text);
    fadeAnim.setValue(1);
    setSpeaking(true);

    try {
      if (audioUrl) {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) finishSpeaking();
        });
      } else {
        Speech.speak(text, { onDone: finishSpeaking });
      }
    } catch (e) {
      console.error(e);
      Speech.speak(text, { onDone: finishSpeaking });
    }
  };

  const finishSpeaking = () => {
    setSpeaking(false);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => setAIResponse(""));
  };

  // Voice recording
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

      const res = await axios.post(
        `${BACKEND_URL}/therapist/chat-audio`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const { reply, emotion: aiEmotion } = res.data;
      setEmotion(aiEmotion || "supportive");
      showAIResponse(reply, null);
    } catch (e) {
      console.error(e);
      showAIResponse("I'm having trouble responding right now.", null);
    } finally {
      setLoading(false);
    }
  };

  const sendTextToAI = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/therapist/chat`, {
        message,
      });
      const { reply, emotion: aiEmotion } = res.data;
      setEmotion(aiEmotion || "supportive");
      showAIResponse(reply, null);
      setMessage("");
    } catch (e) {
      console.error(e);
      showAIResponse("I'm having trouble responding right now.", null);
    } finally {
      setLoading(false);
    }
  };

  // Show loading or locked screen
  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#de0973ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={80} color="#de0973ff" />
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedDescription}>
            Access to the AI Therapist requires a Personal Pro subscription (R99.99/month).
            Get professional mental health support powered by AI.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => showUpgradePrompt(navigation, 'AI Therapist')}
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade to Personal Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Conversation History</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.historyScroll}>
            {conversationHistory.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.historyItem,
                  item.sender === "Natalie"
                    ? styles.userMessage
                    : styles.ayaMessage,
                ]}
              >
                <Text style={styles.senderName}>{item.sender}</Text>
                <Text style={styles.historyText}>{item.message}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Main Screen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AYA Therapist</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.inner}>
        {/* Lottie Voice Orb */}
        <TouchableOpacity
          onPressIn={startRecording}
          onPressOut={stopRecording}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[styles.lottieWrapper, { shadowColor: glowInterpolation }]}
          >
            <LottieView
              ref={lottieRef}
              source={require("../assets/animations/AYA.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* AI Response */}
        {loading && (
          <ActivityIndicator
            size="large"
            color="#dc006eff"
            style={{ marginTop: 30 }}
          />
        )}
        {!loading && aiResponse && (
          <Animated.View
            style={{ opacity: fadeAnim, marginTop: 30, width: "90%" }}
          >
            <Text style={styles.aiText}>{aiResponse}</Text>
          </Animated.View>
        )}

        {/* Text input with icon button */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          style={styles.inputWrapper}
        >
          <TextInput
            style={styles.input}
            placeholder="Share what's on your mind..."
            placeholderTextColor="#aaa"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={sendTextToAI}
            multiline
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={sendTextToAI}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  lottieWrapper: {
    width: 320,
    height: 320,
    borderRadius: 160,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  lottie: { width: 400, height: 400 },
  aiText: {
    color: "#2c2c2c",
    fontSize: 18,
    textAlign: "left",
    lineHeight: 28,
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#dc006eff",
  },
  inputWrapper: {
    flexDirection: "row",
    width: "100%",
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    color: "#000",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: "#dc006eff",
    marginLeft: 10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  historyScroll: {
    flex: 1,
    padding: 20,
  },
  historyItem: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  ayaMessage: {
    backgroundColor: "#ffffffff",
    alignSelf: "flex-end",
    maxWidth: "80%",
    borderLeftWidth: 3,
    borderLeftColor: "#bb0064ff",
  },
  senderName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#dc006eff",
    marginBottom: 6,
  },
  historyText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#de0973ff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
