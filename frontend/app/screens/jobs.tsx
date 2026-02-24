import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Navbar from "../navbar";

export default function JobsScreen() {
  const [currentView, setCurrentView] = useState("jobs");
  const MICRO_JOBS = [
  { id: "1", type: "Labor", title: "Pick up plastic waste", location: "Cebu City", pay: "50 pts", time: "2 hrs ago" },
  { id: "2", type: "Volunteer", title: "Assist in community cleanup", location: "Mandaue City", pay: "100 pts", time: "1 day ago" },
  { id: "3", type: "Labor", title: "Collect metal scraps", location: "Lapu-Lapu City", pay: "75 pts", time: "5 hrs ago" },
];
  return (
    <View style={{ flex: 1,  }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>TrashCare Jobs</Text>
      <Text style={styles.subtitle}>Earn income or points by helping out.</Text>

      <View style={{ marginBottom: 16 }}>
        {MICRO_JOBS.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Text style={[
                  styles.jobType, 
                  job.type === "Labor" ? styles.laborType : styles.volunteerType
                ]}>
                {job.type}
              </Text>
              <Text style={styles.jobPay}>{job.pay}</Text>
            </View>

            <Text style={styles.jobTitle}>{job.title}</Text>

            <View style={styles.jobLocation}>
              <Ionicons name="location-outline" size={14} color="#9ca3af" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{job.location}</Text>
            </View>

            <View style={styles.jobFooter}>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={12} color="#9ca3af" style={{ marginRight: 4 }} />
                <Text style={styles.timeText}>{job.time}</Text>
              </View>

              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Post a Job Request */}
      <View style={styles.requestCard}>
        <Text style={styles.requestText}>Need help segregating?</Text>
        <TouchableOpacity>
          <Text style={styles.requestButton}>Post a Job Request</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    <Navbar currentView={currentView} setCurrentView={setCurrentView} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16, paddingTop: 60, },
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
  jobType: { fontSize: 10, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, textTransform: "uppercase" },
  laborType: { backgroundColor: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  volunteerType: { backgroundColor: "rgba(139,92,246,0.2)", color: "#c084fc" },

  jobPay: { fontSize: 12, fontWeight: "700", color: "#84cc16" },
  jobTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  jobLocation: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  locationText: { color: "#9ca3af", fontSize: 12 },

  jobFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#3f3f46", paddingTop: 8 },
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
  requestButton: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#84cc16", textDecorationLine: "underline" },
});