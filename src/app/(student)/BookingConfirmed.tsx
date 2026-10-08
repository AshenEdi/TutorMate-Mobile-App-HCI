import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BookingDetails {
  booking_ref: string | null;
  tutor_id: string | null;
  tutor_name: string | null;
  subject: string | null;
  session_date: string | null;
  time_slot: string | null;
  duration: number | null;
  delivery_format: string | null;
  status: string | null;
  total_price: number | null;
}

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingRef?: string | string[];
  }>();
  const bookingRef = Array.isArray(params.bookingRef)
    ? params.bookingRef[0]
    : params.bookingRef;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(bookingRef));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!bookingRef) {
      return () => {
        isMounted = false;
      };
    }

    async function fetchBooking() {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("booking_ref", bookingRef)
          .single();
        if (error) throw error;
        if (isMounted) {
          setBooking({
            booking_ref: data.booking_ref,
            tutor_id: data.tutor_id,
            tutor_name: data.tutor_name,
            subject: data.subject,
            session_date: data.session_date,
            time_slot: data.time_slot,
            duration: data.duration == null ? null : Number(data.duration),
            delivery_format: data.delivery_format,
            status: data.status,
            total_price: data.total_price == null ? null : Number(data.total_price),
          });
        }
      } catch (error) {
        console.error("Failed to load confirmed booking:", error);
        if (isMounted) setErrorMessage("No booking found");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchBooking();
    return () => {
      isMounted = false;
    };
  }, [bookingRef]);

  const totalPrice = booking?.total_price ?? 0;
  const paymentTotal = `$${totalPrice.toFixed(2)}`;
  const dateKey = booking?.session_date;

  let dateMonth = "—";
  let dateNum = "—";
  if (dateKey) {
    const parts = dateKey.split("-");
    if (parts.length === 3) {
      const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dateMonth = dObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      dateNum = String(dObj.getDate());
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  const pageError = errorMessage || (!bookingRef ? "No booking found" : null);
  if (pageError || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Text style={styles.heroTitle}>{pageError || "No booking found"}</Text>
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => router.push("/(student)/dashboard")}
        >
          <Text style={styles.returnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tutorName = booking.tutor_name || "—";
  const subject = booking.subject || "—";
  const timeSlot = booking.time_slot || "—";
  const bookingStatus = booking.status || "—";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER BAR --- */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(student)/dashboard")}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="book" size={18} color="#FFFFFF" />
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
        
        {/* --- SUCCESS HERO SECTION --- */}
        <View style={styles.heroSection}>
          {/* Decorative Confetti Dots */}
          <View style={[styles.confetti, { top: 10, left: 50, backgroundColor: '#2563EB', width: 6, height: 6 }]} />
          <View style={[styles.confetti, { top: 40, left: 20, backgroundColor: '#10B981', width: 8, height: 8 }]} />
          <View style={[styles.confetti, { top: 70, left: 80, backgroundColor: '#F59E0B', width: 5, height: 5 }]} />
          <View style={[styles.confetti, { top: 20, right: 40, backgroundColor: '#2563EB', width: 7, height: 7 }]} />
          <View style={[styles.confetti, { top: 60, right: 20, backgroundColor: '#10B981', width: 6, height: 6 }]} />
          <View style={[styles.confetti, { bottom: 10, left: 30, backgroundColor: '#F59E0B', width: 8, height: 8 }]} />
          <View style={[styles.confetti, { bottom: 30, right: 50, backgroundColor: '#2563EB', width: 5, height: 5 }]} />
          <View style={[styles.confetti, { top: 100, right: 70, backgroundColor: '#F59E0B', width: 6, height: 6 }]} />

          <View style={styles.successBadgeOuter}>
            <View style={styles.successBadgeInner}>
              <Ionicons name="checkmark" size={44} color="#FFFFFF" />
            </View>
          </View>
          
          <View style={styles.confirmedPill}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.confirmedPillText}>{bookingStatus}</Text>
          </View>

          <View style={styles.refRow}>
            <Text style={styles.refText}>Ref #: {booking.booking_ref || "—"}</Text>
            <TouchableOpacity style={{ marginLeft: 6 }}>
              <Ionicons name="copy-outline" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{bookingStatus}</Text>
          <Text style={styles.heroSubtitle}>
            You&apos;re all set for mastery with {tutorName}.
          </Text>
        </View>

        {/* --- SESSION DETAILS CARD --- */}
        <View style={styles.detailsCard}>
          <View style={styles.cardAccent} />
          <View style={styles.detailsMain}>
            <View style={styles.dateBox}>
              <Text style={styles.dateMonth}>{dateMonth}</Text>
              <Text style={styles.dateNum}>{dateNum}</Text>
            </View>
            <View style={styles.detailsInfo}>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.timeText}>{timeSlot}</Text>
              </View>
              <Text style={styles.subjectText}>{subject}</Text>
              <Text style={styles.focusText}>{booking.delivery_format || "—"}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.tutorRow}>
            <View style={styles.avatarWrapper}>
              <Ionicons name="person-circle-outline" size={40} color="#64748B" />
            </View>
            <View style={styles.tutorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.tutorName}>{tutorName}</Text>
                <Ionicons name="checkmark-circle" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
              </View>
              <View style={styles.statusRow}>
                <View style={styles.greenDot} />
                <Text style={styles.statusText}>{bookingStatus}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.chatBtn}
              onPress={() => router.push("/(student)/ChatConversation")}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- PAYMENT SUMMARY CARD --- */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentTitleRow}>
              <Ionicons name="wallet-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.paymentTitle}>Payment Summary</Text>
            </View>
            <TouchableOpacity style={styles.receiptBtn}>
              <Ionicons name="download-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.receiptText}>Receipt PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              {booking.duration ?? "—"} min {subject} Tutoring
            </Text>
            <Text style={styles.paymentValue}>{paymentTotal}</Text>
          </View>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Delivery format</Text>
            <Text style={styles.paymentValue}>{booking.delivery_format || "—"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <View style={styles.walletPaidRow}>
              <Ionicons name="receipt-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.paymentLabel}>Booking total</Text>
            </View>
            <Text style={styles.paymentValue}>-{paymentTotal}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.remainingCard}>
            <View style={styles.remainingLeft}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.remainingLabel}>Booking status</Text>
            </View>
            <Text style={styles.remainingValue}>{bookingStatus}</Text>
          </View>
        </View>

        {/* --- RETURN TO DASHBOARD --- */}
        <TouchableOpacity 
          style={styles.returnBtn}
          onPress={() => router.push("/(student)/dashboard")}
        >
          <Ionicons name="arrow-back" size={16} color="#0F172A" style={{ marginRight: 8 }} />
          <Text style={styles.returnText}>Return to Student Dashboard</Text>
        </TouchableOpacity>

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
    paddingTop: 10,
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 30,
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    borderRadius: 50,
  },
  successBadgeOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successBadgeInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  confirmedPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  refText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  cardAccent: {
    height: 4,
    backgroundColor: "#2563EB",
  },
  detailsMain: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  dateBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
  },
  dateNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailsInfo: {
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  subjectText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  focusText: {
    fontSize: 12,
    color: "#64748B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },
  tutorRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    margin: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  tutorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  tutorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tutorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: "#64748B",
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  receiptBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  receiptText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  paymentLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  freeBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10B981",
  },
  walletPaidRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  remainingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  remainingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  remainingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
  },
  returnBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 20,
  },
  returnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
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
});
