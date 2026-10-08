import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getOrCreateConversation } from "../../lib/chat";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

interface SessionItem {
  id: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
  topic: string;
  date: string;
  time: string;
  status: string;
  duration: string;
  delivery: string;
  rating: string;
  bookingRef: string;
  unlockTime?: string;
  info?: string;
  features?: string;
}

export default function MySessionsScreen() {
  const router = useRouter();
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleChat = async (tutorId: string) => {
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

  useEffect(() => {
    let isMounted = true;

    async function fetchBookings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch from Supabase — build the query with filter BEFORE awaiting
        let dbQuery = supabase
          .from("bookings")
          .select("*")
          .order("session_date", { ascending: true });

        if (user?.id) {
          dbQuery = dbQuery.eq("student_id", user.id);
        }

        const { data: dbBookings } = await dbQuery;

        // 2. Fetch from AsyncStorage (local backup after offline booking)
        let localBookings: any[] = [];
        try {
          const stored = await AsyncStorage.getItem("@tutormate_booked_sessions");
          if (stored) localBookings = JSON.parse(stored);
        } catch {}

        // Only include local bookings that match the logged-in student
        const filteredLocal = user?.id
          ? localBookings.filter((b: any) => !b.studentId || b.studentId === user.id)
          : localBookings;

        const mergedMap: Record<string, any> = {};

        // Add local bookings first (as fallback)
        filteredLocal.forEach((b: any, idx: number) => {
          const idStr = b.id || `local_${idx}`;
          mergedMap[idStr] = {
            id: idStr,
            tutorName: b.tutorName || "Tutor",
            tutorAvatar: b.tutorAvatar || DEFAULT_AVATAR,
            subject: b.subject || "Tutoring Session",
            topic: b.focusText || "Custom Tutoring Session",
            date: b.date || "",
            time: b.timeSlot || "",
            status: b.status ? (b.status.charAt(0).toUpperCase() + b.status.slice(1)) : "Confirmed",
            duration: b.duration || "60 mins (1 hr)",
            delivery: b.deliveryFormat || "Interactive Video & Canvas Whiteboard",
            rating: "5.0",
            bookingRef: b.bookingRef || "",
          };
        });

        // Add / override with DB bookings (authoritative source)
        if (dbBookings && dbBookings.length > 0) {
          dbBookings.forEach((b: any) => {
            mergedMap[b.id] = {
              id: b.id,
              tutor_id: b.tutor_id,
              tutorName: b.tutor_name || "Tutor",
              tutorAvatar: DEFAULT_AVATAR,
              subject: b.subject || "Tutoring Session",
              topic: b.focus_notes || "Custom Tutoring Session",
              date: b.session_date || "",
              time: b.time_slot || "",
              status: b.status ? (b.status.charAt(0).toUpperCase() + b.status.slice(1)) : "Confirmed",
              duration: b.duration || "60 mins (1 hr)",
              delivery: b.delivery_format || "Interactive Video & Canvas Whiteboard",
              rating: "5.0",
              bookingRef: b.booking_ref || "",
            };
          });
        }

        if (isMounted) {
          setSessionsList(Object.values(mergedMap));
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to fetch sessions:", err);
        if (isMounted) setLoading(false);
      }
    }

    fetchBookings();
    return () => { isMounted = false; };
  }, []);


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
        if (Platform.OS === "web") {
          window.alert(`Error\n\n${error.message}`);
        } else {
          Alert.alert("Error", error.message);
        }
        return;
      }

      await fetchBookings();
      if (Platform.OS === "web") {
        window.alert("Booking Cancelled\n\nYour session has been cancelled successfully.");
      } else {
        Alert.alert("Cancelled", "Your session has been cancelled.");
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
    }
  };

  const handleViewDetails = (session: SessionItem) => {
    const details = `
Tutor: ${session.tutorName || "—"}
Subject: ${session.subject || "—"}
Date: ${session.date || "—"}
Time: ${session.time || "—"}
Duration: ${session.duration || "—"}
Status: ${session.status || "—"}
Booking Ref: ${session.bookingRef || "—"}
    `.trim();

    if (Platform.OS === "web") {
      window.alert(`Session Details\n\n${details}`);
    } else {
      Alert.alert("Session Details", details);
    }
  };

  const [activeTab, setActiveTab] = useState("all");

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayCount = sessionsList.filter((s) => s.date === today).length;
  const confirmedCount = sessionsList.filter((s) => s.status?.toLowerCase().includes("confirm") || s.status?.toLowerCase().includes("feature")).length;
  const pendingCount = sessionsList.filter((s) => s.status?.toLowerCase().includes("pend")).length;

  const filterTabs = [
    { id: "all", label: `All (${sessionsList.length})` },
    { id: "today", label: `Today (${todayCount})` },
    { id: "confirmed", label: `Confirmed (${confirmedCount})` },
    { id: "pending", label: `Pending (${pendingCount})` },
  ];

  const filteredSessions = sessionsList.filter((session) => {
    if (activeTab === "today") return session.date === today;
    if (activeTab === "confirmed") return session.status?.toLowerCase().includes("confirm") || session.status?.toLowerCase().includes("feature");
    if (activeTab === "pending") return session.status?.toLowerCase().includes("pend");
    return true;
  });

  const upcomingBookings = [...sessionsList]
    .filter((session) => session.date >= today)
    .sort((first, second) => first.date.localeCompare(second.date));
  const featuredSession = upcomingBookings[0];
  const upcomingSessions = filteredSessions.filter(
    (session) => session.id !== featuredSession?.id,
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP BRAND BAR --- */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="book" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandName}>TutorMate</Text>
            <Text style={styles.brandTitle}>My Sessions</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => router.push("/(student)/StudentProfile")}
        >
          <Ionicons name="person" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- PAGE SUBHEADER --- */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push("/(student)/dashboard")}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.pageTitle}>My Sessions</Text>
            <Text style={styles.pageSubtitle}>Spring Semester • {sessionsList.length} scheduled</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="options-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- FILTER TABS --- */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterTabs}
          contentContainerStyle={styles.filterTabsContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && <ActivityIndicator size="large" color="#2563EB" />}

        {/* --- EMPTY STATE --- */}
        {!loading && sessionsList.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color="#CBD5E1" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No Sessions Yet</Text>
            <Text style={styles.emptySubtitle}>When you book a session with a tutor, it will appear here.</Text>
            <TouchableOpacity
              style={styles.findTutorBtn}
              onPress={() => router.push("/(student)/searchscreen")}
            >
              <Ionicons name="search" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.findTutorBtnText}>Find a Tutor</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- FEATURED SESSION CARD --- */}
        {featuredSession && (
          <View style={styles.featuredCard}>
            <View style={styles.featuredBadgeRow}>
              <View style={styles.statusBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.statusBadgeText}>
                  {featuredSession.status?.toUpperCase() || "CONFIRMED SESSION"}
                </Text>
              </View>
              <Text style={styles.unlockText}>Room unlocks {featuredSession.unlockTime || "15 mins before"}</Text>
            </View>

            <View style={styles.tutorRow}>
              <View style={styles.tutorAvatarWrapper}>
                <Image source={{ uri: featuredSession.tutorAvatar }} style={styles.tutorAvatar} />
                <View style={styles.onlineBadge}>
                  <Ionicons name="flash" size={8} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.tutorInfo}>
                <View style={styles.nameRatingRow}>
                  <Text style={styles.tutorName}>{featuredSession.tutorName}</Text>
                  <View style={styles.ratingBox}>
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
            </View>
          </View>
        )}

        {/* --- UPCOMING SESSIONS SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Coming Up This Week</Text>
          <Text style={styles.sectionCount}>{upcomingSessions.length} session{upcomingSessions.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* --- DYNAMIC UPCOMING SESSIONS CARDS --- */}
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

              <View style={styles.cardTutorRow}>
                <Image source={{ uri: session.tutorAvatar }} style={styles.smallAvatar} />
                <View style={styles.cardTutorInfo}>
                  <Text style={styles.cardTutorName}>{session.tutorName}</Text>
                  <Text style={styles.cardSubject}>{session.subject}</Text>
                  <Text style={styles.cardTopic}>{session.topic}</Text>
                </View>
              </View>

              {session.info ? (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#D97706" />
                  <Text style={styles.infoBoxText}>{session.info}</Text>
                </View>
              ) : (
                <View style={styles.cardMetaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>{session.duration || "60 mins (1 hr)"}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="reader-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>{session.features || "Digital Notebook Sharing"}</Text>
                  </View>
                </View>
              )}

              <View style={styles.cardActions}>
                {isPending ? (
                  <>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { backgroundColor: '#FFF1F2' }]}
                      onPress={() =>
                        confirmCancel(session, () => handleCancelBooking(session.id))
                      }
                    >
                      <Text style={[styles.secondaryBtnText, { color: '#EF4444' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn}>
                      <Text style={styles.secondaryBtnText}>Edit Booking</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { backgroundColor: '#FFF1F2' }]}
                      onPress={() =>
                        confirmCancel(session, () => handleCancelBooking(session.id))
                      }
                    >
                      <Text style={[styles.secondaryBtnText, { color: '#EF4444' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => handleViewDetails(session)}
                    >
                      <Text style={styles.secondaryBtnText}>View Details</Text>
                    </TouchableOpacity>
                  </>
                )}
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
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  brandTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: -2,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filterTabs: {
    marginBottom: 20,
  },
  filterTabsContent: {
    paddingRight: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: "#2563EB",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  featuredCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  featuredBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
  },
  unlockText: {
    fontSize: 11,
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tutorRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tutorAvatarWrapper: {
    position: "relative",
  },
  tutorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0D9488",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  tutorInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRatingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tutorName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 4,
  },
  featuredSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 2,
  },
  featuredTopic: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  dateTimeRow: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  dateTimeBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeTextCol: {
    marginLeft: 8,
  },
  dateTimeLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  dateTimeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  deliveryText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 8,
  },
  featuredActions: {
    flexDirection: "row",
  },
  joinBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0256D0",
    paddingVertical: 14,
    borderRadius: 24,
    marginRight: 10,
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardDateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    marginLeft: 6,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 4,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
    marginLeft: 4,
  },
  cardTutorRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  smallAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardTutorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTutorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 1,
  },
  cardTopic: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
    marginLeft: 8,
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  secondaryBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  smallChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  findTutorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  findTutorBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
