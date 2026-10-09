import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { supabase } from "../../../lib/supabase";
import { TutorBottomNav } from "../../components/TutorBottomNav";
import { TutorHeader } from "../../components/TutorHeader";
import { getOrCreateConversation } from "../../lib/chat";

interface ActiveSessionUser {
  id: string;
  studentId?: string;
  name: string;
  time: string;
  avatar: string;
  isOnline?: boolean;
}

// --- MAIN SCREEN ---
export default function TutorMessagesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (user) {
        setCurrentUserId(user.id);
      }

      // 1. Fetch today's booked sessions for this tutor
      const now = new Date();
      const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      let dbSessions: any[] = [];
      try {
        const { data: bData } = await supabase
          .from("bookings")
          .select("*")
          .eq("tutor_id", user.id)
          .neq("status", "cancelled");

        if (bData && bData.length > 0) {
          const todayRows = bData.filter((b: any) => {
            const bDate = b.session_date || b.date;
            return bDate === todayYMD;
          });
          dbSessions = todayRows.length > 0 ? todayRows : bData.slice(0, 8);
        }
      } catch (bErr) {
        console.warn("Could not query bookings from DB:", bErr);
      }

      // Check AsyncStorage local bookings as backup
      try {
        const localStr = await AsyncStorage.getItem(
          "@tutormate_booked_sessions",
        );
        if (localStr) {
          const localList = JSON.parse(localStr);
          const tutorLocal = localList.filter(
            (b: any) =>
              (b.tutorId === user.id || !b.tutorId) &&
              (b.date === todayYMD || !b.date),
          );
          if (tutorLocal.length > 0) {
            tutorLocal.forEach((lb: any) => {
              if (
                !dbSessions.some(
                  (ds) =>
                    ds.id === lb.id ||
                    (ds.student_id === lb.studentId &&
                      ds.time_slot === lb.timeSlot),
                )
              ) {
                dbSessions.push(lb);
              }
            });
          }
        }
      } catch {}

      // Fetch student profiles for these session bookings
      const bookingStudentIds = dbSessions
        .map((s: any) => s.student_id || s.studentId)
        .filter((id: any) => id && id.length > 10);

      const sessionProfileMap: Record<string, any> = {};
      if (bookingStudentIds.length > 0) {
        const { data: sProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", bookingStudentIds);
        sProfiles?.forEach((p: any) => {
          sessionProfileMap[p.id] = p;
        });
      }

      const mappedSessions: ActiveSessionUser[] = dbSessions.map(
        (s: any, idx: number) => {
          const sId = s.student_id || s.studentId;
          const prof = (sId && sessionProfileMap[sId]) || {};
          const studentName =
            prof.full_name ||
            prof.name ||
            s.student_name ||
            s.studentName ||
            (prof.email ? prof.email.split("@")[0] : `Student ${idx + 1}`);
          const avatar =
            prof.avatar_url ||
            s.student_avatar ||
            s.avatarUrl ||
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop";
          const timeSlot = s.time_slot || s.timeSlot || s.time || "3:00 PM";
          const shortTime = timeSlot.includes("–")
            ? timeSlot.split("–")[0].trim()
            : timeSlot.includes("-")
              ? timeSlot.split("-")[0].trim()
              : timeSlot;

          return {
            id: s.id || `sess_${idx}`,
            studentId: sId,
            name: studentName,
            time: shortTime,
            avatar: avatar,
            isOnline: true,
          };
        },
      );

      setActiveSessions(mappedSessions);

      // 2. Fetch tutor's conversations
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .eq("tutor_id", user.id)
        .order("updated_at", { ascending: false });

      if (!convs || convs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch student profiles
      const studentIds = convs.map((c: any) => c.student_id);
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", studentIds);

      if (profError) {
        console.warn(
          "[TutorMessages] Error fetching profiles:",
          profError.message,
        );
      }

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => {
        profileMap[p.id] = p;
      });

      // Fetch unread counts (where user is NOT the sender)
      const { data: unreadCounts } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("is_read", false)
        .neq("sender_id", user.id)
        .in(
          "conversation_id",
          convs.map((c: any) => c.id),
        );

      const unreadMap: Record<string, number> = {};
      unreadCounts?.forEach((m: any) => {
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
      });

      const mapped = convs.map((c: any) => {
        const student = profileMap[c.student_id] || {};
        const studentName =
          student.full_name ||
          student.name ||
          (student.email ? student.email.split("@")[0] : "Student");
        const unreadCount = unreadMap[c.id] || 0;

        return {
          id: c.id,
          studentId: c.student_id,
          name: studentName,
          gradeSubject:
            student.specialty ||
            (Array.isArray(student.subjects)
              ? student.subjects.join(", ")
              : student.subjects) ||
            "Student",
          avatar:
            student.avatar_url ||
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop",
          time: new Date(c.updated_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isOnline: true,
          message: c.last_message || "Started a conversation...",
          unreadCount: unreadCount,
        };
      });

      setConversations(mapped);
      setLoading(false);
    } catch (err) {
      console.warn("Failed to fetch tutor inbox:", err);
      setLoading(false);
    }
  }, []);

  const handleOpenStudentSession = async (sessionUser: ActiveSessionUser) => {
    if (!sessionUser.studentId || !currentUserId) return;
    try {
      const convId = await getOrCreateConversation(
        sessionUser.studentId,
        currentUserId,
      );
      if (convId) {
        router.push({
          pathname: "/(tutor)/ChatConversation" as any,
          params: { conversationId: convId },
        });
      }
    } catch (err) {
      console.warn("Error starting chat with session student:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isMounted) {
        await fetchInbox();
      }
    }

    loadData();

    // Subscribe to conversations changes to auto-update inbox
    const channelName = `tutor_inbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const convChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          if (isMounted) fetchInbox();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(convChannel);
    };
  }, [fetchInbox]);

  const handleMarkAllRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || conversations.length === 0) return;
      const convIds = conversations.map((c) => c.id);
      await supabase
        .from("messages")
        .update({ is_read: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
    } catch (e) {
      console.warn("Failed to mark all read:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- BRAND TOP NAVBAR --- */}
      <TutorHeader title="Messages" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- SEARCH BAR WITH VOICE & FILTER --- */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#2563EB"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student messages, subjects..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.micButton}>
              <Feather name="mic" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- ACTIVE SESSIONS TODAY --- */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color="#2563EB"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.sectionTitle}>Active Sessions Today</Text>
          </View>
          <Text style={styles.bookedText}>{activeSessions.length} Booked</Text>
        </View>

        {activeSessions.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeSessionsContainer}
          >
            {activeSessions.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.sessionUserCard}
                activeOpacity={0.8}
                onPress={() => handleOpenStudentSession(user)}
              >
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.sessionAvatar}
                  />
                  {user.isOnline && <View style={styles.onlineDot} />}
                </View>
                <Text style={styles.sessionUserName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.sessionUserTime}>{user.time}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noSessionsContainer}>
            <Text style={styles.noSessionsText}>
              No active sessions scheduled for today
            </Text>
          </View>
        )}

        {/* --- RECENT MESSAGES --- */}
        <View style={styles.sectionHeaderBetween}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>
            {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) >
              0 && (
              <View style={styles.sectionUnreadPill}>
                <Text style={styles.sectionUnreadText}>
                  {conversations.reduce(
                    (sum, c) => sum + (c.unreadCount || 0),
                    0,
                  )}{" "}
                  new
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={handleMarkAllRead}
          >
            <Text style={styles.markReadText}>Mark all read</Text>
            <Ionicons
              name="checkmark-done"
              size={14}
              color="#2563EB"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        {/* MESSAGES LIST */}
        {loading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        )}
        {!loading && conversations.length === 0 && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#94A3B8" }}>No messages yet.</Text>
          </View>
        )}
        {conversations
          .filter(
            (c) =>
              !searchQuery.trim() ||
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.message.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((msg) => (
            <TouchableOpacity
              key={msg.id}
              style={[
                styles.messageCard,
                msg.unreadCount > 0 && styles.unreadMessageCard,
              ]}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/(tutor)/ChatConversation" as any,
                  params: { conversationId: msg.id },
                })
              }
            >
              {/* Header: User Info & Time */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrapper}>
                  {msg.avatar ? (
                    <Image
                      source={{ uri: msg.avatar }}
                      style={styles.msgAvatar}
                    />
                  ) : (
                    <View style={styles.initialsAvatar}>
                      <Text style={styles.initialsText}>{msg.initials}</Text>
                    </View>
                  )}
                  {msg.isOnline && <View style={styles.onlineDotMsg} />}
                </View>

                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.userName,
                      msg.unreadCount > 0 && styles.unreadUserName,
                    ]}
                  >
                    {msg.name}
                  </Text>
                  <Text style={styles.userGrade}>{msg.gradeSubject}</Text>
                </View>

                <View style={styles.timeContainer}>
                  <View style={styles.timeRow}>
                    {msg.isReadByOther && (
                      <Ionicons
                        name="checkmark-done"
                        size={14}
                        color="#2563EB"
                        style={{ marginRight: 2 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.timeText,
                        msg.unreadCount > 0 && styles.unreadTimeText,
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                  {msg.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {msg.unreadCount > 99 ? "99+" : msg.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Message Body */}
              <Text
                style={[
                  styles.messageText,
                  msg.unreadCount > 0 && styles.unreadMessageText,
                ]}
                numberOfLines={2}
              >
                {msg.message}
              </Text>

              {/* Attachment Badge */}
              {msg.attachmentBadge && (
                <View style={styles.attachmentPill}>
                  <Ionicons
                    name={msg.attachmentBadge.icon as any}
                    size={14}
                    color="#2563EB"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.attachmentText}>
                    {msg.attachmentBadge.text}
                  </Text>
                </View>
              )}

              {/* Tag Pill for Prospective Student */}
              {msg.tagPill && (
                <View style={styles.tagPill}>
                  <Ionicons
                    name={msg.tagPill.icon as any}
                    size={12}
                    color="#475569"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.tagPillText}>{msg.tagPill.text}</Text>
                </View>
              )}

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                {/* Left Side Pill / Time */}
                {msg.statusPill ? (
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: msg.statusPill.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={msg.statusPill.icon as any}
                      size={12}
                      color={msg.statusPill.textColor}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: msg.statusPill.textColor },
                      ]}
                    >
                      {msg.statusPill.text}
                    </Text>
                  </View>
                ) : msg.scheduledTime ? (
                  <View style={styles.scheduledPill}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color="#64748B"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.scheduledText}>
                      {msg.scheduledTime}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}

                {/* Right Side Actions / Unread Badges */}
                {msg.unreadCount ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{msg.unreadCount}</Text>
                  </View>
                ) : msg.actionButton?.type === "link" ? (
                  <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkButtonText}>
                      {msg.actionButton.label}
                    </Text>
                  </TouchableOpacity>
                ) : msg.actionButton?.type === "primary" ? (
                  <TouchableOpacity style={styles.primaryReplyBtn}>
                    <Text style={styles.primaryReplyText}>
                      {msg.actionButton.label}
                    </Text>
                  </TouchableOpacity>
                ) : msg.footerLabel ? (
                  <Text style={styles.footerLabelText}>{msg.footerLabel}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* --- REUSABLE BOTTOM NAVBAR --- */}
      <TutorBottomNav activeTab="messages" />
    </SafeAreaView>
  );
}

// --- STYLES ---
const navStyles = StyleSheet.create({
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
  iconWrapper: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  tabLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#0256D0",
    fontWeight: "700",
  },
});

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
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  micButton: {
    padding: 4,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  bookedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  activeSessionsContainer: {
    paddingBottom: 16,
  },
  sessionUserCard: {
    alignItems: "center",
    marginRight: 16,
    width: 64,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  sessionAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  onlineDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0D9488",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sessionUserName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  sessionUserTime: {
    fontSize: 11,
    color: "#2563EB",
    marginTop: 1,
  },
  noSessionsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
    alignItems: "center",
  },
  noSessionsText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  unreadMessageCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadUserName: {
    fontWeight: "800",
    color: "#0F172A",
  },
  unreadTimeText: {
    color: "#2563EB",
    fontWeight: "700",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  unreadMessageText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  sectionUnreadPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  sectionUnreadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  msgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  initialsAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#9A3412",
  },
  onlineDotMsg: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0D9488",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  userGrade: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  messageText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    marginBottom: 10,
  },
  attachmentPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scheduledPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scheduledText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  primaryReplyBtn: {
    backgroundColor: "#0256D0",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
  },
  primaryReplyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerLabelText: {
    fontSize: 11,
    color: "#64748B",
  },
});
