import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; icon: IconName; label: string }[] = [
  { name: "index", icon: "home", label: "Home" },
  { name: "explore", icon: "search", label: "Explore" },
  { name: "days", icon: "calendar", label: "Days" },
  { name: "profile", icon: "person", label: "Profile" },
];

/** Floating bottom tab bar with a raised center "create" button. */
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderTab = (tab: (typeof TABS)[number]) => {
    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
    const focused = state.index === routeIndex;

    return (
      <Pressable
        key={tab.name}
        style={styles.tabButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const event = navigation.emit({
            type: "tabPress",
            target: state.routes[routeIndex].key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        }}
      >
        <Ionicons
          name={tab.icon}
          size={21}
          color={focused ? Theme.ink : Theme.inkSoft}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: focused ? Theme.ink : Theme.inkSoft, fontWeight: focused ? "700" : "500" },
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 4 }]}>
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}

      <View style={styles.createSlot}>
        <Pressable
          style={styles.createButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/create");
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="days" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Theme.canvas,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.hairline,
    shadowColor: Theme.ink,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -6 },
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  tabLabel: {
    fontSize: 11,
  },
  createSlot: {
    flex: 1,
    alignItems: "center",
  },
  createButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Theme.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
    shadowColor: Theme.ink,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
});
