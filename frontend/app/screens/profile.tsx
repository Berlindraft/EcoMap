import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { updateUser, fetchUserPoints, fetchUserReports } from "../../services/api";
import ResultModal from "../../components/ResultModal";

export default function ProfileScreen() {
  const { profile, refreshProfile, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [barangay, setBarangay] = useState(profile?.barangay ?? "");

  const [reportCount, setReportCount] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    success: boolean;
    title: string;
    message: string;
  }>({ success: false, title: "", message: "" });

  const loadData = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const [reports, points] = await Promise.all([
        fetchUserReports(profile.uid),
        fetchUserPoints(profile.uid),
      ]);
      setReportCount(reports.length);
      setPointsHistory(points.slice(0, 10));
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setBarangay(profile?.barangay ?? "");
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      await updateUser(profile.uid, {
        full_name: name,
        phone,
        barangay,
      });
      await refreshProfile();
      setEditing(false);
      setModalData({ success: true, title: "Profile Updated", message: "Your changes have been saved." });
      setModalVisible(true);
    } catch {
      setModalData({ success: false, title: "Update Failed", message: "Could not save changes. Try again." });
      setModalVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    loadData();
  };

  const role = profile?.role || "user";
  const roleBadge =
    role === "admin"
      ? { label: "Admin", color: "#ef4444", bg: "rgba(239,68,68,0.15)" }
      : role === "partner"
      ? { label: "Partner", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" }
      : { label: "User", color: "#84cc16", bg: "rgba(132,204,22,0.15)" };

  const timeAgo = (d: string) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!profile) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
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
          <Text style={s.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar + Name */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Ionicons name="person" size={48} color="#84cc16" />
          </View>
          <Text style={s.userName}>{profile.full_name}</Text>
          <Text style={s.userEmail}>{profile.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: roleBadge.bg }]}>
            <Text style={[s.roleText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{profile.eco_points_balance}</Text>
            <Text style={s.statLabel}>Eco-Points</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{reportCount}</Text>
            <Text style={s.statLabel}>Reports</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{profile.city || "Cebu City"}</Text>
            <Text style={s.statLabel}>City</Text>
          </View>
        </View>

        {/* Edit Profile Card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => (editing ? handleSave() : setEditing(true))}>
              {saving ? (
                <ActivityIndicator size="small" color="#84cc16" />
              ) : (
                <Text style={s.editBtn}>{editing ? "Save" : "Edit"}</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={s.fieldLabel}>Full Name</Text>
          {editing ? (
            <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor="#555" />
          ) : (
            <Text style={s.fieldValue}>{profile.full_name}</Text>
          )}

          <Text style={s.fieldLabel}>Phone</Text>
          {editing ? (
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone"
              placeholderTextColor="#555"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={s.fieldValue}>{profile.phone || "Not set"}</Text>
          )}

          <Text style={s.fieldLabel}>Barangay</Text>
          {editing ? (
            <TextInput style={s.input} value={barangay} onChangeText={setBarangay} placeholder="Enter barangay" placeholderTextColor="#555" />
          ) : (
            <Text style={s.fieldValue}>{profile.barangay || "Not set"}</Text>
          )}

          {editing && (
            <TouchableOpacity onPress={() => setEditing(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Admin / Partner quick links */}
        {(role === "admin" || role === "partner") && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Management</Text>
            {role === "admin" && (
              <TouchableOpacity style={s.menuItem} onPress={() => router.push("/screens/dashboard" as any)}>
                <Ionicons name="stats-chart" size={20} color="#84cc16" />
                <Text style={s.menuText}>Dashboard</Text>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            )}
            {role === "admin" && (
              <TouchableOpacity style={s.menuItem} onPress={() => router.push("/screens/user-management" as any)}>
                <Ionicons name="people" size={20} color="#3b82f6" />
                <Text style={s.menuText}>Manage Users</Text>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            )}
            {(role === "partner" || role === "admin") && (
              <TouchableOpacity style={s.menuItem} onPress={() => router.push("/screens/partner-products" as any)}>
                <Ionicons name="storefront" size={20} color="#f97316" />
                <Text style={s.menuText}>My Products</Text>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            )}
            {role === "partner" && (
              <TouchableOpacity style={s.menuItem} onPress={() => router.push("/screens/dashboard" as any)}>
                <Ionicons name="stats-chart" size={20} color="#84cc16" />
                <Text style={s.menuText}>Dashboard</Text>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Points History */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Points Activity</Text>
          {pointsHistory.length === 0 ? (
            <Text style={s.emptyText}>No activity yet.</Text>
          ) : (
            pointsHistory.map((p) => (
              <View key={p.points_id} style={s.historyRow}>
                <View style={s.historyLeft}>
                  <Ionicons
                    name={p.action === "cleanup" ? "checkmark-circle" : p.action === "report" ? "camera" : "leaf"}
                    size={18}
                    color="#84cc16"
                  />
                  <Text style={s.historyAction}>{p.action}</Text>
                </View>
                <View style={s.historyRight}>
                  <Text style={s.historyPts}>+{p.points_earned}</Text>
                  <Text style={s.historyTime}>{timeAgo(p.created_at)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => {
            logout();
            router.replace("/login-and-authetication/login" as any);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ResultModal
        visible={modalVisible}
        success={modalData.success}
        title={modalData.title}
        message={modalData.message}
        onDismiss={() => setModalVisible(false)}
      />
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
    paddingBottom: 12,
    backgroundColor: "#18181b",
  },
  backBtn: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  avatarSection: { alignItems: "center", paddingVertical: 24, backgroundColor: "#18181b", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#84cc16",
    marginBottom: 12,
  },
  userName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  userEmail: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  roleBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#27272a",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center", flex: 1 },
  statNum: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: "#9ca3af", fontSize: 10, fontWeight: "600", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#3f3f46" },
  card: {
    backgroundColor: "#27272a",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  editBtn: { color: "#84cc16", fontWeight: "700", fontSize: 14 },
  fieldLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "600", marginTop: 10, marginBottom: 4 },
  fieldValue: { color: "#fff", fontSize: 15 },
  input: {
    backgroundColor: "#18181b",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  cancelBtn: { alignSelf: "center", marginTop: 12 },
  cancelText: { color: "#9ca3af", fontWeight: "600" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#3f3f46",
    gap: 12,
  },
  menuText: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  emptyText: { color: "#555", marginTop: 8 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyAction: { color: "#d4d4d8", fontSize: 14, textTransform: "capitalize" },
  historyRight: { alignItems: "flex-end" },
  historyPts: { color: "#84cc16", fontWeight: "700", fontSize: 14 },
  historyTime: { color: "#666", fontSize: 10, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});
