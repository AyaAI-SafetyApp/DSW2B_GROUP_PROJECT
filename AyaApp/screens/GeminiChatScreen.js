import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Modal, SafeAreaView } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av'; // Changed import
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Use your machine's local IP for the backend
const BACKEND_URL = 'http://10.254.199.97:3000';

export default function GeminiChatScreen() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false); // New state to indicate recording status
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const scrollViewRef = useRef();

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const savedConversation = await AsyncStorage.getItem('conversation');
        if (savedConversation) {
          setConversation(JSON.parse(savedConversation));
        }
      } catch (e) {
        console.error('Failed to load conversation:', e);
      }
    };
    loadConversation();
  }, []);

  useEffect(() => {
    const saveConversation = async () => {
      try {
        await AsyncStorage.setItem('conversation', JSON.stringify(conversation));
      } catch (e) {
        console.error('Failed to save conversation:', e);
      }
    };
    if (conversation.length > 0) {
      saveConversation();
    }
  }, [conversation]);

  const sendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Invalid Input', 'Please enter a non-empty message.');
      return;
    }
    if (message.length > 500) {
      Alert.alert('Invalid Input', 'Message cannot exceed 500 characters.');
      return;
    }
    const newMessage = { from: 'You', text: message, timestamp: new Date().toISOString() };
    setConversation([...conversation, newMessage]);
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/chat`, { message }, { timeout: 10000 });
      const aiReply = { from: 'AI', text: res.data.reply, timestamp: new Date().toISOString() };
      setConversation((prev) => [...prev, aiReply]);
      speak(res.data.reply);
    } catch (e) {
      console.error('Error sending message:', e.message);
      Alert.alert('Error', 'Failed to get response from server.');
      setConversation((prev) => [...prev, { from: 'AI', text: 'Error: Could not get response.', timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      // FIXED: Use Audio.requestPermissionsAsync() instead of AV.requestPermissionsAsync()
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is required. Please enable it in settings.');
        return;
      }
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // FIXED: Use Audio.Recording.createAsync() with proper options
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started.');
    } catch (e) {
      console.error('Recording start error:', e.message);
      Alert.alert('Recording Error', `Failed to start: ${e.message}. Check permissions.`);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.log('No recording to stop.');
      setIsRecording(false);
      return;
    }
    try {
      await recording.stopAndUnloadAsync();
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Recording stopped, URI:', uri);
      setRecording(null);
      setIsRecording(false);
      setLoading(true);
      const formData = new FormData();
      formData.append('audio', { uri, type: 'audio/m4a', name: 'voice.m4a' });
      const res = await axios.post(`${BACKEND_URL}/chat-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      const newMessage = { from: 'You', text: res.data.transcription, timestamp: new Date().toISOString() };
      setConversation((prev) => [...prev, newMessage]);
      const aiReply = { from: 'AI', text: res.data.reply, timestamp: new Date().toISOString() };
      setConversation((prev) => [...prev, aiReply]);
      speak(res.data.reply);
    } catch (e) {
      console.error('Recording stop error:', e.message);
      Alert.alert('Error', `Failed to process recording: ${e.message}. Check server connection.`);
    } finally {
      setLoading(false);
      setIsRecording(false);
    }
  };

  const getSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/summary`, { timeout: 10000 });
      setSummary(res.data.summary);
      setNotes(res.data.summary);
      setSummaryModalVisible(true);
      speak(res.data.summary);
    } catch (e) {
      console.error('Error getting summary:', e.message);
      Alert.alert('Error', 'Failed to retrieve summary.');
      setSummary('Error: Could not get summary.');
    } finally {
      setLoading(false);
    }
  };

  const getFeedback = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/feedback`, { timeout: 10000 });
      setFeedback(res.data.feedback);
      setFeedbackModalVisible(true);
      speak(res.data.feedback);
    } catch (e) {
      console.error('Error getting feedback:', e.message);
      Alert.alert('Error', 'Failed to retrieve feedback.');
      setFeedback('Error: Could not get feedback.');
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    if (Speech.isSpeakingAsync()) {
      Speech.stop();
    }
    setSpeaking(true);
    Speech.speak(text, {
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => {
        setSpeaking(false);
        Alert.alert('Error', 'Failed to play speech.');
      },
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setSpeaking(false);
  };

  const clearConversation = async () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setConversation([]);
            setSummary('');
            setFeedback('');
            setNotes('');
            await AsyncStorage.removeItem('conversation');
          },
        },
      ]
    );
  };

  const endSession = async () => {
    await getFeedback();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.header}>Gemini Survivor Chat</Text>
          <ScrollView
            style={styles.chatBox}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {conversation.length > 0 ? (
              conversation.map((msg, idx) => (
                <View key={idx} style={msg.from === 'You' ? styles.userMsgContainer : styles.aiMsgContainer}>
                  <Text style={styles.messageText}>
                    <Text style={styles.messageFrom}>{msg.from}: </Text>
                    {msg.text || 'No message content'}
                  </Text>
                  <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.placeholderText}>No conversation yet. Start by typing or speaking!</Text>
            )}
          </ScrollView>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={message}
              onChangeText={setMessage}
              editable={!speaking && !loading}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              accessibilityLabel="Message input"
            />
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.recordingMicButton]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={speaking || loading}
              accessibilityLabel="Record voice message"
            >
              <Text style={styles.micButtonText}>🎤</Text>
            </TouchableOpacity>
            <Button
              title="Send"
              onPress={sendMessage}
              disabled={speaking || loading || !message.trim()}
              accessibilityLabel="Send message"
            />
          </View>
          <View style={styles.buttonRow}>
            <Button
              title="Take Notes"
              onPress={getSummary}
              disabled={speaking || loading || conversation.length === 0}
              accessibilityLabel="Take notes from conversation"
            />
            <Button
              title="End Session"
              onPress={endSession}
              disabled={speaking || loading || conversation.length === 0}
              color="#FF3B30"
              accessibilityLabel="End session and get feedback"
            />
            <Button
              title="Clear Chat"
              onPress={clearConversation}
              disabled={speaking || loading}
              color="#FF3B30"
              accessibilityLabel="Clear conversation"
            />
          </View>
          {speaking && (
            <TouchableOpacity style={styles.stopButton} onPress={stopSpeaking} accessibilityLabel="Stop speaking">
              <Text style={styles.stopButtonText}>Stop Speaking</Text>
            </TouchableOpacity>
          )}
          <Modal
            animationType="slide"
            transparent={true}
            visible={summaryModalVisible}
            onRequestClose={() => setSummaryModalVisible(false)}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Conversation Notes</Text>
              <ScrollView style={styles.modalTextContainer}>
                <Text style={styles.modalText}>{notes || 'No notes available'}</Text>
              </ScrollView>
              <Button title="Close" onPress={() => setSummaryModalVisible(false)} />
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={feedbackModalVisible}
            onRequestClose={() => setFeedbackModalVisible(false)}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Session Feedback</Text>
              <ScrollView style={styles.modalTextContainer}>
                <Text style={styles.modalText}>{feedback || 'No feedback available'}</Text>
              </ScrollView>
              <Button title="Close" onPress={() => setFeedbackModalVisible(false)} />
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  innerContainer: { flex: 1, padding: 16 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center', color: '#1a2e44' },
  chatBox: { flex: 1, marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  userMsgContainer: { alignSelf: 'flex-end', marginVertical: 8, maxWidth: '75%', backgroundColor: '#d1f7d1', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  aiMsgContainer: { alignSelf: 'flex-start', marginVertical: 8, maxWidth: '75%', backgroundColor: '#e6f0fa', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  messageText: { fontSize: 16, color: '#1a2e44', flexWrap: 'wrap' },
  messageFrom: { fontWeight: '600' },
  timestamp: { fontSize: 12, color: '#666', marginTop: 4, alignSelf: 'flex-end' },
  placeholderText: { textAlign: 'center', color: '#666', padding: 16, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginRight: 8, backgroundColor: '#fff', fontSize: 16 },
  micButton: { backgroundColor: '#4CAF50', borderRadius: 8, padding: 12, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  recordingMicButton: { backgroundColor: '#FF5722' }, // Red while recording
  micButtonText: { fontSize: 20, color: '#fff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stopButton: { backgroundColor: '#FF3B30', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  stopButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalView: { margin: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 6, justifyContent: 'center', flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#1a2e44', textAlign: 'center' },
  modalTextContainer: { maxHeight: 400, marginBottom: 20 },
  modalText: { fontSize: 16, color: '#1a2e44', textAlign: 'left', lineHeight: 24 },
});