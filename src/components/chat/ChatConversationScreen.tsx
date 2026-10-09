import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
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
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import {
  pickChatImage,
  pickChatDocument,
  uploadChatAttachment,
  uploadVoiceMessage,
  deleteFailedUpload,
  openAttachmentUrl,
  formatFileSize,
  PickedAttachment,
} from "../../lib/chatAttachments";
import { useVoiceRecorder, formatTimeSeconds } from "../../hooks/useVoiceRecorder";
import { VoiceMessage } from "./VoiceMessage";

interface Message {
  id: string;
  text?: string | null;
  sender: "me" | "other";
  time: string;
  type: "text" | "image" | "file" | "audio";
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  audioDuration?: number | null;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

function resolveAttachmentUrl(m: any): string | null {
  if (m.attachment_url && typeof m.attachment_url === "string" && m.attachment_url.trim()) {
    return m.attachment_url;
  }
  if (m.attachmentUrl && typeof m.attachmentUrl === "string" && m.attachmentUrl.trim()) {
    return m.attachmentUrl;
  }
  if (m.attachment_path && typeof m.attachment_path === "string" && m.attachment_path.trim()) {
    if (m.attachment_path.startsWith("http://") || m.attachment_path.startsWith("https://") || m.attachment_path.startsWith("blob:")) {
      return m.attachment_path;
    }
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(m.attachment_path);
    return data?.publicUrl || null;
  }
  if (m.content && typeof m.content === "string") {
    const trimmed = m.content.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
      return trimmed;
    }
  }
  return null;
}

function resolveMessageType(m: any, resolvedUrl: string | null): "text" | "image" | "file" | "audio" {
  const type = m.message_type || m.type;
  if (type === "audio" || type === "voice") return "audio";
  if (type === "image" || type === "photo") return "image";
  if (type === "file" || type === "document") return "file";

  const mime = m.attachment_mime_type || m.mime_type;
  if (mime?.startsWith("audio/")) return "audio";
  if (mime?.startsWith("image/")) return "image";
  if (mime) return "file";

  if (resolvedUrl) {
    if (resolvedUrl.match(/\.(m4a|mp3|webm|wav|ogg|aac)($|\?)/i)) return "audio";
    if (resolvedUrl.match(/\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i)) return "image";
    return "file";
  }

  return "text";
}

