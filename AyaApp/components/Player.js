import React, { useState, useEffect, useRef } from "react";
import { Animated, PanResponder, Image, StyleSheet } from "react-native";

export default function Player({ civilians, hazards, onRescue, onHitHazard }) {
  const position = useRef(new Animated.ValueXY({ x: 150, y: 500 })).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      let newX = position.x._value + gestureState.dx;
      let newY = position.y._value + gestureState.dy;

      if (newX < 0) newX = 0;
      if (newX > 350) newX = 350;
      if (newY < 0) newY = 0;
      if (newY > 700) newY = 700;

      Animated.spring(position, {
        toValue: { x: newX, y: newY },
        useNativeDriver: false, 
        speed: 20,
        bounciness: 10,
      }).start();
    },
    onPanResponderGrant: () => {
      Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }).start();
    },
    onPanResponderRelease: () => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
    },
  });

  useEffect(() => {
    const listener = position.addListener(({ x, y }) => {
      civilians.forEach((c) => {
        if (Math.abs(c.x - x) < 30 && Math.abs(c.y - y) < 30) {
          onRescue(c.id);
        }
      });
      hazards.forEach((h) => {
        if (Math.abs(h.x - x) < 30 && Math.abs(h.y - y) < 30) {
          onHitHazard(h.id);
        }
      });
    });
    return () => position.removeListener(listener);
  }, [civilians, hazards]);

  return (
    <Animated.Image
      source={require("../assets/Games/player.jpg")}
      style={[
        styles.player,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    />
  );
}

const styles = StyleSheet.create({
  player: {
    width: 50,
    height: 50,
    position: "absolute",
  },
});
