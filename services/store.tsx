import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppUser } from "./types";

const USERNAME_KEY = "tla.username";
const AVATAR_KEY = "tla.avatarImageId";

interface AppStore {
  loading: boolean;
  userId: string;
  username: string | null;
  avatarImageId: string | null;
  isOnboarded: boolean;
  getToken: () => Promise<string>;
  applyProfile: (user: AppUser) => Promise<void>;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const { userId, getToken: clerkGetToken, isLoaded: authLoaded } = useAuth();
  const { user: clerkUser } = useUser();

  const [username, setUsername] = useState<string | null>(null);
  const [avatarImageId, setAvatarImageId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load saved display name / avatar from AsyncStorage whenever the Clerk user changes
  useEffect(() => {
    if (!authLoaded || !userId) {
      setUsername(null);
      setAvatarImageId(null);
      setProfileLoaded(authLoaded);
      return;
    }
    (async () => {
      const entries = await AsyncStorage.multiGet([
        `${USERNAME_KEY}.${userId}`,
        `${AVATAR_KEY}.${userId}`,
      ]);
      const map = Object.fromEntries(entries);
      setUsername(map[`${USERNAME_KEY}.${userId}`] ?? null);
      setAvatarImageId(map[`${AVATAR_KEY}.${userId}`] ?? null);
      setProfileLoaded(true);
    })();
  }, [authLoaded, userId]);

  const getToken = useCallback(async (): Promise<string> => {
    const token = await clerkGetToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }, [clerkGetToken]);

  const applyProfile = useCallback(async (user: AppUser) => {
    if (!userId) return;
    setUsername(user.username);
    setAvatarImageId(user.avatarImageId);
    await AsyncStorage.setItem(`${USERNAME_KEY}.${userId}`, user.username);
    if (user.avatarImageId) {
      await AsyncStorage.setItem(`${AVATAR_KEY}.${userId}`, user.avatarImageId);
    }
  }, [userId]);

  const loading = !authLoaded || (!!userId && !profileLoaded);

  const value = useMemo<AppStore>(
    () => ({
      loading,
      userId: userId ?? "",
      username,
      avatarImageId,
      isOnboarded: !!userId && !!username && username.length > 0,
      getToken,
      applyProfile,
    }),
    [loading, userId, username, avatarImageId, getToken, applyProfile],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStore must be used within an AppStoreProvider");
  return store;
}
