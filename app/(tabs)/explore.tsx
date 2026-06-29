import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "../../components/PostCard";
import { Theme } from "../../constants/theme";
import { API } from "../../services/api";
import { useAppStore } from "../../services/store";
import { useLikeToggle } from "../../services/useLikeToggle";
import type { Post, TodayInfo } from "../../services/types";

export default function ExploreScreen() {
  const { userId } = useAppStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Post[]>([]);
  const [today, setToday] = useState<TodayInfo | null>(null);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const toggleLike = useLikeToggle(setPosts);

  const load = useCallback(
    async (nextSort: "new" | "top" = sort) => {
      try {
        const info = await API.today();
        setToday(info);
        const result = await API.feed(info.day, nextSort, userId);
        setPosts(result);
      } catch {
        // keep previous state
      } finally {
        setLoaded(true);
      }
    },
    [sort, userId],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const changeSort = (next: "new" | "top") => {
    setSort(next);
    load(next);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.title}>Explore</Text>
        <Pressable onPress={() => router.push("/create")}>
          <Ionicons name="add-circle" size={28} color={Theme.accent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.accent} />
        }
      >
        <View style={styles.header}>
          {today && (
            <View style={styles.todayRow}>
              <Text style={styles.todayLabel}>Today's acronym</Text>
              <View style={styles.todayChip}>
                <Text style={styles.todayChipText}>{today.acronym}</Text>
              </View>
            </View>
          )}
          <View style={styles.segmented}>
            {(["new", "top"] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => changeSort(value)}
                style={[styles.segment, sort === value && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, sort === value && styles.segmentTextActive]}>
                  {value === "new" ? "New" : "Top"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {posts.length === 0 && loaded ? (
          <View style={styles.empty}>
            <Ionicons name="images" size={44} color={Theme.sunshine} />
            <Text style={styles.emptyTitle}>No photos yet today</Text>
            <Text style={styles.emptyBody}>Be the first to match today's acronym.</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push("/create")}>
              <Text style={styles.emptyButtonText}>Add your photo</Text>
            </Pressable>
          </View>
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
    </View>
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.hairline,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.ink,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todayLabel: {
    fontSize: 14,
    color: Theme.inkSoft,
  },
  todayChip: {
    backgroundColor: Theme.sunshineSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayChipText: {
    fontSize: 14,
    fontWeight: "900",
    color: Theme.ink,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: Theme.accentSoft,
    borderRadius: 9,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 7,
  },
  segmentActive: {
    backgroundColor: Theme.card,
    shadowColor: Theme.ink,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.inkSoft,
  },
  segmentTextActive: {
    color: Theme.ink,
  },
  list: {
    gap: 18,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.ink,
  },
  emptyBody: {
    fontSize: 14,
    color: Theme.inkSoft,
  },
  emptyButton: {
    backgroundColor: Theme.accent,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
