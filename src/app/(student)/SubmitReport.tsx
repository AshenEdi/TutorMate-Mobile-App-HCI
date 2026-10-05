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
const SESSION_REF = "#TM-84092";
const TUTOR_NAME = "Dr. Sarah Jenkins";
const TUTOR_SUBJECT = "AP Calculus & Algebra";
const SESSION_TIME = "Yesterday, 3:00 PM – 4:00 PM";
const TUTOR_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

export default function SubmitReportScreen() {
  const router = useRouter();
  const [urgentFollowUp, setUrgentFollowUp] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    Alert.alert(
      "Report Submitted",
      "Thank you. Our support team will respond within 24 business hours.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

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
              SESSION REF <Text style={styles.sessionRefValue}>{SESSION_REF}</Text>
            </Text>
            <View style={styles.completedBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.tutorRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: TUTOR_AVATAR }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{TUTOR_NAME}</Text>
              <Text style={styles.tutorSubject}>{TUTOR_SUBJECT}</Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.timeText}>{SESSION_TIME}</Text>
              </View>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>1 hr</Text>
            </View>
          </View>
        </View>

        {/* --- CATEGORY SELECTION --- */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Select Category or Topic <Text style={styles.asterisk}>*</Text>
          </Text>
          <TouchableOpacity style={styles.dropdownInput}>
            <Text style={styles.dropdownText}>Choose issue or feedback topic...</Text>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* --- OVERALL RATING CARD --- */}
        <View style={styles.card}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingLabel}>Overall Rating</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>5.0 • Excellent</Text>
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

        {/* --- CHECKBOX OPTIONS --- */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setUrgentFollowUp(!urgentFollowUp)}
          >
            <View style={[styles.checkbox, urgentFollowUp && styles.checkboxActive]}>
              {urgentFollowUp && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxText}>Request urgent follow-up from TutorMate support team</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAnonymous(!anonymous)}
          >
            <View style={[styles.checkbox, anonymous && styles.checkboxActive]}>
              {anonymous && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxText}>
              Submit anonymously <Text style={styles.anonymousGray}>(hide student identity from tutor)</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- SUBMIT BUTTON --- */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Report & Feedback →</Text>
        </TouchableOpacity>

        {/* --- FOOTER TEXT --- */}
        <View style={styles.footerRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
          <Text style={styles.footerText}>TutorMate Support • Response within 24 business hours</Text>
        </View>
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
