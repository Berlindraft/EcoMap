import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import Navbar from "../navbar";

const { width } = Dimensions.get("window");

// Sample initial reports data
const INITIAL_REPORTS = [
  {
    id: "1",
    type: "Organic",
    status: "Verified",
    severity: "Low",
    location: "Cebu City Center",
    time: "2 hrs ago",
  },
  {
    id: "2",
    type: "Plastic",
    status: "Pending",
    severity: "High",
    location: "Mandaue City",
    time: "4 hrs ago",
  },
  {
    id: "3",
    type: "Metal",
    status: "Verified",
    severity: "Critical",
    location: "Lapu-Lapu City",
    time: "1 day ago",
  },
];

type Report = {
  id: string;
  type: string;
  status: string;
  severity: string;
  location: string;
  time: string;
};

export default function HomeScreen() {
  const points = 21;
  const [currentView, setCurrentView] = useState("home");

  const renderReport = ({ item }: { item: Report }) => {
    const bgColor =
      item.severity === "Critical"
        ? "rgba(239,68,68,0.2)"
        : item.severity === "High"
        ? "rgba(249,115,22,0.2)"
        : "rgba(59,130,246,0.2)";

    const iconColor =
      item.severity === "Critical"
        ? "#ef4444"
        : item.severity === "High"
        ? "#f97316"
        : "#3b82f6";

    const statusColor =
      item.status === "Verified" ? "#84cc16" : "#9ca3af";

    const iconName = item.type === "Organic" ? "leaf" : "trash";

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => console.log("Report clicked")}
      >
        <View style={[styles.reportIcon, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.reportContent}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>{item.type} Waste</Text>
            <Text style={[styles.reportStatus, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.reportSub}>
            <Ionicons name="location" size={12} color="#9ca3af" />{" "}
            {item.location}
          </Text>
          <Text style={styles.reportSub}>
            <Ionicons name="time" size={12} color="#6b7280" /> {item.time}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.dashboardText}>Dashboard</Text>
              <Text style={styles.helloText}>Hello, Ka-Cebu! 👋</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/screens/rewards")}
              style={styles.dashboardButton}
            >
              <Ionicons name="grid-outline" size={24} color="#fff" />
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
                onPress={() => router.push("/screens/rewards")}
              >
                <Ionicons name="camera-outline" size={16} color="#000" />
                <Text style={styles.reportText}>Report</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={100}
              color="rgba(132,204,22,0.1)"
              style={styles.statBackgroundIcon}
            />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Reports Verified</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="leaf-outline"
              size={100}
              color="rgba(132,204,22,0.1)"
              style={styles.statBackgroundIcon}
            />
            <Text style={styles.statValue}>35kg</Text>
            <Text style={styles.statLabel}>Waste Collected</Text>
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

        <FlatList
          data={INITIAL_REPORTS}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

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

  dashboardText: {
    color: "#84cc16",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  helloText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  dashboardButton: {
    backgroundColor: "#27272a",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },

  pointsContainer: {
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
  },

  pointsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  pointsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
  },

  pointsValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#000",
  },

  pointsUnit: {
    fontSize: 14,
    fontWeight: "400",
  },

  coinsIcon: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },

  pointsButtons: {
    flexDirection: "row",
    gap: 8,
  },

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

  redeemText: {
    color: "#fff",
    fontWeight: "700",
  },

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

  reportText: {
    color: "#000",
    fontWeight: "700",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: -30,
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

  statBackgroundIcon: {
    position: "absolute",
    bottom: -10,
    right: -10,
    opacity: 0.1,
  },

  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    marginTop: 4,
  },

  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  activityLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#84cc16",
    flexDirection: "row",
    alignItems: "center",
  },

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

  reportContent: {
    flex: 1,
  },

  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  reportStatus: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(132,204,22,0.1)",
  },

  reportSub: {
    fontSize: 10,
    color: "#9ca3af",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
});