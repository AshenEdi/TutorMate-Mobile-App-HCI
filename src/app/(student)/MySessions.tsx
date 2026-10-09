import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StudentHeader } from "../../components/StudentHeader";
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
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { getOrCreateConversation } from "../../lib/chat";
import { DisputeRecord, getDisputesForStudent } from "../../services/disputeService";

interface SessionItem {
  id: string;
  tutorId?: string;
  tutor_id?: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
  topic: string;
  date: string;
  time: string;
  status: string;
  duration?: string;
  delivery?: string;
  rating?: string;
  info?: string;
  features?: string;
  bookingRef?: string;
  dispute?: DisputeRecord;
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

export default function MySessionsScreen() {
  const router = useRouter();
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleChat = async (tutorId?: string) => {
    if (!tutorId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const convId = await getOrCreateConversation(user.id, tutorId);
      if (convId) {
        router.push({ pathname: "/(student)/ChatConversation", params: { conversationId: convId } });
      }
    } catch (e) {
      console.warn("Failed to open chat", e);
    }
  };

  const fetchBookings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSessionsList([]);
        return;
      }

      const [bookingsRes, disputesRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("student_id", user.id)
          .order("session_date", { ascending: true }),
        getDisputesForStudent(user.id),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;

      const disputesByBookingId = new Map<string, DisputeRecord>();
      const disputesByRef = new Map<string, DisputeRecord>();

      for (const d of disputesRes) {
        if (d.booking_id) disputesByBookingId.set(d.booking_id, d);
        if (d.booking_ref) disputesByRef.set(d.booking_ref, d);
      }

      setSessionsList(
        (bookingsRes.data ?? []).map((booking) => {
          const matchedDispute =
            disputesByBookingId.get(booking.id) ||
            (booking.booking_ref ? disputesByRef.get(booking.booking_ref) : undefined);

          return {
            id: booking.id,
            tutorId: booking.tutor_id,
            tutor_id: booking.tutor_id,
            tutorName: booking.tutor_name || "Tutor",
            tutorAvatar: DEFAULT_AVATAR,
            subject: booking.subject || "Tutoring Session",
            topic: booking.focus_notes || "Custom Tutoring Session",
            date: booking.session_date || "",
            time: booking.time_slot || "",
            status: booking.status
              ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
              : "Confirmed",
            duration: booking.duration || "60 mins (1 hr)",
            delivery: booking.delivery_format || "Interactive Video & Canvas Whiteboard",
            rating: "5.0",
            bookingRef: booking.booking_ref || "",
            dispute: matchedDispute,
          };
        })
      );
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const confirmCancel = (session: SessionItem, onConfirm: () => void) => {
    const message = `Are you sure you want to cancel your session with ${session.tutorName || "the tutor"}?`;
    if (Platform.OS === "web") {
      if (window.confirm(`Cancel Booking\n\n${message}`)) onConfirm();
    } else {
      Alert.alert("Cancel Booking", message, [
        { text: "No", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      await fetchBookings();
      Alert.alert("Cancelled", "Your session has been cancelled.");
    } catch (error) {
      console.error("Failed to cancel booking:", error);
    }
  };

  const handleViewDetails = (session: SessionItem) => {
    const disputeInfo = session.dispute
      ? `\nDispute Status: ${session.dispute.status.toUpperCase()} (${session.dispute.code})\nReason: ${session.dispute.reason}`
      : "";

    const details = `
Tutor: ${session.tutorName || "—"}
Subject: ${session.subject || "—"}
Date: ${session.date || "—"}
Time: ${session.time || "—"}
Duration: ${session.duration || "—"}
Status: ${session.status || "—"}
Booking Ref: ${session.bookingRef || "—"}${disputeInfo}
    `.trim();

    Alert.alert("Session Details", details);
  };

  const handleOpenReport = (session: SessionItem) => {
    router.push({
      pathname: "/(student)/SubmitReport",
      params: {
        bookingId: session.id,
        bookingRef: session.bookingRef,
        tutorId: session.tutorId,
        tutorName: session.tutorName,
      },
    });
  };

  const [activeTab, setActiveTab] = useState("all");

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayCount = sessionsList.filter((s) => s.date === today).length;
  const confirmedCount = sessionsList.filter((s) => s.status?.toLowerCase().includes("confirm") || s.status?.toLowerCase().includes("feature")).length;
  const disputesCount = sessionsList.filter((s) => Boolean(s.dispute)).length;

  const filterTabs = [
    { id: "all", label: `All (${sessionsList.length})` },
    { id: "today", label: `Today (${todayCount})` },
    { id: "confirmed", label: `Confirmed (${confirmedCount})` },
    { id: "disputes", label: `Disputed (${disputesCount})` },
  ];

  const filteredSessions = sessionsList.filter((session) => {
    if (activeTab === "today") return session.date === today;
    if (activeTab === "confirmed") return session.status?.toLowerCase().includes("confirm") || session.status?.toLowerCase().includes("feature");
    if (activeTab === "disputes") return Boolean(session.dispute);
    return true;
  });

  const upcomingBookings = [...sessionsList]
    .filter((session) => session.date >= today)
    .sort((first, second) => first.date.localeCompare(second.date));
  const featuredSession = upcomingBookings[0];
  const upcomingSessions = filteredSessions.filter(
    (session) => session.id !== featuredSession?.id
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP BRAND BAR --- */}
      <StudentHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* --- FILTER TABS --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- FEATURED HERO SESSION CARD --- */}
        {featuredSession && (
          <View style={styles.featuredCard}>
            <View style={styles.featuredTopRow}>
              <View style={styles.statusBadgeLive}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusTextLive}>NEXT UP</Text>
              </View>
              <Text style={styles.refText}>REF: {featuredSession.bookingRef || "TM-8042"}</Text>
            </View>

            {featuredSession.dispute ? (
              <View style={styles.disputeBanner}>
                <Ionicons name="warning" size={14} color="#DC2626" />
                <Text style={styles.disputeBannerText}>
                  {featuredSession.dispute.status === "resolved"
                    ? `Dispute Resolved • ${featuredSession.dispute.decision?.toUpperCase()}`
                    : `Dispute Pending (${featuredSession.dispute.code}) • Escrow Held`}
                </Text>
              </View>
            ) : null}

            <View style={styles.featuredTutorRow}>
              <Image source={{ uri: featuredSession.tutorAvatar }} style={styles.featuredAvatar} />
              <View style={styles.featuredTutorInfo}>
                <View style={styles.nameStarRow}>
                  <Text style={styles.featuredTutorName}>{featuredSession.tutorName}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#D97706" />
                    <Text style={styles.ratingText}>{featuredSession.rating || "5.0"}</Text>
                  </View>
                </View>
                <Text style={styles.featuredSubject}>{featuredSession.subject}</Text>
                <Text style={styles.featuredTopic}>{featuredSession.topic}</Text>
              </View>
            </View>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeBox}>
                <Ionicons name="calendar" size={16} color="#2563EB" />
                <View style={styles.dateTimeTextCol}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <Text style={styles.dateTimeValue}>{featuredSession.date}</Text>
                </View>
              </View>
              <View style={styles.dateTimeBox}>
                <Ionicons name="time" size={16} color="#2563EB" />
                <View style={styles.dateTimeTextCol}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <Text style={styles.dateTimeValue}>{featuredSession.time}</Text>
                </View>
              </View>
            </View>

            <View style={styles.deliveryRow}>
              <Ionicons name="videocam-outline" size={18} color="#0D9488" />
              <Text style={styles.deliveryText}>{featuredSession.delivery || "Interactive Video & Canvas Whiteboard"}</Text>
            </View>

            <View style={styles.featuredActions}>
              <TouchableOpacity style={styles.joinBtn}>
                <Ionicons name="videocam" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.joinBtnText}>Join Whiteboard Room</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.chatBtn}
                onPress={() => handleChat(featuredSession.tutor_id)}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportIconBtn}
                onPress={() => handleOpenReport(featuredSession)}
              >
                <Ionicons name="flag-outline" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- ALL SESSIONS LIST --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <Text style={styles.sectionCount}>{upcomingSessions.length} listed</Text>
        </View>

