import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { fetchJobs, applyToJob, createJob } from "../../services/api";

type Job = {
  job_id: string;
  posted_by: string;
  job_type: string;
  title: string;
  description: string;
  location: string;
  pay_amount: number;
  status: string;
  created_at: string;
};

export default function JobsScreen() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");
  const [newJobLocation, setNewJobLocation] = useState("");
  const [newJobPay, setNewJobPay] = useState("");
  const [creating, setCreating] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (err) {
      console.log("Error loading jobs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const handleApply = async (jobId: string) => {
    if (!profile?.uid) return;
    try {
      await applyToJob(jobId, profile.uid);
      Alert.alert("Applied! ✅", "You have successfully applied to this job.");
    } catch (err) {
      Alert.alert("Error", "Failed to apply. Please try again.");
    }
  };

  const handleCreateJob = async () => {
    if (!profile?.uid || !newJobTitle) return;
    setCreating(true);
    try {
      await createJob({
        posted_by: profile.uid,
        title: newJobTitle,
        description: newJobDesc,
        location: newJobLocation || "Cebu City",
        pay_amount: parseFloat(newJobPay) || 0,
        job_type: "segregation",
      });
      setShowCreateModal(false);
      setNewJobTitle("");
      setNewJobDesc("");
      setNewJobLocation("");
      setNewJobPay("");
      loadJobs();
      Alert.alert("Job Posted! 🎉", "Your job request is now visible to helpers.");
    } catch (err) {
      Alert.alert("Error", "Failed to create job. Please try again.");
    } finally {
      setCreating(false);
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
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#84cc16" />}
      >
        <Text style={styles.title}>TrashCare Jobs</Text>
        <Text style={styles.subtitle}>Earn income or points by helping out.</Text>

        {jobs.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="briefcase-outline" size={48} color="#3f3f46" />
            <Text style={{ color: "#9ca3af", marginTop: 12 }}>No jobs available yet.</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {jobs.map((job) => {
              const typeStyle =
                job.job_type === "cleanup"
                  ? styles.volunteerType
                  : job.job_type === "hauling"
                  ? styles.haulingType
                  : styles.laborType;
              return (
                <View key={job.job_id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={[styles.jobType, typeStyle]}>
                      {job.job_type?.toUpperCase()}
                    </Text>
                    <Text style={styles.jobPay}>
                      {job.pay_amount > 0 ? `₱${job.pay_amount}` : "Volunteer"}
                    </Text>
                  </View>

                  <Text style={styles.jobTitle}>{job.title}</Text>
                  {job.description ? (
                    <Text style={styles.jobDescription} numberOfLines={2}>
                      {job.description}
                    </Text>
                  ) : null}

                  <View style={styles.jobLocation}>
                    <Ionicons name="location-outline" size={14} color="#9ca3af" style={{ marginRight: 4 }} />
                    <Text style={styles.locationText}>{job.location || "Cebu City"}</Text>
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

        {/* Post a Job Request */}
        <View style={styles.requestCard}>
          <Text style={styles.requestText}>Need help segregating?</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <Text style={styles.requestButton}>Post a Job Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Job Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post a Job</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Help segregate household waste"
              placeholderTextColor="#9ca3af"
              value={newJobTitle}
              onChangeText={setNewJobTitle}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80 }]}
              placeholder="Describe the task..."
              placeholderTextColor="#9ca3af"
              value={newJobDesc}
              onChangeText={setNewJobDesc}
              multiline
            />

            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Cebu City"
              placeholderTextColor="#9ca3af"
              value={newJobLocation}
              onChangeText={setNewJobLocation}
            />

            <Text style={styles.inputLabel}>Pay Amount (₱)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0 (leave empty for volunteer)"
              placeholderTextColor="#9ca3af"
              value={newJobPay}
              onChangeText={setNewJobPay}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.createButton, creating && { opacity: 0.6 }]}
              onPress={handleCreateJob}
              disabled={creating || !newJobTitle}
            >
              {creating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.createButtonText}>Post Job</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
  subtitle: { fontSize: 14, color: "#9ca3af", marginBottom: 12 },

  jobCard: {
    backgroundColor: "#27272a",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  jobType: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textTransform: "uppercase",
  },
  laborType: { backgroundColor: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  volunteerType: { backgroundColor: "rgba(139,92,246,0.2)", color: "#c084fc" },
  haulingType: { backgroundColor: "rgba(249,115,22,0.2)", color: "#fb923c" },

  jobPay: { fontSize: 12, fontWeight: "700", color: "#84cc16" },
  jobTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  jobDescription: { fontSize: 12, color: "#9ca3af", marginBottom: 6 },
  jobLocation: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  locationText: { color: "#9ca3af", fontSize: 12 },

  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#3f3f46",
    paddingTop: 8,
  },
  timeContainer: { flexDirection: "row", alignItems: "center" },
  timeText: { fontSize: 10, color: "#9ca3af" },

  applyButton: { backgroundColor: "#84cc16", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  applyButtonText: { color: "#000", fontWeight: "700", fontSize: 12 },

  requestCard: {
    backgroundColor: "#27272a",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3f3f46",
    alignItems: "center",
  },
  requestText: { color: "#9ca3af", fontSize: 12, fontWeight: "500" },
  requestButton: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#84cc16",
    textDecorationLine: "underline",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#18181b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  inputLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "500", marginBottom: 4, marginTop: 12 },
  modalInput: {
    backgroundColor: "#27272a",
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
  createButton: {
    backgroundColor: "#84cc16",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
    alignItems: "center",
  },
  createButtonText: { color: "#000", fontWeight: "700", fontSize: 16 },
});