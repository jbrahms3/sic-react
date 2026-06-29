import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import type { TodayInfo } from "../services/types";

export default function CreateScreen() {
  const { userId } = useAppStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [today, setToday] = useState<TodayInfo | null>(null);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    API.today().then(setToday).catch(() => {});
  }, []);

  const canPost = image !== null && caption.trim().length >= 2;
  const acronym = today?.acronym;

  const choosePhoto = async () => {
    const picked = await pickImage();
    if (picked) setImage(picked);
  };

  const submit = async () => {
    if (!image || !today) return;
    setPosting(true);
    setError(null);
    try {
      const base64 = await base64JPEG(image);
      if (!base64) throw new Error("encode");
      const imageId = await API.uploadImage(base64);
      await API.createPost(userId, caption.trim(), imageId, today.day);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setError("Couldn't post. Please try again.");
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New post</Text>
        <Pressable onPress={submit} disabled={!canPost || posting}>
          <Text style={[styles.post, (!canPost || posting) && styles.postDisabled]}>Post</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {acronym && (
          <View style={styles.matchBlock}>
            <Text style={styles.matchLabel}>MATCH THE LETTERS</Text>
            <AcronymTiles acronym={acronym} tileSize={54} spacing={8} />
          </View>
        )}

        <Pressable style={styles.picker} onPress={choosePhoto}>
          {image ? (
            <Image source={{ uri: image.uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.pickerEmpty}>
              <Ionicons name="image-outline" size={42} color={Theme.ink} />
              <Text style={styles.pickerText}>Choose a photo</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.captionBlock}>
          <Text style={styles.captionLabel}>Your caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder={acronym ? `A phrase for ${acronym}…` : "Write your phrase…"}
            placeholderTextColor={Theme.inkSoft}
            value={caption}
            onChangeText={setCaption}
            multiline
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {posting && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator color={Theme.accent} />
            <Text style={styles.overlayText}>Posting…</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.hairline,
  },
  cancel: {
    fontSize: 16,
    color: Theme.accent,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.ink,
  },
  post: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.accent,
  },
  postDisabled: {
    color: "rgba(27, 42, 74, 0.35)",
  },
  content: {
    padding: 20,
    gap: 22,
  },
  matchBlock: {
    alignItems: "center",
    gap: 8,
  },
  matchLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Theme.inkSoft,
  },
  picker: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: Theme.cardRadius,
    backgroundColor: Theme.accentSoft,
    borderWidth: 1,
    borderColor: Theme.hairline,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerEmpty: {
    alignItems: "center",
    gap: 10,
  },
  pickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
  captionBlock: {
    gap: 8,
  },
  captionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.inkSoft,
  },
  captionInput: {
    minHeight: 64,
    maxHeight: 140,
    fontSize: 16,
    color: Theme.ink,
    backgroundColor: Theme.card,
    borderRadius: 14,
    padding: 14,
    textAlignVertical: "top",
  },
  error: {
    fontSize: 13,
    color: "#D11",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Theme.card,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  overlayText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
});
