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
import { AcronymHero } from "../../components/AcronymHero";
import { RemoteImage } from "../../components/RemoteImage";
import { Theme } from "../../constants/theme";
import { API } from "../../services/api";
import { useAppStore } from "../../services/store";
import { prettyDate } from "../../services/time";
import type { Post, TodayInfo } from "../../services/types";

export default function TodayScreen() {
  const { userId } = useAppStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [today, setToday] = useState<TodayInfo | null>(null);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const acronym = today?.acronym ?? "•••";

  const load = useCallback(async () => {
    try {
      const info = await API.today();
      setToday(info);
      const result = await API.feed(info.day, "top", userId);
      setTopPosts(result.slice(0, 10));
    } catch {
      // best-effort, keep previous state
    }
  }, [userId]);

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.accent} />
      }
    >
      <Text style={styles.header}>Today's Acronym</Text>

      <View style={{ marginTop: 8 }}>
        <AcronymHero acronym={acronym} />
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{today ? prettyDate(today.day) : ""}</Text>
        <Ionicons name="calendar-outline" size={18} color={Theme.inkSoft} />
      </View>

      {/* Share card */}
      <View style={styles.shareCard}>
        <View style={styles.shareTop}>
          <View style={styles.lightbulb}>
            <Ionicons name="bulb" size={26} color={Theme.sunshine} />
          </View>
          <Text style={styles.shareHeadline}>
            Three letters.{"\n"}Infinite meanings.{"\n"}Share yours.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push("/create")}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Share Your {acronym}</Text>
        </Pressable>

        <Pressable
          onPress={() => today && router.push(`/day/${today.day}`)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>View Examples</Text>
        </Pressable>
      </View>

      {/* Top interpretations */}
      <View style={styles.interpretationsHeader}>
        <Text style={styles.sectionTitle}>Top Interpretations</Text>
        {today && (
          <Pressable onPress={() => router.push(`/day/${today.day}`)}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        )}
      </View>

      {topPosts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={34} color={Theme.sunshine} />
          <Text style={styles.emptyTitle}>No interpretations yet today</Text>
          <Text style={styles.emptyBody}>
            Be the first to share what {acronym} means to you.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {topPosts.map((post) => (
            <Pressable
              key={post.id}
              style={styles.interpCard}
              onPress={() => router.push(`/post/${post.id}`)}
            >
              <View style={styles.interpImageWrap}>
                <RemoteImage imageId={post.imageId} style={styles.interpImage} />
              </View>
              <View style={styles.interpBody}>
                <Text style={styles.interpCaption} numberOfLines={2}>
                  {post.caption}
                </Text>
                <View style={styles.interpFooter}>
                  <Text style={styles.interpAuthor} numberOfLines={1}>
                    by @{post.username}
                  </Text>
                  <View style={styles.interpLikes}>
                    <Ionicons name="heart" size={13} color={Theme.like} />
                    <Text style={styles.interpLikeCount}>{post.likeCount}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
  },
  header: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: Theme.inkSoft,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "500",
    color: Theme.inkSoft,
  },
  shareCard: {
    marginHorizontal: 20,
    marginTop: 30,
    padding: 24,
    backgroundColor: Theme.card,
    borderRadius: Theme.cardRadius,
    gap: 22,
    shadowColor: Theme.ink,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  shareTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  lightbulb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.sunshineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  shareHeadline: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: Theme.ink,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    backgroundColor: Theme.ink,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: Theme.ink,
  },
  interpretationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 36,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.ink,
  },
  seeAll: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.link,
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 30,
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
  emptyBody: {
    fontSize: 13,
    color: Theme.inkSoft,
    textAlign: "center",
  },
  carousel: {
    paddingHorizontal: 20,
    gap: 16,
  },
  interpCard: {
    width: 246,
    backgroundColor: Theme.card,
    borderRadius: 24,
    shadowColor: Theme.ink,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  interpImageWrap: {
    padding: 8,
  },
  interpImage: {
    width: 230,
    height: 180,
    borderRadius: 18,
  },
  interpBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 10,
  },
  interpCaption: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.ink,
  },
  interpFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  interpAuthor: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: Theme.inkSoft,
  },
  interpLikes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  interpLikeCount: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.ink,
  },
});
