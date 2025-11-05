import React, { useState, useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

const victimImages = [
  require("../assets/Games/help.jpg"),
  require("../assets/Games/help2.jpg"),
  require("../assets/Games/help3.jpg"),
  require("../assets/Games/help4.jpg"),
];

export default function Civilian({ x, y }) {
  const [imageSource, setImageSource] = useState(victimImages[0]);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * victimImages.length);
    setImageSource(victimImages[randomIndex]);

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Image
      source={imageSource}
      style={[styles.civilian, { top: y, left: x, transform: [{ scale }] }]}
    />
  );
}

const styles = StyleSheet.create({
  civilian: {
    width: 40,
    height: 40,
    position: "absolute",
  },
});
