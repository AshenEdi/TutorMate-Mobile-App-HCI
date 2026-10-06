import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
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

interface QueueItem {
  id: string;
  code: string;
  priorityText: string;
  priorityType: "urgent" | "high" | "technical" | "medium";
  userAvatar: string;
  userName: string;
  subject: string;
  studentName: string;
  amountOrTime?: string;
  amountType?: "negative" | "info";
  description: string;
  calloutDescription?: string;
  tags: { label: string; colorType: "peach" | "amber" | "blue" | "mint" | "teal" | "gray" }[];
  primaryAction: {
    label: string;
    icon: string;
    actionType: "dispute" | "logs" | "credit" | "ping";
    colorType: "blue" | "green";
  };
  secondaryAction: {
    label: string;
    icon?: string;
    actionType: "dismiss" | "warn" | "reassign";
  };
}

const QUEUE_ITEMS: QueueItem[] = [
  {
    id: "1",
    code: "#DIS-8092",
    priorityText: "Urgent ≤ 12m left",
    priorityType: "urgent",
    userAvatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    userName: "Alex Rivera",
    subject: "Physics",
    studentName: "Marcus Sterling (Gr 12)",
    amountOrTime: "-$40.00",
    amountType: "negative",
    description:
      "Student reported tutor no-show for AP Physics exam prep session on Oct 24th. Refund requested ($40.00).",
    tags: [
      { label: "No-Show", colorType: "peach" },
      { label: "Refund Pending", colorType: "amber" },
      { label: "AP Exam Track", colorType: "blue" },
    ],
    primaryAction: {
      label: "Review Case",
      icon: "shield-alert-outline",
      actionType: "dispute",
      colorType: "blue",
    },
    secondaryAction: {
      label: "Dismiss",
      icon: "close",
      actionType: "dismiss",
    },
  },
  {
    id: "2",
    code: "#CHT-4412",
    priorityText: "High Priority",
    priorityType: "high",
    userAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    userName: "David Kim",
    subject: "Chemistry",
    studentName: "Automated Safety Filter",
    calloutDescription:
      "Off-platform contact info [ personal phone number & Venmo handle ] detected in pre-booking chat.",
    description: "",
    tags: [
      { label: "Safety Filter", colorType: "mint" },
      { label: "Payment Bypass", colorType: "amber" },
      { label: "Pre-Session", colorType: "blue" },
    ],
    primaryAction: {
      label: "Inspect Logs",
      icon: "file-document-outline",
      actionType: "logs",
      colorType: "blue",
    },
    secondaryAction: {
      label: "Issue Warning",
      actionType: "warn",
    },
  },
  {
    id: "3",
    code: "#DIS-8071",
    priorityText: "Technical Grievance",
    priorityType: "technical",
    userAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    userName: "Dr. Sarah Jenkins",
    subject: "AP Calc",
    studentName: "Liam T. • Verified Parent Acc",
    amountOrTime: "30 min credit",
    amountType: "info",
    description:
      "Technical disruption: Whiteboard froze for 25 minutes during 1-hour session. Requesting 30 min credit.",
    tags: [
      { label: "Tech Failure", colorType: "blue" },
      { label: "Credit Request", colorType: "teal" },
      { label: "WebRTC disconnect", colorType: "blue" },
    ],
    primaryAction: {
      label: "Review Case",
      icon: "shield-alert-outline",
      actionType: "dispute",
      colorType: "blue",
    },
    secondaryAction: {
      label: "Grant Credit",
      actionType: "credit" as any,
    },
  },
  {
    id: "4",
    code: "#REP-7106",
    priorityText: "Medium Priority",
    priorityType: "medium",
    userAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    userName: "Elena Rostova",
    subject: "French Lit",
    studentName: "Maya Alvarez",
    description:
      "Tutor has not responded to accepted session inquiry after 48 hours.",
    tags: [
      { label: "Communication", colorType: "blue" },
      { label: ">24h Threshold", colorType: "gray" },
    ],
    primaryAction: {
      label: "Ping Tutor",
      icon: "bell-outline",
      actionType: "ping",
      colorType: "blue",
    },
    secondaryAction: {
      label: "Reassign",
      actionType: "reassign",
    },
  },
];

export default function AdminQueueScreen() {
  const router = useRouter();
  const [activeBottomTab, setActiveBottomTab] = useState<AdminTab>("reports");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("All");

  const filteredItems = QUEUE_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      item.code.toLowerCase().includes(query) ||
      item.userName.toLowerCase().includes(query) ||
      item.studentName.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query)
    );
  });

  const handlePrimaryAction = (item: QueueItem) => {
    if (item.primaryAction.actionType === "dispute") {
      router.push("/(admin)/DisputeResolution");
    } else if (item.primaryAction.actionType === "logs") {
      Alert.alert(
        "Chat Inspection Logs",
        `Viewing encrypted flag log for ${item.userName}:\n\n"${item.calloutDescription}"`,
        [{ text: "OK" }]
      );
    } else if (item.primaryAction.actionType === "ping") {
      Alert.alert(
        "Urgent Notification Sent",
        `Automated priority notification dispatched to ${item.userName} via SMS and Push.`
      );
    }
  };

  const handleSecondaryAction = (item: QueueItem) => {
    Alert.alert(
      item.secondaryAction.label,
      `Action executed successfully for case ${item.code}.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Top App Header --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
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
      >
        {/* --- Sub-header Realtime Moderation Headline --- */}
        <View style={styles.headerInfoSection}>
          <View style={styles.realtimeTagRow}>
            <View style={styles.redPulseDot} />
            <Text style={styles.realtimeTagText}>REAL-TIME MODERATION</Text>
          </View>
          <Text style={styles.queueTitleText}>Queue (14 Action Items)</Text>
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
                { text: "Critical (≤ 15m)", onPress: () => setSelectedUrgency("Critical") },
                { text: "Medium", onPress: () => setSelectedUrgency("Medium") },
              ])
            }
          >
            <MaterialCommunityIcons name="filter-variant" size={15} color="#0052CC" />
            <Text style={styles.urgencyText}>Urgency ▾</Text>
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
        </View>
      </ScrollView>

      {/* --- Admin Bottom Nav Component --- */}
      <AdminBottomNav
        activeTab={activeBottomTab}
        onTabPress={(tab) => {
          setActiveBottomTab(tab);
          if (tab === "overview") {
            router.push("/(admin)/dashboard");
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
});
