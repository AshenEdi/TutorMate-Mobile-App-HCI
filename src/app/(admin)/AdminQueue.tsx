import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { AdminBottomNav, AdminTab } from "../../components/admin";
import { getAdminQueueItems, UnifiedQueueItem } from "../../services/adminService";
import { createNotification } from "../../services/notificationService";
import { deleteDispute, deleteModerationFlag } from "../../services/disputeService";

import { AlertModal, AlertType } from "../../components/ui/AlertModal";

export default function AdminQueueScreen() {
  const router = useRouter();
  const [activeBottomTab, setActiveBottomTab] = useState<AdminTab>("reports");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("All");
  const [queueItems, setQueueItems] = useState<UnifiedQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const showMessage = (
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

  const loadQueue = async () => {
    try {
      const items = await getAdminQueueItems();
      setQueueItems(items);
    } catch (err) {
      console.warn("Error loading queue items:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  // Filter queue items by both search query AND urgency
  const filteredItems = useMemo(() => {
    return queueItems.filter((item) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          item.code.toLowerCase().includes(query) ||
          item.userName.toLowerCase().includes(query) ||
          item.studentName.toLowerCase().includes(query) ||
          item.subject.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Urgency filter
      if (selectedUrgency === "Critical" && item.priorityType !== "urgent") {
        return false;
      }
      if (selectedUrgency === "High" && item.priorityType !== "high") {
        return false;
      }
      if (selectedUrgency === "Medium" && item.priorityType !== "medium") {
        return false;
      }
      if (selectedUrgency === "Technical" && item.priorityType !== "technical") {
        return false;
      }

      return true;
    });
  }, [queueItems, searchQuery, selectedUrgency]);

  const handlePrimaryAction = (item: UnifiedQueueItem) => {
    if (item.primaryAction.actionType === "dispute") {
      router.push({
        pathname: "/(admin)/DisputeResolution",
        params: { caseId: item.id, code: item.code, subject: item.subject },
      });
    } else if (item.primaryAction.actionType === "logs") {
      showMessage(
        "Chat Inspection Logs",
        `Viewing encrypted safety flag log for ${item.userName}:\n\n"${item.calloutDescription || item.description}"`,
        "info"
      );
    } else if (item.primaryAction.actionType === "ping") {
      showMessage(
        "Priority Notification Sent",
        `Automated priority notification dispatched to ${item.userName}.`,
        "success"
      );
    }
  };

  const handleSecondaryAction = (item: UnifiedQueueItem) => {
    setAlertConfig({
      visible: true,
      type: "warning",
      title: "Dismiss & Remove Case",
      message: `Are you sure you want to remove ${item.code} (${item.userName}) from the active moderation queue?`,
      showCancel: true,
      cancelText: "Cancel",
      buttonText: "Dismiss / Delete",
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        try {
          if (item.kind === "dispute") {
            await deleteDispute(item.id);
          } else {
            await deleteModerationFlag(item.id);
          }
          setQueueItems((prev) => prev.filter((q) => q.id !== item.id));
          showMessage("Case Removed", `${item.code} was removed from the queue.`, "success");
        } catch (err: any) {
          showMessage("Error", err?.message || "Failed to remove case.", "error");
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Top App Header --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.replace("/(admin)/dashboard")}
        >
          <Ionicons name="arrow-back" size={20} color="#0052CC" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Admin Verification Queue</Text>

        <TouchableOpacity
          style={styles.avatarButtonTop}
          activeOpacity={0.8}
          onPress={() => router.push("/(admin)/AdminProfile")}
        >
          <Ionicons name="person" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* --- Sub-header Realtime Moderation Headline --- */}
        <View style={styles.headerInfoSection}>
          <View style={styles.realtimeTagRow}>
            <View style={styles.redPulseDot} />
            <Text style={styles.realtimeTagText}>REAL-TIME MODERATION</Text>
          </View>
          <Text style={styles.queueTitleText}>
            Queue ({filteredItems.length} Action {filteredItems.length === 1 ? "Item" : "Items"})
          </Text>
        </View>

        {/* --- Search & Urgency Filter Row --- */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ID, tutor, or student..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.urgencyFilterBtn}
            activeOpacity={0.75}
            onPress={() =>
              Alert.alert("Filter Urgency", "Sort queue by response window urgency.", [
                { text: "All Cases", onPress: () => setSelectedUrgency("All") },
                { text: "Critical (Urgent)", onPress: () => setSelectedUrgency("Critical") },
                { text: "High Priority", onPress: () => setSelectedUrgency("High") },
                { text: "Technical Grievances", onPress: () => setSelectedUrgency("Technical") },
                { text: "Medium", onPress: () => setSelectedUrgency("Medium") },
              ])
            }
          >
            <MaterialCommunityIcons name="filter-variant" size={15} color="#0052CC" />
            <Text style={styles.urgencyText}>
              {selectedUrgency === "All" ? "Urgency ▾" : `${selectedUrgency} ▾`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- List of Queue Cards --- */}
        <View style={styles.queueList}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Card Header: Code & Priority Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.codeRow}>
                  <View style={styles.checkboxOutline} />
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {item.priorityType === "urgent" && (
                    <View style={styles.urgentBadge}>
                      <Ionicons name="warning" size={11} color="#DC2626" />
                      <Text style={styles.urgentBadgeText}>{item.priorityText}</Text>
                    </View>
                  )}

                  {item.priorityType === "high" && (
                    <View style={styles.highBadge}>
                      <Ionicons name="warning-outline" size={11} color="#D97706" />
                      <Text style={styles.highBadgeText}>{item.priorityText}</Text>
                    </View>
                  )}

                  {item.priorityType === "technical" && (
                    <View style={styles.technicalBadge}>
                      <Ionicons name="cog-outline" size={12} color="#0052CC" />
                      <Text style={styles.technicalBadgeText}>{item.priorityText}</Text>
                    </View>
                  )}

                  {item.priorityType === "medium" && (
                    <View style={styles.mediumBadge}>
                      <Ionicons name="time-outline" size={11} color="#6366F1" />
                      <Text style={styles.mediumBadgeText}>{item.priorityText}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.trashCardBtn}
                    onPress={() => handleSecondaryAction(item)}
                    accessibilityLabel="Delete item"
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* User Avatar & Subtitle Row */}
              <View style={styles.userRow}>
                <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userNameText}>
                    {item.userName}{" "}
                    <Text style={styles.subjectText}>({item.subject})</Text>
                  </Text>
                  <Text style={styles.studentNameText}>{item.studentName}</Text>
                </View>

                {item.amountOrTime && (
                  <Text
                    style={[
                      styles.amountText,
                      item.amountType === "negative"
                        ? styles.amountNegative
                        : styles.amountInfo,
                    ]}
                  >
                    {item.amountOrTime}
                  </Text>
                )}
              </View>

              {/* Callout box for safety violations or description */}
              {item.calloutDescription ? (
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutText}>{item.calloutDescription}</Text>
                </View>
              ) : null}

              {item.description ? (
                <Text style={styles.descriptionText}>&ldquo;{item.description}&rdquo;</Text>
              ) : null}

              {/* Tags Row */}
              <View style={styles.tagsRow}>
                {item.tags.map((tag, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tagBadge,
                      tag.colorType === "peach" && styles.tagPeach,
                      tag.colorType === "amber" && styles.tagAmber,
                      tag.colorType === "blue" && styles.tagBlue,
                      tag.colorType === "mint" && styles.tagMint,
                      tag.colorType === "teal" && styles.tagTeal,
                      tag.colorType === "gray" && styles.tagGray,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        tag.colorType === "peach" && styles.tagTextPeach,
                        tag.colorType === "amber" && styles.tagTextAmber,
                        tag.colorType === "blue" && styles.tagTextBlue,
                        tag.colorType === "mint" && styles.tagTextMint,
                        tag.colorType === "teal" && styles.tagTextTeal,
                        tag.colorType === "gray" && styles.tagTextGray,
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    item.primaryAction.colorType === "green"
                      ? styles.primaryBtnGreen
                      : styles.primaryBtnBlue,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handlePrimaryAction(item)}
                >
                  <MaterialCommunityIcons
                    name={item.primaryAction.icon as any}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryBtnText}>{item.primaryAction.label}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => handleSecondaryAction(item)}
                >
                  {item.secondaryAction.icon === "close" ? (
                    <Ionicons name="close" size={14} color="#64748B" />
                  ) : null}
                  <Text style={styles.secondaryBtnText}>
                    {item.secondaryAction.label}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#0D9488" />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptySubtitle}>
                No pending moderation items match your active filters.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- Admin Bottom Nav Component --- */}
      <AdminBottomNav
        activeTab="reports"
        onTabPress={(tab) => {
          if (tab === "overview") {
            router.replace("/(admin)/dashboard");
          } else if (tab === "users") {
            router.replace("/(admin)/users");
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0052CC",
  },
  topBarTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  avatarButtonTop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerInfoSection: {
    marginBottom: 14,
    gap: 4,
  },
  realtimeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  redPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#DC2626",
  },
  realtimeTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  queueTitleText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    height: "100%",
  },
  urgencyFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    gap: 4,
  },
  urgencyText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0052CC",
  },
  queueList: {
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxOutline: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  codeText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  highBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  highBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  technicalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  technicalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0052CC",
  },
  mediumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  mediumBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  subjectText: {
    color: "#64748B",
    fontWeight: "500",
  },
  studentNameText: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 1,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "800",
  },
  amountNegative: {
    color: "#DC2626",
  },
  amountInfo: {
    color: "#0052CC",
    fontSize: 12,
  },
  calloutBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  calloutText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
    fontStyle: "italic",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPeach: {
    backgroundColor: "#FEE2E2",
  },
  tagTextPeach: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
  },
  tagAmber: {
    backgroundColor: "#FEF3C7",
  },
  tagTextAmber: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
  },
  tagBlue: {
    backgroundColor: "#EFF6FF",
  },
  tagTextBlue: {
    color: "#0052CC",
    fontSize: 11,
    fontWeight: "700",
  },
  tagMint: {
    backgroundColor: "#CCFBF1",
  },
  tagTextMint: {
    color: "#0D9488",
    fontSize: 11,
    fontWeight: "700",
  },
  tagTeal: {
    backgroundColor: "#E0F2FE",
  },
  tagTextTeal: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "700",
  },
  tagGray: {
    backgroundColor: "#F1F5F9",
  },
  tagTextGray: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  tagText: {
    fontSize: 11,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1.3,
    height: 38,
    borderRadius: 19,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  primaryBtnBlue: {
    backgroundColor: "#0052CC",
  },
  primaryBtnGreen: {
    backgroundColor: "#0D9488",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  secondaryBtnText: {
    color: "#475569",
    fontSize: 12.5,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  trashCardBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
});