        {upcomingSessions.map((session, idx) => {
          const isPending = session.status?.toLowerCase().includes("pend");
          return (
            <View key={session.id || idx} style={styles.sessionCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardDateRow}>
                  <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                  <Text style={styles.cardDateText}>{session.date} • {session.time}</Text>
                </View>
                <View style={isPending ? styles.pendingBadge : styles.confirmedBadge}>
                  <Ionicons
                    name={isPending ? "time-outline" : "checkmark-circle-outline"}
                    size={12}
                    color={isPending ? "#D97706" : "#10B981"}
                  />
                  <Text style={isPending ? styles.pendingBadgeText : styles.confirmedBadgeText}>
                    {session.status || "Confirmed"}
                  </Text>
                </View>
              </View>

              {session.dispute ? (
                <View style={styles.disputeCardBadge}>
                  <Ionicons name="alert-circle" size={14} color="#B91C1C" />
                  <Text style={styles.disputeCardBadgeText}>
                    {session.dispute.status === "resolved"
                      ? `Resolved (${session.dispute.decision?.replace(/_/g, " ").toUpperCase()})`
                      : `Dispute Pending (${session.dispute.code})`}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardTutorRow}>
                <Image source={{ uri: session.tutorAvatar }} style={styles.smallAvatar} />
                <View style={styles.cardTutorInfo}>
                  <Text style={styles.cardTutorName}>{session.tutorName}</Text>
                  <Text style={styles.cardSubject}>{session.subject}</Text>
                  <Text style={styles.cardTopic}>{session.topic}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => handleViewDetails(session)}
                >
                  <Text style={styles.secondaryBtnText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reportBtn}
                  onPress={() => handleOpenReport(session)}
                >
                  <Ionicons name="flag-outline" size={13} color="#DC2626" />
                  <Text style={styles.reportBtnText}>Dispute / Report</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.smallChatBtn}
                  onPress={() => handleChat(session.tutor_id)}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredSessions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Sessions Found</Text>
            <Text style={styles.emptySubtitle}>You have no sessions matching this tab.</Text>
          </View>
        )}
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/dashboard")}>
          <Ionicons name="home-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/searchscreen")}>
          <Ionicons name="search-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/MySessions")}>
          <Ionicons name="calendar" size={22} color="#2563EB" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Sessions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/MessagesInbox")}>
          <Ionicons name="chatbox-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/StudentProfile")}>
          <Ionicons name="person-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  filterScroll: {
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  featuredCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  featuredTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadgeLive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
  statusTextLive: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#2563EB",
  },
  refText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  disputeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  disputeBannerText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DC2626",
  },
  featuredTutorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featuredAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  featuredTutorInfo: {
    flex: 1,
    gap: 2,
  },
  nameStarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredTutorName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  featuredSubject: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  featuredTopic: {
    fontSize: 11.5,
    color: "#64748B",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateTimeBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  dateTimeTextCol: {
    gap: 1,
  },
  dateTimeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  dateTimeValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deliveryText: {
    fontSize: 11.5,
    color: "#0D9488",
    fontWeight: "600",
  },
  featuredActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  joinBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  reportIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionCount: {
    fontSize: 12,
    color: "#64748B",
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardDateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  disputeCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  disputeCardBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  cardTutorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E2E8F0",
  },
  cardTutorInfo: {
    flex: 1,
  },
  cardTutorName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubject: {
    fontSize: 11.5,
    color: "#2563EB",
    fontWeight: "600",
  },
  cardTopic: {
    fontSize: 11,
    color: "#64748B",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  secondaryBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  reportBtn: {
    flex: 1.2,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  reportBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  smallChatBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#64748B",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  tabItem: {
    alignItems: "center",
    gap: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
