import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useDataCache } from "../../contexts/DataCache";
import { convertPointsToCredits } from "../../services/api";

const PRESET_POINTS = [5, 10, 25, 50, 100];

export default function ConvertPointsScreen() {
  const { profile, refreshProfile } = useAuth();
  const { refreshTokens } = useDataCache();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [converting, setConverting] = useState(false);

  const userPoints = profile?.eco_points_balance ?? 0;
  const userCredits = profile?.credits_balance ?? 15;
  const pointsNum = parseInt(amount) || 0;
  const creditsGained = Math.floor(pointsNum / 5);
  const isValid = pointsNum >= 5 && pointsNum % 5 === 0 && pointsNum <= userPoints;

  const handleConvert = async () => {
    if (!profile?.uid || !isValid) return;
    setConverting(true);
    try {
      await convertPointsToCredits(profile.uid, pointsNum);
      if (refreshProfile) await refreshProfile();
      await refreshTokens();
      setAmount("");
      Alert.alert("Converted! ✅", `${pointsNum} points → ${creditsGained} credits`);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Conversion failed.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Convert Points</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceRow}>
        <View style={[styles.balCard, { borderColor: "#fbbf24" }]}>
          <Ionicons name="star" size={24} color="#fbbf24" />
          <Text style={styles.balVal}>{userPoints}</Text>
          <Text style={styles.balLbl}>Eco Points</Text>
        </View>
        <View style={styles.arrowBox}>
          <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
        </View>
        <View style={[styles.balCard, { borderColor: "#60a5fa" }]}>
          <Ionicons name="ticket" size={24} color="#60a5fa" />
          <Text style={styles.balVal}>{userCredits}</Text>
          <Text style={styles.balLbl}>Credits</Text>
        </View>
      </View>

      {/* Conversion Rate */}
      <View style={styles.rateBox}>
        <View style={styles.rateItem}>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={styles.rateText}>5 Eco Points</Text>
        </View>
        <Ionicons name="swap-horizontal" size={18} color="#9ca3af" />
        <View style={styles.rateItem}>
          <Ionicons name="ticket" size={14} color="#60a5fa" />
          <Text style={styles.rateText}>1 Credit</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#60a5fa" />
        <Text style={styles.infoText}>Credits are required to post job listings. Each post costs 10 credits. This prevents spam and abuse.</Text>
      </View>

      {/* Preset Amounts */}
      <Text style={styles.sectionLabel}>Quick Select (Points)</Text>
      <View style={styles.presetRow}>
        {PRESET_POINTS.filter(p => p <= userPoints).map((pts) => (
          <TouchableOpacity
            key={pts}
            style={[styles.presetChip, amount === String(pts) && styles.presetActive]}
            onPress={() => setAmount(String(pts))}
          >
            <Text style={[styles.presetVal, amount === String(pts) && styles.presetValActive]}>{pts}</Text>
            <Text style={[styles.presetSub, amount === String(pts) && styles.presetSubActive]}>
              → {Math.floor(pts / 5)} cr
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Input */}
      <Text style={styles.sectionLabel}>Custom Amount</Text>
      <View style={styles.inputRow}>
        <Ionicons name="star" size={18} color="#fbbf24" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder={`Enter points (max ${userPoints})`}
          placeholderTextColor="#71717a"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      {pointsNum > 0 && (
        <View style={styles.resultBox}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Points to Convert</Text>
            <Text style={styles.resultVal}>⭐ {pointsNum}</Text>
          </View>
          <View style={[styles.resultRow, { borderTopWidth: 1, borderColor: "#27272a", paddingTop: 8 }]}>
            <Text style={styles.resultLabel}>Credits You'll Get</Text>
            <Text style={[styles.resultVal, { color: "#60a5fa", fontSize: 18 }]}>🎫 {creditsGained}</Text>
          </View>
          {pointsNum % 5 !== 0 && (
            <Text style={styles.warnText}>⚠ Points must be a multiple of 5</Text>
          )}
          {pointsNum > userPoints && (
            <Text style={styles.warnText}>⚠ You only have {userPoints} points</Text>
          )}
        </View>
      )}

      {/* Convert Button */}
      <TouchableOpacity
        style={[styles.convertBtn, (!isValid || converting) && { opacity: 0.5 }]}
        onPress={handleConvert}
        disabled={!isValid || converting}
      >
        {converting ? <ActivityIndicator color="#000" /> : (
          <Text style={styles.convertBtnText}>
            Convert {pointsNum} Points → {creditsGained} Credits
          </Text>
        )}
      </TouchableOpacity>

      {/* Max convert button */}
      {userPoints >= 5 && (
        <TouchableOpacity
          style={styles.maxBtn}
          onPress={() => setAmount(String(Math.floor(userPoints / 5) * 5))}
        >
          <Text style={styles.maxBtnText}>Use Max ({Math.floor(userPoints / 5) * 5} pts → {Math.floor(userPoints / 5)} credits)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#27272a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },

  balanceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  balCard: {
    flex: 1, backgroundColor: "#18181b", borderRadius: 16, padding: 16,
    alignItems: "center", borderWidth: 1, gap: 4,
  },
  balVal: { fontSize: 26, fontWeight: "800", color: "#fff" },
  balLbl: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  arrowBox: { padding: 8 },

  rateBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    backgroundColor: "#18181b", borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: "#27272a",
  },
  rateItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  rateText: { color: "#d4d4d8", fontSize: 13, fontWeight: "600" },

  infoBox: {
    flexDirection: "row", gap: 8, backgroundColor: "rgba(96,165,250,0.08)",
    borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#60a5fa20",
  },
  infoText: { flex: 1, color: "#93c5fd", fontSize: 12, lineHeight: 18 },

  sectionLabel: { color: "#d4d4d8", fontSize: 13, fontWeight: "600", marginBottom: 10 },

  presetRow: { flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  presetChip: {
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center",
    backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", minWidth: 60,
  },
  presetActive: { borderColor: "#60a5fa", backgroundColor: "rgba(96,165,250,0.08)" },
  presetVal: { fontSize: 16, fontWeight: "700", color: "#d4d4d8" },
  presetValActive: { color: "#60a5fa" },
  presetSub: { fontSize: 10, color: "#71717a", marginTop: 2 },
  presetSubActive: { color: "#60a5fa90" },

  inputRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  input: {
    flex: 1, backgroundColor: "#18181b", borderColor: "#27272a", borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: "#fff", fontSize: 16,
  },

  resultBox: {
    backgroundColor: "#18181b", borderRadius: 14, padding: 14, marginBottom: 4,
    borderWidth: 1, borderColor: "#27272a",
  },
  resultRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  resultLabel: { color: "#9ca3af", fontSize: 13 },
  resultVal: { color: "#fff", fontSize: 14, fontWeight: "700" },
  warnText: { color: "#ef4444", fontSize: 11, marginTop: 4 },

  convertBtn: {
    backgroundColor: "#60a5fa", paddingVertical: 16, borderRadius: 16,
    alignItems: "center", marginTop: 16,
  },
  convertBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },

  maxBtn: { alignItems: "center", marginTop: 12 },
  maxBtnText: { color: "#60a5fa", fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
});
