import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
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
import { Avatar } from "../../components/Avatar";
import { CaptionText } from "../../components/CaptionText";
import { RemoteImage } from "../../components/RemoteImage";
import { Theme } from "../../constants/theme";
import { API } from "../../services/api";
import { useAppStore } from "../../services/store";
import { timeAgo } from "../../services/time";
import type { Comment, Post } from "../../services/types";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAppStore();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      API.post(id, userId).catch(() => null),
      API.comments(id).catch(() => []),
    ]);
    setPost(p);
    setComments(c);
  }, [id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const like = () => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const optimistic: Post = {
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    };
    setPost(optimistic);
    API.toggleLike(post.id, userId)
      .then(setPost)
      .catch(() => setPost(post));
  };

  const send = async () => {
    const text = newComment.trim();
    if (text.length === 0) return;
    setSending(true);
    setNewComment("");
    try {
      const updated = await API.addComment(id, userId, text);
      setComments(updated);
      setPost((p) => (p ? { ...p, commentCount: updated.length } : p));
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const canSend = newComment.trim().length >= 1;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {!post ? (
          <ActivityIndicator color={Theme.accent} style={{ marginTop: 80 }} />
        ) : (
          <View>
            <View style={styles.photo}>
              <RemoteImage imageId={post.imageId} style={StyleSheet.absoluteFill} />
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.action} onPress={like}>
                <Ionicons
                  name={post.likedByMe ? "heart" : "heart-outline"}
                  size={20}
                  color={post.likedByMe ? Theme.like : Theme.ink}
                />
                <Text style={styles.actionText}>{post.likeCount}</Text>
              </Pressable>
              <View style={styles.action}>
                <Ionicons name="chatbubble-outline" size={19} color={Theme.inkSoft} />
                <Text style={[styles.actionText, { color: Theme.inkSoft }]}>
                  {comments.length}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.acronymBadge}>
                <Text style={styles.acronymBadgeText}>{post.acronym}</Text>
              </View>
            </View>

            <View style={styles.captionRow}>
              <Avatar imageId={post.avatarImageId} username={post.username} size={28} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.captionUser}>{post.username}</Text>
                <CaptionText caption={post.caption} acronym={post.acronym} style={styles.captionText} />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.comments}>
              {comments.length === 0 && (
                <Text style={styles.noComments}>
                  No comments yet — start the conversation.
                </Text>
              )}
              {comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <Avatar imageId={comment.avatarImageId} username={comment.username} size={28} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.commentHead}>
                      <Text style={styles.commentUser}>{comment.username}</Text>
                      <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment…"
          placeholderTextColor={Theme.inkSoft}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <Pressable onPress={send} disabled={!canSend || sending}>
          <Ionicons
            name="arrow-up-circle"
            size={34}
            color={canSend ? Theme.accent : "rgba(27, 42, 74, 0.4)"}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Theme.accentSoft,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
  acronymBadge: {
    backgroundColor: Theme.sunshineSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  acronymBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: Theme.ink,
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  captionUser: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
  captionText: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.hairline,
    marginHorizontal: 16,
  },
  comments: {
    padding: 16,
    gap: 16,
  },
  noComments: {
    fontSize: 13,
    color: Theme.inkSoft,
    paddingTop: 16,
  },
  comment: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  commentHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.ink,
  },
  commentTime: {
    fontSize: 11,
    color: Theme.inkSoft,
  },
  commentText: {
    fontSize: 15,
    color: Theme.ink,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: Theme.card,
    borderTopWidth: 1,
    borderTopColor: Theme.hairline,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    color: Theme.ink,
    backgroundColor: Theme.canvas,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
