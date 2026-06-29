import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Theme } from "../constants/theme";
import { AppStoreProvider, useAppStore } from "../services/store";

/** Redirects between onboarding and the app based on the saved profile. */
function useOnboardingGate() {
  const { loading, isOnboarded } = useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!isOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (isOnboarded && inOnboarding) {
      router.replace("/");
    }
  }, [loading, isOnboarded, segments, router]);
}

function RootNavigator() {
  const { loading } = useAppStore();
  useOnboardingGate();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={Theme.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Theme.canvas },
        headerStyle: { backgroundColor: Theme.canvas },
        headerTintColor: Theme.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700", color: Theme.ink },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="create" options={{ presentation: "modal" }} />
      <Stack.Screen name="post/[id]" options={{ headerShown: true, title: "Post" }} />
      <Stack.Screen name="day/[day]" options={{ headerShown: true, title: "Past day" }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: true, title: "Profile" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Theme.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
});
