import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Navbar from "../navbar";


export default function RewardsScreen() {
  const [points, setPoints] = useState(100);
  const [currentView, setCurrentView] = useState("rewards");
  const REWARDS = [
    { id: "1", name: "Eco Bag", cost: 50, icon: "🛍️" },
    { id: "2", name: "Reusable Bottle", cost: 100, icon: "🥤" },
    { id: "3", name: "Plant Seed Pack", cost: 75, icon: "🌱" },
    { id: "4", name: "Sticker Pack", cost: 20, icon: "📦" },
  ];
  
  const redeem = (cost: number) => {
    if (points >= cost) {
      setPoints(points - cost);
      
      Alert.alert(
        "Redeemed successfully!",
        `Show this code at the store: ECO-${Math.floor(Math.random() * 10000)}`
      );
    } else {
      Alert.alert("Not enough points!");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Available Points */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsLabel}>Available Points</Text>
        <Text style={styles.pointsValue}>{points}</Text>
      </View>

      {/* Redeem Rewards Header */}
      <Text style={styles.redeemHeader}>🎁 Redeem Rewards</Text>

      {/* Rewards Grid */}
      <View style={styles.grid}>
        {REWARDS.map(item => {
          const canRedeem = points >= item.cost;
          return (
            <View key={item.id} style={styles.rewardCard}>
              <View style={styles.rewardIconContainer}>
                <Text style={styles.rewardIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.rewardName}>{item.name}</Text>
              <Text style={styles.rewardCost}>{item.cost} Pts</Text>

              <TouchableOpacity
                disabled={!canRedeem}
                onPress={() => redeem(item.cost)}
                style={[
                  styles.redeemButton,
                  canRedeem ? styles.redeemActive : styles.redeemDisabled
                ]}
              >
                <Text style={[styles.redeemText, canRedeem ? styles.redeemTextActive : styles.redeemTextDisabled]}>
                  Redeem
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
    <Navbar currentView={currentView} setCurrentView={setCurrentView} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16, paddingTop: 60, },
  pointsContainer: { alignItems: "center", marginBottom: 24 },
  pointsLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  pointsValue: { fontSize: 48, fontWeight: "900", color: "#84cc16", textShadowColor: "rgba(163,230,53,0.3)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

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
    alignItems: "center" 
  },
  rewardIconContainer: { marginBottom: 8 },
  rewardIcon: { fontSize: 36 },
  rewardName: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 4, textAlign: "center" },
  rewardCost: { fontSize: 12, fontWeight: "700", color: "#84cc16", marginBottom: 8 },

  redeemButton: { width: "100%", paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  redeemActive: { backgroundColor: "#84cc16" },
  redeemDisabled: { backgroundColor: "#3f3f46" },

  redeemText: { fontSize: 12, fontWeight: "700" },
  redeemTextActive: { color: "#000" },
  redeemTextDisabled: { color: "#9ca3af" },
});