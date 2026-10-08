import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { TutorBottomNav } from '../../components/TutorBottomNav';
import { supabase } from '../../../lib/supabase';
import { formatBookingDate, getCurrentTutorId, getProfilesById } from '../../lib/tutorData';

// Types
type BottomTabType = 'sessions' | 'calendar' | 'requests' | 'messages' | 'profile';

interface AcceptedSessionPayload {
  studentName: string;
  avatarUrl: string;
  subject: string;
  dateTime: string;
  amountEarned: string;
  studentEmail: string;
  roomLink: string;
}

export default function SessionAcceptPopupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [modalVisible, setModalVisible] = useState<boolean>(true);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabType>('requests');
  const [sessionData, setSessionData] = useState<AcceptedSessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAcceptedBooking = async () => {
      try {
        if (!id) throw new Error('Booking ID is missing.');
        const tutorId = await getCurrentTutorId();
        const { data: booking, error } = await supabase.from('bookings')
          .select('*')
          .eq('id', id)
          .eq('tutor_id', tutorId)
          .single();
        if (error) throw error;
        if (booking.status !== 'accepted' && booking.status !== 'confirmed') {
          throw new Error('This booking is not accepted.');
        }
        const profiles = await getProfilesById([booking.student_id]);
        const student = booking.student_id ? profiles.get(booking.student_id) : undefined;
        if (mounted) {
          setSessionData({
            studentName: student?.full_name || booking.student_name || 'Student',
            avatarUrl: student?.avatar_url || '',
            subject: booking.subject,
            dateTime: `${formatBookingDate(booking.session_date)} • ${booking.time_slot}`,
            amountEarned: `$${Number(booking.total_price ?? 0).toFixed(2)}`,
            studentEmail: student?.email || '',
            roomLink: '',
          });
        }
      } catch (error) {
        console.error('Failed to load accepted tutor booking:', error);
        if (mounted) Alert.alert('Session update', error instanceof Error ? error.message : 'Unable to load the accepted session.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadAcceptedBooking();
    return () => { mounted = false; };
  }, [id]);

  const handleCopyLink = () => {
    Alert.alert('Room link unavailable', 'No meeting link is stored for this booking.');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    router.replace('/(tutor)/dashboard');
  };

  if (!sessionData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {loading ? 'Loading accepted session…' : 'Accepted session details are unavailable.'}
          </Text>
          {!loading && (
            <TouchableOpacity style={styles.returnButton} onPress={handleCloseModal}>
              <Text style={styles.returnButtonText}>Back to requests</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#718096" />

      <View style={styles.underlyingScreen} />

      {/* --- Semi-transparent Modal Overlay --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop tap to dismiss */}
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={handleCloseModal}
          />

          {/* Bottom Pop-up Sheet */}
          <View style={styles.popupCard}>
            {/* Header: Check icon + Title/Status + Close button */}
            <View style={styles.popupHeader}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={20} color="#0D9488" />
                </View>

                <View>
                  <Text style={styles.popupTitle}>Session Accepted!</Text>
                  <View style={styles.scheduleBadge}>
                    <Text style={styles.scheduleBadgeText}>Added to Schedule</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.closeBtn}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Student & Session Overview Card */}
            <View style={styles.studentCard}>
              {sessionData.avatarUrl ? (
                <Image source={{ uri: sessionData.avatarUrl }} style={styles.studentAvatar} />
              ) : (
                <View style={[styles.studentAvatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={20} color="#64748B" />
                </View>
              )}

              <View style={styles.studentMeta}>
                <Text style={styles.studentName}>{sessionData.studentName}</Text>
                <Text style={styles.subjectText}>{sessionData.subject}</Text>
                <Text style={styles.dateTimeText}>{sessionData.dateTime}</Text>
              </View>

              <View style={styles.earningsBox}>
                <Text style={styles.earnedAmount}>{sessionData.amountEarned}</Text>
                <Text style={styles.earnedLabel}>Session total</Text>
              </View>
            </View>

            {sessionData.studentEmail ? (
              <View style={styles.calendarInviteCard}>
                <View style={styles.calendarInviteLeft}>
                  <View style={styles.inviteCheckSquare}>
                    <Ionicons name="mail-outline" size={13} color="#0D9488" />
                  </View>
                  <View>
                    <Text style={styles.inviteTitle}>Student email</Text>
                    <Text style={styles.inviteEmail}>{sessionData.studentEmail}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {sessionData.roomLink ? <View style={styles.roomLinkCard}>
              <View style={styles.roomLinkLeft}>
                <MaterialCommunityIcons
                  name="video-account"
                  size={20}
                  color="#2563EB"
                  style={styles.camIcon}
                />
                <View style={styles.roomTextContainer}>
                  <Text style={styles.roomLabel}>Virtual Room Link</Text>
                  <Text
                    style={styles.roomUrl}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {sessionData.roomLink}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.copyBtn}
                onPress={handleCopyLink}
              >
                <Feather name="copy" size={17} color="#475569" />
              </TouchableOpacity>
            </View> : null}
          </View>
        </View>
      </Modal>

      {/* --- Fixed Bottom Navigation Bar (Visible across state) --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('sessions')}
        >
          <MaterialCommunityIcons
            name="ticket-confirmation-outline"
            size={22}
            color={activeBottomTab === 'sessions' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'sessions' && styles.navLabelActive,
            ]}
          >
            Sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('calendar')}
        >
          <Ionicons
            name="calendar-outline"
            size={21}
            color={activeBottomTab === 'calendar' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'calendar' && styles.navLabelActive,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('requests')}
        >
          <View style={styles.badgeWrap}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={23}
              color={activeBottomTab === 'requests' ? '#2563EB' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'requests' && styles.navLabelActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('messages')}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={21}
            color={activeBottomTab === 'messages' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'messages' && styles.navLabelActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('profile')}
        >
          <Ionicons
            name="person-circle-outline"
            size={23}
            color={activeBottomTab === 'profile' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'profile' && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
      <TutorBottomNav activeTab="requests" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  emptyStateText: { color: '#475569', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  returnButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2563EB' },
  returnButtonText: { color: '#FFFFFF', fontWeight: '700' },
  // Background screen layout to simulate blurred/inactive state
  underlyingScreen: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingTop: 16,
    opacity: 0.65,
  },
  bgTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bgTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bgTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  bgCountBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bgCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bgFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bgFilterText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  bgSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#CBD5E1',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  bgTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  bgTabActive: {
    backgroundColor: '#FFF',
    borderRadius: 9,
  },
  bgTabTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  bgTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  bgDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  bgPipelineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  bgPipelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bgPipelineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgPipelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  bgPipelineSub: {
    fontSize: 12,
    color: '#64748B',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
  },

  // Pop-up Sheet
  popupCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scheduleBadge: {
    backgroundColor: '#CCFBF1',
    borderRadius: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 4,
  },
  scheduleBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  closeBtn: {
    padding: 6,
    marginRight: -4,
    marginTop: -2,
  },

  // Student details card
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#CBD5E1',
  },
  studentMeta: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  dateTimeText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },
  earningsBox: {
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  earnedAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  earnedLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0D9488',
    marginTop: 2,
  },

  // Calendar synced container
  calendarInviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  calendarInviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inviteCheckSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  inviteEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },

  // Virtual room link card
  roomLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  roomLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  camIcon: {
    marginTop: 2,
  },
  roomTextContainer: {
    flex: 1,
  },
  roomLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  roomUrl: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  copyBtn: {
    padding: 6,
    marginLeft: 8,
  },

  // Fixed Bottom Tabs Bar
  bottomNav: {
    display: 'none',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  badgeWrap: {
    position: 'relative',
  },
  redBadge: {
    position: 'absolute',
    top: -4,
    right: -7,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  redBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  navLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});