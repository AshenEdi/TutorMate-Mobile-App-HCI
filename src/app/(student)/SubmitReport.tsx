import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
    Alert,
    Image,
    Modal,
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
const REPORT_CATEGORIES = ["Session Quality", "Tutor Behavior", "Technical Issues", "Billing Issue", "Other"];

export default function SubmitReportScreen() {
  const router = useRouter();
  const showMessage = useCallback(
    (title: string, message: string, onOk?: () => void) => {
      if (Platform.OS === "web") {
        window.alert(`${title}\n\n${message}`);
        onOk?.();
      } else {
        Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
      }
    },
    [],
  );
  const params = useLocalSearchParams<{
    tutorId?: string | string[];
    tutorName?: string | string[];
    bookingRef?: string | string[];
  }>();
  const tutorId = Array.isArray(params.tutorId) ? params.tutorId[0] : params.tutorId;
  const tutorNameParam = Array.isArray(params.tutorName)
    ? params.tutorName[0]
    : params.tutorName;
  const bookingRef = Array.isArray(params.bookingRef)
    ? params.bookingRef[0]
    : params.bookingRef;
  const [selectedCategory, setSelectedCategory] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [tutor, setTutor] = useState<{
    full_name: string | null;
    specialty: string | null;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReportContext() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (isMounted) {
            setSessionData(null);
            showMessage("Error", "Please sign in to view report details.");
          }
          return;
        }

        const tutorRequest = tutorId
          ? supabase
              .from("profiles")
              .select("full_name, specialty, avatar_url")
              .eq("id", tutorId)
              .single()
          : null;
        const bookingRequest = bookingRef
          ? supabase
              .from("bookings")
              .select("*")
              .eq("booking_ref", bookingRef)
              .eq("student_id", user.id)
              .single()
          : (() => {
              let query = supabase
                .from("bookings")
                .select("*")
                .eq("student_id", user.id);
              if (tutorId) query = query.eq("tutor_id", tutorId);
              return query
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            })();

        const [tutorResult, bookingResult] = await Promise.all([
          tutorRequest,
          bookingRequest,
        ]);
        if (tutorResult?.error) throw tutorResult.error;
        if (bookingResult.error) throw bookingResult.error;

        if (isMounted) {
          if (tutorResult?.data) setTutor(tutorResult.data);
          setSessionData(bookingResult.data);
        }
      } catch (error) {
        console.error("Failed to load report context:", error);
        showMessage("Error", "Unable to load tutor or session details.");
      }
    }

    void loadReportContext();
    return () => {
      isMounted = false;
    };
  }, [bookingRef, showMessage, tutorId]);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      showMessage("Error", "Please select a category");
      return;
    }
    if (feedback.trim().length < 10) {
      showMessage("Error", "Feedback must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        showMessage("Error", "Please sign in to submit a report.");
        return;
      }

      const { error } = await supabase.from("reports").insert({
        student_id: user.id,
        tutor_id: tutorId || sessionData?.tutor_id || null,
        category: selectedCategory,
        rating,
        feedback: feedback.trim(),
      });
      if (error) {
        showMessage("Error", error.message);
        return;
      }

      const reviewTutorId = tutorId || sessionData?.tutor_id;
      if (reviewTutorId) {
        try {
          const { error: reviewError } = await supabase.from("reviews").insert({
            tutor_id: reviewTutorId,
            student_id: user.id,
            rating,
            comment: feedback.trim(),
          });
          if (reviewError) {
            console.error("Failed to save review:", reviewError);
          }
        } catch (reviewError) {
          console.error("Failed to save review:", reviewError);
        }
      }

      showMessage(
        "Thank You!",
        "Thank you for your review and feedback!",
        () => router.back(),
      );
    } catch (error) {
      console.error("Failed to submit report:", error);
      showMessage("Error", error instanceof Error ? error.message : "Unable to submit your report.");
    } finally {
      setSubmitting(false);
    }
  };

  const sessionDate = sessionData?.session_date
    ? new Date(`${sessionData.session_date}T00:00:00`).toLocaleDateString()
    : "—";
  const sessionTime = [sessionDate, sessionData?.time_slot || "—"].join(", ");
  const displayedTutorName =
    sessionData?.tutor_name || tutor?.full_name || tutorNameParam || "Tutor";
  const displayedBookingRef = sessionData?.booking_ref || bookingRef || "—";
  const displayedSubject =
    sessionData?.subject || tutor?.specialty || "General";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER BAR --- */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report & Feedback</Text>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push("/(student)/StudentProfile")}
        >
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- SESSION REFERENCE CARD --- */}
        <View style={styles.card}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionRefLabel}>
              SESSION REF <Text style={styles.sessionRefValue}>{displayedBookingRef}</Text>
            </Text>
            <View style={styles.completedBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.completedBadgeText}>{sessionData?.status || "Session"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.tutorRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: tutor?.avatar_url || DEFAULT_AVATAR }}
                style={styles.avatar}
              />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{displayedTutorName}</Text>
              <Text style={styles.tutorSubject}>{displayedSubject}</Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.timeText}>{sessionTime}</Text>
              </View>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {sessionData?.duration != null ? `${sessionData.duration}m` : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* --- CATEGORY SELECTION --- */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Select Category or Topic <Text style={styles.asterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedCategory || "Choose issue or feedback topic..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* --- OVERALL RATING CARD --- */}
        <View style={styles.card}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingLabel}>Overall Rating</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>{rating}.0 • {rating === 5 ? "Excellent" : "Rated"}</Text>
            </View>
          </View>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name="star"
                  size={36}
                  color={star <= rating ? "#F59E0B" : "#E2E8F0"}
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.starsSubtitle}>Tap a star to adjust your score</Text>
        </View>

        {/* --- DETAILED FEEDBACK & NOTES SECTION --- */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Detailed Feedback & Notes</Text>
            <Text style={styles.minCharsText}>Min. 10 chars</Text>
          </View>
          <TextInput
            style={styles.multilineInput}
            placeholder="Describe your session highlights, concepts covered, or any issues you encountered in detail..."
            placeholderTextColor="#94A3B8"
            multiline
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
          />
        </View>

        {/* --- ATTACH EVIDENCE SECTION --- */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Attach Evidence or Screenshots (optional)</Text>
          <TouchableOpacity style={styles.uploadBox}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.uploadTitle}>Add screenshot or document</Text>
            <Text style={styles.uploadSubtitle}>PNG, JPG or PDF up to 10MB</Text>
          </TouchableOpacity>
        </View>

        {/* --- SUBMIT BUTTON --- */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>
            {submitting ? "Submitting..." : "Submit Report & Feedback →"}
          </Text>
        </TouchableOpacity>

        {/* --- FOOTER TEXT --- */}
        <View style={styles.footerRow}>
          <Ionicons name="heart-outline" size={16} color="#10B981" />
          <Text style={styles.footerText}>Your feedback helps improve TutorMate for everyone</Text>
        </View>
      </ScrollView>

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
          }}
        >
          <View style={styles.card}>
            {REPORT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.dropdownInput}
                onPress={() => {
                  setSelectedCategory(category);
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={styles.dropdownText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionRefLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  sessionRefValue: {
    color: "#1E293B",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
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
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  tutorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineDot: {
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
    flex: 1,
  },
  tutorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  tutorSubject: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  durationBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  asterisk: {
    color: "#2563EB",
  },
  dropdownInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: "#64748B",
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  ratingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  starIcon: {
    marginHorizontal: 8,
  },
  starsSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  minCharsText: {
    fontSize: 12,
    color: "#64748B",
  },
  multilineInput: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 120,
  },
  uploadBox: {
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderWidth: 2,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  checkboxText: {
    fontSize: 13,
    color: "#0F172A",
    flex: 1,
  },
  anonymousGray: {
    color: "#64748B",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 28,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6,
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
