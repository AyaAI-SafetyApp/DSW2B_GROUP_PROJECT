import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Platform,
  PermissionsAndroid,
  Alert,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { createAgoraRtcEngine, ChannelProfileType } from "react-native-agora";

const APP_ID = "a2291d57f2e94713b80d8f7b28de2fba";
const CHANNEL_NAME = "ayatest";
const TOKEN = "";

export default function VoiceCall() {
  const engineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [users, setUsers] = useState([]); // track joined users

  useEffect(() => {
    const init = async () => {
      try {
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setError("Microphone permission denied");
            return;
          }
        }

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId: APP_ID, logConfig: { level: 0x0001 } });
        engine.setChannelProfile(
          ChannelProfileType.ChannelProfileCommunication
        );
        await engine.enableAudio();

        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            setJoined(true);
            setError(null);
            setIsJoining(false);
          },
          onLeaveChannel: () => {
            setJoined(false);
            setIsJoining(false);
            setUsers([]);
          },
          onError: (_, msg) => {
            setError(`Agora error: ${msg}`);
            setIsJoining(false);
          },
          onUserJoined: (_, remoteUid) => {
            setUsers((prev) => [...prev, remoteUid]);
          },
          onUserOffline: (_, remoteUid) => {
            setUsers((prev) => prev.filter((u) => u !== remoteUid));
          },
        });
      } catch (err) {
        setError(`Init failed: ${err.message}`);
      }
    };

    init();

    return () => {
      const eng = engineRef.current;
      if (eng) {
        eng.leaveChannel();
        eng.release();
      }
    };
  }, []);

  const joinChannel = async () => {
    const eng = engineRef.current;
    if (!eng || joined || isJoining) return;
    setIsJoining(true);
    try {
      await eng.joinChannel(TOKEN, CHANNEL_NAME, 0, { clientRoleType: 1 });
    } catch (err) {
      setError(`Join failed: ${err.message}`);
      setIsJoining(false);
    }
  };

  const leaveChannel = async () => {
    const eng = engineRef.current;
    if (!eng) return;
    try {
      await eng.leaveChannel();
    } catch (err) {
      console.error(err);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {String(item).slice(-2).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.username}>User {item}</Text>
      <Text style={[styles.status, { color: "green" }]}>🟢 Online</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        Status:{" "}
        {joined
          ? "🟢 Connected"
          : isJoining
          ? "🟡 Connecting..."
          : "⚫ Not connected"}
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            joined || isJoining ? styles.buttonDisabled : null,
          ]}
          onPress={joinChannel}
          disabled={joined || isJoining}
        >
          <Text style={styles.buttonText}>Join Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !joined ? styles.buttonDisabled : null]}
          onPress={leaveChannel}
          disabled={!joined}
        >
          <Text style={styles.buttonText}>Leave Call</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.channelText}>Channel: {CHANNEL_NAME}</Text>

      {joined && (
        <FlatList
          data={users}
          keyExtractor={(item) => item.toString()}
          renderItem={renderUser}
          ListHeaderComponent={
            <Text style={styles.participantsTitle}>Participants</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  statusText: { fontSize: 18, marginBottom: 10 },
  errorText: { color: "red", marginBottom: 10, textAlign: "center" },
  buttonContainer: { flexDirection: "row", marginTop: 20 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#007bff",
    borderRadius: 8,
    marginHorizontal: 10,
  },
  buttonDisabled: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontWeight: "600" },
  channelText: { marginTop: 20, fontSize: 12, color: "#666" },
  participantsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  userItem: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { fontWeight: "bold", color: "#333" },
  username: { fontSize: 14, flex: 1 },
  status: { fontSize: 12 },
});
