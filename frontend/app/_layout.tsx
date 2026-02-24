import { Stack } from 'expo-router';
import 'react-native-reanimated';
import "../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', }}>
      {/* Landing Page */}
      <Stack.Screen name="index" />

      {/* Login and Authentication */}
      <Stack.Screen name="login-and-authetication/login" />
      <Stack.Screen name="login-and-authetication/signup" />

      {/* Home Screens */}
      <Stack.Screen name="screens/home"/>
      <Stack.Screen name="screens/map"/>
      <Stack.Screen name="screens/scan"/>
      <Stack.Screen name="screens/jobs"/>
      <Stack.Screen name="screens/rewards"/>
    </Stack>
  );
}