import React from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { Theme } from "../constants/theme";

/**
 * Caption styled so the first letter of each word that matches the acronym, in
 * order, is emphasized (bold + accent). Ported from the SwiftUI `CaptionText`.
 */
export function CaptionText({
  caption,
  acronym,
  style,
}: {
  caption: string;
  acronym: string;
  style?: StyleProp<TextStyle>;
}) {
  const letters = acronym.toUpperCase().split("");
  const words = caption.split(" ");
  let letterIndex = 0;

  return (
    <Text style={[styles.base, style]}>
      {words.map((word, index) => {
        const trailing = index < words.length - 1 ? " " : "";
        const first = word.charAt(0);
        const matches =
          letterIndex < letters.length &&
          first.length > 0 &&
          first.toUpperCase() === letters[letterIndex];

        if (matches) {
          letterIndex += 1;
          return (
            <Text key={index}>
              <Text style={styles.emphasis}>{first}</Text>
              {word.slice(1)}
              {trailing}
            </Text>
          );
        }
        return (
          <Text key={index}>
            {word}
            {trailing}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Theme.ink,
  },
  emphasis: {
    color: Theme.accent,
    fontWeight: "900",
  },
});
