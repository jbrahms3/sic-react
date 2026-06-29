import { Image, type ImageStyle } from "expo-image";
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Theme } from "../constants/theme";
import { imageURL } from "../services/api";

/** Loads a backend image by id with a soft placeholder. */
export function RemoteImage({
  imageId,
  contentFit = "cover",
  style,
}: {
  imageId?: string | null;
  contentFit?: "cover" | "contain";
  style?: StyleProp<ImageStyle>;
}) {
  if (!imageId) {
    return <View style={[styles.placeholder, style as StyleProp<ViewStyle>]} />;
  }
  return (
    <Image
      source={{ uri: imageURL(imageId) }}
      contentFit={contentFit}
      transition={150}
      style={[styles.placeholder, style]}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Theme.card,
  },
});
