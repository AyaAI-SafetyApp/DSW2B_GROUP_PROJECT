import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native"; // ✅ added import

const suggestedPrompts = [
  "My friend collapsed",
  "Someone is choking",
  "I found a fire",
  "Car accident happened",
  "Severe bleeding",
];

const API_BASE = "https://dsw2b-backend.onrender.com";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function EmergencyChat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef(null);
  const navigation = useNavigation(); 

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const userMsg = { id: Date.now().toString(), text, from: "user" };
    setChat((prev) => [userMsg, ...prev]);
    setMessage("");
    setLoading(true);
    setShowSuggestions(false);
    setTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: data.incident
          ? data.incident.instructions.join("\n")
          : "No response from server",
        from: "bot",
      };

      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setChat((prev) => [botMsg, ...prev]);
        setTyping(false);
        setLoading(false);
      }, 800);
    } catch (e) {
      const errorMsg = {
        id: (Date.now() + 2).toString(),
        text: "Error: could not reach server",
        from: "bot",
      };
      setChat((prev) => [errorMsg, ...prev]);
      setTyping(false);
      setLoading(false);
    }
  };

  const handleSuggestionPress = (prompt) => setMessage(prompt);

  const renderChatBubble = ({ item }) => (
    <View
      style={[styles.bubble, item.from === "user" ? styles.user : styles.bot]}
    >
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  const renderPromptButton = (prompt, index) => (
    <TouchableOpacity
      key={index}
      style={styles.promptButton}
      activeOpacity={0.7}
      onPress={() => handleSuggestionPress(prompt)}
    >
      <Icon name="alert-circle" size={16} color="#d32f2f" />
      <Text style={styles.promptText}>{prompt}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#d32f2f" />
          </TouchableOpacity>

          <Icon name="alert-circle-outline" size={24} color="#d32f2f" />
          <Text style={styles.headerTitle}>Emergency Chat</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={chat}
          keyExtractor={(item) => item.id}
          renderItem={renderChatBubble}
          contentContainerStyle={{ paddingVertical: 10 }}
          style={styles.chatContainer}
          inverted
        />

        {typing && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#d32f2f" />
            <Text style={styles.loadingText}>Aya is typing...</Text>
          </View>
        )}

        {showSuggestions && !loading && (
          <View style={styles.promptSection}>
            <Text style={styles.promptSectionTitle}>Emergency Prompts</Text>
            <View style={styles.promptGrid}>
              {suggestedPrompts.map(renderPromptButton)}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Describe your emergency..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: message.trim() && !loading ? 1 : 0.5 },
            ]}
            onPress={() => sendMessage(message)}
            disabled={!message.trim() || loading}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f8f8" },
  container: { flex: 1, paddingHorizontal: 19 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#222",
    marginLeft: 10,
  },
  chatContainer: { flex: 1 },
  inputContainer: {
    flexDirection: "row",
    marginVertical: 12,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    maxHeight: 120,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    backgroundColor: "#de0973",
    padding: 14,
    marginLeft: 10,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  bubble: {
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#e1f5fe",
    borderBottomRightRadius: 8,
  },
  bot: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 8,
  },
  text: { color: "#333", fontSize: 16, lineHeight: 22 },
  loadingText: {
    color: "#888",
    fontSize: 13,
    marginLeft: 6,
    fontStyle: "italic",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  promptSection: {
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  promptSectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
    marginBottom: 14,
    textAlign: "center",
  },
  promptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  promptButton: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "48%",
    minHeight: 42,
  },
  promptText: {
    color: "#555",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    flexWrap: "wrap",
  },
});
