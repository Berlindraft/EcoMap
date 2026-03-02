import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useDataCache } from "../../contexts/DataCache";
import { applyToJob } from "../../services/api";
import ResultModal from "../../components/ResultModal";

type Job = {
  job_id: string;
  posted_by: string;
  poster_name: string;
  job_type: string;
  title: string;
  description: string;
  location: string;
  token_reward: number;
  pay_amount: number;
  status: string;
  created_at: string;
};

export default function JobsScreen() {
  const { profile } = useAuth();
  const { jobs, jobsLoading: loading, refreshJobs } = useDataCache();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ success: true, title: "", message: "", detail: "", detailIcon: "" as any });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshJobs();
    setRefreshing(false);
  };

  const handleApply = async (jobId: string) => {
    if (!profile?.uid) return;
    try {
      await applyToJob(jobId, profile.uid);
      setModalData({ success: true, title: "Applied! ✅", message: "You have successfully applied to this job.", detail: "", detailIcon: "briefcase" });
      setModalVisible(true);
    } catch (err) {
      setModalData({ success: false, title: "Application Failed", message: "Failed to apply. Please try again.", detail: "", detailIcon: "" });
      setModalVisible(true);
    }
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

  const isAdmin = profile?.role === "admin";

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
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#84cc16" />}
      >
        <Text style={styles.title}>TrashCare Jobs</Text>
        <Text style={styles.subtitle}>Find eco-jobs or post your own.</Text>

        {/* Admin: Review Pending */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => router.push("/screens/job-approvals" as any)}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#fbbf24" />
            <Text style={styles.adminText}>Review Pending Job Postings</Text>
            <Ionicons name="chevron-forward" size={16} color="#fbbf24" />
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/screens/post-job" as any)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#84cc16" />
            <Text style={styles.actionLabel}>Post Job</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/screens/buy-tokens" as any)}
          >
            <Ionicons name="diamond-outline" size={24} color="#60a5fa" />
            <Text style={styles.actionLabel}>Buy Tokens</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/screens/convert-points" as any)}
          >
            <Ionicons name="swap-horizontal-outline" size={24} color="#fbbf24" />
            <Text style={styles.actionLabel}>Convert Pts</Text>
          </TouchableOpacity>
        </View>

        {/* Job listings */}
        {jobs.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40, marginBottom: 30 }}>
            <Ionicons name="briefcase-outline" size={48} color="#3f3f46" />
            <Text style={{ color: "#9ca3af", marginTop: 12 }}>No jobs available yet.</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {jobs.map((job) => {
              const typeColors: Record<string, { bg: string; text: string }> = {
                cleanup: { bg: "rgba(132,204,22,0.15)", text: "#84cc16" },
                segregation: { bg: "rgba(96,165,250,0.15)", text: "#60a5fa" },
                hauling: { bg: "rgba(251,146,60,0.15)", text: "#fb923c" },
              };
              const tc = typeColors[job.job_type] || { bg: "rgba(156,163,175,0.15)", text: "#9ca3af" };

              return (
                <View key={job.job_id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.typeText, { color: tc.text }]}>
                        {job.job_type?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.rewardBadge}>
                      <Ionicons name="diamond" size={12} color="#84cc16" />
                      <Text style={styles.rewardText}>
                        {job.token_reward > 0 ? `${job.token_reward} tokens` : "Volunteer"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.jobTitle}>{job.title}</Text>
                  {job.description ? (
                    <Text style={styles.jobDescription} numberOfLines={2}>
                      {job.description}
                    </Text>
                  ) : null}

                  <View style={styles.jobMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={13} color="#9ca3af" />
                      <Text style={styles.metaText}>{job.location || "Cebu City"}</Text>
                    </View>
                    {job.poster_name ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={13} color="#9ca3af" />
                        <Text style={styles.metaText}>{job.poster_name}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.jobFooter}>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={12} color="#9ca3af" style={{ marginRight: 4 }} />
                      <Text style={styles.timeText}>{timeAgo(job.created_at)}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.applyButton,
                        job.status !== "open" && { backgroundColor: "#3f3f46" },
                      ]}
                      onPress={() => handleApply(job.job_id)}
                      disabled={job.status !== "open"}
                    >
                      <Text
                        style={[
                          styles.applyButtonText,
                          job.status !== "open" && { color: "#9ca3af" },
                        ]}
                      >
                        {job.status === "open" ? "Apply" : job.status}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ResultModal
        visible={modalVisible}
        success={modalData.success}
        title={modalData.title}
        message={modalData.message}
        detail={modalData.detail || undefined}
        detailIcon={modalData.detailIcon || undefined}
        onDismiss={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
  subtitle: { fontSize: 14, color: "#9ca3af", marginBottom: 16 },

  adminBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(251,191,36,0.1)", borderWidth: 1, borderColor: "#fbbf2440",
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  adminText: { flex: 1, color: "#fbbf24", fontSize: 13, fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  actionCard: {
    flex: 1, backgroundColor: "#18181b", borderRadius: 14, padding: 16,
    alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#27272a",
  },
  actionLabel: { color: "#d4d4d8", fontSize: 12, fontWeight: "600" },

  jobCard: {
    backgroundColor: "#18181b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: "700" },
  rewardBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardText: { fontSize: 12, fontWeight: "700", color: "#84cc16" },

  jobTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  jobDescription: { fontSize: 12, color: "#9ca3af", marginBottom: 8, lineHeight: 18 },

  jobMeta: { flexDirection: "row", gap: 14, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#9ca3af", fontSize: 11 },

  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#27272a",
    paddingTop: 8,
  },
  timeContainer: { flexDirection: "row", alignItems: "center" },
  timeText: { fontSize: 10, color: "#9ca3af" },

  applyButton: { backgroundColor: "#84cc16", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  applyButtonText: { color: "#000", fontWeight: "700", fontSize: 12 },
});