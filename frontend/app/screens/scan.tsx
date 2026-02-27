import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import {
  uploadImage,
  analyzeWaste,
  submitReport,
  detectObjects,
} from "../../services/api";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type Detection = {
  x: number;
  y: number;
  width: number;
  height: number;
  class_name: string;
  confidence: number;
  waste_type: string;
  color: string;
};

type DetectionResult = {
  detections: Detection[];
  summary: { total_count: number; waste_type: string; severity: string };
  image_width: number;
  image_height: number;
};

type AnalysisResult = {
  waste_type: string;
  severity: string;
  confidence: number;
  action: string;
};



export default function ScanScreen() {
  const { profile, refreshProfile } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Detection state
  const [detections, setDetections] = useState<Detection[]>([]);
  const [summary, setSummary] = useState<DetectionResult["summary"] | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [isLive, setIsLive] = useState(true);

  // Camera photo dimensions (for display container aspect ratio)
  const [photoDims, setPhotoDims] = useState<{ w: number; h: number } | null>(null);
  // Roboflow image dimensions (for bounding box coordinate scaling)
  const [roboImgDims, setRoboImgDims] = useState<{ w: number; h: number } | null>(null);

  // Actual camera view height (captured via onLayout so frozen frame matches exactly)
  const [viewH, setViewH] = useState(SCREEN_H);

  // Report state
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [frozenBase64, setFrozenBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  // Request location permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        setLocation({ lat: 10.3157, lng: 123.8854 });
      }
    })();
  }, []);

  // ─── Scan button → detect + freeze + analyze ─────
  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setDetecting(true);

      // Capture fresh GPS + compass heading at the instant of scan
      try {
        const [loc, head] = await Promise.all([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          Location.getHeadingAsync(),
        ]);
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        if (head.trueHeading >= 0) {
          setHeading(head.trueHeading);
        } else {
          setHeading(head.magHeading);
        }
      } catch {
        // Keep whatever location we already had from mount
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
      });

      if (photo) {
        setIsLive(false);
        setFrozenUri(photo.uri);
        setFrozenBase64(photo.base64 || null);
        // Store camera photo's own dimensions for the display container
        setPhotoDims({ w: photo.width || SCREEN_W, h: photo.height || Math.round(SCREEN_W * 4 / 3) });

        if (photo.base64) {
          // Run detection (bounding boxes) and full analysis in parallel
          setAnalyzing(true);
          try {
            const [detectionResult, analysisResult] = await Promise.allSettled([
              detectObjects(photo.base64),
              analyzeWaste(photo.base64),
            ]);

            if (detectionResult.status === "fulfilled") {
              const dr = detectionResult.value as DetectionResult;
              console.log("[Scan] Detection:", dr.detections.length, "items, roboflow image:", dr.image_width, "x", dr.image_height,
                "camera photo:", photo.width, "x", photo.height);
              setDetections(dr.detections);
              setSummary(dr.summary);
              // Store the image dimensions Roboflow used for coordinate scaling
              if (dr.image_width && dr.image_height) {
                setRoboImgDims({ w: dr.image_width, h: dr.image_height });
              } else {
                // Fallback to photo dims from camera
                setRoboImgDims({ w: photo.width || SCREEN_W, h: photo.height || Math.round(SCREEN_W * 4 / 3) });
              }
            } else {
              console.log("[Scan] Detection FAILED:", detectionResult.reason);
            }

            if (analysisResult.status === "fulfilled") {
              setAnalysis(analysisResult.value);
            } else {
              console.log("Analysis error:", analysisResult.reason);
              const fallbackSummary = detectionResult.status === "fulfilled" ? detectionResult.value.summary : null;
              setAnalysis({
                waste_type: fallbackSummary?.waste_type || "mixed",
                severity: fallbackSummary?.severity || "medium",
                confidence: 0.75,
                action: "Analysis unavailable. Please submit with manual description.",
              });
            }
          } catch (err) {
            console.log("Scan processing error:", err);
          } finally {
            setAnalyzing(false);
          }
        }
      }
    } catch (err) {
      console.log("Scan error:", err);
    } finally {
      setDetecting(false);
    }
  };

  // ─── Submit report ──────────────────────
  const handleSubmit = async () => {
    if (!profile || !analysis) return;

    setSubmitting(true);
    try {
      let imageUrl = "";
      if (frozenUri) {
        try {
          const uploadResult = await uploadImage(frozenUri);
          imageUrl = uploadResult.url;
        } catch {
          console.log("Image upload failed, continuing without image");
        }
      }

      await submitReport({
        user_id: profile.uid,
        image_url: imageUrl,
        geo_lat: location?.lat || 10.3157,
        geo_lng: location?.lng || 123.8854,
        heading: heading ?? undefined,
        waste_type: analysis.waste_type,
        severity: analysis.severity,
        ai_confidence: analysis.confidence,
        description: description || `${analysis.waste_type} waste detected — ${analysis.action}`,
      });

      await refreshProfile();
      Alert.alert(
        "Report Submitted! 🎉",
        `+50 eco-points earned!\nWaste type: ${analysis.waste_type}\nSeverity: ${analysis.severity}`,
        [{ text: "OK", onPress: resetToLive }]
      );
    } catch (err) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
      console.log("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Reset back to live mode ────────────
  const resetToLive = () => {
    setIsLive(true);
    setFrozenUri(null);
    setFrozenBase64(null);
    setAnalysis(null);
    setDetections([]);
    setSummary(null);
    setDescription("");
    setPhotoDims(null);
    setRoboImgDims(null);
    setHeading(null);
  };

  // ─── Permission handling ────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={64} color="#555" />
        <Text style={styles.permText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Report mode (frozen frame) ─────────
  // Match the camera's full-screen "cover" framing so the frozen image
  // looks identical to what the user saw in the viewfinder.
  const imgW = roboImgDims?.w || photoDims?.w || SCREEN_W;
  const imgH = roboImgDims?.h || photoDims?.h || Math.round(SCREEN_W * 4 / 3);
  const containerW = SCREEN_W;
  const containerH = viewH;  // exact height the camera view occupied
  // Cover-mode scale: fill the container, potentially cropping one axis
  const coverScale = Math.max(containerW / imgW, containerH / imgH);
  // How much of the scaled image overflows the container (centered)
  const coverOffsetX = (imgW * coverScale - containerW) / 2;
  const coverOffsetY = (imgH * coverScale - containerH) / 2;

  if (!isLive && frozenUri) {
    return (
      <ScrollView style={styles.reportContainer} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Frozen image with bounding box overlays — matches camera framing */}
        <View style={[styles.frozenImageContainer, { height: containerH }]}>
          <Image
            source={{ uri: frozenUri }}
            style={{ width: containerW, height: containerH }}
            resizeMode="cover"
          />

          {/* Bounding boxes — cover-mode mapping from image coords → screen */}
          {detections.map((d, i) => {
            // Map image coords to display coords using cover-mode transform
            const rawLeft = (d.x - d.width / 2) * coverScale - coverOffsetX;
            const rawTop  = (d.y - d.height / 2) * coverScale - coverOffsetY;
            const rawW    = d.width  * coverScale;
            const rawH    = d.height * coverScale;
            // Clamp to container bounds
            const boxLeft = Math.max(0, rawLeft);
            const boxTop  = Math.max(0, rawTop);
            const boxW    = Math.min(rawW, containerW - boxLeft);
            const boxH    = Math.min(rawH, containerH - boxTop);
            // Skip boxes that are fully off-screen
            if (boxW <= 0 || boxH <= 0) return null;

            return (
              <View
                key={i}
                style={[
                  styles.box,
                  {
                    left: boxLeft,
                    top: boxTop,
                    width: boxW,
                    height: boxH,
                    borderColor: d.color,
                  },
                ]}
              >
                <View style={[styles.boxLabel, { backgroundColor: d.color }]}>
                  <Text style={styles.boxLabelText}>
                    {d.class_name} {Math.round(d.confidence * 100)}%
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Detection count badge on frozen image */}
          {detections.length > 0 && (
            <View style={styles.detectionCountBadge}>
              <Ionicons name="scan" size={14} color="#84cc16" />
              <Text style={styles.detectionCountText}>
                {detections.length} item{detections.length > 1 ? "s" : ""} detected
              </Text>
            </View>
          )}

          {/* Loading overlay while detecting */}
          {(analyzing && detections.length === 0) && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#84cc16" />
              <Text style={styles.scanningOverlayText}>Detecting waste...</Text>
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={resetToLive}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Analysis Card */}
        <View style={styles.analysisCard}>
          {analyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color="#84cc16" />
              <Text style={styles.analyzingText}>Analyzing waste...</Text>
            </View>
          ) : analysis ? (
            <>
              <Text style={styles.cardTitle}>AI Analysis</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Primary Type</Text>
                <View style={[styles.badge, { backgroundColor: "#84cc1633" }]}>
                  <Text style={styles.badgeText}>{analysis.waste_type}</Text>
                </View>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Severity</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        analysis.severity === "critical"
                          ? "#ef444433"
                          : analysis.severity === "high"
                          ? "#f9731633"
                          : "#84cc1633",
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{analysis.severity}</Text>
                </View>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Confidence</Text>
                <Text style={styles.resultValue}>
                  {Math.round(analysis.confidence * 100)}%
                </Text>
              </View>

              <Text style={styles.actionText}>{analysis.action}</Text>
            </>
          ) : null}
        </View>

        {/* Description Input */}
        <View style={styles.inputCard}>
          <Text style={styles.cardTitle}>Description (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add details about the waste..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (submitting || analyzing) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={submitting || analyzing}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#000" />
              <Text style={styles.submitText}>Submit Report (+50 pts)</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── Live camera mode ───────────────────
  return (
    <View style={styles.container} onLayout={(e) => setViewH(e.nativeEvent.layout.height)}>
      {/* Camera — no children allowed */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* Viewfinder guide — shows the center 90% scan area */}
      <View style={styles.viewfinderOverlay} pointerEvents="none">
        <View style={styles.viewfinderEdgeTop} />
        <View style={styles.viewfinderMiddleRow}>
          <View style={styles.viewfinderEdgeSide} />
          <View style={styles.viewfinderCenter}>
            {/* Corner brackets */}
            <View style={[styles.cornerBracket, styles.cornerTL]} />
            <View style={[styles.cornerBracket, styles.cornerTR]} />
            <View style={[styles.cornerBracket, styles.cornerBL]} />
            <View style={[styles.cornerBracket, styles.cornerBR]} />
          </View>
          <View style={styles.viewfinderEdgeSide} />
        </View>
        <View style={styles.viewfinderEdgeBottom} />
      </View>

      {/* Status badge */}
      <View style={styles.statusBadge}>
        {detecting ? (
          <ActivityIndicator size="small" color="#84cc16" />
        ) : (
          <Ionicons name="camera" size={16} color="#84cc16" />
        )}
        <Text style={styles.statusText}>
          {detecting ? "Scanning..." : "Tap SCAN to analyze waste"}
        </Text>
      </View>

      {/* Scan button */}
      <View style={styles.scanButtonContainer}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
          <View style={styles.scanButtonInner}>
            <Ionicons name="scan-circle" size={32} color="#000" />
          </View>
        </TouchableOpacity>
        <Text style={styles.scanLabel}>SCAN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  camera: { flex: 1 },

  // ─── Bounding boxes ─────────────────
  box: {
    position: "absolute",
    borderWidth: 2.5,
    borderRadius: 4,
    zIndex: 10,
    elevation: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  boxLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 11,
    elevation: 11,
  },
  boxLabelText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },

  // ─── Detection count badge ──────────
  detectionCountBadge: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detectionCountText: {
    color: "#84cc16",
    fontSize: 12,
    fontWeight: "800",
  },

  // ─── Scanning overlay ───────────────
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  scanningOverlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // ─── Status badge ───────────────────
  statusBadge: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "#84cc16",
    fontSize: 13,
    fontWeight: "700",
  },

  // ─── Scan button ────────────────────
  scanButtonContainer: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    alignItems: "center",
  },
  scanButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#84cc16",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(132,204,22,0.3)",
    shadowColor: "#84cc16",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  scanButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  scanLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: 2,
  },

  // ─── Permission UI ──────────────────
  permText: { color: "#aaa", fontSize: 16, fontWeight: "600" },
  permButton: {
    backgroundColor: "#84cc16",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permButtonText: { color: "#000", fontWeight: "700", fontSize: 14 },

  // ─── Report mode ────────────────────
  reportContainer: { flex: 1, backgroundColor: "#111" },
  frozenImageContainer: { width: SCREEN_W, position: "relative", overflow: "hidden" },
  frozenImage: { width: SCREEN_W },  // height set dynamically
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Analysis card ──────────────────
  analysisCard: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  analyzingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  analyzingText: { color: "#aaa", fontSize: 14 },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resultLabel: { color: "#888", fontSize: 13, fontWeight: "600" },
  resultValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: "#84cc16", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  actionText: {
    color: "#aaa",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
    lineHeight: 18,
  },

  // ─── Input card ─────────────────────
  inputCard: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
  },
  textInput: {
    backgroundColor: "#27272a",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
  },

  // ─── Submit button ──────────────────
  submitButton: {
    backgroundColor: "#84cc16",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitText: { color: "#000", fontSize: 15, fontWeight: "800" },

  // ─── Viewfinder overlay ─────────────
  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  viewfinderEdgeTop: {
    flex: 0.025,   // 2.5% top strip
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  viewfinderEdgeBottom: {
    flex: 0.025,   // 2.5% bottom strip
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  viewfinderMiddleRow: {
    flex: 0.95,   // center 95%
    flexDirection: "row",
  },
  viewfinderEdgeSide: {
    flex: 0.025,   // 2.5% each side
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  viewfinderCenter: {
    flex: 0.95,
    position: "relative",
  },
  // Corner brackets
  cornerBracket: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#84cc16",
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
});