import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../constants/theme";
import { API } from "../services/api";
import { useAppStore } from "../services/store";
import type { AppUser, Post } from "../services/types";
import { Avatar } from "./Avatar";
import { RemoteImage } from "./RemoteImage";

const GAP = 3;
const TILE = (Dimensions.get("window").width - 6 - GAP * 2) / 3;

export function ProfileContent({
  userId,
  paddingTop = 12,
}: {
  userId: string;
  paddingTop?: number;
}) {
  const store = useAppStore();
  const router = useRouter();

  const [user, setUser] = useState<AppUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isMe = userId === store.userId;
  const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);

  const load = useCallback(async () => {
    try {
      const result = await API.profile(userId, store.userId);
      setUser(result.user);
      setPosts(result.posts);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, [userId, store.userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const displayName = user?.username ?? (isMe ? store.username : null) ?? "you";
  const avatarId = user?.avatarImageId ?? (isMe ? store.avatarImageId : null);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <Avatar imageId={avatarId} username={displayName} size={88} />
        <Text style={styles.username}>{displayName}</Text>

        <View style={styles.stats}>
          <Stat value={posts.length} label="posts" />
          <Stat value={totalLikes} label="likes" />
        </View>

        <Pressable style={styles.daysButton} onPress={() => router.push("/days")}>
          <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
          <Text style={styles.daysButtonText}>Browse past days</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={Theme.accent} style={{ marginTop: 30 }} />
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="grid-outline" size={36} color={Theme.inkSoft} />
          <Text style={styles.emptyText}>
            {isMe ? "You haven't posted yet" : "No posts yet"}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {posts.map((post) => (
            <Pressable
              key={post.id}
              style={styles.tile}
              onPress={() => router.push(`/post/${post.id}`)}
            >
              <RemoteImage imageId={post.imageId} style={StyleSheet.absoluteFill} />
              <View style={styles.tileBadge}>
                <Text style={styles.tileBadgeText}>{post.acronym}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
  },
  content: {
    paddingHorizontal: 3,
    paddingBottom: 110,
  },
  head: {
    alignItems: "center",
    gap: 20,
    paddingBottom: 20,
  },
  username: {
    fontSize: 22,
    fontWeight: "700",
    color: Theme.ink,
  },
  stats: {
    flexDirection: "row",
    gap: 36,
  },
  stat: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.ink,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.inkSoft,
  },
  daysButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Theme.ink,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  daysButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Theme.inkSoft,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    width: TILE,
    height: TILE,
    backgroundColor: Theme.accentSoft,
  },
  tileBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tileBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