export function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId?: string;
    id?: string;
    otherUserId?: string;
    tutorId?: string;
  }>();
  const [activeConvId, setActiveConvId] = useState<string | null>(params.conversationId || params.id || null);
  const conversationId = activeConvId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Attachment states
  const [selectedAttachment, setSelectedAttachment] = useState<PickedAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Voice recording hook
  const {
    isRecording,
    recordingDuration,
    recordedUri,
    recordedDuration,
    isPlayingPreview,
    previewPosition,
    startRecording,
    stopRecording,
    cancelRecording,
    playPreview,
    pausePreview,
    discardRecording,
  } = useVoiceRecorder();

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    async function initChat() {
      if (!conversationId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // 1. Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }
        const uid = user.id;
        if (isMounted) setCurrentUserId(uid);

        // 2. Validate participant & get conversation details
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .maybeSingle();

        if (convError || !convData) {
          console.warn("Could not find conversation:", convError?.message);
          if (isMounted) setLoading(false);
          return;
        }

        const isStudent = convData.student_id === uid;
        const isTutor = convData.tutor_id === uid;
        const isAdmin = convData.admin_id === uid;

        if (!isStudent && !isTutor && !isAdmin) {
          // Check if current user is admin profile
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
          if (prof?.role !== "admin") {
            console.warn("User is not a participant in this conversation.");
            if (isMounted) setLoading(false);
            return;
          }
        }

        if (isMounted) {
          if (isTutor) setCurrentUserRole("tutor");
          else if (isAdmin) setCurrentUserRole("admin");
          else setCurrentUserRole("student");
        }

        const targetOtherUserId = isStudent
          ? convData.tutor_id
          : convData.student_id;

        // Fetch other user's public profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetOtherUserId)
          .maybeSingle();

        if (isMounted && profileData) {
          setOtherUser(profileData);
        }

        // 3. Mark unread messages sent by the other user as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", uid)
          .eq("is_read", false);

        // 4. Fetch historical messages ordered chronologically
        const { data: msgData } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (msgData && isMounted) {
          const mapped: Message[] = msgData.map((m: any) => {
            const url = resolveAttachmentUrl(m);
            const resolvedType = resolveMessageType(m, url);
            return {
              id: m.id,
              text: m.content,
              sender: m.sender_id === uid ? "me" : "other",
              time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              type: resolvedType,
              attachmentUrl: url,
              attachmentName: m.attachment_name,
              attachmentMimeType: m.attachment_mime_type,
              attachmentSize: m.attachment_size,
              audioDuration: m.audio_duration,
              fileName: m.attachment_name || (resolvedType === "audio" ? "Voice Note" : "Attachment"),
              fileSize: formatFileSize(m.attachment_size),
              fileType: m.attachment_mime_type ? m.attachment_mime_type.split("/")[1]?.toUpperCase() : (resolvedType === "audio" ? "AUDIO" : "FILE"),
            };
          });
          setMessages(mapped);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 150);
        }

        if (isMounted) setLoading(false);

        // 5. Subscribe to Realtime INSERT events for this conversation
        const channelName = `chat_${conversationId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              if (!isMounted) return;
              const newMsg = payload.new as any;

              // If incoming from other user, mark as read
              if (newMsg.sender_id !== uid) {
                supabase
                  .from("messages")
                  .update({ is_read: true })
                  .eq("id", newMsg.id)
                  .then();
              }

              const url = resolveAttachmentUrl(newMsg);
              const resolvedType = resolveMessageType(newMsg, url);

              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [
                  ...prev,
                  {
                    id: newMsg.id,
                    text: newMsg.content,
                    sender: newMsg.sender_id === uid ? "me" : "other",
                    time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    type: resolvedType,
                    attachmentUrl: url,
                    attachmentName: newMsg.attachment_name,
                    attachmentMimeType: newMsg.attachment_mime_type,
                    attachmentSize: newMsg.attachment_size,
                    audioDuration: newMsg.audio_duration,
                    fileName: newMsg.attachment_name || (resolvedType === "audio" ? "Voice Note" : "Attachment"),
                    fileSize: formatFileSize(newMsg.attachment_size),
                    fileType: newMsg.attachment_mime_type ? newMsg.attachment_mime_type.split("/")[1]?.toUpperCase() : (resolvedType === "audio" ? "AUDIO" : "FILE"),
                  },
                ];
              });
              setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Chat init error:", err);
        if (isMounted) setLoading(false);
      }
    }

    initChat();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  const handlePickImage = async () => {
    setShowAttachMenu(false);
    const result = await pickChatImage();
    if (result) {
      setSelectedAttachment(result);
    }
  };

  const handlePickDocument = async () => {
    setShowAttachMenu(false);
    const result = await pickChatDocument();
    if (result) {
      setSelectedAttachment(result);
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedAttachment(null);
  };

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if ((!textToSend && !selectedAttachment) || !currentUserId || !conversationId || uploading) return;

    // 1. If sending attachment
    if (selectedAttachment) {
      try {
        setUploading(true);
        const uploadResult = await uploadChatAttachment(selectedAttachment, conversationId, currentUserId);

        if (!uploadResult) {
          setUploading(false);
          return;
        }

        const { error: insertError } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: textToSend || null,
          message_type: selectedAttachment.type,
          attachment_url: uploadResult.url,
          attachment_name: uploadResult.name,
          attachment_mime_type: uploadResult.mimeType,
          attachment_size: uploadResult.size,
          is_read: false,
        });

        if (insertError) {
          console.error("Error inserting attachment message:", insertError);
          await deleteFailedUpload(uploadResult.path);
          Alert.alert("Error", "Could not send attachment message. Please try again.");
        } else {
          setInputText("");
          setSelectedAttachment(null);
        }
      } catch (err) {
        console.error("Failed to send attachment message:", err);
      } finally {
        setUploading(false);
      }
      return;
    }

    // 2. Text-only message
    setInputText("");

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: textToSend,
        message_type: "text",
        is_read: false,
      });

      if (error) {
        console.error("Error sending message:", error);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleSendVoiceNote = async () => {
    if (!recordedUri || !currentUserId || !conversationId || uploading) return;

    try {
      setUploading(true);
      const duration = recordedDuration || recordingDuration || 0;
      const uploadResult = await uploadVoiceMessage(recordedUri, conversationId, currentUserId, duration);

      if (!uploadResult) {
        setUploading(false);
        return;
      }

      let { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: null,
        message_type: "audio",
        attachment_url: uploadResult.url,
        attachment_name: uploadResult.name,
        attachment_mime_type: uploadResult.mimeType,
        attachment_size: uploadResult.size,
        audio_duration: duration,
        is_read: false,
      });

      // Graceful fallback if audio_duration column has not yet been migrated in Supabase
      if (insertError && (insertError.code === "PGRST204" || insertError.message?.includes("audio_duration"))) {
        console.warn("audio_duration column not yet found in Supabase schema, retrying message insert without it...");
        const retryResult = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: null,
          message_type: "audio",
          attachment_url: uploadResult.url,
          attachment_name: uploadResult.name,
          attachment_mime_type: uploadResult.mimeType,
          attachment_size: uploadResult.size,
          is_read: false,
        });
        insertError = retryResult.error;
      }

      if (insertError) {
        console.error("Error inserting audio message:", insertError);
        await deleteFailedUpload(uploadResult.path);
        Alert.alert("Error", "Could not send voice message. Please try again.");
      } else {
        discardRecording();
      }
    } catch (err) {
      console.error("Failed to send voice message:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  const handleVoiceCall = () => {
    const otherName = otherUser?.full_name || otherUser?.name || "this user";
    const phone = otherUser?.phone || otherUser?.phone_number;

    Alert.alert(
      "Voice Call via Third-Party App",
      `Voice calls with ${otherName} are connected through third-party communication apps. Would you like to connect now?`,
      [
        { text: "Cancel", style: "cancel" },
        ...(phone
          ? [
              {
                text: "Call Phone",
                onPress: () => {
                  void Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, "")}`).catch(() => {
                    Alert.alert("Error", "Could not launch phone app.");
                  });
                },
              },
              {
                text: "WhatsApp Call",
                onPress: () => {
                  const cleanPhone = phone.replace(/[^0-9]/g, "");
                  void Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {
                    Alert.alert("Error", "Could not open WhatsApp.");
                  });
                },
              },
            ]
          : [
              {
                text: "Open Google Meet",
                onPress: () => {
                  void Linking.openURL("https://meet.google.com/new").catch(() => {
                    Alert.alert("Error", "Could not open meeting link.");
                  });
                },
              },
            ]),
      ]
    );
  };

  const handleVideoCall = () => {
    const otherName = otherUser?.full_name || otherUser?.name || "this user";
    const meetingUrl = otherUser?.zoom_meeting_url || otherUser?.meeting_url || "https://meet.google.com/new";

    Alert.alert(
      "Video Session via Third-Party App",
      `Live 1-on-1 video sessions with ${otherName} take place in third-party video apps (Google Meet / Zoom). Would you like to launch the video room?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Launch Video Room",
          onPress: () => {
            void Linking.openURL(meetingUrl).catch(() => {
              Alert.alert("Error", "Could not open meeting room link.");
            });
          },
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    const otherName = otherUser?.full_name || otherUser?.name || "User";
    Alert.alert(
      otherName,
      "Select an action:",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Voice Call (Third-Party)", onPress: handleVoiceCall },
        { text: "Video Call (Third-Party)", onPress: handleVideoCall },
      ]
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      if (currentUserRole === "tutor") {
        router.replace("/(tutor)/TutorMessages");
      } else if (currentUserRole === "admin") {
        router.replace("/(admin)/dashboard");
      } else {
        router.replace("/(student)/MessagesInbox");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER BAR --- */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
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
          {/* --- TUTOR/STUDENT HEADER SECTION --- */}
          {otherUser && (
            <View style={styles.tutorHeader}>
              <View style={styles.tutorHeaderMain}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{
                      uri:
                        otherUser.avatar_url ||
                        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
                    }}
                    style={styles.headerAvatar}
                  />
                  <View style={styles.onlineBadge} />
                </View>
                <View style={styles.tutorInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.tutorName}>
                      {otherUser.full_name || otherUser.name || (otherUser.email ? otherUser.email.split("@")[0] : "User")}
                    </Text>
                    {otherUser.role === "tutor" && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#2563EB"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                  <View style={styles.statusRow}>
                    <View style={[styles.onlineBadgeSmall]} />
                    <Text style={styles.statusText}>Online</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.7}
                  onPress={handleVoiceCall}
                >
                  <Ionicons name="call-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.7}
                  onPress={handleVideoCall}
                >
                  <Ionicons name="videocam-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.7}
                  onPress={handleMoreOptions}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* --- DATE DIVIDER --- */}
          <View style={styles.dateDivider}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>
                {loading ? "Connecting..." : "Today"}
              </Text>
            </View>
          </View>

          {/* --- LOADING SPINNER --- */}
          {loading && (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          )}

          {/* --- MESSAGES --- */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.sender === "me" ? styles.studentRow : styles.tutorRow,
              ]}
            >
              {msg.sender === "other" && (
                <Image
                  source={{
                    uri:
                      otherUser?.avatar_url ||
                      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
                  }}
                  style={styles.messageAvatar}
                />
              )}
              <View style={styles.messageContent}>
                {/* 0. VOICE MESSAGE ATTACHMENT */}
                {msg.type === "audio" && (
                  msg.attachmentUrl ? (
                    <VoiceMessage
                      audioUrl={msg.attachmentUrl}
                      duration={msg.audioDuration}
                      isMe={msg.sender === "me"}
                    />
                  ) : (
                    <View
                      style={[
                        styles.messageBubble,
                        msg.sender === "me" ? styles.studentBubble : styles.tutorBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.sender === "me" ? styles.studentText : styles.tutorText,
                        ]}
                      >
                        🎤 Voice Message
                      </Text>
                    </View>
                  )
                )}

                {/* 1. FILE ATTACHMENT */}
                {msg.type === "file" && (
                  msg.attachmentUrl ? (
                    <TouchableOpacity
                      style={styles.fileCard}
                      activeOpacity={0.75}
                      onPress={() => openAttachmentUrl(msg.attachmentUrl || undefined, msg.fileName)}
                    >
                      <View style={styles.fileIconBg}>
                        <Ionicons
                          name={msg.fileName?.endsWith(".pdf") ? "document-text" : "document-attach"}
                          size={24}
                          color="#EF4444"
                        />
                      </View>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {msg.fileName}
                        </Text>
                        <Text style={styles.fileMeta}>
                          {msg.fileSize} • {msg.fileType}
                        </Text>
                      </View>
                      <View style={styles.fileDownloadBtn}>
                        <Ionicons name="download-outline" size={20} color="#2563EB" />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.messageBubble,
                        msg.sender === "me" ? styles.studentBubble : styles.tutorBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.sender === "me" ? styles.studentText : styles.tutorText,
                        ]}
                      >
                        📎 {msg.fileName || "File Attachment"}
                      </Text>
                    </View>
                  )
                )}

                {/* 2. IMAGE ATTACHMENT */}
                {msg.type === "image" && (
                  msg.attachmentUrl ? (
                    <TouchableOpacity
                      style={styles.imageCard}
                      activeOpacity={0.85}
                      onPress={() => setPreviewImageUrl(msg.attachmentUrl || null)}
                    >
                      <Image
                        source={{ uri: msg.attachmentUrl }}
                        style={styles.attachedImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.messageBubble,
                        msg.sender === "me" ? styles.studentBubble : styles.tutorBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.sender === "me" ? styles.studentText : styles.tutorText,
                        ]}
                      >
                        📷 Image
                      </Text>
                    </View>
                  )
                )}

                {/* 3. OPTIONAL TEXT CAPTION / REGULAR TEXT */}
                {Boolean(msg.text && msg.text.trim()) && (
                  <View
                    style={[
                      styles.messageBubble,
                      msg.sender === "me" ? styles.studentBubble : styles.tutorBubble,
                      (msg.type === "image" || msg.type === "file") && styles.captionBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.sender === "me" ? styles.studentText : styles.tutorText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.timeRow,
                    msg.sender === "me" ? styles.studentTimeRow : styles.tutorTimeRow,
                  ]}
                >
                  <Text style={styles.messageTime}>{msg.time}</Text>
                  {msg.sender === "me" && (
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color="#2563EB"
                      style={{ marginLeft: 4 }}
                    />
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
              onPress={() => handleQuickReply("Can we review problem 4 first?")}
            >
              <Ionicons
                name="bulb-outline"
                size={14}
                color="#64748B"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.quickReplyText}>Can we review problem 4 first?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickReplyChip}
              onPress={() => handleQuickReply("Got it, thank you!")}
            >
              <Ionicons
                name="thumbs-up-outline"
                size={14}
                color="#64748B"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.quickReplyText}>Got it, thank you!</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.keyboardBtn}>
            <Ionicons name="keypad-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* --- DRAFT ATTACHMENT PREVIEW --- */}
        {selectedAttachment && (
          <View style={styles.attachmentPreviewBar}>
            {selectedAttachment.type === "image" ? (
              <Image source={{ uri: selectedAttachment.uri }} style={styles.previewThumbnail} />
            ) : (
              <View style={styles.previewDocIconBg}>
                <Ionicons name="document-text" size={22} color="#2563EB" />
              </View>
            )}
            <View style={styles.previewInfoCol}>
              <Text style={styles.previewFileName} numberOfLines={1}>
                {selectedAttachment.name}
              </Text>
              <Text style={styles.previewFileSize}>
                {formatFileSize(selectedAttachment.size)} • Ready to send
              </Text>
            </View>
            {uploading ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginHorizontal: 8 }} />
            ) : (
              <TouchableOpacity style={styles.previewCancelBtn} onPress={handleRemoveAttachment}>
                <Ionicons name="close-circle" size={22} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* --- BOTTOM INPUT BAR --- */}
        <View style={styles.inputBar}>
          {isRecording ? (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingLeft}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTimer}>{formatTimeSeconds(recordingDuration)}</Text>
                <Text style={styles.recordingLabel}>Recording voice note...</Text>
              </View>
              <View style={styles.recordingActions}>
                <TouchableOpacity style={styles.recordingCancelBtn} onPress={cancelRecording}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.recordingStopBtn} onPress={stopRecording}>
                  <Ionicons name="stop" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : recordedUri ? (
            <View style={styles.previewContainer}>
              <TouchableOpacity
                style={styles.previewPlayBtn}
                onPress={isPlayingPreview ? pausePreview : playPreview}
              >
                <Ionicons name={isPlayingPreview ? "pause" : "play"} size={18} color="#2563EB" />
              </TouchableOpacity>
              <View style={styles.previewInfo}>
                <Text style={styles.previewDurationText}>
                  {formatTimeSeconds(isPlayingPreview ? previewPosition : recordedDuration)}
                </Text>
                <View style={styles.previewProgressBar}>
                  <View
                    style={[
                      styles.previewProgressFill,
                      {
                        width: `${
                          recordedDuration > 0
                            ? Math.min(100, ((previewPosition || 0) / recordedDuration) * 100)
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.previewDiscardBtn}
                onPress={discardRecording}
                disabled={uploading}
              >
                <Ionicons name="trash-outline" size={18} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendVoiceNote}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => setShowAttachMenu(true)}
                disabled={uploading}
              >
                <Ionicons name="add" size={24} color="#64748B" />
              </TouchableOpacity>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder={selectedAttachment ? "Add a caption (optional)..." : "Type a message..."}
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  editable={!uploading}
                />
                <TouchableOpacity style={styles.micBtn} onPress={startRecording} disabled={uploading}>
                  <Ionicons name="mic-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!inputText.trim() && !selectedAttachment) || uploading ? { opacity: 0.5 } : null,
                ]}
                onPress={handleSendMessage}
                disabled={(!inputText.trim() && !selectedAttachment) || uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* --- ATTACHMENT OPTIONS POPUP MODAL --- */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}
        >
          <View style={styles.attachMenuCard}>
            <Text style={styles.attachMenuTitle}>Share Attachment</Text>
            <Text style={styles.attachMenuSubtitle}>Select photos, images, or documents</Text>

            <View style={styles.attachOptionRow}>
              <TouchableOpacity
                style={styles.attachOptionItem}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <View style={[styles.attachOptionIconBg, { backgroundColor: "#EFF6FF" }]}>
                  <Ionicons name="image-outline" size={28} color="#2563EB" />
                </View>
                <Text style={styles.attachOptionText}>Photos & Images</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOptionItem}
                onPress={handlePickDocument}
                activeOpacity={0.7}
              >
                <View style={[styles.attachOptionIconBg, { backgroundColor: "#FEF2F2" }]}>
                  <Ionicons name="document-attach-outline" size={28} color="#DC2626" />
                </View>
                <Text style={styles.attachOptionText}>Documents & Files</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.attachCancelBtn}
              onPress={() => setShowAttachMenu(false)}
            >
              <Text style={styles.attachCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- FULLSCREEN IMAGE PREVIEW MODAL --- */}
      <Modal
        visible={Boolean(previewImageUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <View style={styles.imagePreviewModalBackdrop}>
          <TouchableOpacity
            style={styles.imagePreviewCloseBtn}
            onPress={() => setPreviewImageUrl(null)}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    alignSelf: "flex-start",
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
    maxWidth: "85%",
  },
  tutorRow: {
    alignSelf: "flex-start",
  },
  studentRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
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
  captionBubble: {
    marginTop: 4,
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
    justifyContent: "flex-start",
  },
  studentTimeRow: {
    justifyContent: "flex-end",
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
    borderColor: "#E2E8F0",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 220,
  },
  fileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
  fileDownloadBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    marginLeft: 8,
  },
  imageCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
    backgroundColor: "#F1F5F9",
  },
  attachedImage: {
    width: 220,
    height: 180,
    borderRadius: 16,
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
  attachmentPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderTopWidth: 1,
    borderTopColor: "#DBEAFE",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  previewDocIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  previewInfoCol: {
    flex: 1,
    marginLeft: 10,
  },
  previewFileName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  previewFileSize: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  previewCancelBtn: {
    padding: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
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
  /* --- VOICE RECORDING BAR --- */
  recordingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  recordingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
    marginRight: 10,
  },
  recordingLabel: {
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "500",
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordingCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingStopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  /* --- VOICE PREVIEW BAR --- */
  previewContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 24,
    paddingLeft: 8,
    paddingRight: 6,
    height: 48,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  previewPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  previewInfo: {
    flex: 1,
    marginRight: 10,
  },
  previewDurationText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  previewProgressBar: {
    height: 4,
    backgroundColor: "#BFDBFE",
    borderRadius: 2,
    overflow: "hidden",
  },
  previewProgressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 2,
  },
  previewDiscardBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  /* --- ATTACHMENT MODAL --- */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  attachMenuCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  attachMenuTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  attachMenuSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 20,
  },
  attachOptionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  attachOptionItem: {
    alignItems: "center",
    width: 120,
  },
  attachOptionIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  attachOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  attachCancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  attachCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
  /* --- FULLSCREEN IMAGE MODAL --- */
  imagePreviewModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewCloseBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
});
