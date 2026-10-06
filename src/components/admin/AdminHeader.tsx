import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AdminHeaderProps {
  onProfilePress?: () => void;
}

export function AdminHeader({ onProfilePress }: AdminHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Overview</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>
        <Text style={styles.subtitleText}>TutorMate Portal</Text>
      </View>

      <TouchableOpacity
        style={styles.profileButton}
        activeOpacity={0.8}
        onPress={onProfilePress}
        accessibilityLabel="Admin Profile & Logout"
      >
        <Ionicons name="person" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  titleColumn: {
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  adminBadge: {
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: "#0D9488",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#64748B",
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0052CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});
