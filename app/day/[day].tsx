import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { AcronymTiles } from "../../components/AcronymTiles";
import { PostCard } from "../../components/PostCard";
import { Theme } from "../../constants/theme";
import { API } from "../../services/api";
import { useAppStore } from "../../services/store";
import { useLikeToggle } from "../../services/useLikeToggle";
import type { Post } from "../../services/types";

export default function DayFeedScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const { userId } = useAppStore();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [acronym, setAcronym] = useState("");
  const [loading, setLoading] = useState(true);

  const toggleLike = useLikeToggle(setPosts);

  const load = useCallback(async () => {
    try {
      const result = await API.feed(day, "new", userId);
      setPosts(result);
      setAcronym(result[0]?.acronym ?? "");
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, [day, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {acronym.length > 0 && (
        <View style={styles.tiles}>
          <AcronymTiles acronym={acronym} tileSize={60} />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={Theme.accent} style={{ marginTop: 40 }} />
      ) : posts.length === 0 ? (
        <Text style={styles.emptyText}>No photos for this day.</Text>
      ) : (
        <View style={styles.list}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => toggleLike(post)}
              onOpen={() => router.push(`/post/${post.id}`)}
              onOpenProfile={() => router.push(`/user/${post.userId}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tiles: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 18,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    color: Theme.inkSoft,
  },
  list: {
    gap: 18,
  },
});
