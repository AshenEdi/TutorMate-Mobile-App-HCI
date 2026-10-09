import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AdminBottomNav } from "../../components/admin/AdminBottomNav";
import { AlertModal, AlertType } from "../../components/ui/AlertModal";
import {
  AdminUserProfile,
  deleteUserProfile,
  getAllAdminUsers,
  updateUserStanding,
} from "../../services/adminService";

type RoleFilter = "all" | "student" | "tutor" | "admin";
type StandingFilter = "all" | "good_standing" | "warning" | "under_review" | "suspended";

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [standingFilter, setStandingFilter] = useState<StandingFilter>("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // Alert Modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    buttonText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onOk?: () => void;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showNotification = (
    title: string,
    message: string,
    type: AlertType = "info",
    onOk?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttonText: "Got it",
      showCancel: false,
      onOk,
    });
  };

  const loadUsers = async () => {
    try {
      const data = await getAllAdminUsers();
      setUsers(data);
    } catch (err) {
      console.warn("Error fetching admin users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // Dynamic counts for tabs & metrics
  const counts = useMemo(() => {
    const total = users.length;
    const students = users.filter((u) => u.role === "student").length;
    const tutors = users.filter((u) => u.role === "tutor").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const flagged = users.filter(
      (u) => (u.strikes_count && u.strikes_count > 0) || u.standing === "suspended" || u.standing === "warning"
    ).length;
    return { total, students, tutors, admins, flagged };
  }, [users]);

  // Filtered list based on Search, Role, and Standing
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = user.full_name?.toLowerCase().includes(query) ?? false;
        const matchEmail = user.email?.toLowerCase().includes(query) ?? false;
        const matchSpecialty = user.specialty?.toLowerCase().includes(query) ?? false;
        const matchEducation = user.education?.toLowerCase().includes(query) ?? false;
        const matchPhone = user.phone_number?.toLowerCase().includes(query) ?? false;
        const matchLocation = user.location?.toLowerCase().includes(query) ?? false;
        const matchId = user.id?.toLowerCase().includes(query) ?? false;

        if (!matchName && !matchEmail && !matchSpecialty && !matchEducation && !matchPhone && !matchLocation && !matchId) {
          return false;
        }
      }

      // 2. Role Filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      // 3. Standing Filter
      if (standingFilter !== "all") {
        const userStanding = user.standing || "good_standing";
        if (userStanding !== standingFilter) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, standingFilter]);

  // Delete User Handler
  const handleDeleteUser = (user: AdminUserProfile) => {
    const roleLabel = user.role ? user.role.toUpperCase() : "USER";
    setAlertConfig({
      visible: true,
      type: "error",
      title: "Delete User Account",
      message: `Are you sure you want to permanently delete ${user.full_name} (${user.email})?\n\nRole: ${roleLabel}\nThis action will remove their profile and cannot be undone.`,
      showCancel: true,
      cancelText: "Cancel",
      buttonText: "Delete Permanently",
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        setIsProcessing(true);
        const res = await deleteUserProfile(user.id);
        setIsProcessing(false);

        if (res.success) {
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          showNotification(
            "User Deleted",
            `${user.full_name} was successfully removed from the system.`,
            "success"
          );
        } else {
          showNotification(
            "Delete Failed",
            res.error || "Unable to delete user. Please check database permissions.",
            "error"
          );
        }
      },
    });
  };

  // Update Standing Handler (Toggle Suspended / Warning / Good Standing)
  const handleToggleStanding = (user: AdminUserProfile, newStanding: 'good_standing' | 'warning' | 'suspended') => {
    const standingLabel =
      newStanding === "suspended"
        ? "Suspended"
        : newStanding === "warning"
        ? "Warning"
        : "Good Standing";

    setAlertConfig({
      visible: true,
      type: newStanding === "suspended" ? "warning" : "info",
      title: "Change Account Standing",
      message: `Set standing for ${user.full_name} to "${standingLabel}"?`,
      showCancel: true,
      cancelText: "Cancel",
      buttonText: "Apply Change",
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        setIsProcessing(true);
        const res = await updateUserStanding(user.id, newStanding);
        setIsProcessing(false);

        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, standing: newStanding } : u))
          );
          showNotification(
            "Standing Updated",
            `${user.full_name}'s standing is now set to ${standingLabel}.`,
            "success"
          );
        } else {
          showNotification("Update Failed", res.error || "Could not update standing.", "error");
        }
      },
    });
  };

  // Standing Badge Color Helper
  const getStandingBadge = (standing?: string) => {
    const st = standing || "good_standing";
    switch (st) {
      case "suspended":
        return { label: "Suspended", bg: "#FEE2E2", color: "#DC2626", border: "#FECDD3" };
      case "warning":
        return { label: "Warning", bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" };
      case "under_review":
        return { label: "Under Review", bg: "#F3E8FF", color: "#7E22CE", border: "#E9D5FF" };
      case "good_standing":
      default:
        return { label: "Good Standing", bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0" };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Top App Header --- */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.replace("/(admin)/dashboard")}
          >
            <Ionicons name="arrow-back" size={20} color="#0052CC" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topBarTitle}>User Directory</Text>
            <Text style={styles.topBarSubTitle}>{counts.total} Registered Accounts</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            activeOpacity={0.7}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons name="reload" size={17} color="#0052CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButtonTop}
            activeOpacity={0.8}
            onPress={() => router.push("/(admin)/AdminProfile")}
          >
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* --- Metric Stat Cards --- */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: "#2563EB" }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Students</Text>
              <Ionicons name="school-outline" size={16} color="#2563EB" />
            </View>
            <Text style={styles.metricValue}>{counts.students}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: "#0D9488" }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Tutors</Text>
              <MaterialCommunityIcons name="account-tie-outline" size={16} color="#0D9488" />
            </View>
            <Text style={styles.metricValue}>{counts.tutors}</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: "#DC2626" }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Flagged</Text>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            </View>
            <Text style={[styles.metricValue, { color: counts.flagged > 0 ? "#DC2626" : "#0F172A" }]}>
              {counts.flagged}
            </Text>
          </View>
        </View>

        {/* --- Search Input Box --- */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, subject, phone..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- Role Filter Tabs --- */}
        <View style={styles.roleTabsRow}>
          <TouchableOpacity
            style={[styles.roleTab, roleFilter === "all" && styles.roleTabActive]}
            activeOpacity={0.8}
            onPress={() => setRoleFilter("all")}
          >
            <Text style={[styles.roleTabText, roleFilter === "all" && styles.roleTabTextActive]}>
              All Users ({counts.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, roleFilter === "student" && styles.roleTabActive]}
            activeOpacity={0.8}
            onPress={() => setRoleFilter("student")}
          >
            <Text style={[styles.roleTabText, roleFilter === "student" && styles.roleTabTextActive]}>
              Students ({counts.students})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, roleFilter === "tutor" && styles.roleTabActive]}
            activeOpacity={0.8}
            onPress={() => setRoleFilter("tutor")}
          >
            <Text style={[styles.roleTabText, roleFilter === "tutor" && styles.roleTabTextActive]}>
              Tutors ({counts.tutors})
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Secondary Standing Chips Filter --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.standingChipsScroll}
        >
          <TouchableOpacity
            style={[
              styles.standingChip,
              standingFilter === "all" && styles.standingChipActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setStandingFilter("all")}
          >
            <Text
              style={[
                styles.standingChipText,
                standingFilter === "all" && styles.standingChipTextActive,
              ]}
            >
              All Standings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.standingChip,
              standingFilter === "good_standing" && styles.standingChipActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setStandingFilter("good_standing")}
          >
            <View style={[styles.chipDot, { backgroundColor: "#10B981" }]} />
            <Text
              style={[
                styles.standingChipText,
                standingFilter === "good_standing" && styles.standingChipTextActive,
              ]}
            >
              Good Standing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.standingChip,
              standingFilter === "warning" && styles.standingChipActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setStandingFilter("warning")}
          >
            <View style={[styles.chipDot, { backgroundColor: "#F59E0B" }]} />
            <Text
              style={[
                styles.standingChipText,
                standingFilter === "warning" && styles.standingChipTextActive,
              ]}
            >
              Warning
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.standingChip,
              standingFilter === "suspended" && styles.standingChipActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setStandingFilter("suspended")}
          >
            <View style={[styles.chipDot, { backgroundColor: "#EF4444" }]} />
            <Text
              style={[
                styles.standingChipText,
                standingFilter === "suspended" && styles.standingChipTextActive,
              ]}
            >
              Suspended
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- Results Count / Status --- */}
        <View style={styles.resultsInfoRow}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ fontWeight: "700", color: "#0F172A" }}>{filteredUsers.length}</Text> accounts
          </Text>
        </View>

        {/* --- Loading Indicator --- */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0052CC" />
            <Text style={styles.loadingText}>Loading accounts directory...</Text>
          </View>
        )}

        {/* --- User Cards List --- */}
        {!loading && filteredUsers.length > 0 && (
          <View style={styles.userList}>
            {filteredUsers.map((user) => {
              const isTutor = user.role === "tutor";
              const isStudent = user.role === "student";
              const standingBadge = getStandingBadge(user.standing);
              const fallbackAvatar = isTutor
                ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
                : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

              return (
                <View key={user.id} style={styles.userCard}>
                  {/* Top Row: Avatar & Basic Info */}
                  <View style={styles.cardHeaderRow}>
                    <Image
                      source={{ uri: user.avatar_url || fallbackAvatar }}
                      style={styles.userAvatar}
                    />

                    <View style={styles.userMainInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {user.full_name || "Unnamed User"}
                        </Text>
                        <View
                          style={[
                            styles.roleBadge,
                            isTutor
                              ? styles.roleBadgeTutor
                              : isStudent
                              ? styles.roleBadgeStudent
                              : styles.roleBadgeAdmin,
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              isTutor
                                ? styles.roleBadgeTextTutor
                                : isStudent
                                ? styles.roleBadgeTextStudent
                                : styles.roleBadgeTextAdmin,
                            ]}
                          >
                            {user.role ? user.role.toUpperCase() : "STUDENT"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.userEmail} numberOfLines={1}>
                        {user.email || "No email provided"}
                      </Text>

                      {/* Standing & Verification Badges */}
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.standingBadge,
                            {
                              backgroundColor: standingBadge.bg,
                              borderColor: standingBadge.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.standingBadgeText,
                              { color: standingBadge.color },
                            ]}
                          >
                            {standingBadge.label}
                          </Text>
                        </View>

                        {isTutor && user.background_check_status === "verified" && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={11} color="#0D9488" />
                            <Text style={styles.verifiedBadgeText}>Verified</Text>
                          </View>
                        )}

                        {user.strikes_count != null && user.strikes_count > 0 && (
                          <View style={styles.strikeBadge}>
                            <Ionicons name="warning" size={11} color="#DC2626" />
                            <Text style={styles.strikeBadgeText}>
                              {user.strikes_count} {user.strikes_count === 1 ? "Strike" : "Strikes"}
                            </Text>
                          </View>
                        )}

                        {user.active_disputes != null && user.active_disputes > 0 && (
                          <View style={styles.disputeBadge}>
                            <Text style={styles.disputeBadgeText}>
                              {user.active_disputes} Active Dispute
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Attributes Grid */}
                  <View style={styles.attributesGrid}>
                    {isTutor && user.specialty && (
                      <View style={styles.attributeItem}>
                        <Ionicons name="book-outline" size={13} color="#64748B" />
                        <Text style={styles.attributeText} numberOfLines={1}>
                          {user.specialty}
                        </Text>
                      </View>
                    )}

                    {isStudent && user.education && (
                      <View style={styles.attributeItem}>
                        <Ionicons name="school-outline" size={13} color="#64748B" />
                        <Text style={styles.attributeText} numberOfLines={1}>
                          {user.education}
                        </Text>
                      </View>
                    )}

                    {user.phone_number && (
                      <View style={styles.attributeItem}>
                        <Ionicons name="call-outline" size={13} color="#64748B" />
                        <Text style={styles.attributeText}>{user.phone_number}</Text>
                      </View>
                    )}

                    {user.location && (
                      <View style={styles.attributeItem}>
                        <Ionicons name="location-outline" size={13} color="#64748B" />
                        <Text style={styles.attributeText}>{user.location}</Text>
                      </View>
                    )}

                    {isTutor && user.hourly_rate != null && (
                      <View style={styles.attributeItem}>
                        <FontAwesome5 name="dollar-sign" size={12} color="#059669" />
                        <Text style={[styles.attributeText, { color: "#059669", fontWeight: "700" }]}>
                          ${Number(user.hourly_rate).toFixed(2)}/hr
                        </Text>
                      </View>
                    )}

                    {isStudent && user.wallet_balance != null && (
                      <View style={styles.attributeItem}>
                        <Ionicons name="wallet-outline" size={13} color="#2563EB" />
                        <Text style={[styles.attributeText, { color: "#2563EB", fontWeight: "700" }]}>
                          Wallet: ${Number(user.wallet_balance).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {user.total_bookings != null && (
                      <View style={styles.attributeItem}>
                        <Ionicons name="calendar-outline" size={13} color="#64748B" />
                        <Text style={styles.attributeText}>
                          {user.total_bookings} Bookings
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions Row */}
                  <View style={styles.cardActionsRow}>
                    {/* Standing Controls */}
                    <View style={styles.standingActionsGroup}>
                      {user.standing === "suspended" ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnReinstate]}
                          activeOpacity={0.8}
                          onPress={() => handleToggleStanding(user, "good_standing")}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                          <Text style={styles.actionBtnReinstateText}>Reinstate</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnSuspend]}
                          activeOpacity={0.8}
                          onPress={() => handleToggleStanding(user, "suspended")}
                        >
                          <Ionicons name="ban-outline" size={14} color="#DC2626" />
                          <Text style={styles.actionBtnSuspendText}>Suspend</Text>
                        </TouchableOpacity>
                      )}

                      {user.standing !== "warning" && user.standing !== "suspended" && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnWarn]}
                          activeOpacity={0.8}
                          onPress={() => handleToggleStanding(user, "warning")}
                        >
                          <Ionicons name="warning-outline" size={14} color="#D97706" />
                          <Text style={styles.actionBtnWarnText}>Warn</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Delete User Button */}
                    <TouchableOpacity
                      style={styles.deleteUserBtn}
                      activeOpacity={0.8}
                      onPress={() => handleDeleteUser(user)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      <Text style={styles.deleteUserBtnText}>Delete User</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* --- Empty State --- */}
        {!loading && filteredUsers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No accounts matching "${searchQuery}". Try adjusting your search query or filters.`
                : "There are currently no users in this directory category."}
            </Text>
            {(searchQuery.length > 0 || roleFilter !== "all" || standingFilter !== "all") && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setStandingFilter("all");
                }}
              >
                <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* --- Admin Bottom Navigation --- */}
      <AdminBottomNav
        activeTab="users"
        onTabPress={(tab) => {
          if (tab === "overview") {
            router.replace("/(admin)/dashboard");
          } else if (tab === "reports") {
            router.replace("/(admin)/AdminQueue");
          }
        }}
      />

      {/* --- POPUP ALERT CONFIRMATION MODAL --- */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={alertConfig.buttonText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={() => {
          const onOkAction = alertConfig.onOk;
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (onOkAction) onOkAction();
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  topBarSubTitle: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "500",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarButtonTop: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3.5,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#0F172A",
  },
  roleTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  roleTabActive: {
    backgroundColor: "#0052CC",
    borderColor: "#0052CC",
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  roleTabTextActive: {
    color: "#FFFFFF",
  },
  standingChipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  standingChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  standingChipActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  standingChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#475569",
  },
  standingChipTextActive: {
    color: "#FFFFFF",
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  resultsInfoRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsCountText: {
    fontSize: 12,
    color: "#64748B",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  userList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2E8F0",
  },
  userMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeStudent: {
    backgroundColor: "#DBEAFE",
  },
  roleBadgeTutor: {
    backgroundColor: "#CCFBF1",
  },
  roleBadgeAdmin: {
    backgroundColor: "#EDE9FE",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  roleBadgeTextStudent: {
    color: "#1D4ED8",
  },
  roleBadgeTextTutor: {
    color: "#0F766E",
  },
  roleBadgeTextAdmin: {
    color: "#6D28D9",
  },
  userEmail: {
    fontSize: 12.5,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  standingBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  standingBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F0FDFA",
    borderColor: "#99F6E4",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0D9488",
  },
  strikeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECDD3",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  strikeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  disputeBadge: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  disputeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#EA580C",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  attributesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  attributeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  attributeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  standingActionsGroup: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnSuspend: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  actionBtnSuspendText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  actionBtnReinstate: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  actionBtnReinstateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  actionBtnWarn: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  actionBtnWarnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  deleteUserBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  deleteUserBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DC2626",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  resetFilterBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#0052CC",
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
});
