import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";
import { useDataCache } from "../../contexts/DataCache";
import { createJob, uploadImage } from "../../services/api";

const JOB_TYPES = [
  { id: "cleanup", label: "Cleanup", icon: "leaf-outline" as const, color: "#84cc16" },
  { id: "segregation", label: "Segregation", icon: "layers-outline" as const, color: "#60a5fa" },
  { id: "hauling", label: "Hauling", icon: "car-outline" as const, color: "#fb923c" },
];

const CREDITS_PER_POST = 10;

export default function PostJobScreen() {
  const { profile, refreshProfile } = useAuth();
  const { refreshJobs, refreshPendingJobs } = useDataCache();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("cleanup");
  const [tokenReward, setTokenReward] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const userTokens = profile?.eco_tokens_balance ?? 0;
  const userCredits = profile?.credits_balance ?? 15;
  const rewardAmount = parseInt(tokenReward) || 0;

  const canPost = title.length > 0 && userCredits >= CREDITS_PER_POST && userTokens >= rewardAmount;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!profile?.uid || !title) return;

    if (userCredits < CREDITS_PER_POST) {
      Alert.alert("Insufficient Credits", `You need ${CREDITS_PER_POST} credits to post a job. You have ${userCredits}.`);
      return;
    }
    if (rewardAmount > 0 && userTokens < rewardAmount) {
      Alert.alert("Insufficient Tokens", `You need ${rewardAmount} tokens for the reward. You have ${userTokens}.`);
      return;
    }

    setPosting(true);
    try {
      let imageUrl = "";
      if (imageUri) {
        const uploaded = await uploadImage(imageUri);
        imageUrl = uploaded.url || "";
      }

      await createJob({
        posted_by: profile.uid,
        title,
        description,
        location: location || "Cebu City",
        job_type: jobType,
        token_reward: rewardAmount,
        credits_cost: CREDITS_PER_POST,
        image_url: imageUrl,
      });

      if (refreshProfile) await refreshProfile();
      await Promise.all([refreshJobs(), refreshPendingJobs()]);

      Alert.alert(
        "Job Submitted! 🎉",
        "Your job posting is pending admin approval. You'll be notified once approved.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      const msg = err?.message || "Failed to post job.";
      Alert.alert("Error", msg);
    } finally {
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post a Job</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceRow}>
          <View style={[styles.balanceCard, { borderColor: "#84cc16" }]}>
            <Ionicons name="diamond-outline" size={18} color="#84cc16" />
            <Text style={styles.balanceValue}>{userTokens}</Text>
            <Text style={styles.balanceLabel}>Eco Tokens</Text>
          </View>
          <View style={[styles.balanceCard, { borderColor: "#60a5fa" }]}>
            <Ionicons name="ticket-outline" size={18} color="#60a5fa" />
            <Text style={styles.balanceValue}>{userCredits}</Text>
            <Text style={styles.balanceLabel}>Credits</Text>
          </View>
        </View>

        {/* Cost info */}
        <View style={styles.costInfo}>
          <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
          <Text style={styles.costText}>Posting costs {CREDITS_PER_POST} credits</Text>
        </View>

        {/* Job Type */}
        <Text style={styles.sectionLabel}>Job Type</Text>
        <View style={styles.typeRow}>
          {JOB_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeChip, jobType === t.id && { borderColor: t.color, backgroundColor: `${t.color}15` }]}
              onPress={() => setJobType(t.id)}
            >
              <Ionicons name={t.icon} size={16} color={jobType === t.id ? t.color : "#9ca3af"} />
              <Text style={[styles.typeLabel, jobType === t.id && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.sectionLabel}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Help segregate household waste"
          placeholderTextColor="#71717a"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
          placeholder="Describe the task, requirements, and timeline..."
          placeholderTextColor="#71717a"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Location */}
        <Text style={styles.sectionLabel}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Cebu City"
          placeholderTextColor="#71717a"
          value={location}
          onChangeText={setLocation}
        />

        {/* Token Reward */}
        <Text style={styles.sectionLabel}>Eco Token Reward</Text>
        <View style={styles.tokenInputRow}>
          <Ionicons name="diamond" size={18} color="#84cc16" style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="0 (leave empty for volunteer)"
            placeholderTextColor="#71717a"
            value={tokenReward}
            onChangeText={setTokenReward}
            keyboardType="numeric"
          />
        </View>
        {rewardAmount > 0 && (
          <Text style={styles.tokenNote}>
            = ₱{rewardAmount} worth • Deducted from your token balance
          </Text>
        )}

        {/* Image */}
        <Text style={styles.sectionLabel}>Photo</Text>
        {imageUri ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImg} />
            <TouchableOpacity style={styles.removeImg} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageButtonsRow}>
            <TouchableOpacity style={styles.imgBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={22} color="#84cc16" />
              <Text style={styles.imgBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imgBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color="#84cc16" />
              <Text style={styles.imgBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!canPost || posting) && { opacity: 0.5 }]}
          onPress={handlePost}
          disabled={!canPost || posting}
        >
          {posting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitText}>Submit for Approval</Text>
          )}
        </TouchableOpacity>

        {!canPost && title.length > 0 && (
          <Text style={styles.errorHint}>
            {userCredits < CREDITS_PER_POST
              ? "Not enough credits. Convert eco points or earn more."
              : rewardAmount > userTokens
              ? "Not enough tokens. Buy tokens first."
              : ""}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#27272a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },

  balanceRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  balanceCard: {
    flex: 1, backgroundColor: "#18181b", borderRadius: 16, padding: 14,
    alignItems: "center", borderWidth: 1, gap: 4,
  },
  balanceValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  balanceLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },

  costInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20, paddingHorizontal: 4 },
  costText: { color: "#9ca3af", fontSize: 12 },

  sectionLabel: { color: "#d4d4d8", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 14 },

  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: "#18181b", borderWidth: 1, borderColor: "#3f3f46",
  },
  typeLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af" },

  input: {
    backgroundColor: "#18181b", borderColor: "#3f3f46", borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: "#fff", fontSize: 14, marginBottom: 4,
  },

  tokenInputRow: { flexDirection: "row", alignItems: "center" },
  tokenNote: { color: "#84cc16", fontSize: 11, marginTop: 4, marginLeft: 26 },

  imagePreview: { position: "relative", marginTop: 4 },
  previewImg: { width: "100%", height: 200, borderRadius: 12 },
  removeImg: { position: "absolute", top: 8, right: 8 },

  imageButtonsRow: { flexDirection: "row", gap: 12 },
  imgBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, backgroundColor: "#18181b",
    borderRadius: 12, borderWidth: 1, borderColor: "#3f3f46",
  },
  imgBtnText: { color: "#84cc16", fontSize: 13, fontWeight: "600" },

  submitBtn: {
    backgroundColor: "#84cc16", paddingVertical: 16, borderRadius: 16,
    alignItems: "center", marginTop: 28,
  },
  submitText: { color: "#000", fontSize: 16, fontWeight: "700" },

  errorHint: { color: "#ef4444", fontSize: 12, textAlign: "center", marginTop: 8 },
});
