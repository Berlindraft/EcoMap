import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useDataCache } from "../../contexts/DataCache";

const { width } = Dimensions.get("window");
const AD_WIDTH = width - 32;
const AD_HEIGHT = 70;

// ── Ad data (replace with real ads / fetch from backend later) ──
const ADS = [
  {
    id: "1",
    gradient: ["#84cc16", "#15803d"] as [string, string],
    icon: "leaf" as const,
    title: "Go Green with EcoMap!",
    subtitle: "Earn points for every cleanup report you submit.",
  },
  {
    id: "2",
    gradient: ["#3b82f6", "#1e40af"] as [string, string],
    icon: "gift" as const,
    title: "Redeem Eco-Rewards",
    subtitle: "Use your points for discounts at partner stores.",
  },
  {
    id: "3",
    gradient: ["#f97316", "#c2410c"] as [string, string],
    icon: "briefcase" as const,
    title: "TrashCare Jobs",
    subtitle: "Help your community and earn income or points.",
  },
  {
    id: "4",
    gradient: ["#ec4899", "#9d174d"] as [string, string],
    icon: "people" as const,
    title: "Invite Friends",
    subtitle: "Grow the EcoMap community in Cebu!",
  },
];

type Report = {
  report_id: string;
  user_id: string;
  waste_type: string;
  status: string;
  severity: string;
  description: string;
  created_at: string;
  geo_lat: number;
  geo_lng: number;
};

