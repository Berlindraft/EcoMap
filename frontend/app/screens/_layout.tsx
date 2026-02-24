import { Stack } from "expo-router";
import { useState } from "react";
import Navbar from "../navbar";

export default function ScreensLayout() {
  const [currentView, setCurrentView] = useState("home"); // default view

  return (
    <>
      {/* Dynamic Navbar */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Stack for Screens */}
      <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="map" />
        <Stack.Screen name="rewards" />
        <Stack.Screen name="marketplace" />
        {/* add other screens as needed */}
      </Stack>
    </>
  );
}