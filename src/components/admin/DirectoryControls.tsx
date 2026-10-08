import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type AccountCategory = "All" | "Students" | "Tutors" | "Suspended";
export type StatusFilter = "Active" | "Pending" | "Reported" | "High Risk";

interface DirectoryControlsProps {
  totalCount?: string;
  categoryCounts?: {
    all?: number;
    students?: number;
    tutors?: number;
    suspended?: number;
  };
  selectedCategory: AccountCategory;
  onSelectCategory: (cat: AccountCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: StatusFilter;
  onSelectStatus: (status: StatusFilter) => void;
  reportedCount?: number;
}

export function DirectoryControls({
  totalCount = "1,605 Accounts",
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
  reportedCount = 14,
}: DirectoryControlsProps) {
  const categories: { id: AccountCategory; label: string }[] = [
    { id: "All", label: `All (${categoryCounts?.all ?? 1605})` },
    { id: "Students", label: `Students (${categoryCounts?.students ?? 1420})` },
    { id: "Tutors", label: `Tutors (${categoryCounts?.tutors ?? 185})` },
    { id: "Suspended", label: `Suspended (${categoryCounts?.suspended ?? 0})` },
  ];
  return (
    <View style={styles.container}>
      {/* Title & Account Count */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Directory & Records</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.accountsLinkText}>{totalCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.75}
              style={[
                styles.categoryTab,
                isActive ? styles.categoryTabActive : styles.categoryTabInactive,
              ]}
              onPress={() => onSelectCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  isActive
                    ? styles.categoryTabTextActive
                    : styles.categoryTabTextInactive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, student ID, email, or subje..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        <TouchableOpacity activeOpacity={0.6} style={styles.micButton}>
          <Feather name="mic" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusChipsScroll}
      >
        {/* Active Chip */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.chip,
            selectedStatus === "Active" ? styles.chipActiveSolid : styles.chipInactive,
          ]}
          onPress={() => onSelectStatus("Active")}
        >
          <Text
            style={[
              styles.chipText,
              selectedStatus === "Active"
                ? styles.chipTextActiveSolid
                : styles.chipTextInactive,
            ]}
          >
            Active ✓
          </Text>
        </TouchableOpacity>

        {/* Pending Approval Chip */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.chip,
            styles.chipPending,
            selectedStatus === "Pending" && styles.chipSelectedBorder,
          ]}
          onPress={() => onSelectStatus("Pending")}
        >
          <Text style={styles.chipPendingText}>Pending Approval</Text>
          <View style={styles.blueDot} />
        </TouchableOpacity>

        {/* Reported Chip */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.chip,
            styles.chipReported,
            selectedStatus === "Reported" && styles.chipSelectedBorder,
          ]}
          onPress={() => onSelectStatus("Reported")}
        >
          <Text style={styles.chipReportedText}>Reported</Text>
          <View style={styles.reportedBadge}>
            <Text style={styles.reportedBadgeText}>{reportedCount}</Text>
          </View>
        </TouchableOpacity>

        {/* High Risk Chip */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.chip,
            styles.chipInactive,
            selectedStatus === "High Risk" && styles.chipSelectedBorder,
          ]}
          onPress={() => onSelectStatus("High Risk")}
        >
          <Text style={styles.chipTextInactive}>High Risk</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  accountsLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryTabActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  categoryTabInactive: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  categoryTabText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  categoryTabTextActive: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
  categoryTabTextInactive: {
    color: "#64748B",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#0F172A",
    height: "100%",
  },
  micButton: {
    padding: 6,
  },
  statusChipsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    gap: 6,
  },
  chipActiveSolid: {
    backgroundColor: "#0052CC",
  },
  chipInactive: {
    backgroundColor: "#F1F5F9",
  },
  chipPending: {
    backgroundColor: "#F1F5F9",
  },
  chipReported: {
    backgroundColor: "#FFF1F2",
  },
  chipSelectedBorder: {
    borderWidth: 1.5,
    borderColor: "#0052CC",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActiveSolid: {
    color: "#FFFFFF",
  },
  chipTextInactive: {
    color: "#64748B",
  },
  chipPendingText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0052CC",
  },
  chipReportedText: {
    color: "#BE123C",
    fontSize: 12,
    fontWeight: "700",
  },
  reportedBadge: {
    backgroundColor: "#FFE4E6",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  reportedBadgeText: {
    color: "#BE123C",
    fontSize: 10.5,
    fontWeight: "800",
  },
});
