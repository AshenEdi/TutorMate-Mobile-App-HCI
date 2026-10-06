import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type AdminTab = "overview" | "users" | "reports";

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabPress: (tab: AdminTab) => void;
}

export function AdminBottomNav({
  activeTab,
  onTabPress,
}: AdminBottomNavProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabPress("overview")}
      >
        <MaterialCommunityIcons
          name="view-dashboard-outline"
          size={22}
          color={activeTab === "overview" ? "#0052CC" : "#64748B"}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === "overview" && styles.tabLabelActive,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabPress("users")}
      >
        <Ionicons
          name="people-outline"
          size={22}
          color={activeTab === "users" ? "#0052CC" : "#64748B"}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === "users" && styles.tabLabelActive,
          ]}
        >
          Users
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabPress("reports")}
      >
        <Ionicons
          name="flag-outline"
          size={21}
          color={activeTab === "reports" ? "#0052CC" : "#64748B"}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === "reports" && styles.tabLabelActive,
          ]}
        >
          Reports
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingVertical: 10,
    paddingBottom: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#0052CC",
    fontWeight: "700",
  },
});
