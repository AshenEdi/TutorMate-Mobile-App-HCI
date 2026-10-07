import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// Supabase Integration note:
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient('SUPABASE_URL', 'SUPABASE_ANON_KEY');

// --- Types ---
type TabType = 'Pending' | 'Accepted' | 'Declined';
type BottomTabType = 'sessions' | 'calendar' | 'requests' | 'messages' | 'profile';

interface BookingRequest {
  id: string;
  studentName: string;
  avatarUrl: string;
  isOnline: boolean;
  badgeType?: 'verified' | 'star';
  subTitle: string;
  ratePerHour: number;
  rateLabel: 'Standard Rate' | 'Advanced Topic';
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

// --- Initial Mock Data ---
const INITIAL_REQUESTS: BookingRequest[] = [
  {
    id: '1',
    studentName: 'Marcus Sterling',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    isOnline: true,
    badgeType: 'verified',
    subTitle: 'Grade 12 • 4 sessions completed',
    ratePerHour: 45,
    rateLabel: 'Standard Rate',
    subject: 'AP Calculus BC',
    subjectIcon: 'sigma',
    subjectBgColor: '#EBF4FF',
    subjectTextColor: '#1D4ED8',
    mode: 'Online Video',
    date: 'Tomorrow, Mar 15',
    time: '4:00 PM – 5:00 PM',
    note: '"Need urgent prep for Series & Power Series convergence tests for Friday\'s midterm!"',
    noteIconName: 'document-text-outline',
    status: 'Pending',
  },
  {
    id: '2',
    studentName: 'Emily Watson',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isOnline: true,
    badgeType: 'star',
    subTitle: 'College Soph. • New Student',
    ratePerHour: 55,
    rateLabel: 'Advanced Topic',
    subject: 'Organic Chemistry I',
    subjectIcon: 'flask-outline',
    subjectBgColor: '#CCFBF1',
    subjectTextColor: '#0F766E',
    mode: 'Online Video',
    date: 'Thu, Mar 16',
    time: '6:30 PM – 7:30 PM',
    note: '"Looking for someone to walk through SN1 vs SN2 reaction mechanisms step by step."',
    noteIconName: 'help-circle-outline',
    status: 'Pending',
  },
  {
    id: '3',
    studentName: 'Jason Liu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isOnline: false,
    subTitle: 'Adult Learner • Career Transition',
    ratePerHour: 50,
    rateLabel: 'Standard Rate',
    subject: 'Python Data Structures',
    subjectIcon: 'code-tags',
    subjectBgColor: '#FEF3C7',
    subjectTextColor: '#B45309',
    mode: 'Online Video',
    date: 'Sat, Mar 18',
    time: '11:00 AM – 12:00 PM',
    note: '"Working on binary search trees and recursion logic for upcoming coding interview."',
    noteIconName: 'code-slash',
    status: 'Pending',
  },
];

const STORAGE_KEY = '@tutor_booking_requests_cache';

export default function TutorBookingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Pending');
  const [currentBottomTab, setCurrentBottomTab] = useState<BottomTabType>('requests');
  const [requests, setRequests] = useState<BookingRequest[]>(INITIAL_REQUESTS);

  // Load cached data or fall back to initial
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setRequests(JSON.parse(cached));
        }
      } catch (e) {
        console.error('Failed to load cached requests:', e);
      }
    })();
  }, []);

  const saveRequests = async (updated: BookingRequest[]) => {
    setRequests(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist requests:', e);
    }
  };

  const handleAccept = async (id: string) => {
    // Supabase mutation example:
    // await supabase.from('bookings').update({ status: 'Accepted' }).eq('id', id);
    const updated = requests.map((item) =>
      item.id === id ? { ...item, status: 'Accepted' as TabType } : item
    );
    await saveRequests(updated);
    Alert.alert('Session Accepted', 'Session has been confirmed and scheduled.');
  };

  const handleDecline = async (id: string) => {
    // Supabase mutation example:
    // await supabase.from('bookings').update({ status: 'Declined' }).eq('id', id);
    const updated = requests.map((item) =>
      item.id === id ? { ...item, status: 'Declined' as TabType } : item
    );
    await saveRequests(updated);
    Alert.alert('Session Declined', 'Request has been declined.');
  };

  const visibleRequests = requests.filter((r) => r.status === activeTab);
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const acceptedCount = requests.filter((r) => r.status === 'Accepted').length;
  const pendingTotal = requests
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + r.ratePerHour, 0);

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
              <Text style={styles.pillBadgeText}>{acceptedCount > 0 ? acceptedCount : 8}</Text>
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
        {visibleRequests.length === 0 ? (
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
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    <View
                      style={[
                        styles.presenceDot,
                        { backgroundColor: item.isOnline ? '#0D9488' : '#94A3B8' },
                      ]}
                    />
                  </View>

                  <View style={styles.nameMeta}>
                    <View style={styles.nameRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push(
                            `/(tutor)/TutorBookingRequestDetails?status=${item.status.toLowerCase()}`
                          )
                        }
                      >
                        <Text style={styles.nameText}>{item.studentName}</Text>
                      </TouchableOpacity>
                      {item.badgeType === 'verified' && (
                        <Ionicons name="checkmark-circle" size={17} color="#2563EB" />
                      )}
                      {item.badgeType === 'star' && (
                        <MaterialCommunityIcons name="star-circle" size={18} color="#0D9488" />
                      )}
                    </View>
                    <Text style={styles.subTitleText}>{item.subTitle}</Text>
                  </View>
                </View>

                <View style={styles.rateBox}>
                  <Text style={styles.rateAmount}>
                    ${item.ratePerHour}
                    <Text style={styles.perHrText}>/hr</Text>
                  </Text>
                  <Text
                    style={[
                      styles.rateBadgeText,
                      { color: item.rateLabel === 'Standard Rate' ? '#059669' : '#B45309' },
                    ]}
                  >
                    {item.rateLabel}
                  </Text>
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
                    <Text style={[styles.subjectTagText, { color: item.subjectTextColor }]}>
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
                    onPress={() => handleDecline(item.id)}
                  >
                    <Ionicons name="close" size={18} color="#0F172A" />
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item.id)}
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
          onPress={() => Alert.alert('Pipeline', `Total estimated pipeline: $${pendingTotal}.00`)}
        >
          <View style={styles.pipelineLeft}>
            <View style={styles.pipelineIconBox}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.pipelineTitle}>Estimated Pipeline</Text>
              <Text style={styles.pipelineSub}>Pending total: ${pendingTotal}.00</Text>
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
                <Text style={styles.navRedBadgeText}>2</Text>
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
    marginBottom: 10,
  },
  subjectTag: {
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
    fontSize: 12,
    fontWeight: '700',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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