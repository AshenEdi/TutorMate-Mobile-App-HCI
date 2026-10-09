import { supabase } from '../../lib/supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  role: 'student' | 'tutor' | 'admin';
  type: 'session' | 'message' | 'wallet' | 'booking' | 'material' | 'review' | 'dispute' | 'moderation';
  title: string;
  description: string;
  highlight_text?: string;
  is_unread: boolean;
  category: 'Sessions' | 'Messages' | 'Reminders';
  reference_id?: string;
  created_at: string;
}

export async function getNotifications(userId?: string): Promise<AppNotification[]> {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[notificationService] fetch warning (table might be initializing):', error.message);
      return [];
    }

    return (data ?? []).map((n) => ({
      id: n.id,
      user_id: n.user_id,
      role: n.role || 'student',
      type: n.type || 'dispute',
      title: n.title,
      description: n.description,
      highlight_text: n.highlight_text,
      is_unread: n.is_unread ?? true,
      category: (n.category as any) || 'Reminders',
      reference_id: n.reference_id,
      created_at: n.created_at,
    }));
  } catch (err) {
    console.warn('[notificationService] error fetching notifications:', err);
    return [];
  }
}

export async function createNotification(params: {
  userId: string;
  role?: 'student' | 'tutor' | 'admin';
  type: AppNotification['type'];
  title: string;
  description: string;
  highlightText?: string;
  category?: 'Sessions' | 'Messages' | 'Reminders';
  referenceId?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      role: params.role || 'student',
      type: params.type,
      title: params.title,
      description: params.description,
      highlight_text: params.highlightText,
      category: params.category || 'Reminders',
      reference_id: params.referenceId,
      is_unread: true,
    });

    if (error) {
      console.warn('[notificationService] insert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[notificationService] error creating notification:', err);
    return false;
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await supabase.from('notifications').update({ is_unread: false }).eq('id', id);
  } catch (err) {
    console.warn('[notificationService] error marking notification read:', err);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await supabase.from('notifications').update({ is_unread: false }).eq('user_id', userId);
  } catch (err) {
    console.warn('[notificationService] error marking all read:', err);
  }
}
