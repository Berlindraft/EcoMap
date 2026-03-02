import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { purchaseTokens, fetchTokenTransactions } from "../../services/api";

type Transaction = {
  transaction_id: string;
  type: string;
  amount: number;
  php_amount: number;
  created_at: string;
};

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

export default function BuyTokensScreen() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [buyAmount, setBuyAmount] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userTokens = profile?.eco_tokens_balance ?? 0;

  const loadTransactions = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const data = await fetchTokenTransactions(profile.uid);
      setTransactions(data.filter((t: Transaction) => t.type === "purchase"));
    } catch (err) {
      console.log("Error loading transactions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.uid]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleBuy = async () => {
    const amount = parseInt(buyAmount);
    if (!profile?.uid || !amount || amount < 1) return;
    setPurchasing(true);
    try {
      await purchaseTokens(profile.uid, amount);
      if (refreshProfile) await refreshProfile();
      setBuyAmount("");
      loadTransactions();
      Alert.alert("Tokens Purchased! 💎", `${amount} Eco Tokens added to your balance.`);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Purchase failed.");
    } finally {
      setPurchasing(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTransactions(); }} tintColor="#84cc16" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Eco Tokens</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Current Balance */}
      <View style={styles.balanceCard}>
        <Ionicons name="diamond" size={28} color="#84cc16" />
        <Text style={styles.balanceValue}>{userTokens}</Text>
        <Text style={styles.balanceLabel}>Eco Tokens</Text>
        <Text style={styles.balanceSub}>= ₱{userTokens} PHP</Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#60a5fa" />
        <Text style={styles.infoText}>1 Eco Token = ₱1 (PHP). Tokens are used to reward workers who complete your jobs.</Text>
      </View>

      {/* Preset Amounts */}
      <Text style={styles.sectionLabel}>Select Amount</Text>
      <View style={styles.presetGrid}>
        {PRESET_AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[styles.presetChip, buyAmount === String(amt) && styles.presetActive]}
            onPress={() => setBuyAmount(String(amt))}
          >
            <Text style={[styles.presetAmount, buyAmount === String(amt) && styles.presetAmountActive]}>
              {amt}
            </Text>
            <Text style={[styles.presetPeso, buyAmount === String(amt) && styles.presetPesoActive]}>
              ₱{amt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Amount */}
      <Text style={styles.sectionLabel}>Or Enter Custom Amount</Text>
      <View style={styles.customRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputPrefix}>₱</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="Enter amount"
            placeholderTextColor="#71717a"
            value={buyAmount}
            onChangeText={setBuyAmount}
            keyboardType="numeric"
          />
        </View>
      </View>

      {parseInt(buyAmount) > 0 && (
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You Pay</Text>
            <Text style={styles.summaryValue}>₱{buyAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You Get</Text>
            <Text style={[styles.summaryValue, { color: "#84cc16" }]}>
              💎 {buyAmount} Eco Tokens
            </Text>
          </View>
        </View>
      )}

      {/* Buy Button */}
      <TouchableOpacity
        style={[styles.buyBtn, (!buyAmount || purchasing) && { opacity: 0.5 }]}
        onPress={handleBuy}
        disabled={!buyAmount || purchasing}
      >
        {purchasing ? <ActivityIndicator color="#000" /> : (
          <Text style={styles.buyBtnText}>
            Buy {buyAmount || "0"} Tokens
          </Text>
        )}
      </TouchableOpacity>

      {/* Purchase History */}
      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Purchase History</Text>
      {loading ? (
        <ActivityIndicator color="#84cc16" style={{ marginTop: 16 }} />
      ) : transactions.length === 0 ? (
        <Text style={styles.emptyText}>No purchases yet.</Text>
      ) : (
        transactions.slice(0, 15).map((tx) => (
          <View key={tx.transaction_id} style={styles.txRow}>
            <Ionicons name="arrow-down-circle" size={18} color="#84cc16" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.txLabel}>Purchased {tx.amount} tokens</Text>
              <Text style={styles.txTime}>{timeAgo(tx.created_at)}</Text>
            </View>
            <Text style={styles.txCost}>₱{tx.php_amount}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#27272a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },

  balanceCard: {
    backgroundColor: "#18181b", borderRadius: 20, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "#84cc1630", marginBottom: 16, gap: 4,
  },
  balanceValue: { fontSize: 36, fontWeight: "800", color: "#fff" },
  balanceLabel: { fontSize: 13, color: "#d4d4d8", fontWeight: "600" },
  balanceSub: { fontSize: 12, color: "#71717a" },

  infoBox: {
    flexDirection: "row", gap: 8, backgroundColor: "rgba(96,165,250,0.08)",
    borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#60a5fa20",
  },
  infoText: { flex: 1, color: "#93c5fd", fontSize: 12, lineHeight: 18 },

  sectionLabel: { color: "#d4d4d8", fontSize: 13, fontWeight: "600", marginBottom: 10 },

  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  presetChip: {
    width: "30%", flexGrow: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center",
    backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a",
  },
  presetActive: { borderColor: "#84cc16", backgroundColor: "rgba(132,204,22,0.08)" },
  presetAmount: { fontSize: 18, fontWeight: "700", color: "#d4d4d8" },
  presetAmountActive: { color: "#84cc16" },
  presetPeso: { fontSize: 11, color: "#71717a", marginTop: 2 },
  presetPesoActive: { color: "#84cc1690" },

  customRow: { marginBottom: 16 },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  inputPrefix: { color: "#84cc16", fontSize: 20, fontWeight: "700", marginRight: 8 },
  amountInput: {
    flex: 1, backgroundColor: "#18181b", borderColor: "#27272a", borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: "#fff", fontSize: 16,
  },

  summaryBox: {
    backgroundColor: "#18181b", borderRadius: 14, padding: 14, marginBottom: 4,
    borderWidth: 1, borderColor: "#27272a",
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { color: "#9ca3af", fontSize: 13 },
  summaryValue: { color: "#fff", fontSize: 14, fontWeight: "700" },

  buyBtn: {
    backgroundColor: "#84cc16", paddingVertical: 16, borderRadius: 16,
    alignItems: "center", marginTop: 16,
  },
  buyBtnText: { color: "#000", fontSize: 16, fontWeight: "700" },

  emptyText: { color: "#71717a", fontSize: 13, textAlign: "center", marginTop: 12 },

  txRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10,
    borderBottomWidth: 1, borderColor: "#18181b",
  },
  txLabel: { color: "#d4d4d8", fontSize: 13, fontWeight: "500" },
  txTime: { color: "#71717a", fontSize: 10 },
  txCost: { color: "#84cc16", fontSize: 14, fontWeight: "700" },
});
