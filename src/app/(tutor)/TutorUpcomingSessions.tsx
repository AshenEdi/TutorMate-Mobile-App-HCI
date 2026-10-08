import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import {
  formatBookingDate,
  getProfilesById,
  getTutorBookings,
  localDateString,
} from '../../lib/tutorData';

// Types
type TabType = 'upcoming' | 'past';
type BottomTabType = 'sessions' | 'calendar' | 'requests' | 'messages' | 'profile';

interface SessionItem {
  id: string;
  studentName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  subject: string;
  startsInText: string;
  dateBadgeText: string;
  dateBadgeIcon?: 'calendar-outline';
  statusBadge: 'Confirmed';
  timeSlot: string;
  deliveryType: string;
}

export default function TutorUpcomingSessionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [activeBottomNav, setActiveBottomNav] = useState<BottomTabType>('sessions');
  const [upcomingList, setUpcomingList] = useState<SessionItem[]>([]);
  const [pastCount, setPastCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadSessions = async () => {
      try {
        const bookings = await getTutorBookings();
        const profiles = await getProfilesById(bookings.map((booking) => booking.student_id));
        const today = localDateString();
        const upcoming = bookings.filter((booking) =>
          booking.session_date >= today &&
          (booking.status === 'confirmed' || booking.status === 'accepted')
        );
        if (!mounted) return;
        setUpcomingList(upcoming.map((booking) => {
          const student = booking.student_id ? profiles.get(booking.student_id) : undefined;
          return {
            id: booking.id,
            studentName: student?.full_name || booking.student_name || 'Student',
            avatarUrl: student?.avatar_url || undefined,
            isVerified: false,
            subject: booking.subject,
            startsInText: formatBookingDate(booking.session_date),
            dateBadgeText: formatBookingDate(booking.session_date),
            statusBadge: 'Confirmed' as const,
            timeSlot: `${booking.time_slot}${booking.duration ? ` (${booking.duration})` : ''}`,
            deliveryType: booking.delivery_format || 'Session',
          };
        }));
        setPastCount(bookings.filter((booking) =>
          booking.session_date < today &&
          (booking.status === 'completed' || booking.status === 'cancelled')
        ).length);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load tutor sessions:', error);
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Unable to load sessions.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadSessions();
    return () => { mounted = false; };
  }, []);

  const featuredSession = upcomingList[0] ?? null;
  const regularSessions = upcomingList.slice(1);
  const handleSessionPress = (bookingId: string) => {
    router.push(`/(tutor)/TutorBookingRequestDetails?id=${encodeURIComponent(bookingId)}`);
  };

  const handleOpenCalendar = () => {
    router.push('/(tutor)/TutorCalendar');
  };

  const handleOpenFilter = () => {
    Alert.alert('Filter', 'Filter upcoming sessions by date range, topic, or student');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- Top Header Navigation --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.headerIconBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tutor)/dashboard");
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenterLogo}>
          <Ionicons name="book" size={20} color="#FFFFFF" />
        </View>

        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.headerProfileBtn}
          onPress={() => router.push("/(tutor)/TutorProfile")}
        >
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Title & View Badge & Actions --- */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>My Sessions</Text>
            <View style={styles.tutorViewBadge}>
              <Text style={styles.tutorViewText}>Tutor View</Text>
            </View>
          </View>

          <View style={styles.titleActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.circleActionButton}
              onPress={handleOpenCalendar}
            >
              <Ionicons name="calendar-outline" size={19} color="#2563EB" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.circleActionButton}
              onPress={handleOpenFilter}
            >
              <Ionicons name="options-outline" size={20} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Segmented Control Tabs (Upcoming 4 | Past Records 18) --- */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'upcoming' && styles.tabCountPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'upcoming' && styles.tabCountTextActive,
                ]}
              >
                {upcomingList.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.tabButton, activeTab === 'past' && styles.tabButtonActive]}
            onPress={() => router.replace('/(tutor)/TutorPastsessions')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
              Past Records
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'past' && styles.tabCountPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'past' && styles.tabCountTextActive,
                ]}
              >
                {pastCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Highlighted Active Next Session Card --- */}
        {featuredSession && <View style={styles.featuredCard}>
          <View style={styles.blueLeftIndicator} />

          <View style={styles.featuredInner}>
            {/* Top status bar: Starts in 45m | Online Room */}
            <View style={styles.featuredTopRow}>
              <View style={styles.startsInPill}>
                <View style={styles.startsInDot} />
                <Text style={styles.startsInText}>{featuredSession.startsInText}</Text>
              </View>

              <View style={styles.onlineRoomGroup}>
                <Ionicons name="videocam-outline" size={17} color="#2563EB" />
                <Text style={styles.onlineRoomText}>{featuredSession.deliveryType}</Text>
              </View>
            </View>

            {/* Student Info Row */}
            <View style={styles.featuredStudentRow}>
              <View style={styles.avatarWrap}>
                {featuredSession.avatarUrl ? (
                  <Image source={{ uri: featuredSession.avatarUrl }} style={styles.featuredAvatar} />
                ) : (
                  <View style={[styles.featuredAvatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={20} color="#64748B" />
                  </View>
                )}
                {featuredSession.isVerified && (
                  <View style={styles.verifiedCheckWrap}>
                    <Ionicons name="checkmark" size={11} color="#0F766E" />
                  </View>
                )}
              </View>

              <View style={styles.featuredMeta}>
                <Text style={styles.featuredStudentName}>{featuredSession.studentName}</Text>
                <Text style={styles.featuredSubject}>{featuredSession.subject}</Text>
                <View style={styles.featuredTimeRow}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.featuredTimeSlot}>{featuredSession.timeSlot}</Text>
                </View>
              </View>
            </View>

            {/* Zoom Action Row */}
            <View style={styles.zoomButtonRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.zoomPrimaryBtn}
                onPress={() => handleSessionPress(featuredSession.id)}
              >
                <MaterialCommunityIcons name="video-plus-outline" size={20} color="#FFFFFF" />
                <Text style={styles.zoomBtnText}>Session Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.zoomArrowBtn}
                onPress={() => handleSessionPress(featuredSession.id)}
              >
                <Ionicons name="chevron-forward" size={19} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>
        </View>}

        {/* --- Regular Upcoming Sessions List --- */}
        {loading ? (
          <Text style={styles.emptyText}>Loading sessions…</Text>
        ) : errorMessage ? (
          <Text style={styles.emptyText}>{errorMessage}</Text>
        ) : upcomingList.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming sessions</Text>
        ) : regularSessions.map((item) => {
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.sessionCard}
              onPress={() => handleSessionPress(item.id)}
            >
              <View style={styles.sessionCardTop}>
                {/* Date / Day badge */}
                <View style={styles.dateTag}>
                  <Ionicons name="calendar-outline" size={13} color="#2563EB" />
                  <Text style={styles.dateTagText}>{item.dateBadgeText}</Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusTag,
                    styles.confirmedTag,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      styles.confirmedText,
                    ]}
                  >
                    {item.statusBadge}
                  </Text>
                </View>
              </View>

              {/* Student info + Right arrow */}
              <View style={styles.sessionBody}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.sessionAvatar} />
                ) : (
                  <View style={[styles.sessionAvatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={18} color="#64748B" />
                  </View>
                )}

                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionStudentName}>{item.studentName}</Text>
                  <Text style={styles.sessionSubject}>{item.subject}</Text>
                  <View style={styles.sessionTimeRow}>
                    <Ionicons name="time-outline" size={13.5} color="#64748B" />
                    <Text style={styles.sessionTimeSlot}>{item.timeSlot}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>

      {/* --- Fixed Bottom Tab Bar --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomNav('sessions')}
        >
          <View style={styles.sessionsNavIconWrap}>
            <Ionicons
              name="book"
              size={18}
              color={activeBottomNav === 'sessions' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeBottomNav === 'sessions' && styles.navLabelActive,
            ]}
          >
            Sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomNav('calendar')}
        >
          <Ionicons
            name="calendar-outline"
            size={22}
            color={activeBottomNav === 'calendar' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomNav === 'calendar' && styles.navLabelActive,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomNav('requests')}
        >
          <View style={styles.badgeWrapper}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={23}
              color={activeBottomNav === 'requests' ? '#2563EB' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeBottomNav === 'requests' && styles.navLabelActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomNav('messages')}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={21}
            color={activeBottomNav === 'messages' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomNav === 'messages' && styles.navLabelActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomNav('profile')}
        >
          <Ionicons
            name="person-circle-outline"
            size={23}
            color={activeBottomNav === 'profile' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomNav === 'profile' && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
      <TutorBottomNav activeTab="sessions" />
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
    backgroundColor: '#F8FAFC',
  },
  headerIconBtn: {
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
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  tutorViewBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tutorViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleActionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  tabCountPill: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountPillActive: {
    backgroundColor: '#1D4ED8',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },

  // Featured session card
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  blueLeftIndicator: {
    width: 5,
    backgroundColor: '#0252D4',
  },
  featuredInner: {
    flex: 1,
    padding: 16,
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  startsInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 6,
  },
  startsInDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D9488',
  },
  startsInText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  onlineRoomGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineRoomText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  featuredStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  featuredAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    paddingVertical: 24,
    color: '#64748B',
    textAlign: 'center',
  },
  verifiedCheckWrap: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  featuredMeta: {
    flex: 1,
  },
  featuredStudentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  featuredSubject: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0252D4',
    marginTop: 2,
  },
  featuredTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  featuredTimeSlot: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  zoomButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoomPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0252D4',
    borderRadius: 24,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#0252D4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  zoomBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  zoomArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Standard session cards
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  dateTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  statusTag: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  confirmedTag: {
    backgroundColor: '#CCFBF1',
  },
  rescheduledTag: {
    backgroundColor: '#FFEDD5',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  confirmedText: {
    color: '#0F766E',
  },
  rescheduledText: {
    color: '#9A3412',
  },
  sessionBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  sessionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sessionStudentName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  sessionSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0252D4',
    marginTop: 2,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sessionTimeSlot: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Weekly Goal banner
  goalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  goalSubtitle: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 2,
  },
  goalProgressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  circularTrackContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3.5,
    borderColor: '#2563EB',
    borderTopColor: '#93C5FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularSegmentTop: {
    position: 'absolute',
  },
  circularSegmentBottom: {
    position: 'absolute',
  },
  goalPercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },

  // Bottom navigation
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
  sessionsNavIconWrap: {
    width: 28,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0252D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWrapper: {
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