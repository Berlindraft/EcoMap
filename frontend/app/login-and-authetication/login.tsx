import { useRouter, Stack } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import ResultModal from "../../components/ResultModal";

export default function LoginView() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ success: true, title: "", message: "", detail: "", detailIcon: "" as any });

  const handleLogin = async () => {
    if (!email || !password) {
      setModalData({ success: false, title: "Error", message: "Please enter email and password.", detail: "", detailIcon: "" });
      setModalVisible(true);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/screens/home");
    } catch (err: any) {
      const msg =
        err?.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err?.code === "auth/user-not-found"
          ? "No account found with that email."
          : err?.message || "Login failed.";
      setModalData({ success: false, title: "Login Failed", message: msg, detail: "", detailIcon: "" });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to continue cleaning Cebu 🌱</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => router.push("/login-and-authetication/signup")}
          >
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

      <ResultModal
        visible={modalVisible}
        success={modalData.success}
        title={modalData.title}
        message={modalData.message}
        detail={modalData.detail || undefined}
        detailIcon={modalData.detailIcon || undefined}
        onDismiss={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 30,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  header: { alignItems: "center", marginBottom: 40 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#9ca3af", fontSize: 14, marginTop: 4, textAlign: "center" },
  form: {},
  label: { color: "#9ca3af", fontSize: 12, fontWeight: "500" },
  input: {
    backgroundColor: "#111827",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    marginTop: 6,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 6,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: "#84cc16",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 30,
    alignItems: "center",
    shadowColor: "#a3e635",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  loginText: { color: "#000", fontWeight: "700", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 40 },
  footerText: { color: "#9ca3af", fontSize: 14 },
  signupText: { color: "#84cc16", fontWeight: "600", fontSize: 14 },
});