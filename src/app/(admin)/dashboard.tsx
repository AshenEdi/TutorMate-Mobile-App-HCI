import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AccountCard,
  AccountCategory,
  AccountData,
  AdminActionBanner,
  AdminBottomNav,
  AdminHeader,
  AdminTab,
  DirectoryControls,
  PlatformPulse,
  StatusFilter,
} from "../../components/admin";
import {
  getDirectoryAccounts,
  getPlatformPulseMetrics,
  PlatformMetricsData,
} from "../../services/adminService";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeBottomTab, setActiveBottomTab] = useState<AdminTab>("overview");
  const [selectedCategory, setSelectedCategory] =
    useState<AccountCategory>("All");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [fetchedAccounts, fetchedMetrics] = await Promise.all([
        getDirectoryAccounts(),
        getPlatformPulseMetrics(),
      ]);
      setAccounts(fetchedAccounts);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.warn("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Dynamic category counts
  const categoryCounts = useMemo(() => {
    const all = accounts.length;
    const students = accounts.filter((a) => a.type === "student").length;
    const tutors = accounts.filter((a) => a.type === "tutor").length;
    const suspended = accounts.filter((a) => a.badgeText === "Suspended").length;
    return { all, students, tutors, suspended };
  }, [accounts]);

  // Filter accounts based on category, status, and search query
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = acc.name.toLowerCase().includes(query);
        const matchSubtitle = acc.subtitle.toLowerCase().includes(query);
        const matchId = acc.accountId?.toLowerCase().includes(query);
        if (!matchName && !matchSubtitle && !matchId) return false;
      }

      // 2. Category Tab filter
      if (selectedCategory === "Students" && acc.type !== "student") return false;
      if (selectedCategory === "Tutors" && acc.type !== "tutor") return false;
      if (selectedCategory === "Suspended" && acc.badgeText !== "Suspended") return false;

      // 3. Status filter
      if (selectedStatus === "Reported" && acc.type !== "dispute") return false;
      if (selectedStatus === "Active" && acc.badgeText !== "Active" && acc.badgeText !== "Good Standing") return false;
      if (selectedStatus === "Pending" && acc.badgeText !== "Pending" && acc.badgeType !== "pending") return false;
      if (selectedStatus === "High Risk" && acc.badgeText !== "Suspended" && acc.badgeText !== "Report Pending") return false;

      return true;
    });
  }, [accounts, selectedCategory, selectedStatus, searchQuery]);

  const handleCheckReportedIssues = () => {
    router.replace("/(admin)/AdminQueue");
  };

  const handleReviewCase = (item: AccountData) => {
    router.push({
      pathname: "/(admin)/DisputeResolution",
      params: { caseId: item.id, userName: item.name },
    });
  };

  const handleAuditProfile = (item: AccountData) => {
    Alert.alert(
      "Audit Profile Details",
      `User: ${item.name}\n${item.subtitle}\nID: ${item.accountId || "—"}\nRate: ${item.hourlyRate || "—"}\nRating: ${item.rating || "—"} ★\nStatus: ${item.badgeText}`
    );
  };

  const handleViewDetails = (item: AccountData) => {
    Alert.alert(
      "Account Record Details",
      `User: ${item.name}\nType: ${item.type.toUpperCase()}\nStatus: ${item.badgeText}\n${item.subtitle}`
    );
  };

  const dynamicPulseMetrics = metrics
    ? [
        {
          id: "students",
          iconName: "school",
          iconType: "ionicons" as const,
          iconColor: "#3B82F6",
          iconBgColor: "#EEF2FF",
          badgeText: metrics.studentsGrowth,
          badgeTextColor: "#059669",
          value: metrics.totalStudents,
          label: "Total Students",
        },
        {
          id: "mentors",
          iconName: "account-tie-outline",
          iconType: "material" as const,
          iconColor: "#0D9488",
          iconBgColor: "#CCFBF1",
          badgeText: metrics.tutorsApprovalRate,
          badgeTextColor: "#0D9488",
          value: metrics.activeTutors,
          label: "Active Mentors",
        },
        {
          id: "classes",
          iconName: "ticket-confirmation-outline",
          iconType: "material" as const,
          iconColor: "#4F46E5",
          iconBgColor: "#EEF2FF",
          badgeText: "All Time",
          badgeTextColor: "#64748B",
          value: metrics.completedClasses,
          label: "Completed Classes",
        },
        {
          id: "flags",
          iconName: "flag",
          iconType: "ionicons" as const,
          iconColor: "#D97706",
          iconBgColor: "#FEF3C7",
          badgeText: Number(metrics.unresolvedFlags) > 0 ? "Alert" : "Clean",
          badgeTextColor: "#FFFFFF",
          badgeBgColor: Number(metrics.unresolvedFlags) > 0 ? "#DC2626" : "#0D9488",
          isBadgePill: true,
          value: metrics.unresolvedFlags,
          label: "Unresolved Flags",
        },
      ]
    : undefined;

  const totalPendingActionItems = Number(metrics?.unresolvedFlags ?? 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- Top Header Component --- */}
      <AdminHeader onProfilePress={() => router.push("/(admin)/AdminProfile")} />

      {/* --- Main Scrollable Dashboard Content --- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* --- Action Items Banner Component --- */}
        <AdminActionBanner
          count={totalPendingActionItems}
          newCount={totalPendingActionItems}
          onPressAction={handleCheckReportedIssues}
        />

        {/* --- Platform Pulse 2x2 Metrics Component --- */}
        <PlatformPulse metrics={dynamicPulseMetrics} />

        {/* --- Directory & Records Search & Filter Component --- */}
        <DirectoryControls
          totalCount={`${accounts.length} Accounts`}
          categoryCounts={categoryCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          reportedCount={totalPendingActionItems}
        />

        {/* --- Records List of AccountCard Components --- */}
        <View style={styles.cardsList}>
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              data={account}
              onViewDetails={handleViewDetails}
              onAuditProfile={handleAuditProfile}
              onReviewCase={handleReviewCase}
            />
          ))}

          {filteredAccounts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Accounts Found</Text>
              <Text style={styles.emptySubtitle}>
                No records matched your search or active filter criteria.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- Bottom Navigation Component --- */}
      <AdminBottomNav
        activeTab="overview"
        onTabPress={(tab) => {
          if (tab === "reports") {
            router.replace("/(admin)/AdminQueue");
          } else if (tab === "users") {
            router.replace("/(admin)/users");
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  cardsList: {
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
  },
});
