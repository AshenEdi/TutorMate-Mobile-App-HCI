import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
} from 'react-native';
import { TutorBottomNav } from '../../components/TutorBottomNav';
import { supabase } from '../../../lib/supabase';
import {
  formatBookingDate,
  getCurrentTutorId,
  getProfilesById,
  getTutorBookings,
} from '../../lib/tutorData';
import {
  DisputeRecord,
  getDisputesForTutor,
  submitTutorDisputeResponse,
} from '../../services/disputeService';

// --- Types ---
type TabType = 'Pending' | 'Accepted' | 'Declined';
type BottomTabType = 'sessions' | 'calendar' | 'requests' | 'messages' | 'profile';

interface BookingRequest {
  id: string;
  studentName: string;
  avatarUrl?: string;
  badgeType?: 'verified' | 'star';
  subTitle: string;
  ratePerHour: number | null;
  totalPrice: number | null;
  rateLabel: string;
  subject: string;
  subjectIcon: 'sigma' | 'flask-outline' | 'code-tags';
  subjectBgColor: string;
  subjectTextColor: string;
  mode: string;
  date: string;
  time: string;
  note: string;
  noteIconName: 'document-text-outline' | 'help-circle-outline' | 'code-slash';
  status: TabType;
}

export default function TutorBookingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Pending');
  const [currentBottomTab, setCurrentBottomTab] = useState<BottomTabType>('requests');
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tutorProfile, setTutorProfile] = useState<{ standing: string; strikes_count: number } | null>(null);
  const [activeDisputes, setActiveDisputes] = useState<DisputeRecord[]>([]);
  const [selectedDisputeForResponse, setSelectedDisputeForResponse] = useState<DisputeRecord | null>(null);
  const [responseStatement, setResponseStatement] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadRequests = async () => {
      try {
        const tutorId = await getCurrentTutorId();
        const [bookings, disputes, { data: prof }] = await Promise.all([
          getTutorBookings(),
          getDisputesForTutor(tutorId),
          supabase.from('profiles').select('standing, strikes_count').eq('id', tutorId).single(),
        ]);

        if (mounted) {
          setActiveDisputes(disputes.filter((d) => d.status === 'pending' || d.status === 'investigating'));
          if (prof) setTutorProfile(prof);
        }

        const profiles = await getProfilesById(bookings.map((booking) => booking.student_id));
        if (!mounted) return;
        setRequests(bookings
          .filter((booking) =>
            booking.status === 'pending' ||
            booking.status === 'confirmed' ||
            booking.status === 'accepted' ||
            booking.status === 'declined'
          )
          .map((booking) => {
          const student = booking.student_id ? profiles.get(booking.student_id) : undefined;
          const subjectStyle = booking.subject.toLowerCase().includes('chem')
            ? { subjectIcon: 'flask-outline' as const, subjectBgColor: '#CCFBF1', subjectTextColor: '#0F766E' }
            : booking.subject.toLowerCase().includes('python') || booking.subject.toLowerCase().includes('code')
              ? { subjectIcon: 'code-tags' as const, subjectBgColor: '#FEF3C7', subjectTextColor: '#B45309' }
              : { subjectIcon: 'sigma' as const, subjectBgColor: '#EBF4FF', subjectTextColor: '#1D4ED8' };
          return {
            id: booking.id,
            studentName: student?.full_name || booking.student_name || 'Student',
            avatarUrl: student?.avatar_url || undefined,
            subTitle: student?.education || 'Student',
            ratePerHour: booking.hourly_rate == null ? null : Number(booking.hourly_rate),
            totalPrice: booking.total_price == null ? null : Number(booking.total_price),
            rateLabel: 'Hourly rate',
            subject: booking.subject,
            ...subjectStyle,
            mode: booking.delivery_format || 'Session',
            date: formatBookingDate(booking.session_date),
            time: booking.time_slot,
            note: booking.focus_notes || 'No session notes provided.',
            noteIconName: 'document-text-outline' as const,
            status: booking.status === 'pending' ? 'Pending' : booking.status === 'declined' ? 'Declined' : 'Accepted',
          };
        }));
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load tutor booking requests:', error);
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Unable to load booking requests.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadRequests();
    return () => { mounted = false; };
  }, []);

  const updateRequestStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const tutorId = await getCurrentTutorId();
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tutor_id', tutorId);
      if (error) throw error;
      setRequests((previous) => previous.map((item) =>
        item.id === id ? { ...item, status: status === 'accepted' ? 'Accepted' : 'Declined' } : item
      ));
      Alert.alert(status === 'accepted' ? 'Session Accepted' : 'Session Declined',
        status === 'accepted' ? 'Session has been confirmed and scheduled.' : 'Request has been declined.');
    } catch (error) {
      console.error('Failed to update booking status:', error);
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to update this request.');
    }
  };

  const visibleRequests = requests.filter((r) => r.status === activeTab);
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const acceptedCount = requests.filter((r) => r.status === 'Accepted').length;
  const pendingTotal = requests
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- Top Navigation Header --- */}
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="book" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>TutorMate</Text>
        </View>

        

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerProfileBtn}
          onPress={() => router.push('/(tutor)/TutorProfile')}
        >
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Account Standing Card --- */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: (tutorProfile?.strikes_count ?? 0) > 0 ? '#FEE2E2' : '#CCFBF1',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons
                name={(tutorProfile?.strikes_count ?? 0) > 0 ? "warning-outline" : "shield-checkmark"}
                size={18}
                color={(tutorProfile?.strikes_count ?? 0) > 0 ? "#DC2626" : "#0D9488"}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>
                Account Standing
              </Text>
              <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                {(tutorProfile?.strikes_count ?? 0) === 0
                  ? "Good Standing • 0 Strikes"
                  : `${tutorProfile?.strikes_count} Strike${(tutorProfile?.strikes_count ?? 0) !== 1 ? "s" : ""} • Under Review`}
              </Text>
            </View>
          </View>
          <View style={{
            backgroundColor: (tutorProfile?.strikes_count ?? 0) > 0 ? '#FEF2F2' : '#EEF4FF',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: (tutorProfile?.strikes_count ?? 0) > 0 ? '#DC2626' : '#0052CC',
            }}>
              {(tutorProfile?.standing || "Good Standing").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* --- Dispute Action Required Alert Banner --- */}
        {activeDisputes.length > 0 && (
          <View style={{
            backgroundColor: '#FFF1F2',
            borderRadius: 16,
            padding: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#FECDD3',
            gap: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#881337' }}>
                Action Required • Active Dispute ({activeDisputes[0].code})
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#9F1239', lineHeight: 16 }}>
              Student {activeDisputes[0].student_name} reported an issue for {activeDisputes[0].subject}: &ldquo;{activeDisputes[0].reason}&rdquo;
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#991B1B',
                borderRadius: 12,
                paddingVertical: 8,
                alignItems: 'center',
                marginTop: 4,
              }}
              onPress={() => {
                setSelectedDisputeForResponse(activeDisputes[0]);
                setResponseStatement(activeDisputes[0].tutor_statement || "");
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' }}>
                {activeDisputes[0].tutor_statement ? "Edit Dispute Explanation" : "Submit Response to Admin"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- Title & Filter Row --- */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.headingTitle}>Incoming Requests</Text>
            {pendingCount > 0 && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{pendingCount} New</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.filterBtn}
            onPress={() => Alert.alert('Filter', 'Filter options')}
          >
            <MaterialCommunityIcons name="filter-variant" size={18} color="#2563EB" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* --- Segmented Control Tabs --- */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.segmentBtn, activeTab === 'Pending' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Pending')}
          >
            <Text style={[styles.segmentText, activeTab === 'Pending' && styles.segmentTextActive]}>
              Pending
            </Text>
            {activeTab === 'Pending' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.segmentBtn, activeTab === 'Accepted' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Accepted')}
          >
            <Text style={[styles.segmentText, activeTab === 'Accepted' && styles.segmentTextActive]}>
              Accepted
            </Text>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{acceptedCount}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.segmentBtn, activeTab === 'Declined' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Declined')}
          >
            <Text style={[styles.segmentText, activeTab === 'Declined' && styles.segmentTextActive]}>
              Declined
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Request Cards List --- */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading booking requests…</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{errorMessage}</Text>
          </View>
        ) : visibleRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No requests in this category</Text>
          </View>
        ) : (
          visibleRequests.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Card Header (Avatar + Name & Rates) */}
              <View style={styles.cardHeader}>
                <View style={styles.studentInfoLeft}>
                  <View style={styles.avatarWrap}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Ionicons name="person" size={18} color="#64748B" />
                      </View>
                    )}
                  </View>

                  <View style={styles.nameMeta}>
                    <View style={styles.nameRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push(
                            `/(tutor)/TutorBookingRequestDetails?id=${item.id}&status=${item.status.toLowerCase()}`
                          )
                        }
                      >
                        <Text style={styles.nameText}>{item.studentName}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.subTitleText}>{item.subTitle}</Text>
                  </View>
                </View>

                <View style={styles.rateBox}>
                  <Text style={styles.rateAmount}>
                    {item.ratePerHour == null ? 'Rate not set' : `$${item.ratePerHour}`}
                    {item.ratePerHour != null && <Text style={styles.perHrText}>/hr</Text>}
                  </Text>
                  {item.ratePerHour != null && <Text style={styles.rateBadgeText}>{item.rateLabel}</Text>}
                </View>
              </View>

              {/* Session Detail Container */}
              <View style={styles.detailsBox}>
                <View style={styles.subjectRow}>
                  <View style={[styles.subjectTag, { backgroundColor: item.subjectBgColor }]}>
                    <MaterialCommunityIcons
                      name={item.subjectIcon}
                      size={15}
                      color={item.subjectTextColor}
                      style={styles.subjectIconStyle}
                    />
                    <Text
                      style={[styles.subjectTagText, { color: item.subjectTextColor }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.subject}
                    </Text>
                  </View>

                  <View style={styles.modeContainer}>
                    <Ionicons name="videocam-outline" size={16} color="#475569" />
                    <Text style={styles.modeText}>{item.mode}</Text>
                  </View>
                </View>

                {/* Date & Time */}
                <View style={styles.dateTimeRow}>
                  <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Text style={styles.dotDivider}>•</Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                {/* Note message */}
                <View style={styles.noteContainer}>
                  <View style={styles.noteIconWrap}>
                    <Ionicons
                      name={item.noteIconName}
                      size={16}
                      color={
                        item.noteIconName === 'help-circle-outline'
                          ? '#0D9488'
                          : item.noteIconName === 'code-slash'
                          ? '#2563EB'
                          : '#94A3B8'
                      }
                    />
                  </View>
                  <Text style={styles.noteContent}>{item.note}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              {item.status === 'Pending' && (
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={styles.declineButton}
                    onPress={() => void updateRequestStatus(item.id, 'declined')}
                  >
                    <Ionicons name="close" size={18} color="#0F172A" />
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.acceptButton}
                    onPress={() => void updateRequestStatus(item.id, 'accepted')}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.acceptText}>Accept Session</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {/* --- Estimated Pipeline Card --- */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.pipelineBanner}
          onPress={() => Alert.alert('Pipeline', `Total estimated pipeline: $${pendingTotal.toFixed(2)}`)}
        >
          <View style={styles.pipelineLeft}>
            <View style={styles.pipelineIconBox}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.pipelineTitle}>Estimated Pipeline</Text>
              <Text style={styles.pipelineSub}>Pending total: ${pendingTotal.toFixed(2)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      {/* --- Bottom Navigation Bar --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setCurrentBottomTab('sessions')}
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color={currentBottomTab === 'sessions' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.bottomNavText,
              currentBottomTab === 'sessions' && styles.bottomNavTextActive,
            ]}
          >
            Sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setCurrentBottomTab('calendar')}
        >
          <Ionicons
            name="calendar-outline"
            size={22}
            color={currentBottomTab === 'calendar' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.bottomNavText,
              currentBottomTab === 'calendar' && styles.bottomNavTextActive,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setCurrentBottomTab('requests')}
        >
          <View style={styles.badgeWrapper}>
            <Ionicons
              name="albums-outline"
              size={22}
              color={currentBottomTab === 'requests' ? '#2563EB' : '#64748B'}
            />
            {pendingCount > 0 && (
              <View style={styles.navRedBadge}>
                <Text style={styles.navRedBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.bottomNavText,
              currentBottomTab === 'requests' && styles.bottomNavTextActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setCurrentBottomTab('messages')}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={22}
            color={currentBottomTab === 'messages' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.bottomNavText,
              currentBottomTab === 'messages' && styles.bottomNavTextActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setCurrentBottomTab('profile')}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={currentBottomTab === 'profile' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.bottomNavText,
              currentBottomTab === 'profile' && styles.bottomNavTextActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- Tutor Dispute Response Modal --- */}
      <Modal
        visible={Boolean(selectedDisputeForResponse)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDisputeForResponse(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 36,
            gap: 12,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
                Dispute Response ({selectedDisputeForResponse?.code})
              </Text>
              <TouchableOpacity onPress={() => setSelectedDisputeForResponse(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>STUDENT COMPLAINT</Text>
              <Text style={{ fontSize: 12.5, color: '#334155', marginTop: 2 }}>
                &ldquo;{selectedDisputeForResponse?.reason}&rdquo;
              </Text>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
              Your Official Statement to Admin
            </Text>
            <TextInput
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 14,
                padding: 12,
                height: 110,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                fontSize: 13,
                color: '#0F172A',
                textAlignVertical: 'top',
              }}
              placeholder="Explain any technical disruption, Wi-Fi outage, or agreed rescheduling details..."
              placeholderTextColor="#94A3B8"
              multiline
              value={responseStatement}
              onChangeText={setResponseStatement}
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 20,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 4,
              }}
              disabled={submittingResponse}
              onPress={async () => {
                if (!selectedDisputeForResponse || responseStatement.trim().length < 5) {
                  Alert.alert("Error", "Please provide a detailed response (at least 5 characters).");
                  return;
                }

                setSubmittingResponse(true);
                const res = await submitTutorDisputeResponse(selectedDisputeForResponse.id, responseStatement.trim());
                setSubmittingResponse(false);

                if (res.success) {
                  Alert.alert("Success", "Your statement has been submitted to Admin Moderation.");
                  setSelectedDisputeForResponse(null);
                  setResponseStatement("");
                  // Refresh active disputes
                  const tutorId = await getCurrentTutorId();
                  const updatedDisputes = await getDisputesForTutor(tutorId);
                  setActiveDisputes(updatedDisputes.filter((d) => d.status === 'pending' || d.status === 'investigating'));
                } else {
                  Alert.alert("Error", res.error || "Failed to submit response.");
                }
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' }}>
                {submittingResponse ? "Submitting..." : "Submit Explanation to Admin"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TutorBottomNav activeTab="requests" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  headerNavBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
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
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  newBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#1D4ED8',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  pillBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pillBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  studentInfoLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameMeta: {
    justifyContent: 'center',
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  subTitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  rateBox: {
    alignItems: 'flex-end',
  },
  rateAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  perHrText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  subjectTag: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subjectIconStyle: {
    marginRight: 4,
  },
  subjectTagText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  modeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dotDivider: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  timeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  noteIconWrap: {
    marginTop: 2,
  },
  noteContent: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  acceptButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0252D4',
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  pipelineBanner: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 4,
  },
  pipelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pipelineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  pipelineSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
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
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  badgeWrapper: {
    position: 'relative',
  },
  navRedBadge: {
    position: 'absolute',
    top: -4,
    right: -7,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  navRedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomNavText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
  },
  bottomNavTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});