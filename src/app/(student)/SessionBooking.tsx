import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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

// --- MOCK DATA ---
const TUTOR = {
  name: "Dr. Sarah Jenkins",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  verified: true,
  online: true,
  replyTime: "5m",
};

const SUBJECTS = [
  { id: "1", name: "AP Calculus BC", active: true },
  { id: "2", name: "Differential Equations", active: false },
  { id: "3", name: "Algebra II", active: false },
];

const DATES = [
  { id: "1", day: "TODAY", date: "16", month: "Mar", active: true },
  { id: "2", day: "TUE", date: "17", month: "Mar", active: false },
  { id: "3", day: "WED", date: "18", month: "Mar", active: false },
  { id: "4", day: "THU", date: "19", month: "Mar", active: false },
  { id: "5", day: "FRI", date: "20", month: "Mar", active: false },
];

const LENGTHS = [
  { id: "1", time: "45m", price: "$35", active: false },
  { id: "2", time: "60m", price: "$45", active: true, popular: true },
  { id: "3", time: "90m", price: "$65", active: false },
];

const SLOTS = [
  { id: "1", time: "2:00 PM - 3:00 PM", active: false },
  { id: "2", time: "3:30 PM - 4:30 PM", active: true, icon: true },
  { id: "3", time: "5:00 PM - 6:00 PM", active: false },
  { id: "4", time: "7:00 PM - 8:00 PM", active: false },
];

