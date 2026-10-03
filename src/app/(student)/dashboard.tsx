import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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

// --- TYPES ---
interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  tutorsCount: number;
  iconName: string;
  iconBgColor: string;
  iconColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
}

interface SessionItem {
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  badgeText: string;
  badgeType: "zoom" | "confirmed" | "draft";
  date: string;
  duration: string;
  rating: number;
  reviewsCount: number;
  actionType: "join" | "details" | "reschedule";
}

// --- MOCK DATA ---
const CATEGORIES: CategoryItem[] = [
  {
    id: "1",
    title: "Mathematics",
    subtitle: "Calculus & Algebra",
    tutorsCount: 32,
    iconName: "sigma",
    iconBgColor: "#EEF2FF",
    iconColor: "#3B82F6",
    badgeBgColor: "#E0E7FF",
    badgeTextColor: "#3730A3",
  },
  {
    id: "2",
    title: "Physics & Science",
    subtitle: "Mechanics & Bio",
    tutorsCount: 18,
    iconName: "flask",
    iconBgColor: "#E6FFFA",
    iconColor: "#0D9488",
    badgeBgColor: "#CCFBF1",
    badgeTextColor: "#0F766E",
  },
  {
    id: "3",
    title: "English & Lit",
    subtitle: "Essay Writing & Syntax",
    tutorsCount: 24,
    iconName: "book-open",
    iconBgColor: "#FFEDD5",
    iconColor: "#EA580C",
    badgeBgColor: "#FFEDD5",
    badgeTextColor: "#9A3412",
  },
  {
    id: "4",
    title: "Coding & CS",
    subtitle: "Python, Data & Web",
    tutorsCount: 29,
    iconName: "code",
    iconBgColor: "#E0F2FE",
    iconColor: "#0284C7",
    badgeBgColor: "#E0F2FE",
    badgeTextColor: "#0369A1",
  },
];

const SESSIONS: SessionItem[] = [
  {
    id: "1",
    title: "Math with Sarah Jenkins",
    subtitle: "Multivariable Calculus & Derivatives",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    badgeText: "Zoom",
    badgeType: "zoom",
    date: "Tomorrow, 4:00 PM",
    duration: "60 min",
    rating: 4.95,
    reviewsCount: 128,
    actionType: "join",
  },
  {
    id: "2",
    title: "Physics with Dr. Alan Chen",
    subtitle: "Electromagnetism & Circuit Laws",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    badgeText: "Confirmed",
    badgeType: "confirmed",
    date: "Thursday, 2:30 PM",
    duration: "45 min",
    rating: 5.0,
    reviewsCount: 84,
    actionType: "details",
  },
  {
    id: "3",
    title: "English Essay Review with...",
    subtitle: "College Admissions Essay Feedback",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    badgeText: "Draft Ready",
    badgeType: "draft",
    date: "Friday, 11:00 AM",
    duration: "30 min",
    rating: 4.88,
    reviewsCount: 210,
    actionType: "reschedule",
  },
];

export default function StudentHomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER --- */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="book" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>Student Home</Text>
        </View>

        <TouchableOpacity
          style={styles.profileAvatar}
          onPress={() => router.push("/(student)/StudentProfile")}
        >
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.userName}>Alex Rivera</Text>
          </View>

          <View style={styles.streakBadge}>
            <MaterialCommunityIcons name="fire" size={16} color="#D97706" />
            <Text style={styles.streakText}>4 Day Streak</Text>
          </View>
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
          <Text style={styles.sectionSubtitle}>4 Subjects</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
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
                <View
                  style={[
                    styles.tutorBadge,
                    { backgroundColor: cat.badgeBgColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.tutorBadgeText,
                      { color: cat.badgeTextColor },
                    ]}
                  >
                    {cat.tutorsCount} Tutors
                  </Text>
                </View>
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
              <Text style={styles.categorySubtitle}>{cat.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- MIDTERM PREP BANNER --- */}
        <TouchableOpacity style={styles.prepBanner} activeOpacity={0.9}>
          <View style={styles.prepLeft}>
            <View style={styles.prepIconBg}>
              <Ionicons name="book" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.prepTitle}>Midterm Prep Plan</Text>
              <Text style={styles.prepSubtitle}>
                3 sessions booked this week
              </Text>
            </View>
          </View>
          <View style={styles.prepRight}>
            <Text style={styles.trackText}>Track</Text>
            <Ionicons name="arrow-forward" size={16} color="#2563EB" />
          </View>
        </TouchableOpacity>

        {/* --- UPCOMING SESSIONS SECTION --- */}
        <View style={styles.sectionHeader}>
          <View style={styles.sessionsTitleRow}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <View style={styles.activeDot} />
          </View>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all &gt;</Text>
          </TouchableOpacity>
        </View>

        {/* SESSION CARDS */}
        {SESSIONS.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            {/* Header: Avatar, Details & Platform Badge */}
            <View style={styles.sessionMain}>
              <Image source={{ uri: session.avatar }} style={styles.avatar} />
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
              {session.badgeType === "zoom" && (
                <View style={[styles.statusBadge, styles.zoomBadge]}>
                  <View style={styles.greenDot} />
                  <Text style={styles.zoomText}>{session.badgeText}</Text>
                </View>
              )}
              {session.badgeType === "confirmed" && (
                <View style={[styles.statusBadge, styles.confirmedBadge]}>
                  <Text style={styles.confirmedText}>{session.badgeText}</Text>
                </View>
              )}
              {session.badgeType === "draft" && (
                <View style={[styles.statusBadge, styles.draftBadge]}>
                  <Text style={styles.draftText}>{session.badgeText}</Text>
                </View>
              )}
            </View>

            {/* Bottom Row: Ratings & Action Buttons */}
            <View style={styles.sessionBottomRow}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#D97706" />
                <Text style={styles.ratingText}>
                  {session.rating.toFixed(session.rating % 1 === 0 ? 1 : 2)}{" "}
                  <Text style={styles.reviewsText}>
                    ({session.reviewsCount} reviews)
                  </Text>
                </Text>
              </View>

              {/* Dynamic Actions */}
              {session.actionType === "join" && (
                <TouchableOpacity style={styles.joinBtn}>
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
                <TouchableOpacity style={styles.detailsBtn}>
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
                  <TouchableOpacity style={styles.rescheduleBtn}>
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
              Upload your assignment rubric 15 minutes before your call with
              Emma to maximize your 30-minute review.
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
