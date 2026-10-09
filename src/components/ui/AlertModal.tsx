import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type AlertType = "error" | "success" | "warning" | "info";

export interface AlertModalProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  buttonText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
}

export function AlertModal({
  visible,
  type = "error",
  title,
  message,
  buttonText = "Got it",
  cancelText = "Cancel",
  showCancel = false,
  onClose,
  onConfirm,
}: AlertModalProps) {
  if (!visible) return null;

  const iconConfig: Record<
    AlertType,
    { name: keyof typeof Ionicons.glyphMap; color: string; bg: string; buttonBg: string }
  > = {
    error: {
      name: "alert-circle",
      color: "#EF4444",
      bg: "#FEE2E2",
      buttonBg: "#EF4444",
    },
    success: {
      name: "checkmark-circle",
      color: "#10B981",
      bg: "#D1FAE5",
      buttonBg: "#10B981",
    },
    warning: {
      name: "warning",
      color: "#F59E0B",
      bg: "#FEF3C7",
      buttonBg: "#F59E0B",
    },
    info: {
      name: "information-circle",
      color: "#2563EB",
      bg: "#DBEAFE",
      buttonBg: "#2563EB",
    },
  };

  const currentConfig = iconConfig[type] || iconConfig.error;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={[styles.iconWrapper, { backgroundColor: currentConfig.bg }]}>
                <Ionicons
                  name={currentConfig.name}
                  size={36}
                  color={currentConfig.color}
                />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {showCancel ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.cancelButton}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.confirmButton, { backgroundColor: currentConfig.buttonBg }]}
                    onPress={() => {
                      if (onConfirm) onConfirm();
                      else if (onClose) onClose();
                    }}
                  >
                    <Text style={styles.confirmButtonText}>{buttonText}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.button, { backgroundColor: currentConfig.buttonBg }]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>{buttonText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmButton: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
