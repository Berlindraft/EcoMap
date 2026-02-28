import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_W } = Dimensions.get("window");

type ResultModalProps = {
  visible: boolean;
  success: boolean;
  title: string;
  message: string;
  /** e.g. "+50 Eco-Points" or "Code: ECO-AB12CD" */
  detail?: string;
  /** Icon shown inside the detail badge (default: leaf for success, alert-circle for fail) */
  detailIcon?: keyof typeof Ionicons.glyphMap;
  /** Label on the dismiss button (default: "Done" for success, "OK" for fail) */
  buttonLabel?: string;
  onDismiss: () => void;
};

export default function ResultModal({
  visible,
  success,
  title,
  message,
  detail,
  detailIcon,
  buttonLabel,
  onDismiss,
}: ResultModalProps) {
  const accent = success ? "#84cc16" : "#ef4444";
  const icon = success ? "checkmark-circle" : "close-circle";
  const btnLabel = buttonLabel ?? (success ? "Done" : "OK");
  const dIcon = detailIcon ?? (success ? "leaf" : "alert-circle");

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: success ? "rgba(132,204,22,0.3)" : "rgba(239,68,68,0.3)" }]}>
          <Ionicons name={icon} size={56} color={accent} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {detail ? (
            <View style={[styles.detailBadge, { backgroundColor: success ? "rgba(132,204,22,0.15)" : "rgba(239,68,68,0.15)" }]}>
              <Ionicons name={dIcon} size={18} color={accent} />
              <Text style={[styles.detailText, { color: accent }]}>{detail}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: accent }]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>{btnLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: SCREEN_W - 48,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },
  message: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  detailText: {
    fontSize: 16,
    fontWeight: "800",
  },
  button: {
    marginTop: 22,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 140,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
});
