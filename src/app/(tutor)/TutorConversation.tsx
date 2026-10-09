import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
} from 'react-native';
import { TutorBottomNav } from '../../components/TutorBottomNav';
import { supabase } from '../../../lib/supabase';
import { getCurrentTutorId } from '../../lib/tutorData';
import { createNotification } from '../../services/notificationService';

interface ConversationMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function TutorConversationScreen() {
  const router = useRouter();
  const { id, studentId, name } = useLocalSearchParams<{
    id?: string;
    studentId?: string;
    name?: string;
  }>();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [tutorId, setTutorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;
    const loadConversation = async () => {
      try {
        if (!id || !studentId) throw new Error('Conversation details are missing.');
        const currentTutorId = await getCurrentTutorId();
        const { data: conversation, error: conversationError } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', id)
          .eq('tutor_id', currentTutorId)
          .eq('student_id', studentId)
          .single();
        if (conversationError) throw conversationError;

        const { data, error } = await supabase
          .from('messages')
          .select('id, sender_id, content, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        if (error) throw error;
        const { error: readError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', currentTutorId);
        if (readError) throw readError;
        if (mounted) {
          setTutorId(currentTutorId);
          setMessages((data ?? []) as ConversationMessage[]);
        }
      } catch (error) {
        console.error('Failed to load tutor conversation:', error);
        if (mounted) Alert.alert('Conversation error', error instanceof Error ? error.message : 'Unable to load conversation.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadConversation();
    return () => { mounted = false; };
  }, [id, studentId]);

  const sendMessage = async () => {
    const content = messageText.trim();
    if (!content || !id || !studentId || sending) return;
    try {
      setSending(true);
      const currentTutorId = tutorId || await getCurrentTutorId();
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: currentTutorId,
          content,
          is_read: false,
        })
        .select('id, sender_id, content, created_at')
        .single();
      if (error) throw error;
      setMessages((previous) => [...previous, data as ConversationMessage]);
      setMessageText('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

      // Update conversations table with latest message and timestamp
      void supabase
        .from('conversations')
        .update({
          last_message: content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Notify student
      void createNotification({
        userId: studentId,
        role: 'student',
        type: 'message',
        title: 'New Message from Tutor',
        description: content.length > 60 ? `${content.slice(0, 60)}...` : content,
        referenceId: id,
        category: 'Messages',
      });
    } catch (error) {
      console.error('Failed to send tutor message:', error);
      Alert.alert('Message not sent', error instanceof Error ? error.message : 'Unable to send your message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Ionicons name="person" size={19} color="#2563EB" />
        </View>
        <Text style={styles.headerName} numberOfLines={1}>{name || 'Student'}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.conversation}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 86 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {loading ? (
            <Text style={styles.emptyText}>Loading conversation…</Text>
          ) : messages.length === 0 ? (
            <Text style={styles.emptyText}>No messages yet. Send the first message.</Text>
          ) : messages.map((message) => {
            const fromTutor = message.sender_id === tutorId;
            return (
              <View
                key={message.id}
                style={[styles.messageBubble, fromTutor ? styles.tutorBubble : styles.studentBubble]}
              >
                <Text style={[styles.messageText, fromTutor && styles.tutorMessageText]}>
                  {message.content}
                </Text>
                <Text style={[styles.messageTime, fromTutor && styles.tutorTime]}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Write a message..."
            placeholderTextColor="#94A3B8"
            style={styles.input}
            multiline
            maxLength={4000}
            editable={!loading && !sending}
          />
          <TouchableOpacity
            accessibilityLabel="Send message"
            disabled={!messageText.trim() || loading || sending}
            onPress={() => void sendMessage()}
            style={[styles.sendButton, (!messageText.trim() || loading || sending) && styles.sendDisabled]}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <TutorBottomNav activeTab="messages" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: { padding: 6 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  headerName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  conversation: { flex: 1 },
  messageList: { flexGrow: 1, justifyContent: 'flex-end', padding: 16, gap: 10 },
  emptyText: { paddingVertical: 20, color: '#64748B', textAlign: 'center' },
  messageBubble: { maxWidth: '84%', borderRadius: 18, padding: 12, gap: 5 },
  tutorBubble: { alignSelf: 'flex-end', backgroundColor: '#2563EB', borderBottomRightRadius: 5 },
  studentBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 21, color: '#0F172A' },
  tutorMessageText: { color: '#FFFFFF' },
  messageTime: { alignSelf: 'flex-end', fontSize: 10, color: '#64748B' },
  tutorTime: { color: '#DBEAFE' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    color: '#0F172A',
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  sendDisabled: { opacity: 0.45 },
});
