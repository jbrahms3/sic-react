import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../constants/theme";
import { API } from "../services/api";
import { useAppStore } from "../services/store";

interface AcronymDay {
  day: string;
  acronym: string;
  isOverride: boolean;
}

export default function AdminScreen() {
  const { getToken } = useAppStore();
  const insets = useSafeAreaInsets();

  const [days, setDays] = useState<AcronymDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // day being edited
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setDays(await API.adminGetAcronyms(token));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (day: AcronymDay) => {
    setEditing(day.day);
    setDraft(day.acronym);
  };

  const cancelEdit = () => { setEditing(null); setDraft(""); };

  const save = async () => {
    if (!editing || draft.trim().length < 2) return;
    setSaving(true);
    try {
      const token = await getToken();
      await API.adminSetAcronym(editing, draft.trim(), token);
      await load();
      setEditing(null);
      setDraft("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const clear = async (day: string) => {
    Alert.alert("Reset to default?", `Revert ${day} back to the default acronym?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            await API.adminClearAcronym(day, token);
            await load();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: AcronymDay }) => {
    const isEditing = editing === item.day;
    const label = new Date(item.day + "T00:00:00Z").toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
    });

    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.dateText}>{label}</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={(t) => setDraft(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              autoFocus
            />
          ) : (
            <View style={styles.acronymRow}>
              <Text style={styles.acronymText}>{item.acronym}</Text>
              {item.isOverride && <View style={styles.overrideBadge}><Text style={styles.overrideBadgeText}>custom</Text></View>}
            </View>
          )}
        </View>

        <View style={styles.rowActions}>
          {isEditing ? (
            <>
              <Pressable style={styles.saveBtn} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.editBtn} onPress={() => startEdit(item)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
              {item.isOverride && (
                <Pressable style={styles.clearBtn} onPress={() => clear(item.day)}>
                  <Text style={styles.clearBtnText}>Reset</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Acronym Schedule</Text>
      <Text style={styles.subtitle}>Next 14 days — tap Edit to override any day's acronym.</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Theme.accent} />
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.day}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Theme.ink,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.inkSoft,
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  rowLeft: {
    flex: 1,
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: Theme.inkSoft,
  },
  acronymRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acronymText: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.ink,
    letterSpacing: 2,
  },
  overrideBadge: {
    backgroundColor: Theme.sunshine,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  overrideBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Theme.ink,
  },
  input: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.ink,
    letterSpacing: 2,
    backgroundColor: Theme.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
  },
  rowActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  editBtn: {
    backgroundColor: Theme.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.ink,
  },
  clearBtn: {
    backgroundColor: "rgba(234,60,70,0.1)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.like,
  },
  saveBtn: {
    backgroundColor: Theme.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  cancelBtn: {
    backgroundColor: Theme.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.ink,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.hairline,
  },
});
