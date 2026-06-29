import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../constants/theme";
import { RemoteImage } from "./RemoteImage";

/** Circular avatar with initials fallback. */
export function Avatar({
  imageId,
  username,
  size = 36,
}: {
  imageId?: string | null;
  username: string;
  size?: number;
}) {
  const initials = username.trim().slice(0, 1).toUpperCase();
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {imageId ? (
        <RemoteImage
          imageId={imageId}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.hairline,
    overflow: "hidden",
  },
  initials: {
    fontWeight: "700",
    color: Theme.accent,
  },
});
