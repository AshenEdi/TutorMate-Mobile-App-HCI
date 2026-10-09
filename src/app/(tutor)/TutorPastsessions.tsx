import {
    Feather,
    FontAwesome,
    Ionicons,
    MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
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
import { TutorHeader } from '../../components/TutorHeader';
import {
  formatBookingDate,
  getCurrentTutorId,
  getProfilesById,
  getTutorBookings,
  localDateString,
} from '../../lib/tutorData';
import { getDisputesForTutor } from '../../services/disputeService';

// --- Type Definitions ---
type MainTab = 'upcoming' | 'past';
type BottomTab = 'sessions' | 'calendar' | 'requests' | 'messages' | 'profile';

interface PastSessionRecord {
  id: string;
  studentName: string;
  avatarUrl?: string;
  initials?: string;
  isVerified?: boolean;
  subject: string;
  sessionMode: string;
  dateStr: string;
  timeStr: string;
  status: 'Completed' | 'Cancelled' | 'Declined';
  payoutAmount: string;
  payoutStatus: string;
  // Dynamic card content
  rating?: number;
  reviewComment?: string;
  reviewAuthorTag?: string;
  leftRatingTag?: string;
  whiteboardFiles?: { name: string; type: 'pdf' | 'attachment' }[];
  summaryNote?: string;
  cancellationPolicyNotice?: string;
  hasSessionNotes?: boolean;
  hasReceipt?: boolean;
  hasWhiteboardView?: boolean;
  hasFollowUpMsg?: boolean;
}

export default function TutorPastSessionsScreen() {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('past');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterChip, setSelectedFilterChip] = useState('All Subjects');
  const [records, setRecords] = useState<PastSessionRecord[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadRecords = async () => {
      try {
        const tutorId = await getCurrentTutorId();
        const [bookings, disputes] = await Promise.all([
          getTutorBookings(),
          getDisputesForTutor(tutorId),
        ]);

        const disputesMap = new Map(disputes.map((d) => [d.booking_id || d.booking_ref, d]));

        const today = localDateString();
        setUpcomingCount(bookings.filter((booking) =>
          booking.session_date >= today &&
          (booking.status === 'accepted' || booking.status === 'confirmed')
        ).length);
        const pastBookings = bookings.filter((booking) =>
          booking.status === 'completed' ||
          booking.status === 'cancelled' ||
          booking.status === 'declined' ||
          booking.session_date < today
        );
        const profiles = await getProfilesById(pastBookings.map((booking) => booking.student_id));
        if (!mounted) return;
        setRecords(pastBookings.map((booking) => {
          const student = booking.student_id ? profiles.get(booking.student_id) : undefined;
          const total = Number(booking.total_price ?? 0);
          const dispute = disputesMap.get(booking.id) || (booking.booking_ref ? disputesMap.get(booking.booking_ref) : undefined);

          let payoutStatus = 'Payout completed';
          if (dispute) {
            if (dispute.status === 'pending' || dispute.status === 'investigating') {
              payoutStatus = `Escrow Held (${dispute.code})`;
            } else if (dispute.decision === 'full_refund') {
              payoutStatus = 'Refunded to Student';
            } else if (dispute.decision === 'partial_refund') {
              payoutStatus = 'Partial Split ($20.00 Released)';
            } else if (dispute.decision === 'dismiss') {
              payoutStatus = 'Payout Released (Dispute Dismissed)';
            }
          }

          return {
            id: booking.id,
            studentName: student?.full_name || booking.student_name || 'Student',
            avatarUrl: student?.avatar_url || undefined,
            subject: booking.subject,
            sessionMode: booking.delivery_format || '',
            dateStr: formatBookingDate(booking.session_date),
            timeStr: `${booking.time_slot}${booking.duration ? ` (${booking.duration})` : ''}`,
            status: booking.status === 'declined'
              ? 'Declined'
              : booking.status === 'cancelled'
                ? 'Cancelled'
                : 'Completed',
            payoutAmount: `$${total.toFixed(2)}`,
            payoutStatus,
            hasSessionNotes: Boolean(booking.focus_notes),
            summaryNote: booking.focus_notes || undefined,
          };
        }));
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load tutor past sessions:', error);
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Unable to load past sessions.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadRecords();
    return () => { mounted = false; };
  }, []);

  const completedRecords = records.filter((record) => record.status === 'Completed');
  const completedHours = completedRecords.reduce((sum, record) => {
    const match = record.timeStr.match(/\((\d+)\s*(?:m|min|mins|minutes|h|hr|hrs|hours?)\)/i);
    if (!match) return sum;
    const duration = Number(match[1]);
    return /h|hr|hour/i.test(match[0]) ? sum + duration : sum + duration / 60;
  }, 0);
  const completedSessionValue = completedRecords.reduce(
    (sum, record) => sum + Number(record.payoutAmount.replace(/[^0-9.]/g, '') || 0),
    0
  );

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.subject.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedFilterChip === 'All Subjects') return matchSearch;
      if (selectedFilterChip === 'Calculus') {
        return matchSearch && rec.subject.toLowerCase().includes('calc');
      }
      if (selectedFilterChip === 'Chemistry') {
        return matchSearch && rec.subject.toLowerCase().includes('chem');
      }
      return matchSearch;
    });
  }, [records, searchQuery, selectedFilterChip]);

  const handleExport = (format: 'CSV' | 'PDF') => {
    Alert.alert('Export Records', `Exporting tutoring earnings report as ${format}...`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- Top Global Header --- */}
      <TutorHeader title="Sessions" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Term Header Row (Tutor View & Action Buttons) --- */}
        <View style={styles.termRow}>
          <View style={styles.termBadgeWrap}>
            <View style={styles.tutorViewPill}>
              <View style={styles.blueDot} />
              <Text style={styles.tutorViewText}>TUTOR VIEW</Text>
            </View>
            <Text style={styles.termLabel}>{new Date().getFullYear()} tutoring history</Text>
          </View>

          <View style={styles.termActionBtns}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.termRoundBtn}
              onPress={() => handleExport('CSV')}
            >
              <Feather name="download" size={17} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.termRoundBtn}
              onPress={() => Alert.alert('Calendar', 'Opening Term Schedule Calendar')}
            >
              <Ionicons name="calendar-outline" size={17} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Top Toggle Tabs: Upcoming (4) | Past Records (18) --- */}
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.toggleBtn, activeMainTab === 'upcoming' && styles.toggleBtnActive]}
            onPress={() => router.replace('/(tutor)/TutorUpcomingSessions')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeMainTab === 'upcoming' && styles.toggleBtnTextActive,
              ]}
            >
              Upcoming
            </Text>
            <View
              style={[
                styles.countBadge,
                activeMainTab === 'upcoming' ? styles.countBadgeActive : styles.countBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  activeMainTab === 'upcoming' && styles.countBadgeTextActive,
                ]}
              >
                {upcomingCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.toggleBtn, activeMainTab === 'past' && styles.toggleBtnActive]}
            onPress={() => setActiveMainTab('past')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeMainTab === 'past' && styles.toggleBtnTextActive,
              ]}
            >
              Past Records
            </Text>
            <View
              style={[
                styles.countBadge,
                activeMainTab === 'past' ? styles.countBadgeActive : styles.countBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  activeMainTab === 'past' && styles.countBadgeTextActive,
                ]}
              >
                {records.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Lifetime Teaching Record Dashboard Card --- */}
        <View style={styles.lifetimeCard}>
          <View style={styles.lifetimeHeader}>
            <View style={styles.lifetimeTitleGroup}>
              <View style={styles.lifetimeIconWrap}>
                <Ionicons name="trending-up" size={18} color="#2563EB" />
              </View>
              <Text style={styles.lifetimeTitle}>Past Teaching Record</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Alert.alert('Teaching record', `${records.length} past sessions`)}
            >
              <Text style={styles.viewAnalyticsLink}>View Analytics</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            {/* Stat 1: Taught */}
            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <Ionicons name="time-outline" size={13} color="#2563EB" />
                <Text style={styles.statLabel}>Taught</Text>
              </View>
              <View style={styles.statNumberRow}>
                <Text style={styles.statBigNumber}>{completedHours.toFixed(1)}</Text>
                <Text style={styles.statUnit}>hrs</Text>
              </View>
              <Text style={styles.statSubText}>{completedRecords.length} completed sessions</Text>
            </View>

            {/* Stat 2: Payout */}
            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <MaterialCommunityIcons name="wallet-outline" size={13} color="#0D9488" />
                <Text style={styles.statLabel}>Session value</Text>
              </View>
              <Text style={styles.statBigNumber}>${completedSessionValue.toFixed(2)}</Text>
              <Text style={styles.statSubText}>Completed booking totals</Text>
            </View>

            {/* Stat 3: Rating */}
            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <FontAwesome name="star" size={12} color="#D97706" />
                <Text style={styles.statLabel}>Cancelled</Text>
              </View>
              <Text style={styles.statBigNumber}>{records.filter((record) => record.status === 'Cancelled').length}</Text>
              <Text style={styles.statSubText}>Bookings</Text>
            </View>
          </View>
        </View>

        {/* --- Search Bar with Filter Icon --- */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or topic..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.searchFilterBtn}
            onPress={() => Alert.alert('Filter', 'Filter options')}
          >
            <MaterialCommunityIcons name="tune-variant" size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* --- Horizontal Filter Pills --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {/* All Subjects Dropdown */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.pillButton,
              selectedFilterChip === 'All Subjects' ? styles.pillActive : styles.pillInactive,
            ]}
            onPress={() => setSelectedFilterChip('All Subjects')}
          >
            <Text
              style={[
                styles.pillText,
                selectedFilterChip === 'All Subjects' && styles.pillTextActive,
              ]}
            >
              All Subjects
            </Text>
            <Ionicons
              name="caret-down"
              size={11}
              color={selectedFilterChip === 'All Subjects' ? '#FFFFFF' : '#475569'}
            />
          </TouchableOpacity>

          {/* Date Range Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.pillInactive}
            onPress={() => Alert.alert('Date Range', 'Select date range')}
          >
            <Ionicons name="calendar-outline" size={13} color="#475569" />
            <Text style={styles.pillText}>{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
          </TouchableOpacity>

          {/* Calculus Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.pillButton,
              selectedFilterChip === 'Calculus' ? styles.pillActive : styles.pillInactive,
            ]}
            onPress={() =>
              setSelectedFilterChip(selectedFilterChip === 'Calculus' ? 'All Subjects' : 'Calculus')
            }
          >
            <Text
              style={[
                styles.pillText,
                selectedFilterChip === 'Calculus' && styles.pillTextActive,
              ]}
            >
              Calculus
            </Text>
          </TouchableOpacity>

          {/* Chemistry Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.pillButton,
              selectedFilterChip === 'Chemistry' ? styles.pillActive : styles.pillInactive,
            ]}
            onPress={() =>
              setSelectedFilterChip(
                selectedFilterChip === 'Chemistry' ? 'All Subjects' : 'Chemistry'
              )
            }
          >
            <Text
              style={[
                styles.pillText,
                selectedFilterChip === 'Chemistry' && styles.pillTextActive,
              ]}
            >
              Chemistry
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- Past Session Cards List --- */}
        {loading ? (
          <Text style={styles.emptyText}>Loading past sessions…</Text>
        ) : errorMessage ? (
          <Text style={styles.emptyText}>{errorMessage}</Text>
        ) : filteredRecords.length === 0 ? (
          <Text style={styles.emptyText}>No past sessions found</Text>
        ) : filteredRecords.map((item) => {
          const isCancelled = item.status !== 'Completed';

          return (
            <View key={item.id} style={styles.sessionCard}>
              {/* Card Header Row: Date & Status Pill */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="calendar-outline" size={15} color="#475569" />
                  <Text style={styles.cardDateText}>{item.dateStr}</Text>
                  <Text style={styles.cardDotDivider}>•</Text>
                  <Text style={styles.cardTimeText}>{item.timeStr}</Text>
                </View>

                {isCancelled ? (
                  <View style={styles.cancelledBadge}>
                    <Ionicons name="close-circle-outline" size={13} color="#475569" />
                    <Text style={styles.cancelledBadgeText}>{item.status}</Text>
                  </View>
                ) : (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle-outline" size={13} color="#0D9488" />
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                )}
              </View>

              {/* Student Info & Payout Header */}
              <View style={styles.studentPayoutRow}>
                <View style={styles.studentInfoGroup}>
                  {item.avatarUrl ? (
                    <View style={styles.avatarWrap}>
                      <Image source={{ uri: item.avatarUrl }} style={styles.studentAvatar} />
                      {item.isVerified && (
                        <View style={styles.verifiedBadgeCircle}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.initialsAvatar}>
                      <Ionicons name="person" size={18} color="#64748B" />
                    </View>
                  )}

                  <View style={styles.nameMeta}>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <View style={styles.subjectTagsRow}>
                      <View style={styles.subjectTag}>
                        <Text style={styles.subjectTagText}>{item.subject}</Text>
                      </View>
                      {item.sessionMode ? (
                        <Text style={styles.sessionModeText}>{item.sessionMode}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={styles.payoutGroup}>
                  <Text
                    style={[
                      styles.payoutAmount,
                      isCancelled && styles.payoutAmountCancelled,
                    ]}
                  >
                    {item.payoutAmount}
                  </Text>
                  <Text style={styles.payoutStatusText}>{item.payoutStatus}</Text>
                </View>
              </View>

              {/* Conditional Card Section 1: Marcus Sterling Review Quote */}
              {item.reviewComment && (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewTopRow}>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesome
                          key={star}
                          name="star"
                          size={13}
                          color="#D97706"
                          style={{ marginRight: 2 }}
                        />
                      ))}
                      <Text style={styles.ratingNumberText}>{item.rating?.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.reviewAuthorTag}>{item.reviewAuthorTag}</Text>
                  </View>
                  <Text style={styles.reviewCommentText}>{item.reviewComment}</Text>
                </View>
              )}

              {/* Conditional Card Section 2: Whiteboard PDF Attachments (Sarah Lin) */}
              {item.whiteboardFiles && (
                <View style={styles.whiteboardPillsRow}>
                  {item.whiteboardFiles.map((file, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      style={styles.attachmentChip}
                      onPress={() => Alert.alert('File', `Opening ${file.name}`)}
                    >
                      {file.type === 'pdf' ? (
                        <MaterialCommunityIcons name="file-pdf-box" size={17} color="#2563EB" />
                      ) : (
                        <Feather name="paperclip" size={14} color="#2563EB" />
                      )}
                      <Text style={styles.attachmentChipText}>{file.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Conditional Card Section 3: Covered Topic Note (Emily Watson) */}
              {item.summaryNote && (
                <View style={styles.summaryNoteBox}>
                  <Feather
                    name="align-left"
                    size={14}
                    color="#475569"
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text style={styles.summaryNoteText}>{item.summaryNote}</Text>
                </View>
              )}

              {/* Conditional Card Section 4: Cancellation Policy Note (David Kim) */}
              {item.cancellationPolicyNotice && (
                <View style={styles.cancellationNoticeBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={17}
                    color="#64748B"
                    style={{ marginTop: 1, marginRight: 8 }}
                  />
                  <Text style={styles.cancellationNoticeText}>
                    {item.cancellationPolicyNotice}
                  </Text>
                </View>
              )}

              {/* Bottom Actions Row for Marcus Sterling: View Notes & Receipt */}
              {item.hasSessionNotes && (
                <View style={styles.cardActionsSplit}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.inlineActionBtn}
                    onPress={() => Alert.alert('Session Notes', 'Opening full notes viewer')}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#2563EB" />
                    <Text style={styles.inlineActionBtnText}>View Session Notes</Text>
                  </TouchableOpacity>

                  {item.hasReceipt && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.receiptPillBtn}
                      onPress={() => Alert.alert('Receipt', 'Downloading payout receipt')}
                    >
                      <Ionicons name="receipt-outline" size={14} color="#334155" />
                      <Text style={styles.receiptPillBtnText}>Receipt</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Bottom Actions Row for Sarah Lin: View Whiteboard & Follow-up */}
              {item.hasWhiteboardView && (
                <View style={styles.cardActionsSplit}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.inlineActionBtn}
                    onPress={() => Alert.alert('Whiteboard', 'Opening synced whiteboard')}
                  >
                    <Ionicons name="eye-outline" size={16} color="#2563EB" />
                    <Text style={styles.inlineActionBtnText}>View Whiteboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.followUpBtn}
                    onPress={() => Alert.alert('Messages', 'Composing follow-up message')}
                  >
                    <Feather name="send" size={13} color="#2563EB" />
                    <Text style={styles.followUpBtnText}>Follow-up Message</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom Actions Row for Emily Watson: Left Rating & Receipt */}
              {item.leftRatingTag && (
                <View style={styles.cardActionsSplit}>
                  <View style={styles.leftRatingRow}>
                    <FontAwesome name="star" size={13} color="#D97706" />
                    <Text style={styles.leftRatingText}>{item.leftRatingTag}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.receiptPillBtn}
                    onPress={() => Alert.alert('Receipt', 'Downloading payout receipt')}
                  >
                    <Ionicons name="receipt-outline" size={14} color="#334155" />
                    <Text style={styles.receiptPillBtnText}>Receipt</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* --- Export Earnings & Records Banner --- */}
        <View style={styles.exportBanner}>
          <View style={styles.exportBannerLeft}>
            <View style={styles.exportDownloadCircle}>
              <Feather name="download" size={18} color="#2563EB" />
            </View>
            <View style={styles.exportMeta}>
              <Text style={styles.exportTitle}>Export Earnings & Records</Text>
              <Text style={styles.exportSubtitle}>
                Monthly report for taxes and tutoring credits
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.exportFormatBtn}
            onPress={() => handleExport('CSV')}
          >
            <Text style={styles.exportFormatBtnText}>CSV / PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- Fixed Bottom Tab Bar Navigation --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveBottomTab('sessions')}
        >
          <View style={styles.activeSessionsIconWrap}>
            <Ionicons
              name="book"
              size={18}
              color={activeBottomTab === 'sessions' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.bottomNavLabel,
              activeBottomTab === 'sessions' && styles.bottomNavLabelActive,
            ]}
          >
            Sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveBottomTab('calendar')}
        >
          <Ionicons
            name="calendar-outline"
            size={22}
            color={activeBottomTab === 'calendar' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.bottomNavLabel,
              activeBottomTab === 'calendar' && styles.bottomNavLabelActive,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveBottomTab('requests')}
        >
          <View style={styles.requestsBadgeWrapper}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={23}
              color={activeBottomTab === 'requests' ? '#2563EB' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.bottomNavLabel,
              activeBottomTab === 'requests' && styles.bottomNavLabelActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveBottomTab('messages')}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={21}
            color={activeBottomTab === 'messages' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.bottomNavLabel,
              activeBottomTab === 'messages' && styles.bottomNavLabelActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setActiveBottomTab('profile')}
        >
          <Ionicons
            name="person-circle-outline"
            size={23}
            color={activeBottomTab === 'profile' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.bottomNavLabel,
              activeBottomTab === 'profile' && styles.bottomNavLabelActive,
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
  emptyText: {
    paddingVertical: 24,
    color: '#64748B',
    textAlign: 'center',
  },
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
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenterBrand: {
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
    paddingTop: 8,
    paddingBottom: 28,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  termBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tutorViewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  tutorViewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.4,
  },
  termLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  termActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countBadgeActive: {
    backgroundColor: '#1D4ED8',
  },
  countBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
  lifetimeCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0EFFF',
  },
  lifetimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lifetimeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lifetimeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifetimeTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAnalyticsLink: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  statNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statBigNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statUnit: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  statGrowthPositive: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 2,
  },
  statSubText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  searchFilterBtn: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  filterPillsScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  pillActive: {
    backgroundColor: '#0252D4',
  },
  pillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
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
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardDateText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDotDivider: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  cardTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  studentPayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  studentInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  initialsAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  nameMeta: {
    marginLeft: 10,
    flex: 1,
  },
  studentName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  subjectTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  subjectTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  sessionModeText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  payoutGroup: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  payoutAmount: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  payoutAmountCancelled: {
    color: '#475569',
  },
  payoutStatusText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 4,
  },
  reviewAuthorTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  reviewCommentText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
    fontStyle: 'italic',
  },
  whiteboardPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  attachmentChipText: {
    fontSize: 11.5,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  summaryNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  summaryNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  cancellationNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  cancellationNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  cardActionsSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  receiptPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  receiptPillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  followUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  followUpBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  leftRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  leftRatingText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  exportBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  exportDownloadCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportMeta: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  exportFormatBtn: {
    backgroundColor: '#0252D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  exportFormatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  activeSessionsIconWrap: {
    width: 28,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0252D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestsBadgeWrapper: {
    position: 'relative',
  },
  redBadgeCircle: {
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
  bottomNavLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
  },
  bottomNavLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});