import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import { StudentHeader } from "../../components/StudentHeader";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
    ActivityIndicator,
    Alert,
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

// --- TYPES ---
interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconBgColor: string;
  iconColor: string;
}

interface SessionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  duration: string;
  status: string;
  bookingRef: string;
  actionType: "join" | "details" | "reschedule";
}

const STATIC_CATEGORIES: CategoryItem[] = [
  {
    id: "1",
    title: "Mathematics",
    subtitle: "Calculus & Algebra",
    iconName: "sigma",
    iconBgColor: "#EEF2FF",
    iconColor: "#3B82F6",
  },
  {
    id: "2",
    title: "Physics & Science",
    subtitle: "Mechanics & Bio",
    iconName: "flask",
    iconBgColor: "#E6FFFA",
    iconColor: "#0D9488",
  },
  {
    id: "3",
    title: "English & Lit",
    subtitle: "Essay Writing & Syntax",
    iconName: "book-open",
    iconBgColor: "#FFEDD5",
    iconColor: "#EA580C",
  },
  {
    id: "4",
    title: "Coding & CS",
    subtitle: "Python, Data & Web",
    iconName: "code",
    iconBgColor: "#E0F2FE",
    iconColor: "#0284C7",
  },
];

export default function StudentHomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("Student");
  const [walletBalance, setWalletBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(STATIC_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Home");

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadDashboardData() {
        setLoading(true);
        try {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user) {
            if (isMounted) {
              setUserName("Student");
              setWalletBalance(0);
              setUpcomingSessions([]);
            }
            return;
          }

          const [profileResult, bookingsResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, wallet_balance")
              .eq("id", user.id)
              .single(),
            supabase
              .from("bookings")
              .select("*")
              .eq("student_id", user.id)
              .gte("session_date", new Date().toISOString().split("T")[0])
              .order("session_date", { ascending: true })
              .limit(5),
          ]);
          if (profileResult.error) throw profileResult.error;
          if (bookingsResult.error) throw bookingsResult.error;

          const sessions: SessionItem[] = (bookingsResult.data ?? []).map((booking) => {
            const status = String(booking.status || "Upcoming");
            const normalizedStatus = status.toLowerCase();
            const date = booking.session_date
              ? new Date(`${booking.session_date}T00:00:00`).toLocaleDateString()
              : "Date not set";

            return {
              id: String(booking.id),
              title: `${booking.subject || "Tutoring session"}${booking.tutor_name ? ` with ${booking.tutor_name}` : ""}`,
              subtitle: booking.subject || "Upcoming tutoring session",
              date: booking.time_slot ? `${date}, ${booking.time_slot}` : date,
              duration: booking.duration ? `${booking.duration} min` : "",
              status,
              bookingRef: booking.booking_ref || "—",
              actionType:
                normalizedStatus === "confirmed"
                  ? "join"
                  : normalizedStatus === "pending"
                    ? "reschedule"
                    : "details",
            };
          });

          if (isMounted) {
            setUserName(profileResult.data.full_name || "Student");
            setWalletBalance(Number(profileResult.data.wallet_balance) || 0);
            setUpcomingSessions(sessions);
            setStreak(0);
            setCategories(STATIC_CATEGORIES);
          }
        } catch (error) {
          console.error("Failed to load student dashboard:", error);
          Alert.alert("Error", "Unable to load your dashboard data.");
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      void loadDashboardData();
      return () => {
        isMounted = false;
      };
    }, []),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER --- */}
      <StudentHeader title="Home" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- WELCOME & STREAK BANNER --- */}
        <View style={styles.welcomeRow}>
          <View>
            <View style={styles.welcomeSubtitleRow}>
              <Text style={styles.welcomeSubtitle}>Welcome back,</Text>
              <Ionicons
                name="sparkles-outline"
                size={14}
                color="#888"
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text style={styles.userName}>{userName || "Student"}</Text>
          </View>

          {streak > 0 && (
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={16} color="#D97706" />
              <Text style={styles.streakText}>{streak} Day Streak</Text>
            </View>
          )}
        </View>

        {/* --- SEARCH BAR --- */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#3B82F6"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects, tutors, topics..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* --- CATEGORIES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <Text style={styles.sectionSubtitle}>{categories.length} Subjects</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              activeOpacity={0.8}
            >
              <View style={styles.categoryTopRow}>
                <View
                  style={[
                    styles.categoryIconBg,
                    { backgroundColor: cat.iconBgColor },
                  ]}
                >
                  {cat.iconName === "sigma" ? (
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: cat.iconColor,
                      }}
                    >
                      ∑
                    </Text>
                  ) : (
                    <FontAwesome5
                      name={cat.iconName}
                      size={16}
                      color={cat.iconColor}
                    />
                  )}
                </View>
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
              <Text style={styles.categorySubtitle}>{cat.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- MIDTERM PREP BANNER --- */}
        <TouchableOpacity
          style={styles.prepBanner}
          activeOpacity={0.9}
          onPress={() => router.push("/(student)/MySessions")}
        >
          <View style={styles.prepLeft}>
            <View style={styles.prepIconBg}>
              <Ionicons name="book" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.prepTitle}>This week</Text>
              <Text style={styles.prepSubtitle}>
                {upcomingSessions.length
                  ? `${upcomingSessions.length} sessions booked this week`
                  : "No sessions this week"}
              </Text>
            </View>
          </View>
          <View style={styles.prepRight}>
            <Text style={styles.trackText}>${walletBalance.toFixed(2)}</Text>
            <Ionicons name="arrow-forward" size={16} color="#2563EB" />
          </View>
        </TouchableOpacity>

        {/* --- UPCOMING SESSIONS SECTION --- */}
        <View style={styles.sectionHeader}>
          <View style={styles.sessionsTitleRow}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <View style={styles.activeDot} />
          </View>
          <TouchableOpacity onPress={() => router.push("/(student)/MySessions")}>
            <Text style={styles.seeAllText}>See all &gt;</Text>
          </TouchableOpacity>
        </View>

        {/* SESSION CARDS */}
        {upcomingSessions.length === 0 ? (
          <View style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>No upcoming sessions. Book one now!</Text>
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => router.push("/(student)/searchscreen")}
            >
              <Text style={styles.detailsBtnText}>Search Tutors</Text>
            </TouchableOpacity>
          </View>
        ) : upcomingSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            {/* Header: Avatar, Details & Platform Badge */}
            <View style={styles.sessionMain}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color="#64748B" />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionSubtitle}>{session.subtitle}</Text>

                <View style={styles.timeRow}>
                  <Ionicons name="calendar-outline" size={14} color="#3B82F6" />
                  <Text style={styles.timeText}>{session.date}</Text>
                  <Text style={styles.timeDot}>•</Text>
                  <Text style={styles.durationText}>{session.duration}</Text>
                </View>
              </View>

              {/* Status Badges */}
              <View style={[styles.statusBadge, styles.confirmedBadge]}>
                <Text style={styles.confirmedText}>{session.status}</Text>
              </View>
            </View>

            {/* Bottom Row: Ratings & Action Buttons */}
            <View style={styles.sessionBottomRow}>
              <View style={styles.ratingRow}>
                <Ionicons name="document-text-outline" size={14} color="#64748B" />
                <Text style={styles.ratingText}>Ref: {session.bookingRef}</Text>
              </View>

              {/* Dynamic Actions */}
              {session.actionType === "join" && (
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => Alert.alert("Coming Soon", "Video room integration")}
                >
                  <Ionicons
                    name="videocam"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.joinBtnText}>Join Class</Text>
                </TouchableOpacity>
              )}

              {session.actionType === "details" && (
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => router.push("/(student)/MySessions")}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="#1E3A8A"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.detailsBtnText}>View Details</Text>
                </TouchableOpacity>
              )}

              {session.actionType === "reschedule" && (
                <View style={styles.rescheduleGroup}>
                  <TouchableOpacity style={styles.paperclipBtn}>
                    <Ionicons name="attach-outline" size={18} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rescheduleBtn}
                    onPress={() => router.push("/(student)/MySessions")}
                  >
                    <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* --- QUICK STUDY TIP --- */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconBg}>
            <Ionicons name="bulb-outline" size={20} color="#D97706" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Quick Study Tip</Text>
            <Text style={styles.tipDescription}>
              Bring your questions and learning materials to your next session
              to make the most of your study time.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        {[
          { name: "Home", icon: "school-outline", activeIcon: "school" },
          { name: "Search", icon: "search-outline", activeIcon: "search" },
          {
            name: "Sessions",
            icon: "calendar-outline",
            activeIcon: "calendar",
          },
          { name: "Messages", icon: "chatbox-outline", activeIcon: "chatbox" },
          { name: "Profile", icon: "person-outline", activeIcon: "person" },
        ].map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => {
                if (tab.name === "Sessions") {
                  router.push("/(student)/MySessions");
                } else if (tab.name === "Profile") {
                  router.push("/(student)/StudentProfile");
                } else if (tab.name === "Messages") {
                  router.push("/(student)/MessagesInbox");
                } else if (tab.name === "Search") {
                  router.push("/(student)/searchscreen");
                } else {
                  setActiveTab(tab.name);
                }
              }}
            >
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.icon) as any}
                size={22}
                color={isActive ? "#2563EB" : "#9CA3AF"}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// --- STYLES ---
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
  brandTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  welcomeSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
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
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  categoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tutorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tutorBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  categorySubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  prepBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  prepLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  prepIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  prepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  prepSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  prepRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  trackText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    marginRight: 4,
  },
  sessionsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginLeft: 6,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sessionMain: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  sessionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  timeText: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 4,
  },
  timeDot: {
    fontSize: 11,
    color: "#CBD5E1",
    marginHorizontal: 4,
  },
  durationText: {
    fontSize: 11,
    color: "#64748B",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  zoomBadge: {
    backgroundColor: "#CCFBF1",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
    marginRight: 4,
  },
  zoomText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F766E",
  },
  confirmedBadge: {
    backgroundColor: "#E0E7FF",
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3730A3",
  },
  draftBadge: {
    backgroundColor: "#E2E8F0",
  },
  draftText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  sessionBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 11,
    fontWeight: "400",
    color: "#64748B",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  rescheduleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  paperclipBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  rescheduleBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rescheduleBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  tipIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 12,
    color: "#B45309",
    lineHeight: 16,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
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
});
