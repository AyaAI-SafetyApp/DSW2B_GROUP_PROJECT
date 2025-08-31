import React, { useState } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const suggestedPrompts = [
  "My friend collapsed",
  "Someone is choking",
  "I found a fire",
  "Car accident happened",
  "Severe bleeding",
];

export default function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now().toString(), text, from: "user" };
    setChat((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);
    setShowSuggestions(false); // Hide suggestions after first message

    try {
      const res = await fetch("http://172.16.26.108:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: data.incident
          ? data.incident.instructions.join("\n")
          : "No response",
        from: "bot",
      };
      setChat((prev) => [...prev, botMsg]);
    } catch (e) {
      const errorMsg = {
        id: (Date.now() + 2).toString(),
        text: "Error: could not reach server",
        from: "bot",
      };
      setChat((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (prompt) => {
    setMessage(prompt);
    // Optionally auto-send the message
    // sendMessage(prompt);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}></View>

        {/* Chat Messages */}
        <FlatList
          data={chat}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.from === "user" ? styles.user : styles.bot,
              ]}
            >
              <Text style={styles.text}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{
            paddingBottom: 10,
            paddingTop: 10,
            flexGrow: 1,
          }}
          style={styles.chatContainer}
        />

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#d32f2f" />
            <Text style={styles.loadingText}>Aya is analyzing...</Text>
          </View>
        )}

        {/* Suggested Prompts Section */}
        {showSuggestions && (
          <View style={styles.promptSection}>
            <Text style={styles.promptSectionTitle}>Emergency Prompts</Text>
            <View style={styles.promptGrid}>
              {suggestedPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.promptButton}
                  onPress={() => handleSuggestionPress(prompt)}
                >
                  <Icon name="alert-circle" size={16} color="#d32f2f" />
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Describe your emergency..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: message.trim() ? 1 : 0.5 }]}
            onPress={() => sendMessage(message)}
            disabled={!message.trim()}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  chatContainer: {
    flex: 1,
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: "#d32f2f",
    padding: 12,
    marginLeft: 10,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 48,
    minHeight: 48,
  },
  bubble: {
    marginVertical: 3,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#e3f2fd",
    borderBottomRightRadius: 5,
  },
  bot: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 5,
  },
  text: {
    color: "#333",
    fontSize: 15,
    lineHeight: 20,
  },
  loading: {
    alignItems: "center",
    marginVertical: 10,
    paddingVertical: 5,
  },
  loadingText: {
    color: "#888",
    fontSize: 13,
    marginTop: 5,
    fontStyle: "italic",
  },
  promptSection: {
    marginVertical: 10,
    paddingVertical: 15,
    paddingHorizontal: 5,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  promptSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "48%", // Two columns
    minHeight: 40,
  },
  promptText: {
    color: "#555",
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    flexWrap: "wrap",
  },
});
