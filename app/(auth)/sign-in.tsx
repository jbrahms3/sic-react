import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AcronymTiles } from "../../components/AcronymTiles";
import { Theme } from "../../constants/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      await setActive({ session: result.createdSessionId });
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? "Sign in failed. Try again.");
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setOAuthActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      setError("Google sign in failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.intro}>
        <AcronymTiles acronym="TLA" tileSize={72} />
        <Text style={styles.title}>Three-Letter Acronym</Text>
        <Text style={styles.subtitle}>
          Each day a new acronym drops.{"\n"}Match it with a photo and a caption.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Theme.inkSoft}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Theme.inkSoft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, (!email || !password) && styles.buttonDisabled]}
          onPress={onSignIn}
          disabled={loading || !email || !password}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.googleButton} onPress={onGoogleSignIn} disabled={loading}>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>
      </View>

      <Link href="/(auth)/sign-up" asChild>
        <Pressable style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerLink}>Sign up</Text>
          </Text>
        </Pressable>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.canvas,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  intro: {
    alignItems: "center",
    gap: 14,
    marginTop: "20%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Theme.ink,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: Theme.inkSoft,
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  input: {
    width: "100%",
    fontSize: 16,
    color: Theme.ink,
    backgroundColor: Theme.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  error: {
    fontSize: 13,
    color: "#D11",
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.accent,
    borderRadius: 16,
    paddingVertical: 17,
  },
  buttonDisabled: {
    backgroundColor: "rgba(27, 42, 74, 0.4)",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.hairline,
  },
  dividerText: {
    color: Theme.inkSoft,
    fontSize: 13,
  },
  googleButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.card,
    borderRadius: 16,
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: Theme.hairline,
  },
  googleButtonText: {
    color: Theme.ink,
    fontSize: 17,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: Theme.inkSoft,
  },
  footerLink: {
    color: Theme.link,
    fontWeight: "600",
  },
});
