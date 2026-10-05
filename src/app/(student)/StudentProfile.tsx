import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
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

// --- TYPES ---
interface StatCard {
  id: string;
  value: string;
  label: string;
  icon: string;
  iconColor: string;
  bgIconColor: string;
}

interface SubjectPill {
  id: string;
  name: string;
  dotColor: string;
  bgColor: string;
}

// --- MOCK DATA ---
const PROFILE_STATS: StatCard[] = [
  {
    id: "1",
    value: "14",
    label: "Sessions",
    icon: "checkmark-circle-outline",
    iconColor: "#2563EB",
    bgIconColor: "#EFF6FF",
  },
  {
    id: "2",
    value: "4–Day",
    label: "Streak",
    icon: "flame-outline",
    iconColor: "#D97706",
    bgIconColor: "#FEF3C7",
  },
  {
    id: "3",
    value: "4.9",
    label: "Rating (12)",
    icon: "star-outline",
    iconColor: "#D97706",
    bgIconColor: "#FEF3C7",
  },
  {
    id: "4",
    value: "2",
    label: "Mentors",
    icon: "school-outline",
    iconColor: "#0D9488",
    bgIconColor: "#CCFBF1",
  },
];

const ACTIVE_SUBJECTS: SubjectPill[] = [
  { id: "1", name: "AP Calculus BC", dotColor: "#2563EB", bgColor: "#EFF6FF" },
  { id: "2", name: "AP Physics C", dotColor: "#0D9488", bgColor: "#E6FFFA" },
  { id: "3", name: "College Essays", dotColor: "#F59E0B", bgColor: "#FEF3C7" },
  { id: "4", name: "Linear Algebra", dotColor: "#6B7280", bgColor: "#F1F5F9" },
];

const TARGET_UNIVERSITIES = [
  { id: "1", name: "Stanford", icon: "school-outline" },
  { id: "2", name: "MIT", icon: "school-outline" },
  { id: "3", name: "UC Berkeley", icon: "school-outline" },
];

