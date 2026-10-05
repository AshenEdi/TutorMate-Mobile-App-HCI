import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AdminActionBannerProps {
  count?: number;
  newCount?: number;
  onPressAction?: () => void;
}

export function AdminActionBanner({
  count = 14,
  newCount = 14,
  onPressAction,
}: AdminActionBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="warning" size={20} color="#FFFFFF" />
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.titleText}>{count} Action Items</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{newCount} New</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>
            Disputed sessions, student grievances & flagged chat logs await
            moderation.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.85}
        onPress={onPressAction}
      >
        <MaterialCommunityIcons
          name="shield-alert-outline"
          size={16}
          color="#FFFFFF"
          style={styles.actionBtnIcon}
        />
        <Text style={styles.actionButtonText}>Check Reported Issues</Text>
        <Feather name="arrow-right" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF1F2",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECDD3",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#BE123C",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#881337",
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: "#9F1239",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "700",
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#9F1239",
    fontWeight: "400",
  },
  actionButton: {
    backgroundColor: "#991B1B",
    borderRadius: 25,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  actionBtnIcon: {
    marginRight: -2,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
});
