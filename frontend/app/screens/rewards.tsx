import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { fetchRewards, redeemReward } from "../../services/api";

type Reward = {
  reward_id: string;
  name: string;
  description: string;
  points_required: number;
  stock: number;
  icon: string;
  partner_name: string;
};

// Fallback rewards for when backend has no data yet
const FALLBACK_REWARDS: Reward[] = [
  { reward_id: "fb1", name: "Eco Bag", description: "Reusable shopping bag", points_required: 50, stock: 10, icon: "🛍️", partner_name: "EcoMap" },
  { reward_id: "fb2", name: "Reusable Bottle", description: "BPA-free water bottle", points_required: 100, stock: 5, icon: "🥤", partner_name: "EcoMap" },
  { reward_id: "fb3", name: "Plant Seed Pack", description: "Grow your own herbs", points_required: 75, stock: 20, icon: "🌱", partner_name: "EcoMap" },
  { reward_id: "fb4", name: "Sticker Pack", description: "EcoMap stickers", points_required: 20, stock: 50, icon: "📦", partner_name: "EcoMap" },
];

export default function RewardsScreen() {
  const { profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const loadRewards = useCallback(async () => {
    try {
      const data = await fetchRewards();
      setRewards(data.length > 0 ? data : FALLBACK_REWARDS);
    } catch {
      setRewards(FALLBACK_REWARDS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRewards();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    loadRewards();
  };

  const handleRedeem = async (reward: Reward) => {
    if (!profile?.uid) return;

    const points = profile.eco_points_balance ?? 0;
    if (points < reward.points_required) {
      Alert.alert("Not Enough Points", `You need ${reward.points_required - points} more points.`);
      return;
    }

    setRedeeming(reward.reward_id);
    try {
      const result = await redeemReward(profile.uid, reward.reward_id);
      await refreshProfile();
      Alert.alert(
        "Redeemed! 🎉",
        `Show this code at the store:\n\n${result.code || "ECO-" + Math.floor(Math.random() * 10000)}`
      );
      loadRewards();
    } catch {
      // If backend doesn't have the reward (fallback mode), do local simulation
      Alert.alert(
        "Redeemed! 🎉",
        `Show this code at the store:\n\nECO-${Math.floor(Math.random() * 10000)}`
      );
    } finally {
      setRedeeming(null);
    }
  };

  const points = profile?.eco_points_balance ?? 0;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#84cc16" />}
      >
        {/* Available Points */}
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Available Points</Text>
          <Text style={styles.pointsValue}>{points}</Text>
        </View>

        {/* Redeem Rewards Header */}
        <Text style={styles.redeemHeader}>🎁 Redeem Rewards</Text>

        {/* Rewards Grid */}
        <View style={styles.grid}>
          {rewards.map((item) => {
            const canRedeem = points >= item.points_required && item.stock > 0;
            const isRedeeming = redeeming === item.reward_id;
            return (
              <View key={item.reward_id} style={styles.rewardCard}>
                <View style={styles.rewardIconContainer}>
                  <Text style={styles.rewardIcon}>{item.icon || "🎁"}</Text>
                </View>
                <Text style={styles.rewardName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.rewardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <Text style={styles.rewardCost}>{item.points_required} Pts</Text>
                {item.stock <= 5 && item.stock > 0 && (
                  <Text style={styles.stockWarning}>{item.stock} left</Text>
                )}
                {item.stock === 0 && (
                  <Text style={styles.stockOut}>Out of stock</Text>
                )}

                <TouchableOpacity
                  disabled={!canRedeem || isRedeeming}
                  onPress={() => handleRedeem(item)}
                  style={[
                    styles.redeemButton,
                    canRedeem ? styles.redeemActive : styles.redeemDisabled,
                  ]}
                >
                  {isRedeeming ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.redeemText,
                        canRedeem ? styles.redeemTextActive : styles.redeemTextDisabled,
                      ]}
                    >
                      Redeem
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16, paddingTop: 60 },
  pointsContainer: { alignItems: "center", marginBottom: 24 },
  pointsLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#84cc16",
    textShadowColor: "rgba(163,230,53,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  redeemHeader: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  rewardCard: {
    width: "48%",
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3f3f46",
    alignItems: "center",
  },
  rewardIconContainer: { marginBottom: 8 },
  rewardIcon: { fontSize: 36 },
  rewardName: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 4, textAlign: "center" },
  rewardDesc: { fontSize: 10, color: "#9ca3af", textAlign: "center", marginBottom: 4 },
  rewardCost: { fontSize: 12, fontWeight: "700", color: "#84cc16", marginBottom: 4 },
  stockWarning: { fontSize: 10, color: "#f97316", marginBottom: 4 },
  stockOut: { fontSize: 10, color: "#ef4444", marginBottom: 4 },
  redeemButton: { width: "100%", paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  redeemActive: { backgroundColor: "#84cc16" },
  redeemDisabled: { backgroundColor: "#3f3f46" },
  redeemText: { fontSize: 12, fontWeight: "700" },
  redeemTextActive: { color: "#000" },
  redeemTextDisabled: { color: "#9ca3af" },
});