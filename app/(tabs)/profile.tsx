import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileContent } from "../../components/ProfileContent";
import { Theme } from "../../constants/theme";
import { useAppStore } from "../../services/store";

export default function ProfileScreen() {
  const { userId } = useAppStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.title}>Your profile</Text>
      </View>
      <ProfileContent userId={userId} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Theme.hairline,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.ink,
  },
});
