<<<<<<< HEAD
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Heatmap } from "react-native-maps";
import Navbar from "../navbar";

const { width, height } = Dimensions.get("window");

// Sample report type
type Report = {
  id: string;
  lat: number;
  lng: number;
  type: string;
  location: string;
  severity: "Low" | "High" | "Critical";
};

type Props = {
  reports: Report[];
};

export default function MapScreen() {
  const reports: Report[] = [
    {
      id: "1",
      lat: 10.3157,
      lng: 123.8854,
      type: "Organic",
      location: "Cebu City Central Park",
      severity: "Low",
    },
    {
      id: "2",
      lat: 10.3210,
      lng: 123.8920,
      type: "Plastic",
      location: "Mango Avenue",
      severity: "High",
    },
    {
      id: "3",
      lat: 10.3180,
      lng: 123.8700,
      type: "Hazardous",
      location: "Carbon Market",
      severity: "Critical",
    },
    {
      id: "4",
      lat: 10.3300,
      lng: 123.8900,
      type: "Organic",
      location: "Cebu IT Park",
      severity: "Low",
    },
    {
      id: "5",
      lat: 10.3100,
      lng: 123.8800,
      type: "Plastic",
      location: "Fuente Osmeña",
      severity: "High",
    },
  ];

  const mapRef = useRef<MapView>(null);
  const [currentView, setCurrentView] = useState("map");

  // Region centered on Cebu City
  const region = {
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case "Critical":
      case "High":
        return "red";
      case "Low":
      default:
        return "orange";
    }
  };

  // --- WEB CHECK ---
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
        {/* Markers */}
        {reports.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            title={`${r.type} Waste`}
            description={`${r.location}\nSeverity: ${r.severity}`}
            pinColor={getMarkerColor(r.severity)}
          />
        ))}

        {/* Heatmap */}
        <Heatmap
          points={reports.map((r) => ({
            latitude: r.lat,
            longitude: r.lng,
            weight:
              r.severity === "Critical"
                ? 1
                : r.severity === "High"
                ? 0.8
                : 0.5,
          }))}
          radius={50}
          opacity={0.6}
          gradient={{
            colors: ["blue", "lime", "red"],
            startPoints: [0.1, 0.4, 1],
            colorMapSize: 256,
          }}
        />
      </MapView>

      {/* Filters Overlay */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
            <Text style={styles.filterTextActive}>All Waste</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Plastics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Hazardous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Organic</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />

    </View>
  );
}

// Dark Google Map Style
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
    top: 40,
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
=======
import React from "react";
import { StyleSheet } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

export default function MapScreen() {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        latitude: 10.3157,
        longitude: 123.8854,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
>>>>>>> 8f579f976825d45999329a877d2947ba5c22ba6e
});