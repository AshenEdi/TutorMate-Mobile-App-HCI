import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
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

// --- MOCK DATA ---
const SESSIONS = [
  {
    id: "1",
    tutorName: "Dr. Sarah Jenkins",
    tutorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    subject: "AP Calculus BC",
    topic: "Taylor Series, Power Series & Convergence",
    date: "Today, Mar 16",
    time: "3:30 - 4:30 PM",
    status: "Featured",
    startTime: "45 MIN",
    unlockTime: "3:15 PM",
    delivery: "Interactive Video & Canvas Whiteboard",
    rating: "5.0",
  },
  {
    id: "2",
    tutorName: "Elena Rostova, M.S.",
    tutorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    subject: "Organic Chemistry II",
    topic: "Reaction Mechanisms & Synthesis Practice",
    date: "WED, MAR 18",
    time: "4:00 PM EDT",
    status: "Confirmed",
    duration: "60 mins (1 hr)",
    features: "Digital Notebook Sharing",
  },
  {
    id: "3",
    tutorName: "David Kim",
    tutorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    subject: "SAT Math Prep • 99th Percentile",
    topic: "SAT Math Mock Review: Advanced Geometry",
    date: "SAT, MAR 21",
    time: "11:00 AM EDT",
    status: "Pending Tutor",
    info: "David typically responds within 3 hours. No charge will be placed until confirmed.",
  },
];

const FILTER_TABS = [
  { id: "all", label: "All (3)", active: true },
  { id: "today", label: "Today (1)", active: false },
  { id: "confirmed", label: "Confirmed (2)", active: false },
  { id: "pending", label: "Pending (1)", active: false },
];

export default function MySessionsScreen() {
  const router = useRouter();

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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.pageTitle}>My Sessions</Text>
            <Text style={styles.pageSubtitle}>Spring Semester • 3 scheduled</Text>
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
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, tab.active && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, tab.active && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- FEATURED SESSION CARD --- */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadgeRow}>
            <View style={styles.statusBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.statusBadgeText}>STARTS IN 45 MIN</Text>
            </View>
            <Text style={styles.unlockText}>Room unlocks 3:15 PM</Text>
          </View>

          <View style={styles.tutorRow}>
            <View style={styles.tutorAvatarWrapper}>
              <Image source={{ uri: SESSIONS[0].tutorAvatar }} style={styles.tutorAvatar} />
              <View style={styles.onlineBadge}>
                <Ionicons name="flash" size={8} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.tutorInfo}>
              <View style={styles.nameRatingRow}>
                <Text style={styles.tutorName}>{SESSIONS[0].tutorName}</Text>
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={12} color="#D97706" />
                  <Text style={styles.ratingText}>{SESSIONS[0].rating}</Text>
                </View>
              </View>
              <Text style={styles.featuredSubject}>{SESSIONS[0].subject}</Text>
              <Text style={styles.featuredTopic}>{SESSIONS[0].topic}</Text>
            </View>
          </View>

          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeBox}>
              <Ionicons name="calendar" size={16} color="#2563EB" />
              <View style={styles.dateTimeTextCol}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{SESSIONS[0].date}</Text>
              </View>
            </View>
            <View style={styles.dateTimeBox}>
              <Ionicons name="time" size={16} color="#2563EB" />
              <View style={styles.dateTimeTextCol}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{SESSIONS[0].time}</Text>
              </View>
            </View>
          </View>

          <View style={styles.deliveryRow}>
            <Ionicons name="videocam-outline" size={18} color="#0D9488" />
            <Text style={styles.deliveryText}>{SESSIONS[0].delivery}</Text>
          </View>

          <View style={styles.featuredActions}>
            <TouchableOpacity style={styles.joinBtn}>
              <Ionicons name="videocam" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.joinBtnText}>Join Whiteboard Room</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- UPCOMING SESSIONS SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Coming Up This Week</Text>
          <Text style={styles.sectionCount}>2 sessions</Text>
        </View>

        {/* --- SESSION CARD 1 (Confirmed) --- */}
        <View style={styles.sessionCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardDateRow}>
              <Ionicons name="calendar-outline" size={16} color="#2563EB" />
              <Text style={styles.cardDateText}>{SESSIONS[1].date} • {SESSIONS[1].time}</Text>
            </View>
            <View style={styles.confirmedBadge}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#10B981" />
              <Text style={styles.confirmedBadgeText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.cardTutorRow}>
            <Image source={{ uri: SESSIONS[1].tutorAvatar }} style={styles.smallAvatar} />
            <View style={styles.cardTutorInfo}>
              <Text style={styles.cardTutorName}>{SESSIONS[1].tutorName}</Text>
              <Text style={styles.cardSubject}>{SESSIONS[1].subject}</Text>
              <Text style={styles.cardTopic}>{SESSIONS[1].topic}</Text>
            </View>
          </View>

          <View style={styles.cardMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{SESSIONS[1].duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="reader-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{SESSIONS[1].features}</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallChatBtn}>
              <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SESSION CARD 2 (Pending) --- */}
        <View style={styles.sessionCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardDateRow}>
              <Ionicons name="calendar-outline" size={16} color="#2563EB" />
              <Text style={styles.cardDateText}>{SESSIONS[2].date} • {SESSIONS[2].time}</Text>
            </View>
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={12} color="#D97706" />
              <Text style={styles.pendingBadgeText}>Pending Tutor</Text>
            </View>
          </View>

          <View style={styles.cardTutorRow}>
            <Image source={{ uri: SESSIONS[2].tutorAvatar }} style={styles.smallAvatar} />
            <View style={styles.cardTutorInfo}>
              <Text style={styles.cardTutorName}>{SESSIONS[2].tutorName}</Text>
              <Text style={styles.cardSubject}>{SESSIONS[2].subject}</Text>
              <Text style={styles.cardTopic}>{SESSIONS[2].topic}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#D97706" />
            <Text style={styles.infoBoxText}>{SESSIONS[2].info}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: '#FFF1F2' }]}>
              <Text style={[styles.secondaryBtnText, { color: '#EF4444' }]}>Cancel Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Edit Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/dashboard")}>
          <Ionicons name="home-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/search")}>
          <Ionicons name="search-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/MySessions")}>
          <Ionicons name="calendar" size={22} color="#2563EB" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Sessions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/messages")}>
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
});
