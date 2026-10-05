import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
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
  KeyboardAvoidingView,
} from "react-native";

interface Message {
  id: string;
  text?: string;
  sender: "tutor" | "student";
  time: string;
  type: "text" | "file";
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    text: "Hi Alex! Looking forward to our session on Saturday. Have you had a chance to work through the series convergence problem set?",
    sender: "tutor",
    time: "10:30 AM",
    type: "text",
  },
  {
    id: "2",
    text: "Hi Dr. Jenkins! Yes, I got stuck on the Ratio Test and polar coordinates on questions 4 and 6.",
    sender: "student",
    time: "10:34 AM",
    type: "text",
  },
  {
    id: "3",
    fileName: "polar_series_cheat_sheet.pdf",
    fileSize: "1.8 MB",
    fileType: "PDF",
    sender: "tutor",
    time: "10:37 AM",
    type: "file",
    text: "Take a look at page 2, this formula makes the convergence test much easier!",
  },
  {
    id: "4",
    text: "Awesome, downloading now! See you at 3 PM on Zoom.",
    sender: "student",
    time: "10:39 AM",
    type: "text",
  },
];

export default function ChatConversationScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "student",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text",
    };

    setMessages([...messages, newMessage]);
    setInputText("");
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* --- TUTOR HEADER SECTION --- */}
          <View style={styles.tutorHeader}>
            <View style={styles.tutorHeaderMain}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" }}
                  style={styles.headerAvatar}
                />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.tutorInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.tutorName}>Dr. Sarah Jenkins</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.onlineBadgeSmall]} />
                  <Text style={styles.statusText}>Online • Typically replies in 5m</Text>
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

          {/* --- NEXT SESSION CARD --- */}
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionIconBg}>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.sessionTitleCol}>
                <View style={styles.sessionTagRow}>
                  <Text style={styles.nextSessionTag}>NEXT SESSION</Text>
                  <Text style={styles.subjectTag}>• AP Calculus BC</Text>
                </View>
                <Text style={styles.sessionTime}>Saturday, Mar 18 • 3:00 PM</Text>
              </View>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>Confirmed</Text>
              </View>
            </View>
            <View style={styles.sessionActions}>
              <TouchableOpacity style={styles.rescheduleBtn}>
                <Text style={styles.rescheduleText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailsBtn}>
                <Text style={styles.detailsText}>Session Details →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- DATE DIVIDER --- */}
          <View style={styles.dateDivider}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>Today, March 15</Text>
            </View>
          </View>

          {/* --- MESSAGES --- */}
          {messages.map((msg) => (
            <View key={msg.id} style={[
              styles.messageRow,
              msg.sender === "student" ? styles.studentRow : styles.tutorRow
            ]}>
              {msg.sender === "tutor" && (
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" }}
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
                  <View style={[
                    styles.messageBubble,
                    msg.sender === "student" ? styles.studentBubble : styles.tutorBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      msg.sender === "student" ? styles.studentText : styles.tutorText
                    ]}>
                      {msg.text}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.timeRow,
                  msg.sender === "student" ? styles.studentTimeRow : styles.tutorTimeRow
                ]}>
                  <Text style={styles.messageTime}>{msg.time}</Text>
                  {msg.sender === "student" && (
                    <Ionicons name="checkmark-done" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* --- TYPING INDICATOR --- */}
          <View style={styles.typingRow}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" }}
              style={styles.messageAvatar}
            />
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Dr. Sarah is typing <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>•••</Text></Text>
            </View>
          </View>
        </ScrollView>

        {/* --- QUICK REPLY CHIPS --- */}
        <View style={styles.quickReplyContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyScroll}>
            <TouchableOpacity style={styles.quickReplyChip}>
              <Ionicons name="bulb-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.quickReplyText}>Can we review problem 4 first?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickReplyChip}>
              <Ionicons name="thumbs-up-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.quickReplyText}>Got it, thank you!</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.keyboardBtn}>
            <Ionicons name="keypad-outline" size={20} color="#64748B" />
          </TouchableOpacity>
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
            <TouchableOpacity style={styles.micBtn}>
              <Ionicons name="mic-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
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
