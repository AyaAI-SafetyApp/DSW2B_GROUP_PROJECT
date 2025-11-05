import React from "react";
import { Image, StyleSheet } from "react-native";

export default function Hazard({ x, y }) {
  return (
    <Image
      source={require("../assets/Games/thief.jpg")}
      style={[styles.hazard, { top: y, left: x }]}
    />
  );
}

const styles = StyleSheet.create({
  hazard: {
    width: 40, 
    height: 40,
    position: "absolute",
  },
});
