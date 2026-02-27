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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Heatmap } from "react-native-maps";
import { fetchReports } from "../../services/api";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type Report = {
  report_id: string;
  geo_lat: number;
  geo_lng: number;
  waste_type: string;
  description: string;
  severity: string;
  status: string;
  image_url?: string;
  heading?: number | null;
  ai_confidence?: number;
  created_at?: string;
};

// Severity levels in ascending order
const SEV_LEVELS = ["low", "medium", "high", "critical"] as const;

/** Haversine distance in meters between two lat/lng points */
function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * For each report, count how many other reports are within `radius` meters.
 * If the count >= `threshold`, bump the severity up one level.
 * Returns a map of report_id → effective severity.
 */
function computeEffectiveSeverity(
  reports: Report[],
  radius: number = 20,
  threshold: number = 10,
): Map<string, string> {
  const result = new Map<string, string>();
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    let nearby = 0;
    for (let j = 0; j < reports.length; j++) {
      if (i === j) continue;
      const dist = haversineMeters(r.geo_lat, r.geo_lng, reports[j].geo_lat, reports[j].geo_lng);
      if (dist <= radius) nearby++;
    }
    const baseIdx = SEV_LEVELS.indexOf(r.severity?.toLowerCase() as any);
    const idx = baseIdx >= 0 ? baseIdx : 0;
    const effective = nearby >= threshold
      ? SEV_LEVELS[Math.min(idx + 1, SEV_LEVELS.length - 1)]
      : SEV_LEVELS[idx];
    result.set(r.report_id, effective);
  }
  return result;
}

export default function MapScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selected, setSelected] = useState<Report | null>(null);
  const mapRef = useRef<MapView>(null);

  // Pre-compute density-adjusted severity for every report
  const severityMap = React.useMemo(
    () => computeEffectiveSeverity(reports, 20, 10),
    [reports],
  );

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

  const getPinColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ef4444";
      case "medium":
        return "#f97316";
      default:
        return "#84cc16";
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
        onPress={() => setSelected(null)}
      >
        {reports.map((r) => {
          const eff = severityMap.get(r.report_id) || r.severity;
          const color = getPinColor(eff);
          return (
            <Marker
              key={r.report_id}
              coordinate={{ latitude: r.geo_lat, longitude: r.geo_lng }}
              pinColor={color}
              onPress={() => setSelected(r)}
            />
          );
        })}

        {reports.length > 0 && (
          <Heatmap
            points={reports.map((r) => {
              const eff = severityMap.get(r.report_id) || r.severity;
              return {
                latitude: r.geo_lat,
                longitude: r.geo_lng,
                weight:
                  eff === "critical"
                    ? 1
                    : eff === "high"
                    ? 0.8
                    : eff === "medium"
                    ? 0.5
                    : 0.3,
              };
            })}
            radius={50}
            opacity={0.15}
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

      {/* Report count */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{reports.length} reports</Text>
      </View>

      {/* Detail card when a pin is tapped */}
      {selected && (
        <View style={styles.detailCard}>
          <TouchableOpacity style={styles.detailClose} onPress={() => setSelected(null)}>
            <Ionicons name="close" size={20} color="#aaa" />
          </TouchableOpacity>

          {selected.image_url ? (
            <Image
              source={{ uri: selected.image_url }}
              style={styles.detailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.detailNoImage}>
              <Ionicons name="image-outline" size={32} color="#555" />
              <Text style={styles.detailNoImageText}>No photo</Text>
            </View>
          )}

          <View style={styles.detailBody}>
            <Text style={styles.detailTitle}>
              {selected.waste_type?.charAt(0).toUpperCase() + selected.waste_type?.slice(1)} Waste
            </Text>

            <View style={styles.detailRow}>
              <View style={[styles.severityDot, { backgroundColor: getPinColor(severityMap.get(selected.report_id) || selected.severity) }]} />
              <Text style={styles.detailSeverity}>
                {(severityMap.get(selected.report_id) || selected.severity)?.charAt(0).toUpperCase() +
                  (severityMap.get(selected.report_id) || selected.severity)?.slice(1)}
              </Text>
              {selected.ai_confidence != null && (
                <Text style={styles.detailConf}>
                  {Math.round((selected.ai_confidence || 0) * 100)}% confidence
                </Text>
              )}
            </View>

            {selected.description ? (
              <Text style={styles.detailDesc} numberOfLines={3}>
                {selected.description}
              </Text>
            ) : null}

            <View style={styles.detailFooter}>
              <Text style={[styles.detailStatus, { color: getPinColor(severityMap.get(selected.report_id) || selected.severity) }]}>
                {selected.status?.toUpperCase()}
              </Text>
              {selected.heading != null && (
                <View style={styles.headingBadge}>
                  <Ionicons name="compass-outline" size={12} color="#84cc16" />
                  <Text style={styles.headingText}>{Math.round(selected.heading)}°</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
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
  map: { width: SCREEN_W, height: SCREEN_H },

  // ─── Filters ────────────────────────
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

  // ─── Detail card ────────────────────
  detailCard: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  detailClose: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailImage: {
    width: "100%",
    height: 140,
  },
  detailNoImage: {
    width: "100%",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
  },
  detailNoImageText: {
    color: "#555",
    fontSize: 11,
    marginTop: 4,
  },
  detailBody: {
    padding: 14,
  },
  detailTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailSeverity: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "600",
  },
  detailConf: {
    color: "#84cc16",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
  detailDesc: {
    color: "#999",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  detailFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailStatus: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  headingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(132,204,22,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  headingText: {
    color: "#84cc16",
    fontSize: 11,
    fontWeight: "700",
  },
  webContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  webText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});