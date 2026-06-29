import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../constants/theme";

/** The bold acronym letter tiles (navy on cream). */
export function AcronymTiles({
  acronym,
  tileSize = 64,
  spacing = 10,
}: {
  acronym: string;
  tileSize?: number;
  spacing?: number;
}) {
  const letters = acronym.toUpperCase().split("");
  return (
    <View style={[styles.row, { gap: spacing }]}>
      {letters.map((letter, index) => (
        <View
          key={index}
          style={[
            styles.tile,
            { width: tileSize, height: tileSize, borderRadius: Theme.tileRadius },
          ]}
        >
          <Text style={[styles.letter, { fontSize: tileSize * 0.5 }]}>{letter}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tile: {
    backgroundColor: Theme.ink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Theme.ink,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  letter: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
