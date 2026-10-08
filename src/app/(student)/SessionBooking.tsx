import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
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

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

interface TutorDetails {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  online: boolean;
  replyTime: string;
  hourlyRate: number;
  subjects: string[];
}

interface StudentWalletProfile {
  full_name: string | null;
  wallet_balance: number;
}

interface TutorProfile {
  id: string;
  full_name: string | null;
  specialty: string | null;
  hourly_rate: number | string | null;
  avatar_url: string | null;
}

export default function SessionBookingScreen() {
  const router = useRouter();
  const showMessage = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
    }
  };

  const params = useLocalSearchParams<{ tutorId?: string | string[] }>();
  const tutorId = Array.isArray(params.tutorId) ? params.tutorId[0] : params.tutorId;

  const [delivery, setDelivery] = useState("whiteboard");
  const [focusText, setFocusText] = useState("");
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedLengthIdx, setSelectedLengthIdx] = useState(1);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [userProfile, setUserProfile] = useState<StudentWalletProfile | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [booking, setBooking] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);

  const tutor: TutorDetails = {
    id: tutorProfile?.id || tutorId || "",
    name: tutorProfile?.full_name || "Tutor",
    avatar: tutorProfile?.avatar_url || DEFAULT_AVATAR,
    verified: true,
    online: true,
    replyTime: "5m",
    hourlyRate: Number(tutorProfile?.hourly_rate) || 45,
    subjects: [tutorProfile?.specialty || "General"],
  };

  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { morning: boolean; afternoon: boolean; evening: boolean }>>({});
  const [bookedSlotsList, setBookedSlotsList] = useState<{ tutorId: string; date: string; timeSlot: string }[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadStudentProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, wallet_balance")
          .eq("id", user.id)
          .single();
        if (error) throw error;

        if (isMounted) {
          setUserProfile({
            full_name: data.full_name,
            wallet_balance: data.wallet_balance == null ? 0 : Number(data.wallet_balance),
          });
        }
      } catch (error) {
        console.error("Failed to load student wallet:", error);
        showMessage("Error", "Unable to load your wallet balance.");
      } finally {
        if (isMounted) setWalletLoading(false);
      }
    }

    loadStudentProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch tutor profile and availability from Supabase by tutor_id
  useEffect(() => {
    let isMounted = true;

    async function loadTutorAndAvailability() {
      try {
        if (!tutorId) {
          router.back();
          return;
        }

        // 1. Fetch tutor profile from Supabase
        const { data: prof, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, specialty, hourly_rate, avatar_url")
          .eq("id", tutorId)
          .single();
        if (profileError) throw profileError;
        if (isMounted) setTutorProfile(prof);

        // 2. Fetch availability for this tutor_id from Supabase tutor_availability table
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const { data: availRows } = await supabase
          .from("tutor_availability")
          .select("*")
          .eq("tutor_id", tutorId)
          .gte("date", todayStr);

        const map: Record<string, { morning: boolean; afternoon: boolean; evening: boolean }> = {};
        if (availRows) {
          availRows.forEach((r: any) => {
            map[r.date] = {
              morning: !!r.morning_window,
              afternoon: !!r.afternoon_window,
              evening: !!r.evening_window,
            };
          });
        }

        // Merge AsyncStorage schedule for this tutor
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          const schedKeys = allKeys.filter((k) => k.startsWith("@tutormate_schedule_availability_v1"));
          for (const key of schedKeys) {
            const parts = key.split("_");
            if (parts.length >= 6) {
              const y = parts[4];
              const m = parts[5];
              const val = await AsyncStorage.getItem(key);
              if (val) {
                const dayMap = JSON.parse(val);
                Object.keys(dayMap).forEach((dStr) => {
                  const dateKey = `${y}-${m}-${String(dStr).padStart(2, '0')}`;
                  if (!map[dateKey]) {
                    map[dateKey] = {
                      morning: !!dayMap[dStr].morning,
                      afternoon: !!dayMap[dStr].afternoon,
                      evening: !!dayMap[dStr].evening,
                    };
                  }
                });
              }
            }
          }
        } catch {}

        // Fetch booked sessions from Supabase bookings table to exclude booked slots
        try {
          const { data: dbBooked } = await supabase
            .from("bookings")
            .select("*")
            .eq("tutor_id", tutorId)
            .neq("status", "cancelled");

          if (dbBooked && isMounted) {
            const dbBookedSlots = dbBooked.map((b: any) => ({
              tutorId: b.tutor_id,
              date: b.session_date,
              timeSlot: b.time_slot,
            }));
            setBookedSlotsList((prev) => [...prev, ...dbBookedSlots]);
          }
        } catch {}

        // Fetch local booked sessions to exclude booked slots
        try {
          const bookedStr = await AsyncStorage.getItem("@tutormate_booked_sessions");
          if (bookedStr && isMounted) {
            const localList = JSON.parse(bookedStr);
            setBookedSlotsList((prev) => [...prev, ...localList]);
          }
        } catch {}

        if (isMounted) {
          setAvailabilityMap(map);
        }
      } catch (e) {
        console.warn("Failed to load tutor booking availability:", e);
      }
    }

    loadTutorAndAvailability();

    return () => {
      isMounted = false;
    };
  }, [router, tutorId]);

  // Generate 5 upcoming dates starting today
  const upcomingDates = Array.from({ length: 5 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = idx === 0 ? "TODAY" : d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dateNum = String(d.getDate());
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const hasAvail = availabilityMap[ymd]
      ? (availabilityMap[ymd].morning || availabilityMap[ymd].afternoon || availabilityMap[ymd].evening)
      : true;

    return { id: String(idx + 1), dateKey: ymd, day: dayLabel, date: dateNum, month: monthName, hasAvail };
  });

  const selectedDateObj = upcomingDates[selectedDateIdx] || upcomingDates[0];
  const dateKey = selectedDateObj.dateKey;
  const availWindow = availabilityMap[dateKey] || { morning: true, afternoon: true, evening: true };

  // Generate time slots based on tutor_availability windows for selectedDate
  let generatedSlots: string[] = [];
  if (availWindow.morning) {
    generatedSlots.push("9:00 AM - 10:00 AM", "10:30 AM - 11:30 AM");
  }
  if (availWindow.afternoon) {
    generatedSlots.push("1:00 PM - 2:00 PM", "2:30 PM - 3:30 PM", "3:30 PM - 4:30 PM", "4:30 PM - 5:30 PM");
  }
  if (availWindow.evening) {
    generatedSlots.push("6:00 PM - 7:00 PM", "7:30 PM - 8:30 PM");
  }

  if (generatedSlots.length === 0) {
    generatedSlots = ["2:00 PM - 3:00 PM", "3:30 PM - 4:30 PM", "5:00 PM - 6:00 PM", "7:00 PM - 8:00 PM"];
  }

  // Filter out booked slots for this tutor and date
  const availableSlots = generatedSlots.filter((slotTime) => {
    return !bookedSlotsList.some(
      (b) => b.tutorId === tutor.id && b.date === dateKey && b.timeSlot === slotTime
    );
  });

  const activeSlots = availableSlots.length > 0 ? availableSlots : generatedSlots;

  // Session lengths & prices
  const lengths = [
    { id: "1", time: "45m", price: `$${Math.round(tutor.hourlyRate * 0.75)}` },
    { id: "2", time: "60m", price: `$${tutor.hourlyRate}`, popular: true },
    { id: "3", time: "90m", price: `$${Math.round(tutor.hourlyRate * 1.5)}` },
  ];

  const selectedLengthObj = lengths[selectedLengthIdx] || lengths[1];
  const selectedSlotText = activeSlots[selectedSlotIdx] || activeSlots[0] || "3:30 PM - 4:30 PM";

  const numericPrice = selectedLengthIdx === 0
    ? Math.round(tutor.hourlyRate * 0.75)
    : selectedLengthIdx === 2
    ? Math.round(tutor.hourlyRate * 1.5)
    : tutor.hourlyRate;

  const handleConfirm = async () => {
    setBooking(true);
    try {
      const bookingTutorId = tutorId || tutorProfile?.id;
      if (!bookingTutorId) {
        showMessage("Error", "A tutor is required to book a session.");
        return;
      }

      if ((userProfile?.wallet_balance ?? 0) < numericPrice) {
        showMessage(
          "Insufficient Balance",
          `Your wallet has $${(userProfile?.wallet_balance ?? 0).toFixed(2)} but this session costs $${numericPrice.toFixed(2)}. Please add funds to continue.`,
        );
        return;
      }

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!currentUser) {
        showMessage("Error", "Please sign in to book a session.");
        return;
      }

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
        tutor_id: bookingTutorId,
        student_id: currentUser.id,
        student_name: userProfile?.full_name || currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Student",
        tutor_name: tutorProfile?.full_name || "Tutor",
        subject: tutorProfile?.specialty || "General",
        focus_notes: focusText || "Custom Tutoring Session",
        session_date: dateKey,
        time_slot: selectedSlotText,
        duration: selectedLengthObj.time,
        delivery_format: delivery,
        hourly_rate: Number(tutorProfile?.hourly_rate) || 45,
        total_price: numericPrice,
        status: "confirmed",
      })
        .select()
        .single();
      if (bookingError) throw bookingError;
      if (!newBooking.booking_ref) {
        const { error: rollbackBookingError } = await supabase
          .from("bookings")
          .delete()
          .eq("id", newBooking.id);
        if (rollbackBookingError) {
          console.error("Failed to remove booking without a reference:", rollbackBookingError);
        }
        throw new Error("The booking was saved without a booking reference.");
      }

      const newBalance = (userProfile?.wallet_balance ?? 0) - numericPrice;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", currentUser.id);
      if (balanceError) {
        const { error: rollbackBookingError } = await supabase
          .from("bookings")
          .delete()
          .eq("id", newBooking.id);
        if (rollbackBookingError) {
          console.error("Failed to remove booking after wallet update failed:", rollbackBookingError);
        }
        throw balanceError;
      }

      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: currentUser.id,
          amount: -numericPrice,
          type: "payment",
          description: `Booking ${newBooking.booking_ref}`,
          booking_id: newBooking.id,
        });
      if (transactionError) {
        const { error: rollbackBalanceError } = await supabase
          .from("profiles")
          .update({ wallet_balance: userProfile?.wallet_balance ?? 0 })
          .eq("id", currentUser.id);
        const { error: rollbackBookingError } = await supabase
          .from("bookings")
          .delete()
          .eq("id", newBooking.id);
        if (rollbackBalanceError || rollbackBookingError) {
          console.error("Failed to roll back booking payment:", {
            balanceError: rollbackBalanceError,
            bookingError: rollbackBookingError,
          });
        }
        throw transactionError;
      }

      try {
        const storedBookings = await AsyncStorage.getItem("@tutormate_booked_sessions");
        const localBookings = storedBookings ? JSON.parse(storedBookings) : [];
        localBookings.push({
          id: newBooking.id,
          bookingRef: newBooking.booking_ref,
          studentId: currentUser.id,
          tutorId: bookingTutorId,
          tutorName: tutor.name,
          tutorAvatar: tutor.avatar,
          date: dateKey,
          timeSlot: selectedSlotText,
          subject: tutorProfile?.specialty || "General",
          focusText,
          price: numericPrice,
          duration: selectedLengthObj.time,
          deliveryFormat: delivery,
          status: "confirmed",
          createdAt: new Date().toISOString(),
        });
        await AsyncStorage.setItem("@tutormate_booked_sessions", JSON.stringify(localBookings));
      } catch (storageError) {
        console.warn("Could not save local booking cache:", storageError);
      }

      setUserProfile((previous) =>
        previous ? { ...previous, wallet_balance: newBalance } : previous,
      );
      router.push({
        pathname: "/(student)/BookingConfirmed",
        params: {
          bookingRef: newBooking.booking_ref,
          tutorName: tutorProfile?.full_name || "Tutor",
          tutorAvatar: tutor.avatar,
          subject: tutorProfile?.specialty || "General",
          timeSlot: selectedSlotText,
          dateKey,
          price: String(numericPrice),
          focusText,
        },
      });
    } catch (error) {
      console.error("Failed to book session:", error);
      showMessage("Error", error instanceof Error ? error.message : "Unable to book the session.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER BAR --- */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          router.push("/(student)/searchscreen");
        }}>
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
            <Image source={{ uri: tutorProfile?.avatar_url || DEFAULT_AVATAR }} style={styles.avatar} />
            {tutor.online && <View style={styles.onlineBadge} />}
          </View>
          <View style={styles.tutorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.tutorName}>{tutorProfile?.full_name || "Tutor"}</Text>
              {tutor.verified && <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />}
            </View>
            <View style={styles.statusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Online • Typically replies in {tutor.replyTime}</Text>
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
            {tutor.subjects.map((subName, idx) => {
              const isActive = selectedSubjectIdx === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setSelectedSubjectIdx(idx)}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{subName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.focusContainer}>
            <View style={styles.focusHeader}>
              <Ionicons name="create-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.focusLabel}>What would you like {(tutorProfile?.full_name || "Tutor").split(" ")[0]} to focus on?</Text>
            </View>
            <TextInput
              style={styles.focusInput}
              placeholder="e.g., Taylor series convergence tests & FRQ practice from homework problem set #4..."
              placeholderTextColor="#94A3B8"
              multiline
              value={focusText}
              onChangeText={setFocusText}
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
            {upcomingDates.map((d, idx) => {
              const isActive = selectedDateIdx === idx;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.datePill, isActive && styles.datePillActive]}
                  onPress={() => {
                    setSelectedDateIdx(idx);
                    setSelectedSlotIdx(0);
                  }}
                >
                  <Text style={[styles.dateDay, isActive && styles.dateTextActive]}>{d.day}</Text>
                  <Text style={[styles.dateNum, isActive && styles.dateTextActive]}>{d.date}</Text>
                  <Text style={[styles.dateMonth, isActive && styles.dateTextActive]}>{d.month}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Session Length */}
          <View style={styles.subSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.subTitle}>Session Length</Text>
              <Text style={styles.infoText}>Priced proportionally</Text>
            </View>
            <View style={styles.lengthRow}>
              {lengths.map((l, idx) => {
                const isActive = selectedLengthIdx === idx;
                return (
                  <View key={l.id} style={styles.lengthCol}>
                    {l.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAR</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.lengthPill, isActive && styles.pillActive]}
                      onPress={() => setSelectedLengthIdx(idx)}
                    >
                      <Text style={[styles.lengthTime, isActive && styles.pillTextActive]}>{l.time}</Text>
                      <Text style={[styles.lengthPrice, isActive && styles.pillTextActive]}>{l.price}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Time Slots */}
          <View style={styles.subSection}>
            <Text style={styles.slotsLabel}>Available Afternoon & Evening Slots</Text>
            <View style={styles.slotsGrid}>
              {activeSlots.map((slotTime, idx) => {
                const isActive = selectedSlotIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.slotBtn, isActive && styles.slotBtnActive]}
                    onPress={() => setSelectedSlotIdx(idx)}
                  >
                    {isActive && <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />}
                    <Text style={[styles.slotText, isActive && styles.pillTextActive]}>{slotTime}</Text>
                  </TouchableOpacity>
                );
              })}
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
                <Text style={styles.balanceText}>${(userProfile?.wallet_balance ?? 0).toFixed(2)} Available</Text>
              </View>
            </View>
            <View style={styles.autoPayBadge}>
              <View style={styles.greenDotSmall} />
              <Text style={styles.autoPayText}>Auto-Pay Active</Text>
            </View>
          </View>

          <View style={styles.feeBreakdown}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Session Fee ({selectedLengthObj.time} • {tutor.name})</Text>
              <Text style={styles.feeValue}>${numericPrice}.00</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Platform Service Fee <Ionicons name="information-circle-outline" size={12} color="#64748B" /></Text>
              <Text style={styles.feeFree}>$4.50 Free</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.feeRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>${numericPrice}.00</Text>
            </View>
            <View style={[styles.feeRow, { marginTop: 12 }]}>
              <Text style={styles.remainingLabel}>Remaining balance after booking:</Text>
              <Text style={styles.remainingValue}>${Math.max(0, (userProfile?.wallet_balance ?? 0) - numericPrice).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* --- GUARANTEE CARD --- */}
        <View style={styles.guaranteeCard}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" style={{ marginRight: 8 }} />
          <Text style={styles.guaranteeText}>Free cancellation up to 24 hours prior • 100% Guaranteed</Text>
        </View>

        {/* --- CONFIRM BUTTON --- */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          disabled={booking || walletLoading || !tutorProfile}
        >
          <Text style={styles.confirmBtnText}>
            {booking ? "Booking..." : `Confirm & Book Session • $${numericPrice.toFixed(2)} →`}
          </Text>
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
