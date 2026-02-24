import { Stack } from 'expo-router';
import 'react-native-reanimated';
import "../global.css";

export default function RootLayout() {
  return (
    <Stack>
      {/* Landing Page */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Login and Authentication */}
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false, headerTitle: '' }} 
      />
      <Stack.Screen 
        name="login-and-authentication/signup" 
        options={{ headerShown: false }} 
      />

      {/* Home Screens */}
      <Stack.Screen name="screens/home" options={{ headerShown: false }} />
      <Stack.Screen name="screens/map" options={{ headerShown: false }} />
      <Stack.Screen name="screens/scan" options={{ headerShown: false }} />
      <Stack.Screen name="screens/jobs" options={{ headerShown: false }} />
      <Stack.Screen name="screens/rewards" options={{ headerShown: false }} />
    </Stack>
  );
}