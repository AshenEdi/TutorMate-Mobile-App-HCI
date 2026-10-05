import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AccountCard,
  AccountCardType,
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
import { useAuth } from "../../context/AuthContext";

const INITIAL_ACCOUNTS: AccountData[] = [
  {
    id: "1",
    type: "tutor",
    name: "Dr. Sarah Jenkins",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    badgeText: "Active",
    badgeType: "active",
    subtitle: "AP Calculus Specialist • Ph.D. MIT",
    hourlyRate: "$45",
    rating: 4.9,
    reviewsCount: 125,
    accountId: "#TUT-8842",
  },
  {
    id: "2",
    type: "student",
    name: "Maya Alvarez",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    badgeText: "Good Standing",
    badgeType: "good_standing",
    subtitle: "Grade 11 • Algebra II & Chem",
    completedSessions: 24,
    lastActive: "Last active: 2h ago",
  },
  {
    id: "3",
    type: "dispute",
    name: "Alex Rivera",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    badgeText: "Report Pending",
    badgeType: "dispute",
    subtitle: "Physics Mentor • University Senior",
    disputeTag: "Session Dispute",
    disputeReportCount: "1 Report Pending",
    disputeDescription:
      "Student reported tutor no-show for AP Physics exam prep session on Oct 24th. Refund requested ($40.00).",
  },
  {
    id: "4",
    type: "tutor",
    name: "Dr. Marcus Vance",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    badgeText: "Active",
    badgeType: "active",
    subtitle: "AP Physics C Specialist • Harvard M.S.",
    hourlyRate: "$60",
    rating: 4.95,
    reviewsCount: 204,
    accountId: "#TUT-9104",
  },
  {
    id: "5",
    type: "student",
    name: "Lucas Bennett",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    badgeText: "Good Standing",
    badgeType: "good_standing",
    subtitle: "Grade 12 • AP Biology & Pre-Med",
    completedSessions: 18,
    lastActive: "Last active: 1d ago",
  },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const [activeBottomTab, setActiveBottomTab] = useState<AdminTab>("overview");
  const [selectedCategory, setSelectedCategory] =
    useState<AccountCategory>("All");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Filter accounts based on category, status, and search query
  const filteredAccounts = useMemo(() => {
    return INITIAL_ACCOUNTS.filter((acc) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = acc.name.toLowerCase().includes(query);
        const matchSubtitle = acc.subtitle.toLowerCase().includes(query);
        const matchId = acc.accountId?.toLowerCase().includes(query);
        if (!matchName && !matchSubtitle && !matchId) return false;
      }

      // 2. Category Tab filter
      if (selectedCategory === "Students" && acc.type !== "student")
        return false;
      if (selectedCategory === "Tutors" && acc.type !== "tutor") return false;
      if (selectedCategory === "Suspended") return false;

      // 3. Status filter
      if (selectedStatus === "Reported" && acc.type !== "dispute") return false;

      return true;
    });
  }, [selectedCategory, selectedStatus, searchQuery]);

  const handleSignOut = async () => {
    setShowProfileModal(false);
    await signOut();
    router.replace("/welcome");
  };

  const handleCheckReportedIssues = () => {
    router.push("/(admin)/AdminQueue");
  };

  const handleReviewCase = (item: AccountData) => {
    router.push("/(admin)/DisputeResolution");
  };

  const handleAuditProfile = (item: AccountData) => {
    Alert.alert(
      "Audit Profile",
      `Tutor: ${item.name}\n${item.subtitle}\nRate: ${item.hourlyRate}/hr\nRating: ${item.rating} ★\n\nBackground check status: Verified & Approved.`
    );
  };

  const handleViewDetails = (item: AccountData) => {
    Alert.alert(
      "Account Record Details",
      `User: ${item.name}\nType: ${item.type.toUpperCase()}\nStatus: ${item.badgeText}\n${item.subtitle}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- Top Header Component --- */}
      <AdminHeader onProfilePress={() => router.push("/(admin)/AdminProfile")} />

      {/* --- Main Scrollable Dashboard Content --- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- Action Items Banner Component --- */}
        <AdminActionBanner
          count={14}
          newCount={14}
          onPressAction={handleCheckReportedIssues}
        />

        {/* --- Platform Pulse 2x2 Metrics Component --- */}
        <PlatformPulse />

        {/* --- Directory & Records Search & Filter Component --- */}
        <DirectoryControls
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          reportedCount={14}
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
        activeTab={activeBottomTab}
        onTabPress={(tab) => {
          if (tab === "reports") {
            router.push("/(admin)/AdminQueue");
          } else if (tab === "users") {
            setActiveBottomTab(tab);
            setSelectedCategory("All");
            setSelectedStatus("Active");
          } else {
            setActiveBottomTab(tab);
          }
        }}
      />

      {/* --- Admin Profile & Sign Out Modal --- */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatarCircle}>
                <Ionicons name="shield-checkmark" size={28} color="#0052CC" />
              </View>
              <Text style={styles.modalAdminName}>
                {profile?.full_name ?? "Administrator"}
              </Text>
              <Text style={styles.modalAdminEmail}>
                {profile?.email ?? "admin@tutormate.io"}
              </Text>
              <View style={styles.modalRolePill}>
                <Text style={styles.modalRoleText}>Role: Administrator</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalSignOutBtn}
              activeOpacity={0.85}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              <Text style={styles.modalSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    gap: 6,
    width: "100%",
  },
  modalAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  modalAdminName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalAdminEmail: {
    fontSize: 13,
    color: "#64748B",
  },
  modalRolePill: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  modalRoleText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0052CC",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    width: "100%",
    marginVertical: 18,
  },
  modalSignOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    width: "100%",
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modalSignOutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
});
