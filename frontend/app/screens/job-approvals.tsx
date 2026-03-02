import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useDataCache } from "../../contexts/DataCache";
import { approveJob, rejectJob } from "../../services/api";

type PendingJob = {
  job_id: string;
  posted_by: string;
  poster_name: string;
  job_type: string;
  title: string;
  description: string;
  location: string;
  token_reward: number;
  credits_cost: number;
  image_url: string;
  created_at: string;
};

export default function JobApprovalsScreen() {
  const { profile } = useAuth();
  const { pendingJobs: jobs, pendingJobsLoading: loading, refreshPendingJobs, refreshJobs } = useDataCache();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPendingJobs();
    setRefreshing(false);
  };

  const handleApprove = async (jobId: string, title: string) => {
    if (!profile?.uid) return;
    Alert.alert("Approve Job?", `Approve "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          setActionLoading(jobId);
          try {
            await approveJob(jobId, profile.uid);
            await Promise.all([refreshPendingJobs(), refreshJobs()]);
            Alert.alert("Approved ✅", "The job is now visible to users.");
          } catch (err) {
            Alert.alert("Error", "Failed to approve job.");
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (jobId: string, title: string) => {
    if (!profile?.uid) return;
    Alert.alert("Reject Job?", `Reject "${title}"? Credits and tokens will be refunded.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setActionLoading(jobId);
          try {
            await rejectJob(jobId, profile.uid);
            await refreshPendingJobs();
            Alert.alert("Rejected", "Credits and tokens have been refunded.");
          } catch (err) {
            Alert.alert("Error", "Failed to reject job.");
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
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

  const typeColor: Record<string, string> = {
    cleanup: "#84cc16",
    segregation: "#60a5fa",
    hauling: "#fb923c",
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#84cc16" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Approvals</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{jobs.length}</Text>
        </View>
      </View>

      {jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={56} color="#3f3f46" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyDesc}>No pending job postings to review.</Text>
        </View>
      ) : (
        jobs.map((job) => {
          const isLoading = actionLoading === job.job_id;
          return (
            <View key={job.job_id} style={styles.card}>
              {/* Job Image */}
              {job.image_url ? (
                <Image source={{ uri: job.image_url }} style={styles.cardImage} />
              ) : null}

              {/* Meta */}
              <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeColor[job.job_type] || "#9ca3af"}20` }]}>
                    <Text style={[styles.typeText, { color: typeColor[job.job_type] || "#9ca3af" }]}>
                      {job.job_type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.metaTime}>{timeAgo(job.created_at)}</Text>
                </View>

                <Text style={styles.cardTitle}>{job.title}</Text>
                {job.description ? (
                  <Text style={styles.cardDesc} numberOfLines={3}>{job.description}</Text>
                ) : null}

                {/* Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={13} color="#9ca3af" />
                    <Text style={styles.detailText}>{job.poster_name || "Unknown"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={13} color="#9ca3af" />
                    <Text style={styles.detailText}>{job.location || "—"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="diamond-outline" size={13} color="#84cc16" />
                    <Text style={[styles.detailText, { color: "#84cc16" }]}>
                      {job.token_reward > 0 ? `${job.token_reward} tokens` : "Volunteer"}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, isLoading && { opacity: 0.5 }]}
                    onPress={() => handleReject(job.job_id, job.title)}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator size="small" color="#ef4444" /> : (
                      <>
                        <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                        <Text style={styles.rejectText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approveBtn, isLoading && { opacity: 0.5 }]}
                    onPress={() => handleApprove(job.job_id, job.title)}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator size="small" color="#000" /> : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#000" />
                        <Text style={styles.approveText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#27272a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  badge: { backgroundColor: "#ef4444", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  emptyState: { alignItems: "center", marginTop: 80 },
  emptyTitle: { color: "#d4d4d8", fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptyDesc: { color: "#71717a", fontSize: 13, marginTop: 4 },

  card: {
    backgroundColor: "#18181b", borderRadius: 16, overflow: "hidden",
    marginBottom: 16, borderWidth: 1, borderColor: "#27272a",
  },
  cardImage: { width: "100%", height: 160 },
  cardBody: { padding: 16 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: "700" },
  metaTime: { color: "#71717a", fontSize: 11 },

  cardTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  cardDesc: { fontSize: 12, color: "#9ca3af", marginBottom: 10, lineHeight: 18 },

  detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { color: "#9ca3af", fontSize: 11 },

  actionsRow: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: "#ef444450",
  },
  rejectText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  approveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#84cc16",
  },
  approveText: { color: "#000", fontSize: 13, fontWeight: "700" },
});
