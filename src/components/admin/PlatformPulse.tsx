import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface MetricItem {
  id: string;
  iconName: string;
  iconType: "ionicons" | "material" | "feather" | "fontawesome";
  iconColor: string;
  iconBgColor: string;
  badgeText: string;
  badgeTextColor: string;
  badgeBgColor?: string;
  isBadgePill?: boolean;
  value: string;
  label: string;
}

const DEFAULT_METRICS: MetricItem[] = [
  {
    id: "students",
    iconName: "school",
    iconType: "ionicons",
    iconColor: "#3B82F6",
    iconBgColor: "#EEF2FF",
    badgeText: "↗ +12%",
    badgeTextColor: "#059669",
    value: "1,420",
    label: "Total Students",
  },
  {
    id: "mentors",
    iconName: "account-tie-outline",
    iconType: "material",
    iconColor: "#0D9488",
    iconBgColor: "#CCFBF1",
    badgeText: "94% Appr.",
    badgeTextColor: "#0D9488",
    value: "185",
    label: "Active Mentors",
  },
  {
    id: "classes",
    iconName: "ticket-confirmation-outline",
    iconType: "material",
    iconColor: "#4F46E5",
    iconBgColor: "#EEF2FF",
    badgeText: "All Time",
    badgeTextColor: "#64748B",
    value: "3,890",
    label: "Completed Classes",
  },
  {
    id: "flags",
    iconName: "flag",
    iconType: "ionicons",
    iconColor: "#D97706",
    iconBgColor: "#FEF3C7",
    badgeText: "Alert",
    badgeTextColor: "#FFFFFF",
    badgeBgColor: "#DC2626",
    isBadgePill: true,
    value: "14",
    label: "Unresolved Flags",
  },
];

interface PlatformPulseProps {
  metrics?: MetricItem[];
}

export function PlatformPulse({ metrics = DEFAULT_METRICS }: PlatformPulseProps) {
  const renderIcon = (item: MetricItem) => {
    switch (item.iconType) {
      case "ionicons":
        return <Ionicons name={item.iconName as any} size={18} color={item.iconColor} />;
      case "material":
        return (
          <MaterialCommunityIcons
            name={item.iconName as any}
            size={19}
            color={item.iconColor}
          />
        );
      case "feather":
        return <Feather name={item.iconName as any} size={18} color={item.iconColor} />;
      case "fontawesome":
        return (
          <FontAwesome5 name={item.iconName as any} size={16} color={item.iconColor} />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerIconWrapper}>
          <MaterialCommunityIcons
            name="chart-timeline-variant"
            size={18}
            color="#2563EB"
          />
        </View>
        <Text style={styles.sectionTitle}>Platform Pulse</Text>
      </View>

      <View style={styles.grid}>
        {metrics.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              <View
                style={[styles.iconWrapper, { backgroundColor: item.iconBgColor }]}
              >
                {renderIcon(item)}
              </View>

              {item.isBadgePill ? (
                <View
                  style={[
                    styles.pillBadge,
                    { backgroundColor: item.badgeBgColor ?? "#DC2626" },
                  ]}
                >
                  <Text style={styles.pillBadgeText}>{item.badgeText}</Text>
                </View>
              ) : (
                <Text
                  style={[styles.statBadgeText, { color: item.badgeTextColor }]}
                >
                  {item.badgeText}
                </Text>
              )}
            </View>

            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  headerIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  card: {
    width: "48.2%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillBadgeText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "700",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
});
