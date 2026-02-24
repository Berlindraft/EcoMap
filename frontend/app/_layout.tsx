import { Stack } from 'expo-router';
import 'react-native-reanimated';
import "../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login-and-authetication/login" />
      <Stack.Screen name="login-and-authetication/signup" />
    </Stack>
  );
}