export default function UserProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");

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
            <Text style={styles.brandTitle}>Profile</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push("/notification")}
        >
          <Ionicons name="notifications-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- PAGE SUBHEADER --- */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.pageHeaderTitle}>Account & Profile</Text>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => router.push("/(student)/EditStudentProfile")}
          >
            <Ionicons name="pencil-outline" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* --- PROFILE CARD --- */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>Alex Rivera</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#2563EB"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.userTrack}>Grade 12 • AP & Honors Track</Text>
              <Text style={styles.userJoined}>Joined Fall 2025</Text>
            </View>
          </View>

          {/* Goal Banner */}
          <View style={styles.targetBanner}>
            <MaterialCommunityIcons name="target" size={16} color="#D97706" />
            <Text style={styles.targetText}>
              Target:{" "}
              <Text style={styles.targetHighlight}>5 on AP Calc & Physics</Text>
            </Text>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            {PROFILE_STATS.map((stat) => (
              <View key={stat.id} style={styles.statBox}>
                <View
                  style={[
                    styles.statIconBg,
                    { backgroundColor: stat.bgIconColor },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={14}
                    color={stat.iconColor}
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- LEARNING WALLET CARD --- */}
        <View style={styles.card}>
          <View style={styles.walletHeader}>
            <View style={styles.walletHeaderLeft}>
              <View style={styles.walletIconBg}>
                <Ionicons name="wallet-outline" size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Learning Wallet</Text>
                <Text style={styles.cardSubtitle}>TutorMate Pass</Text>
              </View>
            </View>

            <View style={styles.autoReloadBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.autoReloadText}>Auto-Reload On</Text>
            </View>
          </View>

          {/* Balance Box */}
          <View style={styles.balanceBox}>
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <View style={styles.securedRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color="#2563EB"
                />
                <Text style={styles.securedText}>Secured</Text>
              </View>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>$120.00</Text>
              <Text style={styles.creditsText}>~2.0 hrs credits</Text>
            </View>
          </View>

          {/* Wallet Actions */}
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.addFundsBtn}>
              <Ionicons
                name="add"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.historyBtn}>
              <Ionicons
                name="receipt-outline"
                size={16}
                color="#1E293B"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.historyText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- ACTIVE SUBJECTS CARD --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.headerIconBg}>
                <Ionicons name="book-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Active Subjects</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editLink}>Edit &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Subject Pills */}
          <View style={styles.pillsWrap}>
            {ACTIVE_SUBJECTS.map((subject) => (
              <View
                key={subject.id}
                style={[
                  styles.subjectPill,
                  { backgroundColor: subject.bgColor },
                ]}
              >
                <View
                  style={[
                    styles.pillDot,
                    { backgroundColor: subject.dotColor },
                  ]}
                />
                <Text style={styles.subjectPillText}>{subject.name}</Text>
              </View>
            ))}
          </View>

          {/* Target Universities Sub-section */}
          <Text style={styles.subSectionTitle}>TARGET UNIVERSITIES</Text>
          <View style={styles.pillsWrap}>
            {TARGET_UNIVERSITIES.map((uni) => (
              <View key={uni.id} style={styles.uniPill}>
                <Ionicons
                  name="school-outline"
                  size={12}
                  color="#2563EB"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.uniPillText}>{uni.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- SAVED TUTORS BANNER --- */}
        <TouchableOpacity style={styles.listRowCard}>
          <View style={styles.listRowLeft}>
            <View style={styles.headerIconBg}>
              <Ionicons name="bookmark-outline" size={18} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.listRowTitle}>Saved Tutors & Favorites</Text>
              <Text style={styles.listRowSubtitle}>5 vetted instructors</Text>
            </View>
          </View>

          <View style={styles.listRowRight}>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>5</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* --- SUPPORT & COMMUNITY CARD --- */}
        <View style={styles.card}>
          <Text style={styles.subSectionTitle}>SUPPORT & COMMUNITY</Text>

          <TouchableOpacity style={styles.supportRow}>
            <View style={styles.supportIconBg}>
              <Ionicons name="help-buoy-outline" size={18} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Help & Academic Support</Text>
              <Text style={styles.supportSubtitle}>
                24/7 concierge for reschedule & questions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Become a Peer Tutor Callout */}
          <View style={styles.peerTutorCard}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="return-up-forward-outline"
                  size={16}
                  color="#2563EB"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.peerTutorTitle}>Become a Peer Tutor</Text>
              </View>
              <Text style={styles.peerTutorSubtitle}>
                Help underclassmen in Math & Physics
              </Text>
            </View>

            <TouchableOpacity style={styles.switchBtn}>
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- LOG OUT BUTTON --- */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await signOut();
            router.replace("/welcome");
          }}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#EF4444"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* --- FOOTER VERSION --- */}
        <Text style={styles.versionText}>
          TutorMate Mobile v2.4.1 (Build 184)
        </Text>
        <Text style={styles.taglineText}>
          Empowering Student Success Everywhere
        </Text>
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        {[
          { name: "Home", icon: "home-outline", active: false },
          { name: "Search", icon: "search-outline", active: false },
          { name: "Sessions", icon: "calendar-outline", active: false },
          { name: "Messages", icon: "chatbox-outline", active: false },
          { name: "Profile", icon: "person-outline", active: true },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (tab.name === "Sessions") {
                router.push("/(student)/MySessions");
              } else if (tab.name === "Home") {
                router.push("/(student)/dashboard");
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
              name={tab.icon as any}
              size={22}
              color={tab.active ? "#2563EB" : "#9CA3AF"}
            />
            <Text
              style={[styles.tabLabel, tab.active && styles.tabLabelActive]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
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
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  pageHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  userTrack: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  userJoined: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  targetBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  targetText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 6,
  },
  targetHighlight: {
    fontWeight: "700",
    color: "#1E3A8A",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 3,
  },
  statIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  walletHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  autoReloadBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
    marginRight: 4,
  },
  autoReloadText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F766E",
  },
  balanceBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  balanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  securedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  securedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 2,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginRight: 8,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0D9488",
  },
  walletActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addFundsBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0256D0",
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 8,
  },
  addFundsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  historyBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 24,
    marginLeft: 8,
  },
  historyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  cardHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  editLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  subjectPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 10,
  },
  uniPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  uniPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  listRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  listRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  listRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  listRowSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  listRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3730A3",
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  supportIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  supportSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  peerTutorCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 12,
  },
  peerTutorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  peerTutorSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  switchBtn: {
    backgroundColor: "#0256D0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 24,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#94A3B8",
  },
  taglineText: {
    textAlign: "center",
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 2,
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
