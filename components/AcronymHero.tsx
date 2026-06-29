import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../constants/theme";

/** Three short yellow rays fanning out, like a comic-book "shine". */
function SunBurst({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <View style={[styles.burst, mirrored && { transform: [{ scaleX: -1 }] }]}>
      <Ray angle={-34} dx={-2} dy={-26} />
      <Ray angle={0} dx={4} dy={0} />
      <Ray angle={34} dx={-2} dy={26} />
    </View>
  );
}

function Ray({ angle, dx, dy }: { angle: number; dx: number; dy: number }) {
  return (
    <View
      style={[
        styles.ray,
        { transform: [{ translateX: dx }, { translateY: dy }, { rotate: `${angle}deg` }] },
      ]}
    />
  );
}

/**
 * Big editorial acronym wordmark flanked by sunny sunburst rays — the hero of
 * the home screen.
 */
export function AcronymHero({ acronym }: { acronym: string }) {
  return (
    <View style={styles.container}>
      <SunBurst mirrored />
      <Text
        style={styles.word}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {acronym.toUpperCase()}
      </Text>
      <SunBurst />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 20,
  },
  word: {
    flexShrink: 1,
    fontSize: 84,
    fontWeight: "900",
    color: Theme.ink,
    textShadowColor: "rgba(27, 42, 74, 0.08)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  burst: {
    width: 40,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  ray: {
    position: "absolute",
    width: 26,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.sunshine,
  },
});
