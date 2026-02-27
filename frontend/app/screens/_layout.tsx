import { Stack } from "expo-router";
import Navbar from "../navbar";

export default function ScreensLayout() {
  return (
    <>
      {/* Bottom Navbar */}
      <Navbar />

      {/* Stack for Screens */}
      <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="map" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="jobs" />
        <Stack.Screen name="rewards" />
      </Stack>
    </>
  );
}