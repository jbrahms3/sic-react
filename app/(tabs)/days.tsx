import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AcronymTiles } from "../../components/AcronymTiles";
import { Theme } from "../../constants/theme";
import { API } from "../../services/api";
import { prettyDateShort } from "../../services/time";
import type { DayEntry } from "../../services/types";

export default function DaysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setDays(await API.days());
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.title}>Past days</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={Theme.accent} style={{ marginTop: 60 }} />
        ) : days.length === 0 ? (
          <Text style={styles.emptyText}>No past days yet.</Text>
        ) : (
          days.map((entry) => (
            <Pressable
              key={entry.day}
              style={styles.row}
              onPress={() => router.push(`/day/${entry.day}`)}
            >
              <AcronymTiles acronym={entry.acronym} tileSize={44} spacing={6} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{prettyDateShort(entry.day)}</Text>
                <Text style={styles.rowSubtitle}>
                  {entry.postCount} photo{entry.postCount === 1 ? "" : "s"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Theme.inkSoft} />
            </Pressable>
          ))
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
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    fontSize: 14,
    color: Theme.inkSoft,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Theme.canvas,
    borderWidth: 1,
    borderColor: Theme.hairline,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Theme.inkSoft,
  },
});
