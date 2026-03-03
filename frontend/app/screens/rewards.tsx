import React, { useState, useEffect } from "react";
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
import { redeemReward, fetchAllUsers } from "../../services/api";
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

type LeaderboardUser = {
  uid: string;
  full_name: string;
  eco_points_balance: number;
};

export default function RewardsScreen() {
  const { profile, refreshProfile } = useAuth();
  const { rewards, rewardsLoading, refreshRewards } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [leaderboardTop10, setLeaderboardTop10] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [modalData, setModalData] = useState<{
    success: boolean;
    title: string;
    message: string;
    detail?: string;
    detailIcon?: string;
  }>({ success: false, title: "", message: "" });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const users = await fetchAllUsers();
      const sorted = (users as LeaderboardUser[]).sort(
        (a, b) => (b.eco_points_balance || 0) - (a.eco_points_balance || 0)
      );
      setLeaderboardTop10(sorted.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshRewards(), refreshProfile(), fetchLeaderboard()]);
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

        {/* Top 10 Leaderboard */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.leaderboardHeader}>🏆 Top 10 Leaderboard</Text>
          {leaderboardLoading ? (
            <ActivityIndicator color="#84cc16" size="small" style={{ marginVertical: 12 }} />
          ) : leaderboardTop10.length > 0 ? (
            <>
              {/* Top 3 Horizontal */}
              <View style={styles.topRankingsContainer}>
                {leaderboardTop10.slice(0, 3).map((user, index) => (
                  <View key={user.uid} style={styles.rankingCard}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                      <Text style={styles.medalIcon}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </Text>
                    </View>
                    <View style={styles.rankingInfo}>
                      <Text style={styles.rankingName} numberOfLines={1}>{user.full_name}</Text>
                      <Text style={styles.rankingPoints}>{user.eco_points_balance} pts</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Top 4-10 Vertical */}
              {leaderboardTop10.length > 3 && (
                <>
                  <View style={styles.leaderboardHeaderRow}>
                    <View style={styles.leaderboardRank}>
                      <Text style={styles.leaderboardHeaderCell}>Rank</Text>
                    </View>
                    <View style={styles.leaderboardUserInfo}>
                      <Text style={styles.leaderboardHeaderCell}>Name</Text>
                    </View>
                    <View style={styles.leaderboardPointsContainer}>
                      <Text style={[styles.leaderboardHeaderCell, { textAlign: "right" }]}>Points</Text>
                    </View>
                  </View>
                  <View style={styles.leaderboardList}>
                    {leaderboardTop10.slice(3).map((user, index) => (
                      <View key={user.uid} style={styles.leaderboardRow}>
                        <View style={styles.leaderboardRank}>
                          <Text style={styles.leaderboardRankNumber}>{index + 4}</Text>
                        </View>
                        <View style={styles.leaderboardUserInfo}>
                          <Text style={styles.leaderboardUserName} numberOfLines={1}>
                            {user.full_name}
                          </Text>
                        </View>
                        <View style={styles.leaderboardPointsContainer}>
                          <Text style={styles.leaderboardPoints}>{user.eco_points_balance}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>No users yet</Text>
          )}
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
  leaderboardSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  leaderboardHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  topRankingsContainer: {
    gap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rankingCard: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#27272a",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#3f3f46",
    minWidth: "30%",
  },
  rankBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(132, 204, 22, 0.1)",
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: "900",
    color: "#84cc16",
  },
  medalIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  rankingInfo: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  rankingName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  rankingPoints: {
    fontSize: 11,
    color: "#84cc16",
    fontWeight: "600",
  },
  leaderboardList: {
    backgroundColor: "#27272a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3f3f46",
    overflow: "hidden",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3f3f46",
  },
  leaderboardRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(132, 204, 22, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  leaderboardRankNumber: {
    fontSize: 12,
    fontWeight: "900",
    color: "#84cc16",
  },
  leaderboardUserInfo: {
    flex: 1,
  },
  leaderboardUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  leaderboardPointsContainer: {
    alignItems: "flex-end",
  },
  leaderboardPoints: {
    fontSize: 14,
    fontWeight: "700",
    color: "#84cc16",
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 24,
  },
  leaderboardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    backgroundColor: "rgba(132, 204, 22, 0.1)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: -1,
  },
  leaderboardHeaderCell: {
    fontSize: 11,
    fontWeight: "700",
    color: "#84cc16",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});