import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Heatmap } from "react-native-maps";
import { fetchReports } from "../../services/api";

const { width, height } = Dimensions.get("window");

type Report = {
  report_id: string;
  geo_lat: number;
  geo_lng: number;
  waste_type: string;
  description: string;
  severity: string;
  status: string;
};

export default function MapScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const mapRef = useRef<MapView>(null);

  const region = {
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const loadReports = useCallback(async () => {
    try {
      const wasteType = activeFilter === "all" ? undefined : activeFilter;
      const data = await fetchReports({ waste_type: wasteType, limit: 100 });
      setReports(data);
    } catch (err) {
      console.log("Error loading map reports:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    loadReports();
  }, [activeFilter]);

  const getMarkerColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high":
        return "red";
      case "medium":
        return "orange";
      default:
        return "green";
    }
  };

  const zoomIn = () => {
    mapRef.current?.getCamera().then((cam) => {
      if (cam.center) {
        mapRef.current?.animateToRegion(
          {
            latitude: cam.center.latitude,
            longitude: cam.center.longitude,
            latitudeDelta: (region.latitudeDelta * cam.zoom!) / (cam.zoom! + 2) || 0.01,
            longitudeDelta: (region.longitudeDelta * cam.zoom!) / (cam.zoom! + 2) || 0.01,
          },
          300
        );
      }
    });
  };

  const zoomOut = () => {
    mapRef.current?.getCamera().then((cam) => {
      if (cam.center) {
        mapRef.current?.animateToRegion(
          {
            latitude: cam.center.latitude,
            longitude: cam.center.longitude,
            latitudeDelta: (region.latitudeDelta * (cam.zoom || 10)) / ((cam.zoom || 10) - 2) || 0.5,
            longitudeDelta: (region.longitudeDelta * (cam.zoom || 10)) / ((cam.zoom || 10) - 2) || 0.5,
          },
          300
        );
      }
    });
  };

  const recenter = () => {
    mapRef.current?.animateToRegion(region, 500);
  };

  const filters = [
    { key: "all", label: "All Waste" },
    { key: "plastic", label: "Plastics" },
    { key: "hazardous", label: "Hazardous" },
    { key: "biodegradable", label: "Organic" },
    { key: "metal", label: "Metal" },
    { key: "e-waste", label: "E-Waste" },
  ];

  if (Platform.OS === "web") {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.webText}>Map is not available on web</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        customMapStyle={darkMapStyle}
      >
        {reports.map((r) => (
          <Marker
            key={r.report_id}
            coordinate={{ latitude: r.geo_lat, longitude: r.geo_lng }}
            title={`${r.waste_type?.charAt(0).toUpperCase() + r.waste_type?.slice(1)} Waste`}
            description={`Severity: ${r.severity}\n${r.description || ""}`}
            pinColor={getMarkerColor(r.severity)}
          />
        ))}

        {reports.length > 0 && (
          <Heatmap
            points={reports.map((r) => ({
              latitude: r.geo_lat,
              longitude: r.geo_lng,
              weight:
                r.severity === "critical"
                  ? 1
                  : r.severity === "high"
                  ? 0.8
                  : r.severity === "medium"
                  ? 0.5
                  : 0.3,
            }))}
            radius={50}
            opacity={0.6}
            gradient={{
              colors: ["blue", "lime", "red"],
              startPoints: [0.1, 0.4, 1],
              colorMapSize: 256,
            }}
          />
        )}
      </MapView>

      {/* Filters Overlay */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, activeFilter === f.key && styles.activeFilter]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={activeFilter === f.key ? styles.filterTextActive : styles.filterText}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#84cc16" />
        </View>
      )}

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Ionicons name="remove" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.zoomButton, { marginTop: 8 }]} onPress={recenter}>
          <Ionicons name="locate" size={20} color="#84cc16" />
        </TouchableOpacity>
      </View>

      {/* Report count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{reports.length} reports</Text>
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1e1e1e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e1e1e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#2e2e2e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#111111" }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  filtersContainer: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: "rgba(39,39,42,0.9)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#27272a",
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: { color: "#9ca3af", fontSize: 12, fontWeight: "700" },
  activeFilter: { backgroundColor: "#84cc16" },
  filterTextActive: { color: "#000", fontSize: 12, fontWeight: "700" },
  webContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  webText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loadingOverlay: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countBadge: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(39,39,42,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countText: { color: "#84cc16", fontSize: 12, fontWeight: "700" },
  zoomControls: {
    position: "absolute",
    right: 16,
    bottom: 160,
    alignItems: "center",
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(39,39,42,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
});