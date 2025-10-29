import React, { useEffect, useRef, useState } from "react";
import { View, Button, Text, Platform, PermissionsAndroid, Alert } from "react-native";
import { createAgoraRtcEngine, ChannelProfileType } from "react-native-agora";

const APP_ID = "a2291d57f2e94713b80d8f7b28de2fba";
const CHANNEL_NAME = "ayatest";
const TOKEN = "";

export default function VoiceCall() {
  const engineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Request microphone permission
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          console.log("Permission result:", granted);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setError("Microphone permission denied");
            return;
          }
        }

        console.log("Creating Agora engine...");
        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        console.log("Initializing with APP_ID:", APP_ID);
        engine.initialize({ 
          appId: APP_ID,
          logConfig: { level: 0x0001 } // Enable debug logs
        });

        console.log("Setting channel profile...");
        engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        
        console.log("Enabling audio...");
        await engine.enableAudio();

        console.log("Registering event handlers...");
        engine.registerEventHandler({
          onJoinChannelSuccess: (connection, elapsed) => {
            console.log("✅ JOIN SUCCESS!", connection, elapsed);
            setJoined(true);
            setError(null);
            setIsJoining(false);
          },
          onLeaveChannel: (connection, stats) => {
            console.log("👋 Left channel", stats);
            setJoined(false);
            setIsJoining(false);
          },
          onError: (err, msg) => {
            console.log("❌ onError callback:", err, msg);
            setError(`Agora error: ${msg || err}`);
            setIsJoining(false);
          },
          onConnectionStateChanged: (connection, state, reason) => {
            console.log("🔌 Connection state changed:", state, "Reason:", reason);
          },
          onUserJoined: (connection, remoteUid, elapsed) => {
            console.log("👤 User joined:", remoteUid);
          },
          onUserOffline: (connection, remoteUid, reason) => {
            console.log("👤 User left:", remoteUid, reason);
          },
        });
        
        console.log("✅ Agora engine initialized successfully");
      } catch (err) {
        console.error("❌ Initialization error:", err);
        setError(`Init failed: ${err.message}`);
      }
    };

    init();

    return () => {
      const eng = engineRef.current;
      if (eng) {
        console.log("Releasing engine...");
        eng.leaveChannel();
        eng.release();
      }
    };
  }, []);

  const joinChannel = async () => {
    console.log("=== JOIN CHANNEL ATTEMPT ===");
    console.log("Engine exists:", !!engineRef.current);
    console.log("Already joined:", joined);
    console.log("Is joining:", isJoining);
    
    const eng = engineRef.current;
    if (!eng) {
      console.log("❌ No engine!");
      setError("Engine not initialized");
      return;
    }
    
    if (isJoining || joined) {
      console.log("❌ Already joining or joined");
      return;
    }

    setIsJoining(true);
    
    try {
      console.log("Calling joinChannel with:");
      console.log("  TOKEN:", TOKEN || "(empty)");
      console.log("  CHANNEL:", CHANNEL_NAME);
      console.log("  UID: 0");
      
      const result = await eng.joinChannel(TOKEN, CHANNEL_NAME, 0, {
        clientRoleType: 1, // Broadcaster
      });
      
      console.log("joinChannel returned:", result);
    } catch (err) {
      console.error("❌ Join channel error:", err);
      console.error("Error details:", JSON.stringify(err));
      setError(`Join failed: ${err.message}`);
      setIsJoining(false);
    }
  };

  const leaveChannel = async () => {
    const eng = engineRef.current;
    if (!eng) return;
    
    try {
      console.log("Leaving channel...");
      await eng.leaveChannel();
    } catch (err) {
      console.error("Leave error:", err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Status: {joined ? "🟢 Connected" : isJoining ? "🟡 Connecting..." : "⚫ Not connected"}
      </Text>
      
      {error && (
        <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
          {error}
        </Text>
      )}
      
      <View style={{ marginTop: 20 }}>
        <Button 
          title="Join Call" 
          onPress={joinChannel} 
          disabled={joined || isJoining} 
        />
        <View style={{ height: 10 }} />
        <Button 
          title="Leave Call" 
          onPress={leaveChannel} 
          disabled={!joined} 
        />
      </View>
      
      <Text style={{ marginTop: 20, fontSize: 12, color: "#666" }}>
        Channel: {CHANNEL_NAME}
      </Text>
    </View>
  );
}