import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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
    ActivityIndicator,
} from "react-native";

import { supabase } from "../../../lib/supabase";
import { getOrCreateConversation } from "../../lib/chat";
import {
  pickChatImage,
  pickChatDocument,
  uploadChatAttachment,
  formatFileSize,
  PickedAttachment,
} from "../../lib/chatAttachments";

export default function NewMessageScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [draftAttachment, setDraftAttachment] = useState<PickedAttachment | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMentors() {
      try {
        setLoading(true);

        // 1. Get current logged-in auth user
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // 2. Fetch all profiles from Supabase
        const { data: dbProfiles, error: dbError } = await supabase
          .from('profiles')
          .select('*');

        if (dbError) {
          console.warn("[NewMessage] Supabase profiles note:", dbError.message);
        }

        // 3. Check for locally cached / AsyncStorage profile
        let savedEditProfile: any = null;
        let savedProfile: any = null;
        try {
          const editStr = await AsyncStorage.getItem('@tutormate_tutor_edit_profile');
          if (editStr) savedEditProfile = JSON.parse(editStr);
          const profStr = await AsyncStorage.getItem('@tutormate_tutor_profile');
          if (profStr) savedProfile = JSON.parse(profStr);
        } catch {}

        const rawList = dbProfiles || [];

        // 4. Collect all tutors (role is tutor, case-insensitive, including verified, pending, unverified)
        let tutorList = rawList.filter((p: any) => {
          if (p.role && p.role.toLowerCase() === 'tutor') return true;
          if (p.specialty || p.hourly_rate || p.education || p.degree) return true;
          return false;
        });

        // If no explicit 'tutor' role found in DB yet, show non-student profiles
        if (tutorList.length === 0 && rawList.length > 0) {
          tutorList = rawList.filter((p: any) => p.role?.toLowerCase() !== 'student');
          if (tutorList.length === 0) {
            tutorList = rawList;
          }
        }

        // 5. Exclude the current authenticated student from their own tutor list
        if (currentUser) {
          tutorList = tutorList.filter((p: any) => p.id !== currentUser.id);
        }

        if (isMounted) {
          setMentors(tutorList);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to fetch tutors for NewMessage:", err);
        if (isMounted) setLoading(false);
      }
    }

    fetchMentors();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePickImage = async () => {
    const result = await pickChatImage();
    if (result) setDraftAttachment(result);
  };

  const handlePickDocument = async () => {
    const result = await pickChatDocument();
    if (result) setDraftAttachment(result);
  };

  const handleSend = async () => {
    if (sending) return;
    if (!selectedMentor) {
      Alert.alert("Select a Recipient", "Please select a tutor to message first.");
      return;
    }
    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Authentication Required", "Please sign in to send a message.");
        setSending(false);
        return;
      }
      
      const convId = await getOrCreateConversation(user.id, selectedMentor);
      if (convId) {
         if (draftAttachment) {
           const uploadResult = await uploadChatAttachment(draftAttachment, convId, user.id);
           if (uploadResult) {
             await supabase.from("messages").insert({
               conversation_id: convId,
               sender_id: user.id,
               content: message.trim() || null,
               message_type: draftAttachment.type,
               attachment_url: uploadResult.url,
               attachment_name: uploadResult.name,
               attachment_mime_type: uploadResult.mimeType,
               attachment_size: uploadResult.size,
               is_read: false,
             });
           }
         } else if (message.trim()) {
           await supabase.from("messages").insert({
             conversation_id: convId,
             sender_id: user.id,
             content: message.trim(),
             message_type: "text",
             is_read: false
           });
         }
         router.push({ pathname: "/(student)/ChatConversation", params: { conversationId: convId } });
      } else {
        Alert.alert("Error", "Could not start conversation with selected tutor.");
      }
    } catch (e) {
      console.warn("Error starting conversation:", e);
      Alert.alert("Error", "Could not start conversation.");
    } finally {
      setSending(false);
    }
  };

  const filterList = (list: any[], query: string) => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((m) => {
      const name = (m.full_name || m.name || (m.email ? m.email.split('@')[0] : '')).toLowerCase();
      const specialty = (m.specialty || (Array.isArray(m.subjects) ? m.subjects.join(' ') : m.subjects) || m.title || '').toLowerCase();
      const education = (m.education || m.degree || m.degree_credentials || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || specialty.includes(q) || education.includes(q) || email.includes(q);
    });
  };

  const filteredMentors = filterList(mentors, searchQuery);
  const modalFilteredMentors = filterList(mentors, modalSearch);

  const handleSelectTutor = (tutor: any) => {
    setSelectedMentor(tutor.id);
    const tutorName = tutor.full_name || tutor.name || (tutor.email ? tutor.email.split('@')[0] : "Tutor");
    setSearchQuery(tutorName);
    setShowTutorModal(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(student)/MessagesInbox");
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
          <TouchableOpacity onPress={handleSend} disabled={sending}>
            <Text style={[styles.sendBtnText, sending && { opacity: 0.5 }]}>Send ➤</Text>
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
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity 
                style={styles.personAddButton} 
                onPress={() => {
                  setModalSearch("");
                  setShowTutorModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="person-add-outline" size={20} color="#2563EB" />
              </TouchableOpacity>
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
          <TouchableOpacity onPress={() => setShowTutorModal(true)}>
            <Text style={styles.availableLink}>
              {loading ? "loading..." : `${filteredMentors.length} available`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mentorList}>
          {loading && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          )}
          {!loading && filteredMentors.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8' }}>No tutors found.</Text>
            </View>
          )}
          {filteredMentors.map((mentor) => (
            <TouchableOpacity 
              key={mentor.id} 
              style={[styles.mentorCard, selectedMentor === mentor.id && { backgroundColor: '#EFF6FF', borderColor: '#2563EB', borderWidth: 1 }]}
              onPress={() => handleSelectTutor(mentor)}
            >
              <View style={styles.mentorAvatarWrapper}>
                <Image source={{ uri: mentor.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" }} style={styles.mentorAvatar} />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.mentorInfo}>
                <View style={styles.mentorNameRow}>
                  <Text style={styles.mentorName}>{mentor.full_name || mentor.name || (mentor.email ? mentor.email.split('@')[0] : "Tutor")}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                </View>
                <View style={styles.mentorDetailRow}>
                  <Text style={styles.mentorDetail} numberOfLines={1}>{mentor.specialty || (Array.isArray(mentor.subjects) ? mentor.subjects.join(', ') : mentor.subjects) || mentor.title || mentor.education || "Available for Session"}</Text>
                </View>
              </View>
              <View style={styles.addMentorBtn}>
                <Ionicons name={selectedMentor === mentor.id ? "checkmark" : "add"} size={20} color="#2563EB" />
              </View>
            </TouchableOpacity>
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

          {draftAttachment && (
            <View style={styles.attachmentPreviewBar}>
              {draftAttachment.type === "image" ? (
                <Image source={{ uri: draftAttachment.uri }} style={styles.previewThumbnail} />
              ) : (
                <View style={styles.previewDocIconBg}>
                  <Ionicons name="document-text" size={20} color="#2563EB" />
                </View>
              )}
              <View style={styles.previewInfoCol}>
                <Text style={styles.previewFileName} numberOfLines={1}>
                  {draftAttachment.name}
                </Text>
                <Text style={styles.previewFileSize}>
                  {formatFileSize(draftAttachment.size)} • Attached
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDraftAttachment(null)}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.messageActions}>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.actionIconBtn} onPress={handlePickDocument}>
                <Ionicons name="attach-outline" size={22} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconBtn} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={22} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.proposeTimeBtn}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.proposeTimeText}>Propose Time</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setMessage(""); setDraftAttachment(null); }}>
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

      {/* --- SELECT TUTOR MODAL --- */}
      <Modal
        visible={showTutorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTutorModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity 
            style={styles.modalBackdropPressable} 
            activeOpacity={1} 
            onPress={() => setShowTutorModal(false)} 
          />
          <View style={styles.modalContainer}>
            {/* Handle bar for bottom sheet feel */}
            <View style={styles.modalHandleBar} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Tutor</Text>
                <Text style={styles.modalSubtitle}>
                  {loading ? "Loading tutors..." : `${modalFilteredMentors.length} tutors available in directory`}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowTutorModal(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input in Modal */}
            <View style={styles.modalSearchBox}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search by name, subject, specialty..."
                placeholderTextColor="#94A3B8"
                value={modalSearch}
                onChangeText={setModalSearch}
                autoCorrect={false}
              />
              {modalSearch.length > 0 && (
                <TouchableOpacity onPress={() => setModalSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Tutors List */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
            >
              {loading && (
                <View style={styles.modalLoadingState}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.modalStateText}>Loading tutors list...</Text>
                </View>
              )}

              {!loading && modalFilteredMentors.length === 0 && (
                <View style={styles.modalEmptyState}>
                  <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.modalEmptyTitle}>No Tutors Found</Text>
                  <Text style={styles.modalEmptySubtitle}>
                    {modalSearch.trim() ? "Try searching with a different keyword." : "There are currently no registered tutors in the directory."}
                  </Text>
                </View>
              )}

              {modalFilteredMentors.map((mentor) => {
                const isSelected = selectedMentor === mentor.id;
                const displayName = mentor.full_name || mentor.name || (mentor.email ? mentor.email.split('@')[0] : "Tutor");
                const specialty = mentor.specialty || (Array.isArray(mentor.subjects) ? mentor.subjects.join(', ') : mentor.subjects) || mentor.title || mentor.education || "Verified Tutor";
                const education = mentor.education || mentor.degree || mentor.degree_credentials || null;

                return (
                  <TouchableOpacity
                    key={mentor.id}
                    style={[
                      styles.modalTutorCard,
                      isSelected && styles.modalTutorCardSelected
                    ]}
                    onPress={() => handleSelectTutor(mentor)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalAvatarWrapper}>
                      <Image 
                        source={{ uri: mentor.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" }} 
                        style={styles.modalAvatar} 
                      />
                      <View style={styles.onlineBadge} />
                    </View>

                    <View style={styles.modalTutorInfo}>
                      <View style={styles.modalTutorNameRow}>
                        <Text style={styles.modalTutorName}>{displayName}</Text>
                        <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
                      </View>
                      <Text style={styles.modalTutorSpecialty} numberOfLines={1}>
                        {specialty}
                      </Text>
                      {education && (
                        <Text style={styles.modalTutorEducation} numberOfLines={1}>
                          🎓 {education}
                        </Text>
                      )}
                    </View>

                    <View style={[styles.modalSelectIndicator, isSelected && styles.modalSelectIndicatorActive]}>
                      <Ionicons 
                        name={isSelected ? "checkmark" : "chevron-forward"} 
                        size={18} 
                        color={isSelected ? "#FFFFFF" : "#94A3B8"} 
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
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
  personAddButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
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
  /* --- MODAL STYLES --- */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalBackdropPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  modalListContent: {
    paddingBottom: 20,
  },
  modalLoadingState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  modalStateText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
  },
  modalEmptyState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  modalEmptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  modalTutorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  modalTutorCardSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
    borderWidth: 1.5,
  },
  modalAvatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  modalAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E2E8F0",
  },
  modalTutorInfo: {
    flex: 1,
  },
  modalTutorNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTutorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalTutorSpecialty: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalTutorEducation: {
    fontSize: 11,
    color: "#2563EB",
    marginTop: 2,
    fontWeight: "500",
  },
  modalSelectIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  modalSelectIndicatorActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  attachmentPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  previewThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  previewDocIconBg: {
    width: 36,
    height: 36,
    borderRadius: 6,
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
});
