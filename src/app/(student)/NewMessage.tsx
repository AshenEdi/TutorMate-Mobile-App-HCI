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
const SUGGESTED_MENTORS = [
  {
    id: "1",
    name: "Dr. Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    verified: true,
    online: true,
    info: "AP Calculus • Last session Mar 12",
  },
  {
    id: "2",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    online: true,
    info: "Organic Chemistry",
    badge: "1 Upcoming",
  },
  {
    id: "3",
    name: "Dr. Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    online: true,
    info: "AP Physics C • Available today",
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    online: false,
    orangeDot: true,
    info: "Coding & Python • Active 2h ago",
  },
];

export default function NewMessageScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    Alert.alert("Message Sent", "", [{ text: "OK", onPress: () => router.back() }]);
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
            <Ionicons name="book" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>New Message</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* --- DRAFT STATUS --- */}
        <View style={styles.draftRow}>
          <View style={styles.draftInfo}>
            <View style={styles.draftIconBg}>
              <Ionicons name="create-outline" size={18} color="#0D9488" />
            </View>
            <Text style={styles.draftText}>Drafting new thread</Text>
          </View>
          <TouchableOpacity onPress={handleSend}>
            <Text style={styles.sendBtnText}>Send ➤</Text>
          </TouchableOpacity>
        </View>

        {/* --- RECIPIENT SECTION --- */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Text style={styles.toLabel}>To:</Text>
              <TextInput
                style={styles.toInput}
                placeholder="Search mentor or student name..."
                placeholderTextColor="#94A3B8"
              />
              <Ionicons name="person-add-outline" size={20} color="#2563EB" />
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.subjectRow}>
            <Ionicons name="bookmark-outline" size={20} color="#64748B" />
            <Text style={styles.subjectPlaceholder}>Link a Subject or Session (Optional)</Text>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* --- SUGGESTED MENTORS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SUGGESTED & RECENT MENTORS</Text>
          <TouchableOpacity>
            <Text style={styles.availableLink}>4 available</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mentorList}>
          {SUGGESTED_MENTORS.map((mentor) => (
            <View key={mentor.id} style={styles.mentorCard}>
              <View style={styles.mentorAvatarWrapper}>
                <Image source={{ uri: mentor.avatar }} style={styles.mentorAvatar} />
                {mentor.online && <View style={styles.onlineBadge} />}
                {mentor.orangeDot && <View style={[styles.onlineBadge, { backgroundColor: '#F59E0B' }]} />}
              </View>
              <View style={styles.mentorInfo}>
                <View style={styles.mentorNameRow}>
                  <Text style={styles.mentorName}>{mentor.name}</Text>
                  {mentor.verified && <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />}
                </View>
                <View style={styles.mentorDetailRow}>
                  <Text style={styles.mentorDetail} numberOfLines={1}>{mentor.info}</Text>
                  {mentor.badge && (
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingBadgeText}>{mentor.badge}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.addMentorBtn}>
                <Ionicons name="add" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* --- MESSAGE BODY --- */}
        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <View style={styles.messageTitleRow}>
              <Ionicons name="chatbubble-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.messageTitle}>Message Body</Text>
            </View>
            <Text style={styles.charCount}>{message.length} / 500</Text>
          </View>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Write your message to your mentor or student... E.g. ask about session prep, homework assignments, or upcoming schedule flexibility."
            placeholderTextColor="#94A3B8"
            multiline
            value={message}
            onChangeText={setMessage}
            maxLength={500}
          />

          <View style={styles.messageActions}>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.actionIconBtn}>
                <Ionicons name="attach-outline" size={22} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconBtn}>
                <Ionicons name="camera-outline" size={22} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.proposeTimeBtn}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.proposeTimeText}>Propose Time</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setMessage("")}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- PROTOCOL CARD --- */}
        <View style={styles.protocolCard}>
          <View style={styles.protocolHeader}>
            <View style={styles.shieldIconBg}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#0D9488" />
            </View>
            <View style={styles.protocolTitleRow}>
              <Text style={styles.protocolTitle}>Safe Messaging Protocol</Text>
              <View style={[styles.greenDot, { marginLeft: 6 }]} />
            </View>
          </View>
          <Text style={styles.protocolBody}>
            Keep communications and payments within TutorMate to stay fully protected by our Academic Guarantee and instant mentor verification.
          </Text>
        </View>

        {/* --- START CONVERSATION --- */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.startBtn} onPress={handleSend}>
            <Text style={styles.startBtnText}>Start Conversation →</Text>
          </TouchableOpacity>
          <View style={styles.responseTimeRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.responseTimeText}>Typical response time: under 15 minutes</Text>
          </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  draftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  draftInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  draftIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  draftText: {
    fontSize: 14,
    color: "#64748B",
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563EB",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  inputGroup: {
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
  },
  toLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563EB",
    marginRight: 10,
  },
  toInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
  },
  subjectPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#64748B",
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  availableLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  mentorList: {
    marginBottom: 24,
  },
  mentorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  mentorAvatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  mentorInfo: {
    flex: 1,
  },
  mentorNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mentorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  mentorDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  mentorDetail: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  upcomingBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  addMentorBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  messageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  charCount: {
    fontSize: 12,
    color: "#94A3B8",
  },
  messageInput: {
    fontSize: 14,
    color: "#1E293B",
    height: 120,
    textAlignVertical: "top",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconBtn: {
    marginRight: 16,
  },
  proposeTimeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  proposeTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  protocolCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  protocolHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  shieldIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  protocolTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  protocolTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  protocolBody: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  bottomActions: {
    marginBottom: 20,
  },
  startBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  responseTimeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  responseTimeText: {
    fontSize: 12,
    color: "#64748B",
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
