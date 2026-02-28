import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { DataCacheProvider } from "../contexts/DataCache";
import { View, ActivityIndicator } from "react-native";

function RootNavigator() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === "login-and-authetication";
    const onLanding = segs.length === 0 || segs[0] === "index" || segs[0] === "" || segs[0] === undefined;

    if (!firebaseUser && !inAuthGroup && !onLanding) {
      // Not logged in and trying to access protected route → go to landing
      router.replace("/");
    } else if (firebaseUser && (inAuthGroup || onLanding)) {
      // Logged in but on auth/landing page → go to home
      router.replace("/screens/home");
    }
  }, [firebaseUser, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="navbar" />
      <Stack.Screen name="login-and-authetication" />
      <Stack.Screen name="screens" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataCacheProvider>
        <RootNavigator />
      </DataCacheProvider>
    </AuthProvider>
  );
}