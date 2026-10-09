import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StudentHeader } from "../../components/StudentHeader";
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
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

export default function MessagesInboxScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [quickTutors, setQuickTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "active">("all");

  const fetchInbox = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch user's conversations
      const { data: convs, error: convsError } = await supabase
        .from("conversations")
        .select("*")
        .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (convsError) {
        console.warn("[MessagesInbox] Error fetching conversations:", convsError.message);
      }

      if (!convs || convs.length === 0) {
        setConversations([]);
      } else {
        // Find other participants
        const otherUserIds = convs.map((c: any) =>
          c.student_id === user.id ? c.tutor_id : c.student_id
        ).filter(Boolean);

        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", otherUserIds);

        const profileMap: Record<string, any> = {};
        profiles?.forEach((p: any) => { profileMap[p.id] = p; });

        // Fetch unread counts (where user is NOT the sender)
        const { data: unreadCounts } = await supabase
          .from("messages")
          .select("conversation_id")
          .eq("is_read", false)
          .neq("sender_id", user.id)
          .in("conversation_id", convs.map((c: any) => c.id));

        const unreadMap: Record<string, number> = {};
        unreadCounts?.forEach((m: any) => {
          unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
        });

        const mapped = convs.map((c: any) => {
          const otherId = c.student_id === user.id ? c.tutor_id : c.student_id;
          const otherProf = profileMap[otherId] || {};
          const displayName = otherProf.full_name || otherProf.name || (otherProf.email ? otherProf.email.split('@')[0] : "Tutor");
          const unreadCount = unreadMap[c.id] || 0;

          return {
            id: c.id,
            tutorId: otherId,
            name: displayName,
            avatar: otherProf.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
            verified: true,
            online: true,
            time: c.updated_at
              ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "",
            subject: otherProf.specialty || (Array.isArray(otherProf.subjects) ? otherProf.subjects.join(', ') : otherProf.subjects) || "Tutoring Session",
            lastMessage: c.last_message || "Started a conversation...",
            unread: unreadCount,
          };
        });

        setConversations(mapped);
      }

      // Fetch directory tutors for Quick Connect
      const { data: dbTutors } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .eq("role", "tutor")
        .neq("id", user.id)
        .limit(10);

      if (dbTutors && dbTutors.length > 0) {
        setQuickTutors(
          dbTutors.map((p: any) => ({
            id: p.id,
            name: p.full_name || "Tutor",
            avatar: p.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to fetch inbox:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchInbox();

    const channelName = `student_inbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const convChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          if (isMounted) fetchInbox();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(convChannel);
    };
  }, [fetchInbox]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInbox();
  };

  const handleMarkAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || conversations.length === 0) return;
      const convIds = conversations.map((c) => c.id);
      await supabase
        .from("messages")
        .update({ is_read: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      setConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
    } catch (e) {
      console.warn("Failed to mark all read:", e);
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);

  const filteredConversations = conversations.filter((c) => {
    if (activeFilter === "unread") return c.unread > 0;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER BAR --- */}
      <StudentHeader title="Messages" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
      >
        {/* --- SEARCH BAR --- */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages or tutors..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => router.push("/(student)/NewMessage")}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* --- FILTER TABS --- */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === "all" && styles.filterTabActive]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[styles.filterTabText, activeFilter === "all" && styles.filterTabTextActive]}>
              All ({conversations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === "unread" && styles.filterTabActive]}
            onPress={() => setActiveFilter("unread")}
          >
            <Text style={[styles.filterTabText, activeFilter === "unread" && styles.filterTabTextActive]}>
              Unread ({totalUnread})
            </Text>
            {totalUnread > 0 && <View style={styles.unreadDotSmall} />}
          </TouchableOpacity>
        </ScrollView>

        {/* --- QUICK CONNECT --- */}
        {quickTutors.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.quickConnectTitle}>
                <View style={styles.greenDot} />
                <Text style={styles.sectionTitle}>Quick Connect</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Verified Tutors</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickConnectScroll}>
              {quickTutors.map((tutor) => (
                <TouchableOpacity
                  key={tutor.id}
                  style={styles.quickTutor}
                  onPress={() => router.push("/(student)/NewMessage")}
                >
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: tutor.avatar }} style={styles.quickAvatar} />
                    <View style={styles.onlineBadge} />
                  </View>
                  <Text style={styles.quickName} numberOfLines={1}>{tutor.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.quickTutor}
                onPress={() => router.push("/(student)/NewMessage")}
              >
                <View style={styles.newRoomBtn}>
                  <Ionicons name="person-add-outline" size={24} color="#2563EB" />
                </View>
                <Text style={styles.quickName}>New Chat</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

        {/* --- RECENT CONVERSATIONS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>RECENT CONVERSATIONS</Text>
          {totalUnread > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markReadLink}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{ marginTop: 12, color: "#64748B", fontSize: 13 }}>
              Loading messages...
            </Text>
          </View>
        ) : filteredConversations.length > 0 ? (
          <View style={styles.conversationsList}>
            {filteredConversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={styles.conversationCard}
                onPress={() => router.push({
                  pathname: "/(student)/ChatConversation",
                  params: {
                    conversationId: conv.id,
                    otherUserId: conv.tutorId,
                    tutorId: conv.tutorId,
                  },
                })}
              >
                <View style={styles.convAvatarWrapper}>
                  <Image source={{ uri: conv.avatar }} style={styles.convAvatar} />
                  {conv.online && <View style={styles.onlineBadge} />}
                </View>

                <View style={styles.convContent}>
                  <View style={styles.convTopRow}>
                    <View style={styles.nameVerifiedRow}>
                      <Text style={styles.convName}>{conv.name}</Text>
                      {conv.verified && (
                        <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={styles.convTime}>{conv.time}</Text>
                  </View>

                  <View style={styles.tagStatusRow}>
                    {conv.subject ? (
                      <View style={styles.subjectOutlineRow}>
                        <View style={styles.subjectOutlineDot} />
                        <Text style={styles.subjectTagText} numberOfLines={1}>{conv.subject}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.lastMessageRow}>
                    <Text
                      style={[
                        styles.lastMessage,
                        conv.unread > 0 && { color: "#0F172A", fontWeight: "700" },
                      ]}
                      numberOfLines={1}
                    >
                      {conv.lastMessage}
                    </Text>
                    <View style={styles.convActions}>
                      {conv.unread > 0 ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadCount}>{conv.unread > 99 ? "99+" : conv.unread}</Text>
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ paddingVertical: 40, alignItems: "center", paddingHorizontal: 20 }}>
            <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#334155", marginTop: 12 }}>
              No messages found
            </Text>
            <Text style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", marginTop: 6, lineHeight: 18 }}>
              {searchQuery
                ? `No conversations matching "${searchQuery}"`
                : "When you book a session or message a tutor, your conversations will show up here."}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: "#2563EB",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
              }}
              onPress={() => router.push("/(student)/searchscreen")}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
                Find a Tutor
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
    backgroundColor: "#EF4444",
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
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  quickConnectScroll: {
    marginBottom: 24,
  },
  quickTutor: {
    alignItems: "center",
    marginRight: 16,
    width: 60,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  quickAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E2E8F0",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  quickName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
  newRoomBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderStyle: "dashed",
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  markReadLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  conversationsList: {
    marginBottom: 20,
  },
  conversationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  convAvatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  convContent: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
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
    marginBottom: 4,
  },
  subjectOutlineRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  subjectOutlineDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    marginRight: 8,
  },
  subjectTagText: {
    flex: 1,
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
  },
  lastMessageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
    marginRight: 8,
  },
  convActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  tipIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
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
