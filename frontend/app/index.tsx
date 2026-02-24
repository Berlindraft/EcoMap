import { useRouter } from "expo-router";
import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

type Props = {
  setView: (view: string) => void;
};

export default function WelcomeView({ setView }: Props) {
  const router = useRouter();

  return (
    
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={{
          uri: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        }}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={styles.darkOverlay} />

        {/* Bottom Gradient */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]}
          style={styles.gradient}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={{ marginTop: 40 }}>
            <Text style={styles.title}>
              Let the{"\n"}
              <Text style={styles.greenText}>Environment</Text>
              {"\n"}be{" "}
              <Text style={styles.italicText}>Green</Text>
            </Text>
          </View>

          {/* Floating Badge */}
          <View style={styles.floatingContainer}>
            <View style={styles.badge}>
              <Ionicons name="thumbs-up" size={18} color="#1f2937" />
              <Text style={styles.badgeText}>CLEAN UP</Text>
            </View>
          </View>

          {/* Bottom Section */}
          <View>
            <Text style={styles.description}>
              Join the community cleanup effort.{"\n"}
              <Text style={styles.boldWhite}>
                Earn points, save the city.
              </Text>
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push("/login-and-authetication/login")}
              >
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push("/login-and-authetication/signup")}
              >
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  background: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: "space-between",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: height * 0.7,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 80,
  },
  title: {
    fontSize: 44,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 50,
  },
  greenText: {
    color: "#84cc16",
  },
  italicText: {
    fontWeight: "300",
    fontStyle: "italic",
    color: "#d1fae5",
  },
  floatingContainer: {
    position: "absolute",
    top: height * 0.45,
    left: width / 2 - 70,
    transform: [{ rotate: "-12deg" }],
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#84cc16",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    gap: 8,
    elevation: 8,
  },
  badgeText: {
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
    color: "#1f2937",
  },
  description: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  boldWhite: {
    color: "#ffffff",
    fontWeight: "600",
  },
  buttonContainer: {
    gap: 14,
  },
  loginButton: {
    backgroundColor: "#84cc16",
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontWeight: "700",
    color: "#000",
    fontSize: 16,
  },
  signupButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});