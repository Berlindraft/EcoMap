import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import Navbar from "../navbar";

export default function ScreensLayout() {
  const pathname = usePathname(); // Get current route path

  // Extract the screen name (last part of the path)
  const currentScreen = pathname?.split("/").pop();

  return (
    <View style={{ flex: 1 }}>
      {/* Stack for Screens — leave room for the navbar */}
      <View style={{ flex: 1, marginBottom: currentScreen ? 0: 80 }}>
        <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
          <Stack.Screen name="home" />
          <Stack.Screen name="map" />
          <Stack.Screen name="scan"/>
          <Stack.Screen name="jobs" />
          <Stack.Screen name="post-job" />
          <Stack.Screen name="buy-tokens" />
          <Stack.Screen name="convert-points" />
          <Stack.Screen name="job-approvals" />
          <Stack.Screen name="rewards" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="user-management" />
          <Stack.Screen name="partner-products" />
        </Stack>
      </View>

      {/* Bottom Navbar — hide on "scan" screen */}
      {currentScreen !== "scan" && <Navbar />}
    </View>
  );
}