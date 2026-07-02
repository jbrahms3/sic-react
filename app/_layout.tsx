import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Theme } from "../constants/theme";
import { AppStoreProvider, useAppStore } from "../services/store";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function useAuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { loading, isOnboarded } = useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || loading) return;

    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!isSignedIn && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && !isOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (isSignedIn && isOnboarded && (inAuth || inOnboarding)) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, loading, isOnboarded, segments, router]);
}

function RootNavigator() {
  const { isLoaded } = useAuth();
  const { loading } = useAppStore();
  useAuthGate();

  if (!isLoaded || loading) {
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
      <Stack.Screen name="(auth)" />
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
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <AppStoreProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AppStoreProvider>
      </SafeAreaProvider>
    </ClerkProvider>
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