export default function SessionBookingScreen() {
  const router = useRouter();
  const [delivery, setDelivery] = useState("whiteboard");

  const handleConfirm = () => {
    Alert.alert("Booking Confirmed", "Your session has been booked successfully!", [
      { text: "OK", onPress: () => router.push("/(student)/MySessions") }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER BAR --- */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Session Booking</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => router.push("/(student)/StudentProfile")}
        >
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* --- TUTOR PROFILE CARD --- */}
        <View style={styles.tutorCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: TUTOR.avatar }} style={styles.avatar} />
            {TUTOR.online && <View style={styles.onlineBadge} />}
          </View>
          <View style={styles.tutorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.tutorName}>{TUTOR.name}</Text>
              {TUTOR.verified && <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />}
            </View>
            <View style={styles.statusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Online • Typically replies in {TUTOR.replyTime}</Text>
            </View>
          </View>
        </View>

        {/* --- SECTION 1: CHOOSE SUBJECT --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Choose Subject & Focus</Text>
            <Text style={styles.stepText}>Step 1 of 3</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {SUBJECTS.map((sub) => (
              <TouchableOpacity key={sub.id} style={[styles.pill, sub.active && styles.pillActive]}>
                <Text style={[styles.pillText, sub.active && styles.pillTextActive]}>{sub.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.focusContainer}>
            <View style={styles.focusHeader}>
              <Ionicons name="create-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.focusLabel}>What would you like Dr. Sarah to focus on?</Text>
            </View>
            <TextInput
              style={styles.focusInput}
              placeholder="e.g., Taylor series convergence tests & FRQ practice from homework problem set #4..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
        </View>

        {/* --- SECTION 2: SELECT SCHEDULE --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Select Schedule</Text>
            <View style={styles.timezoneBadge}>
              <Ionicons name="time-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.timezoneText}>EDT (UTC-4)</Text>
            </View>
          </View>
          
          {/* Date Picker */}
          <View style={styles.dateRow}>
            {DATES.map((d) => (
              <TouchableOpacity key={d.id} style={[styles.datePill, d.active && styles.datePillActive]}>
                <Text style={[styles.dateDay, d.active && styles.dateTextActive]}>{d.day}</Text>
                <Text style={[styles.dateNum, d.active && styles.dateTextActive]}>{d.date}</Text>
                <Text style={[styles.dateMonth, d.active && styles.dateTextActive]}>{d.month}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Session Length */}
          <View style={styles.subSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.subTitle}>Session Length</Text>
              <Text style={styles.infoText}>Priced proportionally</Text>
            </View>
            <View style={styles.lengthRow}>
              {LENGTHS.map((l) => (
                <View key={l.id} style={styles.lengthCol}>
                  {l.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <TouchableOpacity style={[styles.lengthPill, l.active && styles.pillActive]}>
                    <Text style={[styles.lengthTime, l.active && styles.pillTextActive]}>{l.time}</Text>
                    <Text style={[styles.lengthPrice, l.active && styles.pillTextActive]}>{l.price}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Time Slots */}
          <View style={styles.subSection}>
            <Text style={styles.slotsLabel}>Available Afternoon & Evening Slots</Text>
            <View style={styles.slotsGrid}>
              {SLOTS.map((s) => (
                <TouchableOpacity key={s.id} style={[styles.slotBtn, s.active && styles.slotBtnActive]}>
                  {s.icon && <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />}
                  <Text style={[styles.slotText, s.active && styles.pillTextActive]}>{s.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* --- SECTION 3: DELIVERY FORMAT --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Delivery Format</Text>
          
          <TouchableOpacity 
            style={[styles.radioCard, delivery === "whiteboard" && styles.radioCardActive]}
            onPress={() => setDelivery("whiteboard")}
          >
            <View style={styles.radioHeader}>
              <View style={styles.radioRow}>
                <View style={[styles.radio, delivery === "whiteboard" && styles.radioSelected]}>
                  {delivery === "whiteboard" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioTitle}>Interactive Whiteboard & Video</Text>
              </View>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>RECOMMENDED</Text>
              </View>
            </View>
            <Text style={styles.radioSubtitle}>
              Includes real-time Mathjax equation rendering, recording, and cloud export.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioCard, delivery === "inperson" && styles.radioCardActive]}
            onPress={() => setDelivery("inperson")}
          >
            <View style={styles.radioRow}>
              <View style={[styles.radio, delivery === "inperson" && styles.radioSelected]}>
                {delivery === "inperson" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioTitle}>In-Person (Campus Library)</Text>
            </View>
            <Text style={styles.radioSubtitle}>
              Princeton University Firestone Library • Study Room 304
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- WALLET CARD --- */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <View style={styles.walletIconBg}>
                <Ionicons name="wallet-outline" size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.walletTitle}>Student Wallet Balance</Text>
                <Text style={styles.balanceText}>$120.00 Available</Text>
              </View>
            </View>
            <View style={styles.autoPayBadge}>
              <View style={styles.greenDotSmall} />
              <Text style={styles.autoPayText}>Auto-Pay Active</Text>
            </View>
          </View>

          <View style={styles.feeBreakdown}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Session Fee (1 hr • Dr. Sarah Jenkins)</Text>
              <Text style={styles.feeValue}>$45.00</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Platform Service Fee <Ionicons name="information-circle-outline" size={12} color="#64748B" /></Text>
              <Text style={styles.feeFree}>$4.50 Free</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.feeRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>$45.00</Text>
            </View>
            <View style={[styles.feeRow, { marginTop: 12 }]}>
              <Text style={styles.remainingLabel}>Remaining balance after booking:</Text>
              <Text style={styles.remainingValue}>$75.00</Text>
            </View>
          </View>
        </View>

        {/* --- GUARANTEE CARD --- */}
        <View style={styles.guaranteeCard}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" style={{ marginRight: 8 }} />
          <Text style={styles.guaranteeText}>Free cancellation up to 24 hours prior • 100% Guaranteed</Text>
        </View>

        {/* --- CONFIRM BUTTON --- */}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm & Book Session • $45.00</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/dashboard")}>
          <Ionicons name="home-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/searchscreen")}>
          <Ionicons name="search" size={22} color="#2563EB" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/MySessions")}>
          <Ionicons name="calendar-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Sessions</Text>
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
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    paddingBottom: 100,
  },
  tutorCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  tutorInfo: {
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tutorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  horizontalScroll: {
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: "#2563EB",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  focusContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  focusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  focusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  focusInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: "#1E293B",
    height: 80,
    textAlignVertical: "top",
  },
  timezoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timezoneText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
  },
  datePill: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  datePillActive: {
    backgroundColor: "#2563EB",
  },
  dateDay: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  dateNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  dateTextActive: {
    color: "#FFFFFF",
  },
  subSection: {
    marginTop: 16,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  infoText: {
    fontSize: 11,
    color: "#64748B",
  },
  lengthRow: {
    flexDirection: "row",
    gap: 10,
  },
  lengthCol: {
    flex: 1,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  popularText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  lengthPill: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  lengthTime: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  lengthPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  slotsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotBtn: {
    width: "48%",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  slotBtnActive: {
    backgroundColor: "#2563EB",
  },
  slotText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  radioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  radioCardActive: {
    borderColor: "#2563EB",
    borderWidth: 2,
  },
  radioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioSelected: {
    borderColor: "#2563EB",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },
  radioTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  recommendedBadge: {
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#0D9488",
  },
  radioSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 32,
    lineHeight: 18,
  },
  walletCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  walletTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  autoPayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  greenDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 4,
  },
  autoPayText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  feeBreakdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  feeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  feeFree: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
  },
  remainingLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  remainingValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
  },
  guaranteeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  guaranteeText: {
    fontSize: 11,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
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
