import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { ProfileContent } from "../../components/ProfileContent";
import { useAppStore } from "../../services/store";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useAppStore();
  const isMe = id === store.userId;

  return (
    <>
      <Stack.Screen options={{ title: isMe ? "Your profile" : "Profile" }} />
      <ProfileContent userId={id} />
    </>
  );
}
