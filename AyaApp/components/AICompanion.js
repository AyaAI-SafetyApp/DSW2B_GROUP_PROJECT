import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function AICompanion() {
  const [message, setMessage] = useState(
    "Welcome Hero! Watch out for hazards!"
  );
  const [fadeAnim] = useState(new Animated.Value(0));
  const [color, setColor] = useState("#4caf50"); // default green

  useEffect(() => {
    const messages = [
      { text: "Move carefully!", type: "warning" },
      { text: "A civilian needs help nearby!", type: "urgent" },
      { text: "Watch out for that fire!", type: "danger" },
      { text: "Good job, keep going!", type: "praise" },
      { text: "Quick! Time is ticking!", type: "urgent" },
    ];

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setMessage(randomMsg.text);

      // Set color based on type
      switch (randomMsg.type) {
        case "urgent":
          setColor("#ff9800"); // orange
          break;
        case "danger":
          setColor("#f44336"); // red
          break;
        case "praise":
          setColor("#4caf50"); // green
          break;
        default:
          setColor("#2196f3"); // blue
      }

      // Animate fade-in
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim, borderColor: color }]}
    >
      <Text style={[styles.text, { color }]}>{message}</Text>
      <View style={[styles.triangle, { borderTopColor: color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 80,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    maxWidth: 250,
    alignItems: "center", // centers text horizontally
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center", // ensures multi-line text is centered
  },
  triangle: {
    position: "absolute",
    bottom: -10,
    left: "50%", // center horizontally
    marginLeft: -10, // half of triangle width to truly center
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
