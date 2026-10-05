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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// --- MOCK DATA ---
const CONVERSATIONS = [
  {
    id: "1",
    name: "Dr. Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    verified: true,
    online: true,
    time: "10:42 AM",
    subject: "AP Calculus BC",
    status: "Session in 3h",
    lastMessage: "I shared the practice exam PDF....",
    unread: 2,
    hasAttachment: true,
  },
  {
    id: "2",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    verified: true,
    online: true,
    time: "Yesterday",
    subject: "Organic Chemistry",
    lastMessage: "Great progress with nucleophilic...",
    unread: 1,
    isStarred: true,
  },
  {
    id: "3",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    verified: true,
    online: true,
    time: "Mar 12",
    subject: "Physics Mechanics",
    lastMessage: "Thanks for confirming tomorrow's...",
    isRead: true,
    hasClock: true,
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    verified: true,
    online: true,
    time: "Mar 10",
    subject: "Linear Algebra",
    lastMessage: "You aced the eigenvalues quiz! Ta...",
    isRead: true,
  },
  {
    id: "5",
    name: "Midterm Prep Pod",
    isGroup: true,
    time: "Mar 8",
    subject: "Study Group • 5 members",
    lastMessage: "Chloe: Who wants to hop on a sh...",
    isRead: true,
  },
];

const QUICK_CONNECT = [
  { id: "1", name: "Dr. Sarah", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" },
  { id: "2", name: "Marcus", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
  { id: "3", name: "Elena", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop" },
  { id: "4", name: "David K.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
];

export default function MessagesInboxScreen() {
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
            <Text style={styles.brandTitle}>Messages Inbox</Text>
          </View>
        </View>

        <TouchableOpacity 
        style={styles.bellBtn}
        onPress={() => router.push("/notification")}
      >
          <Ionicons name="notifications-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* --- SEARCH BAR --- */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages or tutors..."
              placeholderTextColor="#94A3B8"
            />
          </View>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => router.push("/(student)/NewMessage")}
          >
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* --- FILTER TABS --- */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
            <Text style={[styles.filterTabText, styles.filterTabTextActive]}>All (5)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterTabText}>Unread (2)</Text>
            <View style={styles.unreadDotSmall} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.filterTabText}>Active Tutors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Ionicons name="archive-outline" size={16} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.filterTabText}>Archived</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- QUICK CONNECT --- */}
        <View style={styles.sectionHeader}>
          <View style={styles.quickConnectTitle}>
            <View style={styles.greenDot} />
            <Text style={styles.sectionTitle}>Quick Connect</Text>
          </View>
          <Text style={styles.sectionSubtitle}>4 online now</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickConnectScroll}>
          {QUICK_CONNECT.map((tutor) => (
            <View key={tutor.id} style={styles.quickTutor}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: tutor.avatar }} style={styles.quickAvatar} />
                <View style={styles.onlineBadge} />
              </View>
              <Text style={styles.quickName} numberOfLines={1}>{tutor.name}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.quickTutor}>
            <View style={styles.newRoomBtn}>
              <Ionicons name="person-add-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.quickName}>New Room</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- RECENT CONVERSATIONS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>RECENT CONVERSATIONS</Text>
          <TouchableOpacity>
            <Text style={styles.markReadLink}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.conversationsList}>
          {CONVERSATIONS.map((conv) => (
            <TouchableOpacity 
              key={conv.id} 
              style={styles.conversationCard}
              onPress={() => router.push("/(student)/ChatConversation")}
            >
              <View style={styles.convAvatarWrapper}>
                {conv.isGroup ? (
                  <View style={styles.groupIconBg}>
                    <Ionicons name="calculator-outline" size={24} color="#2563EB" />
                  </View>
                ) : (
                  <Image source={{ uri: conv.avatar }} style={styles.convAvatar} />
                )}
                {conv.online && <View style={styles.onlineBadge} />}
                {!conv.online && conv.isGroup && <View style={[styles.onlineBadge, { backgroundColor: '#CBD5E1' }]} />}
              </View>

              <View style={styles.convContent}>
                <View style={styles.convTopRow}>
                  <View style={styles.nameVerifiedRow}>
                    <Text style={styles.convName}>{conv.name}</Text>
                    {conv.verified && <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />}
                  </View>
                  <Text style={styles.convTime}>{conv.time}</Text>
                </View>

                <View style={styles.tagStatusRow}>
                  <View style={styles.subjectTag}>
                    <Text style={styles.subjectTagText}>{conv.subject}</Text>
                  </View>
                  {conv.status && (
                    <Text style={styles.statusText}>• {conv.status}</Text>
                  )}
                </View>

                <View style={styles.lastMessageRow}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {conv.isRead ? '✓✓ ' : ''}{conv.lastMessage}
                  </Text>
                  <View style={styles.convActions}>
                    {conv.unread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{conv.unread}</Text>
                      </View>
                    )}
                    {conv.hasAttachment && <Ionicons name="attach-outline" size={18} color="#2563EB" />}
                    {conv.isStarred && <Ionicons name="star-outline" size={18} color="#94A3B8" />}
                    {conv.hasClock && <Ionicons name="time-outline" size={18} color="#94A3B8" />}
                    {!conv.unread && !conv.hasAttachment && !conv.isStarred && !conv.hasClock && (
                      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- TUTORMATE TIP --- */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconBg}>
            <Ionicons name="bulb-outline" size={24} color="#2563EB" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>TutorMate Tip</Text>
            <Text style={styles.tipBody}>
              Sending your homework questions 2 hours ahead helps tutors personalize your session notes!
            </Text>
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
          <Ionicons name="chatbox" size={22} color="#2563EB" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Messages</Text>
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
    paddingBottom: 100,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
  },
  composeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterTabs: {
    marginBottom: 20,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  filterTabActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  unreadDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quickConnectTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
  },
  quickConnectScroll: {
    marginBottom: 24,
  },
  quickTutor: {
    alignItems: "center",
    marginRight: 20,
    width: 60,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  quickAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  quickName: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  newRoomBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  markReadLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  conversationsList: {
    marginBottom: 20,
  },
  conversationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  convAvatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  convAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupIconBg: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  convContent: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nameVerifiedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  convName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  convTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
  tagStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectTag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  subjectTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  statusText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "600",
  },
  lastMessageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
    marginRight: 8,
  },
  convActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadBadge: {
    backgroundColor: "#2563EB",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  tipIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
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
