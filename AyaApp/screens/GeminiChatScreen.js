import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import axios from 'axios';

const BACKEND_URL = 'http://10.0.2.2:3000'; // Use your backend IP if on real device

export default function GeminiChatScreen() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const sendMessage = async () => {
    if (!message.trim()) return;
    setConversation([...conversation, { from: 'You', text: message }]);
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/chat`, { message });
      setConversation((prev) => [...prev, { from: 'AI', text: res.data.reply }]);
      speak(res.data.reply);
    } catch (e) {
      setConversation((prev) => [...prev, { from: 'AI', text: 'Error: Could not get response.' }]);
    }
    setLoading(false);
  };

  const getSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/summary`);
      setSummary(res.data.summary);
      speak(res.data.summary);
    } catch (e) {
      setSummary('Error: Could not get summary.');
    }
    setLoading(false);
  };

  const getFeedback = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/feedback`);
      setFeedback(res.data.feedback);
      speak(res.data.feedback);
    } catch (e) {
      setFeedback('Error: Could not get feedback.');
    }
    setLoading(false);
  };

  const speak = (text) => {
    setSpeaking(true);
    Speech.speak(text, {
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Gemini Survivor Chat</Text>
        <ScrollView
          style={styles.chatBox}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {conversation.map((msg, idx) => (
            <Text key={idx} style={msg.from === 'You' ? styles.userMsg : styles.aiMsg}>
              {msg.from}: {msg.text}
            </Text>
          ))}
          {loading && <ActivityIndicator size="small" color="#007AFF" />}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            editable={!speaking && !loading}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <Button title="Send" onPress={sendMessage} disabled={speaking || loading} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Get Summary" onPress={getSummary} disabled={speaking || loading} />
          <Button title="Get Feedback" onPress={getFeedback} disabled={speaking || loading} />
        </View>
        {summary ? <Text style={styles.summary}>Summary: {summary}</Text> : null}
        {feedback ? <Text style={styles.feedback}>Feedback: {feedback}</Text> : null}
        {/* Add extra space at the bottom so nothing is hidden by the tab bar */}
        <View style={{ height: 30 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 40, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, alignSelf: 'center' },
  chatBox: { flex: 1, marginBottom: 10, backgroundColor: '#f8f8f8', borderRadius: 8, padding: 8 },
  userMsg: { color: '#333', marginVertical: 4, alignSelf: 'flex-end', backgroundColor: '#e0f7fa', padding: 8, borderRadius: 8, maxWidth: '80%' },
  aiMsg: { color: '#007AFF', marginVertical: 4, alignSelf: 'flex-start', backgroundColor: '#e3e3e3', padding: 8, borderRadius: 8, maxWidth: '80%' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginRight: 8, backgroundColor: '#fff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summary: { marginTop: 10, color: '#008000', fontWeight: 'bold' },
  feedback: { marginTop: 10, color: '#800080', fontWeight: 'bold' },
});