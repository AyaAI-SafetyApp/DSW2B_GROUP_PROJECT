import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { createAgoraRtcEngine, ChannelProfileType } from "react-native-agora";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const APP_ID = "a2291d57f2e94713b80d8f7b28de2fba";
const CHANNEL_NAME = "ayatest";
const TOKEN = "";

export default function VoiceCall() {
  const engineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [users, setUsers] = useState([]);
  const [callDuration, setCallDuration] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    if (joined) {
      startPulse();
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } else {
      pulseAnim.setValue(1);
      fadeAnim.setValue(0);
    }
  }, [joined]);

  useEffect(() => {
    let interval;
    if (joined) {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [joined]);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setError("Microphone permission is required for voice calls");
            return;
          }
        }

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId: APP_ID, logConfig: { level: 0x0001 } });
        engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        await engine.enableAudio();

        engine.registerEventHandler({
          onJoinChannelSuccess: () => { setJoined(true); setError(null); setIsJoining(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
          onLeaveChannel: () => { setJoined(false); setIsJoining(false); setUsers([]); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); },
          onError: (_, msg) => { setError(`Connection error: ${msg}`); setIsJoining(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); },
          onUserJoined: (_, remoteUid) => { setUsers(prev => [...prev, remoteUid]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
          onUserOffline: (_, remoteUid) => { setUsers(prev => prev.filter(u => u !== remoteUid)); },
        });
      } catch (err) {
        setError(`Initialization failed: ${err.message}`);
      }
    };

    init();
    return () => {
      const eng = engineRef.current;
      if (eng) { eng.leaveChannel(); eng.release(); }
    };
  }, []);

  const joinChannel = async () => {
    const eng = engineRef.current;
    if (!eng || joined || isJoining) return;
    setIsJoining(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { await eng.joinChannel(TOKEN, CHANNEL_NAME, 0, { clientRoleType: 1 }); }
    catch (err) { setError(`Failed to join: ${err.message}`); setIsJoining(false); }
  };

  const leaveChannel = async () => {
    const eng = engineRef.current;
    if (!eng) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try { await eng.leaveChannel(); }
    catch (err) { console.error(err); }
  };

  const renderUser = ({ item, index }) => (
    <Animated.View style={[styles.userItem, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{String(item).slice(-2)}</Text>
        <View style={styles.onlineIndicator} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>Safety Partner {index + 1}</Text>
        <Text style={styles.userStatus}>Connected</Text>
      </View>
      <Ionicons name="mic" size={20} color="#4B5563" />
    </Animated.View>
  );

  const renderCallControls = () => (
    <Animated.View style={[styles.controlsContainer, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="mic-off" size={24} color="#4B5563" />
          <Text style={styles.controlText}>Mute</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="volume-high" size={24} color="#4B5563" />
          <Text style={styles.controlText}>Speaker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={leaveChannel}>
          <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: "135deg" }] }} />
          <Text style={[styles.controlText, { color: "#FFFFFF" }]}>End</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Safety</Text>
        <Text style={styles.headerSubtitle}>Stay connected with your safety network</Text>
      </View>

      <View style={styles.content}>
        {!joined ? (
          <View style={styles.joinSection}>
            <LinearGradient colors={["#D1D5DB", "#9CA3AF"]} style={styles.illustration}>
              <Ionicons name="people" size={80} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.joinTitle}>Ready to Connect?</Text>
            <Text style={styles.joinDescription}>Join the safety voice channel to connect with your trusted contacts and emergency responders</Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.joinButton} onPress={joinChannel} disabled={isJoining}>
                <LinearGradient colors={["#6B7280", "#374151"]} style={styles.joinButtonGradient}>
                  {isJoining ? <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" /> : <Ionicons name="call-outline" size={24} color="#FFFFFF" />}
                  <Text style={styles.joinButtonText}>{isJoining ? "Connecting..." : "Join Safety Call"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.activeCallSection}>
            <View style={styles.callHeader}>
              <Text style={styles.callTitle}>Safety Call Active</Text>
              <Text style={styles.callDuration}>{formatTime(callDuration)}</Text>
              <Text style={styles.channelInfo}>Channel: {CHANNEL_NAME}</Text>
            </View>
            <View style={styles.participantsSection}>
              <Text style={styles.participantsTitle}>Connected ({users.length + 1})</Text>
              <FlatList data={users} keyExtractor={item => item.toString()} renderItem={renderUser} style={styles.participantsList} showsVerticalScrollIndicator={false} />
            </View>
            {renderCallControls()}
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: "#6B7280", marginBottom: 8 },
  content: { flex: 1, padding: 24 },
  joinSection: { flex: 1, justifyContent: "center", alignItems: "center" },
  illustration: { width: 160, height: 160, borderRadius: 80, justifyContent: "center", alignItems: "center", marginBottom: 32 },
  joinTitle: { fontSize: 24, fontWeight: "600", color: "#111827", marginBottom: 12, textAlign: "center" },
  joinDescription: { fontSize: 16, color: "#6B7280", textAlign: "center", lineHeight: 22, marginBottom: 40, paddingHorizontal: 20 },
  joinButton: { width: width * 0.7, borderRadius: 20, elevation: 6 },
  joinButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 20 },
  joinButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600", marginLeft: 8 },
  activeCallSection: { flex: 1 },
  callHeader: { alignItems: "center", marginBottom: 32 },
  callTitle: { fontSize: 22, fontWeight: "600", color: "#111827", marginBottom: 8 },
  callDuration: { fontSize: 32, fontWeight: "700", color: "#374151", marginBottom: 4 },
  channelInfo: { fontSize: 14, color: "#6B7280" },
  participantsSection: { flex: 1 },
  participantsTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 16 },
  participantsList: { flex: 1 },
  userItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", padding: 16, borderRadius: 16, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 12, backgroundColor: "#D1D5DB" },
  avatarText: { color: "#111827", fontWeight: "600", fontSize: 16 },
  onlineIndicator: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: "#16A34A", borderWidth: 2, borderColor: "#FFFFFF" },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 2 },
  userStatus: { fontSize: 14, color: "#16A34A", fontWeight: "500" },
  controlsContainer: { marginTop: 24 },
  controlButtons: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  controlButton: { alignItems: "center", padding: 16, borderRadius: 20, backgroundColor: "#F3F4F6", minWidth: 80 },
  endCallButton: { backgroundColor: "#DC2626" },
  controlText: { marginTop: 8, fontSize: 12, fontWeight: "500", color: "#111827" },
  errorContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEE2E2", padding: 16, borderRadius: 12, marginTop: 16 },
  errorText: { color: "#DC2626", marginLeft: 8, flex: 1, fontSize: 14 },
});
