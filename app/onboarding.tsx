import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AcronymTiles } from "../components/AcronymTiles";
import { Theme } from "../constants/theme";
import { API } from "../services/api";
import { base64JPEG, pickImage, type PickedImage } from "../services/image";
import { useAppStore } from "../services/store";

export default function OnboardingScreen() {
  const store = useAppStore();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<PickedImage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = username.trim().length >= 2;

  const chooseAvatar = async () => {
    const picked = await pickImage();
    if (picked) setAvatar(picked);
  };

  const save = async () => {
    const name = username.trim();
    if (name.length < 2) return;
    setSaving(true);
    setError(null);
    try {
      const token = await store.getToken();
      let avatarId: string | null = null;
      if (avatar) {
        const base64 = await base64JPEG(avatar, 400);
        if (base64) avatarId = await API.uploadImage(base64, token);
      }
      const user = await API.saveUser(name, avatarId, token);
      await store.applyProfile(user);
    } catch {
      setError("Couldn't set up your profile. Try again.");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.intro}>
        <AcronymTiles acronym="TLA" tileSize={72} />
        <Text style={styles.title}>Three-Letter Acronym</Text>
        <Text style={styles.subtitle}>
          Each day a new acronym drops.{"\n"}Match it with a photo and a caption.
        </Text>
      </View>

      <View style={styles.form}>
        <Pressable style={styles.avatarPicker} onPress={chooseAvatar}>
          <View style={styles.avatarCircle}>
            {avatar ? (
              <Image source={{ uri: avatar.uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <Ionicons name="camera" size={30} color={Theme.accent} />
            )}
          </View>
          <View style={styles.avatarPlus}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </View>
        </Pressable>

        <TextInput
          style={styles.usernameInput}
          placeholder="Pick a username"
          placeholderTextColor={Theme.inkSoft}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign="center"
        />

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Pressable
        style={[styles.button, !canSave && styles.buttonDisabled]}
        onPress={save}
        disabled={!canSave || saving}
      >
        {saving && <ActivityIndicator color="#FFFFFF" />}
        <Text style={styles.buttonText}>{saving ? "Setting up…" : "Start posting"}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  intro: {
    alignItems: "center",
    gap: 14,
    marginTop: "20%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Theme.ink,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: Theme.inkSoft,
    lineHeight: 20,
  },
  form: {
    alignItems: "center",
    gap: 22,
  },
  avatarPicker: {
    width: 104,
    height: 104,
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarPlus: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Theme.canvas,
  },
  usernameInput: {
    width: "100%",
    fontSize: 20,
    fontWeight: "500",
    color: Theme.ink,
    backgroundColor: Theme.card,
    borderRadius: 16,
    paddingVertical: 14,
  },
  error: {
    fontSize: 13,
    color: "#D11",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Theme.accent,
    borderRadius: 16,
    paddingVertical: 17,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "rgba(27, 42, 74, 0.4)",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
