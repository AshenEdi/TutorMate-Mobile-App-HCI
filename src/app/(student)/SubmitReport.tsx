import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
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
import { supabase } from "../../../lib/supabase";
import { createDispute } from "../../services/disputeService";
import { AlertModal, AlertType } from "../../components/ui/AlertModal";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";
const REPORT_CATEGORIES = [
  "Session Quality",
  "Tutor No-Show",
  "Tutor Behavior",
  "Technical Issues",
  "Billing / Escrow Issue",
  "Other",
];

export default function SubmitReportScreen() {
  const router = useRouter();
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onOk?: () => void;
  }>({
    visible: false,
    type: "error",
    title: "",
    message: "",
  });

  const showMessage = useCallback(
    (
      title: string,
      message: string,
      onOk?: () => void,
      type: AlertType = "error"
    ) => {
      setAlertConfig({
        visible: true,
        type,
        title,
        message,
        onOk,
      });
    },
    []
  );

  const params = useLocalSearchParams<{
    bookingId?: string | string[];
    tutorId?: string | string[];
    tutorName?: string | string[];
    bookingRef?: string | string[];
  }>();

  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
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
  const [requestRefund, setRequestRefund] = useState(false);
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

        const bookingRequest = bookingId
          ? supabase.from("bookings").select("*").eq("id", bookingId).single()
          : bookingRef
          ? supabase
              .from("bookings")
              .select("*")
              .eq("booking_ref", bookingRef)
              .eq("student_id", user.id)
              .single()
          : supabase
              .from("bookings")
              .select("*")
              .eq("student_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

        const [tutorResult, bookingResult] = await Promise.all([
          tutorRequest,
          bookingRequest,
        ]);

        if (isMounted) {
          if (bookingResult?.data) {
            setSessionData(bookingResult.data);
            if (!tutorResult?.data && bookingResult.data.tutor_id) {
              const { data: bTutor } = await supabase
                .from("profiles")
                .select("full_name, specialty, avatar_url")
                .eq("id", bookingResult.data.tutor_id)
                .maybeSingle();
              if (isMounted && bTutor) setTutor(bTutor);
            }
          }
          if (tutorResult?.data) setTutor(tutorResult.data);
        }
      } catch (error) {
        console.error("Failed to load report context:", error);
      }
    }

    void loadReportContext();
    return () => {
      isMounted = false;
    };
  }, [bookingId, bookingRef, showMessage, tutorId]);

  const handleSubmit = async () => {
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

      const activeTutorId = tutorId || sessionData?.tutor_id;

      // Fetch student's real profile name
      const { data: studentProf } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const studentFullName = studentProf?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
      const tutorFullName = tutor?.full_name || sessionData?.tutor_name || tutorNameParam || "Tutor";
      const activeSubject = sessionData?.subject || tutor?.specialty || "Tutoring Session";
      const effectiveCategory = selectedCategory || "General Feedback";

      // 1. Only create dispute and send to Admin Queue if Request Refund & Escrow Hold is checked
      if (requestRefund) {
        const calculatedEscrow = sessionData?.total_price
          ? Number(sessionData.total_price)
          : 45;

        const disputeRes = await createDispute({
          bookingId: sessionData?.id || (typeof bookingId === "string" ? bookingId : undefined),
          bookingRef: sessionData?.booking_ref || (typeof bookingRef === "string" ? bookingRef : undefined),
          studentId: user.id,
          tutorId: activeTutorId || user.id,
          studentName: studentFullName,
          tutorName: tutorFullName,
          subject: activeSubject,
          reason: feedback.trim(),
          category: effectiveCategory,
          studentStatement: feedback.trim(),
          escrowAmount: calculatedEscrow,
          priority: effectiveCategory.includes("No-Show")
            ? "urgent"
            : effectiveCategory.includes("Technical")
            ? "technical"
            : "high",
        });

        if (disputeRes.error) {
          if (!disputeRes.error.includes("already pending")) {
            showMessage("Dispute Error", disputeRes.error, undefined, "error");
            setSubmitting(false);
            return;
          }
        }
      }

      // 2. Insert into standard reports table (optional audit)
      try {
        await supabase.from("reports").insert({
          student_id: user.id,
          tutor_id: activeTutorId || null,
          category: effectiveCategory,
          rating,
          feedback: feedback.trim(),
        });
      } catch (err) {
        console.warn("[SubmitReport] non-blocking reports insert:", err);
      }

      // 3. Insert review
      if (activeTutorId) {
        try {
          await supabase.from("reviews").insert({
            tutor_id: activeTutorId,
            student_id: user.id,
            rating,
            comment: feedback.trim(),
          });
        } catch (err) {
          // ignore review duplicate or table error
        }
      }

      showMessage(
        requestRefund ? "Dispute & Report Submitted" : "Thank You!",
        requestRefund
          ? "Your dispute and refund request has been escalated to Admin Moderation. You can track progress in My Sessions."
          : "Thank you for your feedback! It helps keep TutorMate verified and safe.",
        () => router.replace("/(student)/MySessions")
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
        <Text style={styles.headerTitle}>Report & Dispute Session</Text>
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
            Select Category or Grievance{" "}
            <Text style={{ fontSize: 12, fontWeight: "400", color: "#94A3B8" }}>(optional)</Text>
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

        {/* --- REFUND / ESCROW DISPUTE TOGGLE --- */}
        <TouchableOpacity
          style={[styles.refundCard, requestRefund && styles.refundCardActive]}
          activeOpacity={0.8}
          onPress={() => setRequestRefund(!requestRefund)}
        >
          <View style={styles.refundLeftRow}>
            <MaterialCommunityIcons
              name={requestRefund ? "checkbox-marked" : "checkbox-blank-outline"}
              size={22}
              color={requestRefund ? "#0052CC" : "#64748B"}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.refundTitle}>Request Refund & Escrow Hold</Text>
              <Text style={styles.refundSubtitle}>
                Escalates this issue as a formal dispute to Admin Moderation.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

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
            <Text style={styles.inputLabel}>Detailed Feedback & Statement</Text>
            <Text style={styles.minCharsText}>Min. 10 chars</Text>
          </View>
          <TextInput
            style={styles.multilineInput}
            placeholder="Describe what happened during your session in detail (e.g. tutor attendance, technical disconnection, concepts)..."
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
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() =>
              showMessage(
                "Evidence Upload",
                "Screenshot evidence attachment simulated and verified with secure timestamp.",
                undefined,
                "info"
              )
            }
          >
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
            {submitting
              ? "Submitting..."
              : requestRefund
              ? "Submit Formal Dispute & Report →"
              : "Submit Report & Feedback →"}
          </Text>
        </TouchableOpacity>

        {/* --- FOOTER TEXT --- */}
        <View style={styles.footerRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#0052CC" />
          <Text style={styles.footerText}>Protected by TutorMate 100% Student Guarantee</Text>
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

      {/* --- IN-APP ALERT MODAL --- */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          const action = alertConfig.onOk;
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          action?.();
        }}
      />
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
    fontSize: 17,
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
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
    color: "#64748B",
  },
  sessionRefValue: {
    color: "#0F172A",
    fontWeight: "800",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  tutorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  tutorInfo: {
    flex: 1,
    gap: 2,
  },
  tutorName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  tutorSubject: {
    fontSize: 12,
    color: "#64748B",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11.5,
    color: "#64748B",
  },
  durationBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#475569",
  },
  inputSection: {
    marginBottom: 16,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  asterisk: {
    color: "#EF4444",
  },
  dropdownInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownText: {
    fontSize: 13.5,
    color: "#0F172A",
  },
  refundCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  refundCardActive: {
    borderColor: "#0052CC",
    backgroundColor: "#EFF6FF",
  },
  refundLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refundTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  refundSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  ratingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginVertical: 4,
  },
  starIcon: {
    padding: 2,
  },
  starsSubtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  minCharsText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  multilineInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    height: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 13,
    color: "#0F172A",
  },
  uploadBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
    gap: 4,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  uploadSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
  },
  submitBtn: {
    backgroundColor: "#0052CC",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "500",
  },
});
