import {
    Ionicons,
    MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { TutorBottomNav } from '../../components/TutorBottomNav';
import { supabase } from '../../../lib/supabase';
import {
  displayBookingStatus,
  formatBookingDate,
  getCurrentTutorId,
  getOrCreateTutorConversation,
  getProfilesById,
} from '../../lib/tutorData';

interface BookingRequestDetails {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  expiresIn: string;
  student: {
    id: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
    isVerified: boolean;
    gradeRole: string;
    rating?: number;
    sessionsCount?: number;
  };
  session: {
    duration: string;
    scheduledDate: string;
    scheduledTime: string;
    subject: string;
    subTopics: string;
    delivery: string;
    deliverySubtext: string;
    totalPayout: string;
    hourlyRate: string;
  };
  studentNotes: string;
}

const EMPTY_BOOKING_DETAILS: BookingRequestDetails = {
  id: '',
  status: 'pending',
  expiresIn: '',
  student: {
    id: '',
    name: '',
    avatarUrl: '',
    isOnline: false,
    isVerified: false,
    gradeRole: '',
  },
  session: {
    duration: '',
    scheduledDate: '',
    scheduledTime: '',
    subject: '',
    subTopics: '',
    delivery: '',
    deliverySubtext: '',
    totalPayout: '',
    hourlyRate: '',
  },
  studentNotes: '',
};

export default function TutorBookingRequestDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [data, setData] = useState<BookingRequestDetails>(EMPTY_BOOKING_DETAILS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadBooking = async () => {
      try {
        if (!id) throw new Error('Booking ID is missing.');
        const tutorId = await getCurrentTutorId();
        const { data: booking, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', id)
          .eq('tutor_id', tutorId)
          .single();
        if (error) throw error;
        const profiles = await getProfilesById([booking.student_id]);
        const student = booking.student_id ? profiles.get(booking.student_id) : undefined;
        if (!mounted) return;
        setData({
          id: booking.id,
          status: displayBookingStatus(booking.status).toLowerCase() as BookingRequestDetails['status'],
          expiresIn: '',
          student: {
            id: booking.student_id || '',
            name: student?.full_name || booking.student_name || 'Student',
            avatarUrl: student?.avatar_url || '',
            isOnline: false,
            isVerified: false,
            gradeRole: student?.education || '',
          },
          session: {
            duration: booking.duration || '',
            scheduledDate: formatBookingDate(booking.session_date),
            scheduledTime: booking.time_slot,
            subject: booking.subject,
            subTopics: booking.focus_notes || '',
            delivery: booking.delivery_format || '',
            deliverySubtext: '',
            totalPayout: `$${Number(booking.total_price ?? 0).toFixed(2)}`,
            hourlyRate: `$${Number(booking.hourly_rate ?? 0).toFixed(2)}/hr`,
          },
          studentNotes: booking.focus_notes || '',
        });
      } catch (error) {
        console.error('Failed to load booking details:', error);
        Alert.alert('Unable to load request', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadBooking();
    return () => { mounted = false; };
  }, [id]);

  const handleAcceptRequest = async () => {
    try {
      setLoading(true);
      const tutorId = await getCurrentTutorId();
      const { error } = await supabase.from('bookings')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .eq('tutor_id', tutorId);
      if (error) throw error;
      const updated: BookingRequestDetails = { ...data, status: 'accepted' };
      setData(updated);

      router.replace(`/(tutor)/Sessionacceptpopup?id=${encodeURIComponent(data.id)}`);
    } catch (error) {
      console.error('Accept error:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    Alert.alert(
      'Decline Booking Request',
      'Are you sure you want to decline this session request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            void (async () => {
              try {
                const tutorId = await getCurrentTutorId();
                const { error } = await supabase.from('bookings')
                  .update({ status: 'declined', updated_at: new Date().toISOString() })
                  .eq('id', data.id)
                  .eq('tutor_id', tutorId);
                if (error) throw error;
                router.replace('/(tutor)/dashboard');
              } catch (error) {
                console.error('Failed to decline booking:', error);
                Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to decline this request.');
              }
            })();
          },
        },
      ]
    );
  };

  const handleOpenChat = async () => {
    if (!data.student.id) {
      Alert.alert('Chat unavailable', 'This booking has no linked student account.');
      return;
    }
    try {
      const conversationId = await getOrCreateTutorConversation(data.student.id);
      router.push(
        `/(tutor)/TutorConversation?id=${encodeURIComponent(conversationId)}&studentId=${encodeURIComponent(data.student.id)}&name=${encodeURIComponent(data.student.name)}`
      );
    } catch (error) {
      console.error('Failed to open tutor chat:', error);
      Alert.alert('Chat unavailable', error instanceof Error ? error.message : 'Unable to open the conversation.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenterLogo}>
          <Ionicons name="book" size={20} color="#FFFFFF" />
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.headerProfileButton} onPress={() => router.push('/(tutor)/TutorProfile')}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Top Status Bar --- */}
        <View style={styles.statusRow}>
          <View style={styles.pendingReviewBadge}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingReviewText}>PENDING REVIEW</Text>
          </View>

          {loading && <Text style={styles.expiresText}>Loading request…</Text>}
        </View>

        {/* --- Student Card --- */}
        <View style={styles.studentCard}>
          <View style={styles.studentLeftSection}>
            <View style={styles.avatarContainer}>
              {data.student.avatarUrl ? (
                <Image source={{ uri: data.student.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={20} color="#64748B" />
                </View>
              )}
              {data.student.isOnline && <View style={styles.onlineBadge} />}
            </View>

            <View style={styles.studentDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.studentName}>{data.student.name}</Text>
                {data.student.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#2563EB"
                    style={styles.verifiedIcon}
                  />
                )}
              </View>

              <Text style={styles.studentSubRole}>{data.student.gradeRole}</Text>

              {(data.student.rating != null || data.student.sessionsCount != null) && (
                <View style={styles.ratingSessionsRow}>
                  {data.student.rating != null && (
                    <>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{data.student.rating.toFixed(1)}</Text>
                    </>
                  )}
                  {data.student.sessionsCount != null && (
                    <Text style={styles.previousSessionsText}>
                      {data.student.sessionsCount} previous sessions
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.chatIconButton}
            onPress={handleOpenChat}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* --- Session Details Card --- */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionTitle}>Session Details</Text>
            <View style={styles.durationBadge}>
              <Text style={styles.durationBadgeText}>{data.session.duration}</Text>
            </View>
          </View>

          {/* Item 1: Scheduled Date & Time */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar" size={20} color="#2563EB" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Scheduled Date & Time</Text>
              <Text style={styles.infoPrimaryText}>{data.session.scheduledDate}</Text>
              <Text style={styles.infoSecondaryText}>{data.session.scheduledTime}</Text>
            </View>
          </View>

          {/* Item 2: Target Subject */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="book-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Target Subject</Text>
              <Text style={styles.infoPrimaryText}>{data.session.subject}</Text>
              <Text style={styles.infoSecondaryText}>{data.session.subTopics}</Text>
            </View>
          </View>

          {/* Item 3: Session Delivery */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="videocam-outline" size={20} color="#0D9488" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Session Delivery</Text>
              <Text style={styles.infoPrimaryText}>{data.session.delivery}</Text>
              <Text style={styles.deliverySubHighlight}>
                {data.session.deliverySubtext}
              </Text>
            </View>
          </View>

          {/* Item 4: Booking Total */}
          <View style={styles.payoutCard}>
            <View style={styles.payoutLeft}>
              <View style={styles.payoutIconWrap}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.payoutLabel}>Booking total</Text>
                <Text style={styles.payoutAmount}>{data.session.totalPayout}</Text>
              </View>
            </View>

            <View style={styles.rateChip}>
              <Text style={styles.rateChipText}>{data.session.hourlyRate}</Text>
            </View>
          </View>
        </View>

        {/* --- Student Goal & Notes Card --- */}
        <View style={styles.detailsCard}>
          <View style={styles.notesHeaderRow}>
            <Ionicons name="chatbox-outline" size={19} color="#2563EB" />
            <Text style={styles.cardSectionTitle}>Student Goal & Notes</Text>
          </View>

          <View style={styles.quoteBubble}>
            <Text style={styles.quoteText}>{data.studentNotes || 'No session notes provided.'}</Text>
          </View>
        </View>

        {/* --- Action Buttons --- */}
        <View style={styles.actionsContainer}>
          {data.status === 'pending' && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.declineButton}
              onPress={handleDeclineRequest}
            >
              <Ionicons name="close" size={18} color="#991B1B" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          )}

          {data.status === 'pending' && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.acceptButton}
              onPress={handleAcceptRequest}
              disabled={loading}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>
                {loading ? 'Confirming...' : 'Accept Request'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <TutorBottomNav activeTab="requests" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenterLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  headerProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pendingReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2410C',
  },
  pendingReviewText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#9A3412',
    letterSpacing: 0.4,
  },
  expiresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expiresText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  studentLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#0D9488',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  studentDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedIcon: {
    marginTop: 1,
  },
  studentSubRole: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '400',
  },
  ratingSessionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  previousSessionsText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  chatIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  durationBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoSecondaryText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  deliverySubHighlight: {
    fontSize: 12.5,
    color: '#0D9488',
    fontWeight: '500',
    marginTop: 2,
  },
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payoutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  rateChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  rateChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  quoteBubble: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  attachedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paperclipCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileCountText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pdfIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentMeta: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  fileDetails: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginLeft: 10,
  },
  actionsContainer: {
    marginTop: 6,
    gap: 12,
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 28,
    gap: 6,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});