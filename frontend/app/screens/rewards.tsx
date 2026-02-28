import React, { useState } from "react";
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
import { redeemReward } from "../../services/api";
import { useDataCache } from "../../contexts/DataCache";
import ResultModal from "../../components/ResultModal";

type Reward = {
  reward_id: string;
  name: string;
  description: string;
  points_required: number;
  stock: number;
  icon: string;
  partner_name: string;
};

export default function RewardsScreen() {
  const { profile, refreshProfile } = useAuth();
  const { rewards, rewardsLoading, refreshRewards } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    success: boolean;
    title: string;
    message: string;
    detail?: string;
    detailIcon?: string;
  }>({ success: false, title: "", message: "" });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshRewards(), refreshProfile()]);
    setRefreshing(false);
  };

  const handleRedeem = async (reward: Reward) => {
    if (!profile?.uid) return;

    const pts = profile.eco_points_balance ?? 0;
    if (pts < reward.points_required) {
      setModalData({
        success: false,
        title: "Not Enough Points",
        message: `You need ${reward.points_required - pts} more eco-points to redeem this reward.`,
        detail: `${pts} / ${reward.points_required} pts`,
        detailIcon: "alert-circle",
      });
      setModalVisible(true);
      return;
    }

    setRedeeming(reward.reward_id);
    try {
      // Try backend first
      const result = await redeemReward(profile.uid, reward.reward_id);
      await refreshProfile();
      const code = result.code || `ECO-${Math.floor(Math.random() * 10000)}`;
      setModalData({
        success: true,
        title: "Reward Redeemed!",
        message: `Show this code to claim your ${reward.name}:`,
        detail: code,
        detailIcon: "gift",
      });
      setModalVisible(true);
      refreshRewards();
    } catch {
      // Backend rejected — show error instead of faking success
      setModalData({
        success: false,
        title: "Redemption Failed",
        message: "Could not redeem this reward. Please try again later.",
        detailIcon: "alert-circle",
      });
      setModalVisible(true);
    } finally {
      setRedeeming(null);
    }
  };

  const points = profile?.eco_points_balance ?? 0;

  if (rewardsLoading) {
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
                {item.partner_name ? (
                  <View style={styles.partnerBadge}>
                    <Ionicons name="storefront-outline" size={10} color="#84cc16" />
                    <Text style={styles.partnerText}>{item.partner_name}</Text>
                  </View>
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

      <ResultModal
        visible={modalVisible}
        success={modalData.success}
        title={modalData.title}
        message={modalData.message}
        detail={modalData.detail}
        detailIcon={modalData.detailIcon as any}
        onDismiss={() => setModalVisible(false)}
      />
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
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(132,204,22,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  partnerText: { fontSize: 9, color: "#84cc16", fontWeight: "600" },
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