export default function HomeScreen() {
  const { profile, refreshProfile, logout } = useAuth();
  const { reports, userReports, reportsLoading, refreshReports } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);
  const [activeAd, setActiveAd] = useState(0);
  const adRef = useRef<FlatList>(null);

  // Auto-scroll ads every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAd((prev) => {
        const next = (prev + 1) % ADS.length;
        adRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshReports(), refreshProfile()]);
    setRefreshing(false);
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

  const points = profile?.eco_points_balance ?? 0;
  const userName = profile?.full_name?.split(" ")[0] || "Ka-Cebu";

  const renderReport = ({ item }: { item: Report }) => {
    const sev = item.severity?.toLowerCase();
    const bgColor =
      sev === "critical"
        ? "rgba(239,68,68,0.2)"
        : sev === "high"
        ? "rgba(249,115,22,0.2)"
        : "rgba(59,130,246,0.2)";
    const iconColor =
      sev === "critical" ? "#ef4444" : sev === "high" ? "#f97316" : "#3b82f6";
    const statusColor = item.status === "verified" ? "#84cc16" : "#9ca3af";
    const wt = item.waste_type?.toLowerCase();
    const iconName = wt === "biodegradable" || wt === "organic" ? "leaf" : "trash";

    return (
      <TouchableOpacity style={styles.reportCard}>
        <View style={[styles.reportIcon, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.reportContent}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>
              {item.waste_type?.charAt(0).toUpperCase() + item.waste_type?.slice(1)} Waste
            </Text>
            <Text style={[styles.reportStatus, { color: statusColor }]}>
              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
            </Text>
          </View>
          <Text style={styles.reportSub} numberOfLines={1}>
            {item.description || `${item.severity} severity`}
          </Text>
          <Text style={styles.reportSub}>
            <Ionicons name="time" size={12} color="#6b7280" /> {timeAgo(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (reportsLoading) {
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#84cc16" />}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.dashboardText}>DASHBOARD</Text>
              <Text style={styles.helloText}>Hello, {userName}! 👋</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/screens/profile" as any)} style={styles.dashboardButton}>
              <Ionicons name="person-circle-outline" size={28} color="#84cc16" />
            </TouchableOpacity>
          </View>

          {/* Points Display */}
          <LinearGradient
            colors={["#a3e635", "#18181b"]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.pointsContainer}
          >
            <View style={styles.pointsTop}>
              <View>
                <Text style={styles.pointsLabel}>Your Balance</Text>
                <Text style={styles.pointsValue}>
                  {points} <Text style={styles.pointsUnit}>pts</Text>
                </Text>
              </View>
              <View style={styles.coinsIcon}>
                <Ionicons name="cash-outline" size={28} color="#84cc16" />
              </View>
            </View>

            <View style={styles.pointsButtons}>
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={() => router.push("/screens/rewards")}
              >
                <Ionicons name="gift-outline" size={16} color="#fff" />
                <Text style={styles.redeemText}>Redeem</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => router.push("/screens/scan")}
              >
                <Ionicons name="camera-outline" size={16} color="#000" />
                <Text style={styles.reportText}>Report</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ── Ad Carousel ── */}
          <View>
            <FlatList
              ref={adRef}
              data={ADS}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={AD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={{ gap: 12 }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (AD_WIDTH + 12));
                setActiveAd(idx);
              }}
              renderItem={({ item }) => (
                <LinearGradient
                  colors={item.gradient}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.adCard}
                >
                  <View style={styles.adContent}>
                    <View style={styles.adIconWrap}>
                      <Ionicons name={item.icon} size={28} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.adBadge}>ADVERTISEMENT</Text>
                      <Text style={styles.adTitle}>{item.title}</Text>
                      <Text style={styles.adSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                </LinearGradient>
              )}
            />
            {/* Dot indicators */}
            <View style={styles.adDots}>
              {ADS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.adDot,
                    i === activeAd && styles.adDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={100}
              color="rgba(132,204,22)"
              style={styles.statBackgroundIcon}
            />
            <Text style={styles.statValue}>{userReports.length}</Text>
            <Text style={styles.statLabel}>My Reports</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="leaf-outline"
              size={100}
              color="rgba(132,204,22)"
              style={styles.statBackgroundIcon}
            />
            <Text style={styles.statValue}>{points}</Text>
            <Text style={styles.statLabel}>Eco-Points</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/screens/map")}>
            <Text style={styles.activityLink}>
              View Map <Ionicons name="arrow-forward" size={12} color="#84cc16" />
            </Text>
          </TouchableOpacity>
        </View>

        {reports.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 20 }}>
              No reports yet. Tap "Report" to get started!
            </Text>
          </View>
        ) : (
          <FlatList
            data={reports.slice(0, 3)}
            keyExtractor={(item) => item.report_id}
            renderItem={renderReport}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  headerContainer: {
    backgroundColor: "#27272a",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dashboardText: { color: "#84cc16", fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  helloText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  dashboardButton: {
    backgroundColor: "#27272a",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  pointsContainer: { borderRadius: 30, padding: 16, marginBottom: 16 },
  pointsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pointsLabel: { fontSize: 10, fontWeight: "700", color: "#000" },
  pointsValue: { fontSize: 28, fontWeight: "900", color: "#000" },
  pointsUnit: { fontSize: 14, fontWeight: "400" },
  coinsIcon: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  pointsButtons: { flexDirection: "row", gap: 8 },
  redeemButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  redeemText: { color: "#fff", fontWeight: "700" },
  reportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  reportText: { color: "#000", fontWeight: "700" },

  // Ad carousel
  adCard: {
    width: AD_WIDTH,
    height: AD_HEIGHT,
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
  },
  adContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  adIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  adBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  adSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 15,
  },
  adDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  adDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3f3f46",
  },
  adDotActive: {
    backgroundColor: "#84cc16",
    width: 18,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "#27272a",
    borderRadius: 30,
    flex: 1,
    marginHorizontal: 4,
    padding: 20,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  statBackgroundIcon: { position: "absolute", bottom: -10, right: -10, opacity: 0.1 },
  statValue: { fontSize: 28, fontWeight: "900", color: "#fff" },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", marginTop: 4 },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  activityTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  activityLink: { fontSize: 12, fontWeight: "700", color: "#84cc16" },
  reportCard: {
    flexDirection: "row",
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reportContent: { flex: 1 },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reportTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  reportStatus: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(132,204,22,0.1)",
  },
  reportSub: { fontSize: 10, color: "#9ca3af", marginBottom: 2 },
});