import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppUser } from "./types";

const USER_ID_KEY = "tla.userId";
const USERNAME_KEY = "tla.username";
const AVATAR_KEY = "tla.avatarImageId";

/** Generates a UUID-style identifier without external deps. */
function generateId(): string {
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AppStore {
  loading: boolean;
  userId: string;
  username: string | null;
  avatarImageId: string | null;
  isOnboarded: boolean;
  /** Persists the profile after a successful server save. */
  applyProfile: (user: AppUser) => Promise<void>;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [avatarImageId, setAvatarImageId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const entries = await AsyncStorage.multiGet([
        USER_ID_KEY,
        USERNAME_KEY,
        AVATAR_KEY,
      ]);
      const map = Object.fromEntries(entries);

      let id = map[USER_ID_KEY];
      if (!id) {
        id = generateId();
        await AsyncStorage.setItem(USER_ID_KEY, id);
      }
      setUserId(id);
      setUsername(map[USERNAME_KEY] ?? null);
      setAvatarImageId(map[AVATAR_KEY] ?? null);
      setLoading(false);
    })();
  }, []);

  const applyProfile = useCallback(async (user: AppUser) => {
    setUsername(user.username);
    setAvatarImageId(user.avatarImageId);
    await AsyncStorage.setItem(USERNAME_KEY, user.username);
    if (user.avatarImageId) {
      await AsyncStorage.setItem(AVATAR_KEY, user.avatarImageId);
    }
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      loading,
      userId,
      username,
      avatarImageId,
      isOnboarded: !!username && username.length > 0,
      applyProfile,
    }),
    [loading, userId, username, avatarImageId, applyProfile],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStore must be used within an AppStoreProvider");
  return store;
}
