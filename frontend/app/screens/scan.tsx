import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

export default function ReportView() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ type: string; severity: string; action: string } | null>(null);

  // Open Camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission denied");
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true, // needed for AI analysis
    });

    if (!photo.canceled && photo.assets?.length) {
      setImage(photo.assets[0].base64 || null);
      setResult(null);
    }
  };

  // AI Analysis Simulation
  const analyzeImage = async () => {
    if (!image) return;
    setAnalyzing(true);

    try {
      // Replace with real API call
      const simulatedResult = await new Promise<{ type: string; severity: string; action: string }>((resolve) =>
        setTimeout(() => resolve({
          type: "Mixed Plastic",
          severity: "High",
          action: "Requires manual segregation. Do not burn."
        }), 1500)
      );

      setResult(simulatedResult);
    } catch (err) {
      console.error(err);
      Alert.alert("AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    Alert.alert("Report Submitted! +50 Eco-Points");
    router.push("/login-and-authetication/signup")
  };

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 50,
  },
  imageContainer: {
    height: 380,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    backgroundColor: "#ffffff"
  },
  captureBox: {
    height: "100%",
    borderWidth: 2,
    borderColor: "#555",
    borderStyle: "dashed",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4caf50",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
});

return (
  <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 50 }}>
    <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
      Report Waste
    </Text>
    <Text style={{ color: "#aaa", marginBottom: 16 }}>
      Take a photo. Let AI verify it.
    </Text>

    {!image ? (
      <TouchableOpacity style={styles.captureBox} onPress={takePhoto}>
        <Text style={{ color: "#aaa" }}>Tap to Capture</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${image}` }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <TouchableOpacity
          onPress={() => setImage(null)}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 8,
            borderRadius: 50,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>X</Text>
        </TouchableOpacity>
      </View>
    )}

    {image && !result && (
      <TouchableOpacity onPress={analyzeImage} disabled={analyzing} style={styles.button}>
        {analyzing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "bold" }}>AI Verify</Text>}
      </TouchableOpacity>
    )}

    {result && (
      <View style={{ backgroundColor: "#111", padding: 16, borderRadius: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "bold", marginBottom: 8 }}>Verified by EcoMap AI</Text>
        <Text style={{ color: "#aaa" }}>
          Waste Type: <Text style={{ color: "#fff" }}>{result.type}</Text>
        </Text>
        <Text style={{ color: "#aaa" }}>
          Severity:{" "}
          <Text style={{ color: result.severity === "High" || result.severity === "Critical" ? "red" : "orange" }}>
            {result.severity}
          </Text>
        </Text>
        <Text style={{ color: "#aaa", marginVertical: 8 }}>
          Action: <Text style={{ color: "#fff" }}>{result.action}</Text>
        </Text>

        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Submit Report (+50 Pts)</Text>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
);
}