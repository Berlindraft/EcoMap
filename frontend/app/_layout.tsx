import { Stack } from 'expo-router';
import 'react-native-reanimated';
import "../global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
<<<<<<< HEAD
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
=======
      <Stack.Screen name="index" />
      <Stack.Screen name="login-and-authetication/login" />
      <Stack.Screen name="login-and-authetication/signup" />
>>>>>>> 8f579f976825d45999329a877d2947ba5c22ba6e
    </Stack>
  );
}