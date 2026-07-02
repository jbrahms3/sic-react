import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileContent } from "../../components/ProfileContent";
import { Theme } from "../../constants/theme";
import { API } from "../../services/api";
import { useAppStore } from "../../services/store";

export default function ProfileScreen() {
  const { userId, getToken } = useAppStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getToken().then((token) => API.checkAdmin(token)).then(setIsAdmin).catch(() => {});
  }, [getToken]);

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.title}>Your profile</Text>
        {isAdmin && (
          <Pressable style={styles.adminBtn} onPress={() => router.push("/admin")}>
            <Text style={styles.adminBtnText}>Admin</Text>
          </Pressable>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: Theme.hairline,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.ink,
  },
  adminBtn: {
    position: "absolute",
    right: 16,
    bottom: 8,
    backgroundColor: Theme.sunshine,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  adminBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.ink,
  },
});
