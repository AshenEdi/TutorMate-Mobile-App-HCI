import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export function NotificationPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    const channelName = `notifications_bell_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch top 5 recent notifications
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setNotifications(data);
      const unread = data.filter(n => n.is_unread).length;
      setUnreadCount(unread);
    }
  };

  const handleNotificationPress = () => {
    setIsOpen(false);
    // Navigate to full screen for full view
    router.push('/notification');
  };

  const handleMarkAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_unread: false })
      .eq("user_id", user.id)
      .eq("is_unread", true);
      
    fetchNotifications();
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.bellBtn}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="notifications-outline" size={20} color="#0F172A" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.popover}>
            <View style={styles.popoverHeader}>
              <Text style={styles.popoverTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAsRead}>
                  <Text style={styles.markReadText}>Mark read</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.popoverList}>
              {notifications.length === 0 ? (
                <Text style={styles.emptyText}>No notifications yet.</Text>
              ) : (
                notifications.map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.notificationItem, item.is_unread && styles.unreadItem]}
                    onPress={handleNotificationPress}
                  >
                    <View style={styles.iconBox}>
                      <Ionicons 
                        name={item.type === 'message' ? 'chatbox' : 'calendar'} 
                        size={16} 
                        color="#2563EB" 
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                    {item.is_unread && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.viewAllBtn} onPress={handleNotificationPress}>
              <Text style={styles.viewAllText}>View All Notifications</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingRight: 16,
  },
  popover: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 400,
    overflow: 'hidden',
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  popoverTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  markReadText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  popoverList: {
    maxHeight: 300,
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#F8FAFC',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginLeft: 8,
  },
  viewAllBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewAllText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
});

