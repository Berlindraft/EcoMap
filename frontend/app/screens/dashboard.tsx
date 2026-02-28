import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useDataCache } from "../../contexts/DataCache";

type Stats = {
  total_users: number;
  total_reports: number;
  total_cleaned: number;
  total_points_distributed: number;
  total_rewards_redeemed: number;
  total_jobs: number;
  total_products: number;
  recent_reports: any[];
  recent_redemptions: any[];
};

export default function DashboardScreen() {
  const { profile } = useAuth();
  const role = profile?.role || "user";
  const isAdmin = role === "admin";

  const {
    dashboardStats: stats,
    products: cachedProducts,
    dashboardLoading,
    refreshDashboard,
    refreshProducts,
  } = useDataCache();
  const partnerProductCount = cachedProducts.filter(
    (p: any) => p.partner_id === profile?.uid
  ).length;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDashboard(), refreshProducts()]);
    setRefreshing(false);
  };

  const timeAgo = (d: string) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (dashboardLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  // Build stat cards based on role
  const statCards: { icon: string; label: string; value: number | string; color: string }[] = [];

  if (isAdmin) {
    statCards.push(
      { icon: "people", label: "Total Users", value: stats?.total_users ?? 0, color: "#3b82f6" },
      { icon: "document-text", label: "Total Reports", value: stats?.total_reports ?? 0, color: "#f97316" },
      { icon: "checkmark-circle", label: "Cleaned", value: stats?.total_cleaned ?? 0, color: "#84cc16" },
      { icon: "leaf", label: "Points Given", value: stats?.total_points_distributed ?? 0, color: "#a3e635" },
      { icon: "gift", label: "Redemptions", value: stats?.total_rewards_redeemed ?? 0, color: "#ec4899" },
      { icon: "briefcase", label: "Jobs", value: stats?.total_jobs ?? 0, color: "#8b5cf6" },
      { icon: "storefront", label: "Products", value: stats?.total_products ?? 0, color: "#14b8a6" },
    );
  } else {
    // Partner: limited view
    statCards.push(
      { icon: "storefront", label: "My Products", value: partnerProductCount, color: "#f97316" },
      { icon: "gift", label: "Redemptions", value: stats?.total_rewards_redeemed ?? 0, color: "#ec4899" },
      { icon: "document-text", label: "Total Reports", value: stats?.total_reports ?? 0, color: "#3b82f6" },
      { icon: "checkmark-circle", label: "Cleaned", value: stats?.total_cleaned ?? 0, color: "#84cc16" },
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#84cc16" />}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isAdmin ? "Admin Dashboard" : "Partner Dashboard"}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stat Cards Grid — 2 columns */}
        <View style={s.grid}>
          {statCards.map((c, i) => (
            <View key={i} style={s.statCard}>
              <Ionicons name={c.icon as any} size={50} color={c.color} style={s.statBgIcon} />
              <View style={s.statRow}>
                <View style={[s.statIconWrap, { backgroundColor: `${c.color}20` }]}>
                  <Ionicons name={c.icon as any} size={18} color={c.color} />
                </View>
                <Text style={s.statValue}>{c.value}</Text>
              </View>
              <Text style={s.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          {isAdmin && (
            <TouchableOpacity style={s.actionRow} onPress={() => router.push("/screens/user-management" as any)}>
              <View style={[s.actionIcon, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                <Ionicons name="people" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.actionTitle}>Manage Users</Text>
                <Text style={s.actionSub}>View users, approve partners</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.actionRow} onPress={() => router.push("/screens/partner-products" as any)}>
            <View style={[s.actionIcon, { backgroundColor: "rgba(249,115,22,0.15)" }]}>
              <Ionicons name="storefront" size={20} color="#f97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionTitle}>Products</Text>
              <Text style={s.actionSub}>Manage product listings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Recent Reports (Admin only) */}
        {isAdmin && stats && stats.recent_reports.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Reports</Text>
            {stats.recent_reports.map((r: any) => (
              <View key={r.report_id} style={s.listItem}>
                <View style={[s.dot, { backgroundColor: r.severity === "critical" ? "#ef4444" : r.severity === "high" ? "#f97316" : "#3b82f6" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>{r.waste_type} — {r.severity}</Text>
                  <Text style={s.listSub}>{r.description || "No description"}</Text>
                </View>
                <Text style={s.listTime}>{timeAgo(r.created_at)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Redemptions (Admin only) */}
        {isAdmin && stats && stats.recent_redemptions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Redemptions</Text>
            {stats.recent_redemptions.map((r: any) => (
              <View key={r.redemption_id} style={s.listItem}>
                <Ionicons name="gift" size={18} color="#ec4899" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.listTitle}>{r.reward_name}</Text>
                  <Text style={s.listSub}>Code: {r.code}</Text>
                </View>
                <Text style={s.listTime}>{timeAgo(r.redeemed_at)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#18181b",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    backgroundColor: "#27272a",
    borderRadius: 16,
    padding: 12,
    width: "47%",
    flexGrow: 1,
    marginHorizontal: 2,
    overflow: "hidden",
  },
  statBgIcon: { position: "absolute", top: -8, right: -8, opacity: 0.15 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#9ca3af", fontSize: 10, fontWeight: "600", marginTop: 4 },
  section: {
    backgroundColor: "#27272a",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#3f3f46",
    gap: 12,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  actionSub: { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    gap: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  listTitle: { color: "#d4d4d8", fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  listSub: { color: "#666", fontSize: 11, marginTop: 1 },
  listTime: { color: "#555", fontSize: 10 },
});
