import { supabase } from '../../lib/supabase';
import { createNotification } from './notificationService';

export interface ConversationItem {
  id: string;
  tutorId: string;
  studentId: string;
  name: string;
  avatar: string;
  verified?: boolean;
  online?: boolean;
  time: string;
  subject?: string;
  status?: string;
  lastMessage: string;
  unread: number;
  hasAttachment?: boolean;
  isStarred?: boolean;
  isRead?: boolean;
  updated_at?: string;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

/**
 * Format timestamp into user friendly chat label
 */
export function formatChatTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Fetch all conversations for a student
 */
export async function getStudentConversations(studentId?: string): Promise<ConversationItem[]> {
  try {
    let currentStudentId = studentId;
    if (!currentStudentId) {
      const { data: { user } } = await supabase.auth.getUser();
      currentStudentId = user?.id;
    }
    if (!currentStudentId) return [];

    // 1. Fetch conversations from Supabase
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('student_id', currentStudentId)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.warn('[chatService] error fetching conversations:', convError);
    }

    const conversations = convData || [];

    // 2. Also check confirmed/accepted bookings to auto-create conversations with tutors if missing
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, tutor_id, tutor_name, subject, session_date, time_slot, status')
      .eq('student_id', currentStudentId)
      .in('status', ['confirmed', 'accepted', 'pending']);

    const existingTutorIds = new Set(conversations.map((c) => c.tutor_id));

    // If there are bookings with tutors that don't have a conversation yet, create them
    if (bookings && bookings.length > 0) {
      for (const b of bookings) {
        if (b.tutor_id && !existingTutorIds.has(b.tutor_id)) {
          try {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                student_id: currentStudentId,
                tutor_id: b.tutor_id,
                last_message: `Session booked: ${b.subject || 'Tutoring Session'}`,
              })
              .select('*')
              .single();

            if (newConv) {
              conversations.push(newConv);
              existingTutorIds.add(b.tutor_id);
            }
          } catch (e) {
            // Ignore insert race conditions
          }
        }
      }
    }

    if (conversations.length === 0) {
      return [];
    }

    // 3. Fetch tutor profiles
    const tutorIds = Array.from(new Set(conversations.map((c) => c.tutor_id)));
    const { data: tutorProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, specialty, education, background_check_status')
      .in('id', tutorIds);

    const tutorMap = new Map((tutorProfiles || []).map((p) => [p.id, p]));

    // 4. Fetch latest messages & unread counts for all these conversations
    const conversationIds = conversations.map((c) => c.id);
    const { data: allMessages } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, is_read, created_at, attachment_url')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    const latestMessageMap = new Map<string, any>();
    const unreadCountMap = new Map<string, number>();

    (allMessages || []).forEach((msg) => {
      if (!latestMessageMap.has(msg.conversation_id)) {
        latestMessageMap.set(msg.conversation_id, msg);
      }
      if (msg.sender_id !== currentStudentId && !msg.is_read) {
        unreadCountMap.set(
          msg.conversation_id,
          (unreadCountMap.get(msg.conversation_id) || 0) + 1
        );
      }
    });

    // 5. Build conversation items
    return conversations.map((conv) => {
      const tutor = tutorMap.get(conv.tutor_id);
      const latestMsg = latestMessageMap.get(conv.id);
      const unread = unreadCountMap.get(conv.id) || 0;

      const tutorName = tutor?.full_name || 'Tutor';
      const avatar =
        tutor?.avatar_url ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200';

      const lastContent = latestMsg?.content || conv.last_message || 'No messages yet';
      const msgTime = formatChatTime(latestMsg?.created_at || conv.updated_at || conv.created_at);

      // Match booking for upcoming session info
      const booking = (bookings || []).find((b) => b.tutor_id === conv.tutor_id);
      const sessionStatus = booking?.session_date ? `Session ${booking.session_date}` : undefined;

      return {
        id: conv.id,
        tutorId: conv.tutor_id,
        studentId: conv.student_id,
        name: tutorName,
        avatar,
        verified: tutor?.background_check_status === 'verified',
        online: true,
        time: msgTime,
        subject: tutor?.specialty || tutor?.education || booking?.subject || 'Tutoring',
        status: sessionStatus,
        lastMessage: lastContent,
        unread,
        hasAttachment: !!latestMsg?.attachment_url,
        isRead: unread === 0,
        updated_at: conv.updated_at,
      };
    });
  } catch (err) {
    console.warn('[chatService] error getting student conversations:', err);
    return [];
  }
}

/**
 * Fetch messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ChatMessageItem[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[chatService] error fetching messages:', error);
      return [];
    }

    return (data || []) as ChatMessageItem[];
  } catch (err) {
    console.warn('[chatService] error in getConversationMessages:', err);
    return [];
  }
}

/**
 * Get or create a conversation between a student and a tutor
 */
export async function getOrCreateConversation(
  studentId: string,
  tutorId: string
): Promise<string | null> {
  try {
    // Check existing
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', studentId)
      .eq('tutor_id', tutorId)
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    // Insert new
    const { data: inserted, error } = await supabase
      .from('conversations')
      .insert({ student_id: studentId, tutor_id: tutorId })
      .select('id')
      .single();

    if (error) {
      console.warn('[chatService] error creating conversation:', error);
      return null;
    }

    return inserted?.id || null;
  } catch (err) {
    console.warn('[chatService] error in getOrCreateConversation:', err);
    return null;
  }
}

/**
 * Send a message and update conversation's last_message
 */
export async function sendChatMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  recipientId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}): Promise<{ success: boolean; data?: ChatMessageItem; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: params.content,
        attachment_url: params.attachmentUrl || null,
        attachment_name: params.attachmentName || null,
        is_read: false,
      })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update conversation record
    await supabase
      .from('conversations')
      .update({
        last_message: params.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.conversationId);

    // If recipient is known, trigger notification
    if (params.recipientId) {
      void createNotification({
        userId: params.recipientId,
        type: 'message',
        title: 'New Message',
        description: params.content.length > 50 ? `${params.content.slice(0, 50)}...` : params.content,
        referenceId: params.conversationId,
        category: 'Messages',
      });
    }

    return { success: true, data: data as ChatMessageItem };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send message' };
  }
}

/**
 * Mark messages in a conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  try {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId);
  } catch (err) {
    console.warn('[chatService] error marking as read:', err);
  }
}
