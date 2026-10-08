import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
import { useAuth } from "../../context/AuthContext";
import {
  ChatMessageItem,
  formatChatTime,
  getConversationMessages,
  getOrCreateConversation,
  markConversationAsRead,
  sendChatMessage,
} from "../../services/chatService";
import { inspectMessageSafety, logModerationFlag } from "../../services/moderationService";

interface DisplayMessage {
  id: string;
  text?: string;
  sender: "tutor" | "student";
  time: string;
  type: "text" | "file";
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

export default function ChatConversationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    id?: string;
    tutorId?: string;
    name?: string;
    avatar?: string;
    subject?: string;
  }>();

  const [activeConvId, setActiveConvId] = useState<string | null>(params.id || null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tutorDetails, setTutorDetails] = useState<{
    id: string;
    name: string;
    avatar: string;
    subject: string;
  }>({
    id: params.tutorId || "",
    name: params.name || "Tutor",
    avatar:
      params.avatar ||
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    subject: params.subject || "Tutoring",
  });
  const [upcomingSession, setUpcomingSession] = useState<any>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize or fetch conversation ID & tutor info
  useEffect(() => {
    let isMounted = true;

    async function initConversation() {
      try {
        let convId = params.id;
        let tutorId = params.tutorId;

        // If no convId passed, try to find or create one with tutorId
        if (!convId && tutorId && user?.id) {
          convId = (await getOrCreateConversation(user.id, tutorId)) || undefined;
          if (isMounted && convId) {
            setActiveConvId(convId);
          }
        }

        // If convId exists but tutorId is missing, fetch from conversations table
        if (convId && !tutorId) {
          const { data: convRow } = await supabase
            .from("conversations")
            .select("tutor_id")
            .eq("id", convId)
            .single();

          if (convRow?.tutor_id) {
            tutorId = convRow.tutor_id;
          }
        }

        // Fetch tutor profile details
        if (tutorId) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, specialty, education")
            .eq("id", tutorId)
            .single();

          if (isMounted && prof) {
            setTutorDetails({
              id: prof.id,
              name: prof.full_name || params.name || "Tutor",
              avatar:
                prof.avatar_url ||
                params.avatar ||
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
              subject: prof.specialty || prof.education || params.subject || "Tutoring",
            });
          }

          // Check upcoming booking with this tutor
          if (user?.id) {
            const { data: booking } = await supabase
              .from("bookings")
              .select("*")
              .eq("student_id", user.id)
              .eq("tutor_id", tutorId)
              .in("status", ["confirmed", "accepted"])
              .order("session_date", { ascending: true })
              .limit(1)
              .maybeSingle();

            if (isMounted && booking) {
              setUpcomingSession(booking);
            }
          }
        }

        if (isMounted && convId) {
          setActiveConvId(convId);
        }
      } catch (err) {
        console.warn("Error initializing chat:", err);
      }
    }

    initConversation();

    return () => {
      isMounted = false;
    };
  }, [params.id, params.tutorId, user?.id]);

  // Load messages and poll for incoming tutor messages
  useEffect(() => {
    if (!activeConvId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchMessages() {
      if (!activeConvId) return;
      const raw = await getConversationMessages(activeConvId);
      if (!isMounted) return;

      const formatted: DisplayMessage[] = raw.map((m) => {
        const isFromStudent = m.sender_id === user?.id;
        return {
          id: m.id,
          text: m.content,
          sender: isFromStudent ? "student" : "tutor",
          time: formatChatTime(m.created_at),
          type: m.attachment_url ? "file" : "text",
          fileName: m.attachment_name || "Attachment",
          fileSize: "1.2 MB",
          fileType: "PDF",
        };
      });

      setMessages(formatted);
      setLoading(false);

      if (user?.id) {
        void markConversationAsRead(activeConvId, user.id);
      }
    }

    fetchMessages();

    // Poll every 3 seconds to pick up new tutor messages in real-time
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeConvId, user?.id]);

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !user?.id || !activeConvId || sending) return;

    const safety = inspectMessageSafety(textToSend);
    if (safety.flagged) {
      setSafetyWarning(
        "For your security, keep communication and payments within TutorMate to protect your 100% Student Guarantee."
      );

      void logModerationFlag({
        flaggedUserId: user.id,
        flaggedUserName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
        subject: "Safety Filter: Payment / Contact Bypass",
        flagType: "payment_bypass",
        messageContent: textToSend,
        calloutDescription: safety.calloutDescription || "Off-platform contact info detected in chat.",
        priority: "high",
      });
    } else {
      setSafetyWarning(null);
    }

    setSending(true);
    setInputText("");

    // Optimistically add to UI
    const optimisticMsg: DisplayMessage = {
      id: `temp-${Date.now()}`,
      text: textToSend,
      sender: "student",
      time: "Just now",
      type: "text",
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await sendChatMessage({
        conversationId: activeConvId,
        senderId: user.id,
        content: textToSend,
        recipientId: tutorDetails.id || undefined,
      });

      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? {
                  ...m,
                  id: res.data!.id,
                  time: formatChatTime(res.data!.created_at),
                }
              : m
          )
        );
      }
    } catch (err) {
      console.warn("Error sending message:", err);
    } finally {
      setSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
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
          <Text style={styles.headerTitle}>Chat Conversation</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {safetyWarning ? (
        <View
          style={{
            backgroundColor: "#FFFBEB",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#FDE68A",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="alert-circle" size={18} color="#D97706" />
          <Text style={{ fontSize: 11.5, color: "#92400E", flex: 1, lineHeight: 16 }}>
            {safetyWarning}
          </Text>
          <TouchableOpacity onPress={() => setSafetyWarning(null)}>
            <Ionicons name="close" size={16} color="#92400E" />
          </TouchableOpacity>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* --- TUTOR HEADER SECTION --- */}
          <View style={styles.tutorHeader}>
            <View style={styles.tutorHeaderMain}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: tutorDetails.avatar }}
                  style={styles.headerAvatar}
                />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.tutorInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.tutorName}>{tutorDetails.name}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.onlineBadgeSmall]} />
                  <Text style={styles.statusText}>{tutorDetails.subject} • Active</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="call-outline" size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="videocam-outline" size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- NEXT SESSION CARD (if booked) --- */}
          {upcomingSession && (
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionIconBg}>
                  <Ionicons name="calendar" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.sessionTitleCol}>
                  <View style={styles.sessionTagRow}>
                    <Text style={styles.nextSessionTag}>UPCOMING SESSION</Text>
                    <Text style={styles.subjectTag}>• {upcomingSession.subject || tutorDetails.subject}</Text>
                  </View>
                  <Text style={styles.sessionTime}>
                    {upcomingSession.session_date} • {upcomingSession.time_slot || "60 min"}
                  </Text>
                </View>
                <View style={styles.confirmedBadge}>
                  <Text style={styles.confirmedText}>Confirmed</Text>
                </View>
              </View>
              <View style={styles.sessionActions}>
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() => router.push("/(student)/MySessions")}
                >
                  <Text style={styles.rescheduleText}>View Sessions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* --- DATE DIVIDER --- */}
          <View style={styles.dateDivider}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>Chat Stream</Text>
            </View>
          </View>

          {/* --- LOADING INDICATOR --- */}
          {loading && (
            <View style={{ paddingVertical: 30, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={{ marginTop: 8, fontSize: 12, color: "#64748B" }}>
                Loading conversation...
              </Text>
            </View>
          )}

          {/* --- MESSAGES EMPTY --- */}
          {!loading && messages.length === 0 && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color="#CBD5E1" />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#64748B", marginTop: 8 }}>
                No messages yet
              </Text>
              <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                Say hello to {tutorDetails.name} to start your lesson!
              </Text>
            </View>
          )}

          {/* --- MESSAGES LIST --- */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.sender === "student" ? styles.studentRow : styles.tutorRow,
              ]}
            >
              {msg.sender === "tutor" && (
                <Image
                  source={{ uri: tutorDetails.avatar }}
                  style={styles.messageAvatar}
                />
              )}
              <View style={styles.messageContent}>
                {msg.type === "file" && (
                  <View style={styles.fileCard}>
                    <View style={styles.fileIconBg}>
                      <Ionicons name="document-text" size={24} color="#EF4444" />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{msg.fileName}</Text>
                      <Text style={styles.fileMeta}>{msg.fileSize} • {msg.fileType}</Text>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="download-outline" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                )}
                {msg.text && (
                  <View
                    style={[
                      styles.messageBubble,
                      msg.sender === "student" ? styles.studentBubble : styles.tutorBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.sender === "student" ? styles.studentText : styles.tutorText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.timeRow,
                    msg.sender === "student" ? styles.studentTimeRow : styles.tutorTimeRow,
                  ]}
                >
                  <Text style={styles.messageTime}>{msg.time}</Text>
                  {msg.sender === "student" && (
                    <Ionicons name="checkmark-done" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* --- QUICK REPLY CHIPS --- */}
        <View style={styles.quickReplyContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickReplyScroll}
          >
            <TouchableOpacity
              style={styles.quickReplyChip}
              onPress={() => setInputText("Hi! Can we review the homework questions?")}
            >
              <Ionicons name="bulb-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.quickReplyText}>Can we review the homework questions?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickReplyChip}
              onPress={() => setInputText("Got it, thank you!")}
            >
              <Ionicons name="thumbs-up-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.quickReplyText}>Got it, thank you!</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* --- BOTTOM INPUT BAR --- */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, (!inputText.trim() || sending) && { opacity: 0.5 }]} 
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  tutorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  tutorHeaderMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  headerAvatar: {
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
  onlineBadgeSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
  },
  headerActions: {
    flexDirection: "row",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sessionCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sessionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  sessionTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  nextSessionTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
  },
  subjectTag: {
    fontSize: 10,
    color: "#64748B",
    marginLeft: 4,
  },
  sessionTime: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  confirmedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confirmedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  sessionActions: {
    flexDirection: "row",
    gap: 10,
  },
  rescheduleBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  rescheduleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  detailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dateDivider: {
    alignItems: "center",
    marginBottom: 20,
  },
  datePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 20,
    maxWidth: '85%',
  },
  tutorRow: {
    alignSelf: 'flex-start',
  },
  studentRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 4,
  },
  messageContent: {
    marginHorizontal: 10,
    flexShrink: 1,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  tutorBubble: {
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 4,
  },
  studentBubble: {
    backgroundColor: "#2563EB",
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tutorText: {
    color: "#1E293B",
  },
  studentText: {
    color: "#FFFFFF",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  tutorTimeRow: {
    justifyContent: 'flex-start',
  },
  studentTimeRow: {
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 10,
    color: "#94A3B8",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 8,
  },
  fileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  fileMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  typingBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  typingText: {
    fontSize: 12,
    color: "#64748B",
  },
  quickReplyContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  quickReplyScroll: {
    paddingHorizontal: 20,
  },
  quickReplyChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  quickReplyText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  keyboardBtn: {
    paddingHorizontal: 16,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    maxHeight: 100,
  },
  micBtn: {
    marginLeft: 8,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
});
