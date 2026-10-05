import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// In production:
// import { supabase } from '@/lib/supabase';
// import { useRouter } from 'expo-router';

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

const DEFAULT_SESSION: AcceptedSessionPayload = {
  studentName: 'Marcus Sterling',
  avatarUrl:
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  subject: 'AP Calculus BC',
  dateTime: 'Tomorrow, Mar 15 • 4:00 PM – 5:00 PM',
  amountEarned: '$45.00',
  studentEmail: 'marcus.s@school.edu',
  roomLink: 'tutormate.io/room/calc-bc-882',
};

const STORAGE_KEY = '@last_accepted_session';

export default function SessionAcceptPopupScreen() {
  const [modalVisible, setModalVisible] = useState<boolean>(true);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabType>('requests');
  const [sessionData, setSessionData] = useState<AcceptedSessionPayload>(DEFAULT_SESSION);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setSessionData(JSON.parse(cached));
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SESSION));
        }
      } catch (e) {
        console.warn('AsyncStorage cache fetch error', e);
      }
    })();
  }, []);

  const handleCopyLink = () => {
    // In React Native: Clipboard.setString(sessionData.roomLink);
    Alert.alert('Link Copied', `Copied "${sessionData.roomLink}" to clipboard!`);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#718096" />

      {/* --- Blurred/Darkened Background (Simulating the screen behind modal) --- */}
      <View style={styles.underlyingScreen}>
        {/* Mock Incoming Requests Header behind backdrop */}
        <View style={styles.bgTitleRow}>
          <View style={styles.bgTitleGroup}>
            <Text style={styles.bgTitleText}>Incoming Requests</Text>
            <View style={styles.bgCountBadge}>
              <Text style={styles.bgCountText}>3 New</Text>
            </View>
          </View>
          <View style={styles.bgFilterBtn}>
            <MaterialCommunityIcons name="filter-variant" size={18} color="#2563EB" />
            <Text style={styles.bgFilterText}>Filter</Text>
          </View>
        </View>

        {/* Mock Tabs behind backdrop */}
        <View style={styles.bgSegmentContainer}>
          <View style={[styles.bgTab, styles.bgTabActive]}>
            <Text style={styles.bgTabTextActive}>Pending</Text>
            <View style={styles.bgDot} />
          </View>
          <View style={styles.bgTab}>
            <Text style={styles.bgTabText}>Accepted 8</Text>
          </View>
          <View style={styles.bgTab}>
            <Text style={styles.bgTabText}>Declined</Text>
          </View>
        </View>

        {/* Mock Pipeline Card behind backdrop */}
        <View style={styles.bgPipelineCard}>
          <View style={styles.bgPipelineLeft}>
            <View style={styles.bgPipelineIcon}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.bgPipelineTitle}>Estimated Pipeline</Text>
              <Text style={styles.bgPipelineSub}>Pending total: $150.00</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </View>
      </View>

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
              <Image source={{ uri: sessionData.avatarUrl }} style={styles.studentAvatar} />

              <View style={styles.studentMeta}>
                <Text style={styles.studentName}>{sessionData.studentName}</Text>
                <Text style={styles.subjectText}>{sessionData.subject}</Text>
                <Text style={styles.dateTimeText}>{sessionData.dateTime}</Text>
              </View>

              <View style={styles.earningsBox}>
                <Text style={styles.earnedAmount}>{sessionData.amountEarned}</Text>
                <Text style={styles.earnedLabel}>Earned</Text>
              </View>
            </View>

            {/* Calendar Invite Status Box */}
            <View style={styles.calendarInviteCard}>
              <View style={styles.calendarInviteLeft}>
                <View style={styles.inviteCheckSquare}>
                  <Ionicons name="checkmark" size={13} color="#0D9488" />
                </View>
                <View>
                  <Text style={styles.inviteTitle}>Calendar Invite Synced</Text>
                  <Text style={styles.inviteEmail}>{sessionData.studentEmail}</Text>
                </View>
              </View>

              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>

            {/* Virtual Room Link Box */}
            <View style={styles.roomLinkCard}>
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
            </View>
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
            <View style={styles.redBadge}>
              <Text style={styles.redBadgeText}>2</Text>
            </View>
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