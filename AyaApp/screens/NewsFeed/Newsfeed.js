import React, { useEffect, useState } from "react";
import { View, Button, Text } from "react-native";
import RtcEngine from "react-native-agora";

const APP_ID = "d4145cea921547fe87e38d7175187d9b";
const CHANNEL_NAME = "testChannel";

export default function VoiceCall() {
  const [engine, setEngine] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      const agoraEngine = await RtcEngine.create(APP_ID);
      setEngine(agoraEngine);

      await agoraEngine.enableAudio();
      agoraEngine.addListener("JoinChannelSuccess", () => setJoined(true));
    };

    init();

    return () => {
      if (engine) {
        engine.destroy();
      }
    };
  }, []);

  const joinChannel = async () => {
    await engine.joinChannel(null, CHANNEL_NAME, null, 0);
  };

  const leaveChannel = async () => {
    await engine.leaveChannel();
    setJoined(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{joined ? "Connected!" : "Not in call"}</Text>
      <Button title="Join Call" onPress={joinChannel} />
      <Button title="Leave Call" onPress={leaveChannel} />
    </View>
  );
}
