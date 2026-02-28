import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { updateUserRole } from "../../services/api";
import { useDataCache } from "../../contexts/DataCache";
import ResultModal from "../../components/ResultModal";

const { width: SCREEN_W } = Dimensions.get("window");

type UserItem = {
  uid: string;
  full_name: string;
  email: string;
  role: string;
  eco_points_balance: number;
  barangay: string;
  city: string;
  created_at: string;
};

export default function UserManagementScreen() {
  const { profile } = useAuth();
  const { allUsers: cachedUsers, usersLoading, refreshUsers: refreshCacheUsers } = useDataCache();
  const [users, setUsers] = useState<UserItem[]>(cachedUsers);
  const [loading, setLoading] = useState(cachedUsers.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "user" | "partner" | "admin">("all");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    uid: string;
    newRole: string;
    userName: string;
  }>({ uid: "", newRole: "", userName: "" });

  // Result modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    success: boolean;
    title: string;
    message: string;
  }>({ success: false, title: "", message: "" });

  // Sync local state when cache updates
  useEffect(() => {
    if (cachedUsers.length > 0 || !usersLoading) {
      setUsers(cachedUsers);
      setLoading(false);
    }
  }, [cachedUsers, usersLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCacheUsers();
    setRefreshing(false);
  };

  const promptRoleChange = (uid: string, newRole: string, userName: string) => {
    setConfirmData({ uid, newRole, userName });
    setConfirmVisible(true);
  };

  const executeRoleChange = async () => {
    const { uid, newRole, userName } = confirmData;
    setConfirmVisible(false);
    setUpdatingUid(uid);
    try {
      await updateUserRole(uid, newRole);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
      setModalData({
        success: true,
        title: "Role Updated",
        message: `${userName} is now a ${newRole}.`,
      });
      setModalVisible(true);
    } catch (e) {
      console.log("Role update error:", e);
      setModalData({
        success: false,
        title: "Update Failed",
        message: "Could not update role. Try again.",
      });
      setModalVisible(true);
    } finally {
      setUpdatingUid(null);
    }
  };

  // Filter and search
  const filteredUsers = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roleCounts = {
    all: users.length,
    user: users.filter((u) => (u.role || "user") === "user").length,
    partner: users.filter((u) => u.role === "partner").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  if (loading) {
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
          <Text style={s.headerTitle}>Manage Users</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={s.searchContainer}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {(["all", "user", "partner", "admin"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterPill, filter === f && s.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({roleCounts[f]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="people-outline" size={48} color="#3f3f46" />
            <Text style={{ color: "#9ca3af", marginTop: 12 }}>No users found.</Text>
          </View>
        ) : (
          filteredUsers.map((u) => {
            const r = u.role || "user";
            const badge =
              r === "admin"
                ? { color: "#ef4444", bg: "rgba(239,68,68,0.15)" }
                : r === "partner"
                ? { color: "#3b82f6", bg: "rgba(59,130,246,0.15)" }
                : { color: "#84cc16", bg: "rgba(132,204,22,0.15)" };
            const isSelf = u.uid === profile?.uid;

            return (
              <View key={u.uid} style={s.userCard}>
                <View style={s.userTop}>
                  <View style={s.userAvatar}>
                    <Ionicons name="person" size={22} color="#84cc16" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.userName}>{u.full_name}</Text>
                    <Text style={s.userEmail}>{u.email}</Text>
                  </View>
                  <View style={[s.roleBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.roleText, { color: badge.color }]}>{r}</Text>
                  </View>
                </View>

                <View style={s.userMeta}>
                  <Text style={s.metaText}>
                    <Ionicons name="leaf" size={12} color="#84cc16" /> {u.eco_points_balance} pts
                  </Text>
                  <Text style={s.metaText}>
                    <Ionicons name="location" size={12} color="#9ca3af" /> {u.barangay || u.city || "N/A"}
                  </Text>
                </View>

                {/* Role change buttons (don't allow changing own role) */}
                {!isSelf && (
                  <View style={s.roleActions}>
                    {updatingUid === u.uid ? (
                      <ActivityIndicator size="small" color="#84cc16" />
                    ) : (
                      <>
                        {r !== "partner" && (
                          <TouchableOpacity
                            style={[s.roleBtn, { backgroundColor: "rgba(59,130,246,0.15)" }]}
                            onPress={() => promptRoleChange(u.uid, "partner", u.full_name)}
                          >
                            <Text style={[s.roleBtnText, { color: "#3b82f6" }]}>Make Partner</Text>
                          </TouchableOpacity>
                        )}
                        {r !== "admin" && (
                          <TouchableOpacity
                            style={[s.roleBtn, { backgroundColor: "rgba(239,68,68,0.15)" }]}
                            onPress={() => promptRoleChange(u.uid, "admin", u.full_name)}
                          >
                            <Text style={[s.roleBtnText, { color: "#ef4444" }]}>Make Admin</Text>
                          </TouchableOpacity>
                        )}
                        {r !== "user" && (
                          <TouchableOpacity
                            style={[s.roleBtn, { backgroundColor: "rgba(132,204,22,0.15)" }]}
                            onPress={() => promptRoleChange(u.uid, "user", u.full_name)}
                          >
                            <Text style={[s.roleBtnText, { color: "#84cc16" }]}>Demote to User</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { borderColor: "rgba(132,204,22,0.3)" }]}>
            <Ionicons name="shield-checkmark" size={56} color="#f59e0b" />
            <Text style={s.modalTitle}>Confirm Role Change</Text>
            <Text style={s.modalMessage}>
              Change <Text style={{ color: "#fff", fontWeight: "700" }}>{confirmData.userName}</Text> to{" "}
              <Text style={{ color: "#fff", fontWeight: "700" }}>{confirmData.newRole}</Text>?
            </Text>

            <View style={[s.modalBadge, { backgroundColor: "rgba(245,158,11,0.15)" }]}>
              <Ionicons name="swap-horizontal" size={18} color="#f59e0b" />
              <Text style={[s.modalBadgeText, { color: "#f59e0b" }]}>
                {confirmData.newRole === "admin"
                  ? "Full admin access"
                  : confirmData.newRole === "partner"
                  ? "Partner privileges"
                  : "Standard user"}
              </Text>
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: "#3f3f46" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[s.modalBtnText, { color: "#fff" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: "#84cc16" }]}
                onPress={executeRoleChange}
              >
                <Text style={[s.modalBtnText, { color: "#000" }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingBottom: 16,
    backgroundColor: "#18181b",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272a",
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  filterRow: { marginTop: 12, marginBottom: 4 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  filterPillActive: { backgroundColor: "#84cc16", borderColor: "#84cc16" },
  filterText: { color: "#9ca3af", fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: "#000" },
  userCard: {
    backgroundColor: "#27272a",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  userTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  userEmail: { color: "#9ca3af", fontSize: 12, marginTop: 1 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  userMeta: { flexDirection: "row", gap: 16, marginTop: 12, paddingLeft: 56 },
  metaText: { color: "#9ca3af", fontSize: 12 },
  roleActions: { flexDirection: "row", gap: 8, marginTop: 14, paddingLeft: 56, flexWrap: "wrap" },
  roleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  roleBtnText: { fontSize: 12, fontWeight: "700" },
  // Confirmation modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: SCREEN_W - 48,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },
  modalMessage: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalBadgeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
