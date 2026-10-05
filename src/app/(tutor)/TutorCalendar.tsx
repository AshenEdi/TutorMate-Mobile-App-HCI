import {
    Feather,
    Ionicons,
    MaterialCommunityIcons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { TutorBottomNav } from '../../components/TutorBottomNav';
// In your full Supabase setup:
// import { supabase } from '@/lib/supabase';
// import { useRouter } from 'expo-router';

type BottomTab = 'sessions' | 'calendar' | 'requests' | 'messages' | 'profile';

interface WindowSchedule {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

interface CalendarCell {
  day: number | string;
  isCurrentMonth: boolean;
  status: 'available' | 'unavailable' | 'today' | 'selected';
  dotsCount?: number;
}

const STORAGE_KEY = '@tutormate_schedule_availability_v1';

export default function ManageScheduleScreen() {
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('calendar');
  const [selectedDay, setSelectedDay] = useState<number>(12);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Availability windows state for Thursday, Mar 12
  const [windows, setWindows] = useState<WindowSchedule>({
    morning: true,
    afternoon: true,
    evening: true,
  });

  // Load saved schedule settings from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[selectedDay]) {
            setWindows(parsed[selectedDay]);
          }
        }
      } catch (err) {
        console.warn('Failed to load schedule from storage:', err);
      }
    })();
  }, [selectedDay]);

  const activeBlocksCount = [windows.morning, windows.afternoon, windows.evening].filter(
    Boolean
  ).length;

  const handleSaveAvailability = async () => {
    try {
      setIsSaving(true);
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const scheduleMap = existing ? JSON.parse(existing) : {};
      scheduleMap[selectedDay] = windows;

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleMap));

      // Supabase integration example:
      // const { data: { user } } = await supabase.auth.getUser();
      // const { error } = await supabase.from('tutor_availability').upsert({
      //   tutor_id: user?.id,
      //   date: `2026-03-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`,
      //   morning_window: windows.morning,
      //   afternoon_window: windows.afternoon,
      //   evening_window: windows.evening,
      //   timezone: 'America/Los_Angeles',
      //   updated_at: new Date().toISOString(),
      // });
      // if (error) throw error;

      Alert.alert('Success', 'Availability schedule saved successfully!');
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Unable to save availability settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDay = () => {
    setWindows({
      morning: false,
      afternoon: false,
      evening: false,
    });
  };

  const handleCopyToAllThursdays = () => {
    Alert.alert(
      'Copy Schedule',
      'Apply this exact availability to all Thursdays in March 2026?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () =>
            Alert.alert('Applied', 'Schedule copied to Mar 5, 12, 19, and 26.'),
        },
      ]
    );
  };

  // Calendar Grid data matching March 2026 exactly from screenshot
  const calendarDays: CalendarCell[] = [
    // Week 1
    { day: 1, isCurrentMonth: true, status: 'available', dotsCount: 0 },
    { day: 2, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 3, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 4, isCurrentMonth: true, status: 'available', dotsCount: 0 },
    { day: 5, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 6, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 7, isCurrentMonth: true, status: 'available', dotsCount: 0 },
    // Week 2
    { day: 8, isCurrentMonth: true, status: 'available', dotsCount: 0 },
    { day: 9, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 10, isCurrentMonth: true, status: 'today', dotsCount: 2 },
    { day: 11, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 12, isCurrentMonth: true, status: 'selected', dotsCount: 3 },
    { day: 13, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 14, isCurrentMonth: true, status: 'unavailable', dotsCount: 0 },
    // Week 3
    { day: 15, isCurrentMonth: true, status: 'unavailable', dotsCount: 0 },
    { day: 16, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 17, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 18, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 19, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 20, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 21, isCurrentMonth: true, status: 'unavailable', dotsCount: 0 },
    // Week 4
    { day: 22, isCurrentMonth: true, status: 'unavailable', dotsCount: 0 },
    { day: 23, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 24, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 25, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 26, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 27, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 28, isCurrentMonth: true, status: 'unavailable', dotsCount: 0 },
    // Week 5
    { day: 29, isCurrentMonth: true, status: 'unavailable', dotsCount: 0 },
    { day: 30, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 31, isCurrentMonth: true, status: 'available', dotsCount: 1 },
    { day: 1, isCurrentMonth: false, status: 'unavailable', dotsCount: 0 },
    { day: 2, isCurrentMonth: false, status: 'unavailable', dotsCount: 0 },
    { day: 3, isCurrentMonth: false, status: 'unavailable', dotsCount: 0 },
    { day: 4, isCurrentMonth: false, status: 'unavailable', dotsCount: 0 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Top App Header --- */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerBrandBadge}>
          <Ionicons name="book" size={19} color="#FFFFFF" />
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.headerProfileBtn}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Page Header & Timezone --- */}
        <View style={styles.subheaderRow}>
          <View style={styles.titleGroup}>
            <Ionicons name="calendar-outline" size={20} color="#2563EB" />
            <Text style={styles.screenTitle}>Manage Schedule</Text>
          </View>

          <View style={styles.timezoneBadge}>
            <Ionicons name="time-outline" size={14} color="#2563EB" />
            <Text style={styles.timezoneText}>Pacific Time (PT)</Text>
          </View>
        </View>

        {/* --- Month Calendar Card --- */}
        <View style={styles.calendarCard}>
          {/* Calendar Header with Navigation Arrows */}
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.navArrowBtn}
              onPress={() => Alert.alert('Previous Month', 'Feb 2026')}
            >
              <Ionicons name="chevron-back" size={18} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} style={styles.monthSelectorBtn}>
              <Text style={styles.monthTitleText}>March 2026</Text>
              <Ionicons name="chevron-down" size={15} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.navArrowBtn}
              onPress={() => Alert.alert('Next Month', 'April 2026')}
            >
              <Ionicons name="chevron-forward" size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdayRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, index) => (
              <Text key={index} style={styles.weekdayText}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid (7 Columns) */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, idx) => {
              const isSelected = item.isCurrentMonth && item.day === selectedDay;
              const isToday = item.status === 'today';
              const isUnavailable = !item.isCurrentMonth || item.status === 'unavailable';

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  disabled={!item.isCurrentMonth}
                  onPress={() => setSelectedDay(Number(item.day))}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                    isUnavailable && styles.dayCellUnavailable,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                      isUnavailable && styles.dayTextUnavailable,
                    ]}
                  >
                    {item.day}
                  </Text>

                  {/* Indicator dots */}
                  {item.dotsCount && item.dotsCount > 0 ? (
                    <View style={styles.dotsContainer}>
                      {Array.from({ length: item.dotsCount }).map((_, dotIdx) => (
                        <View
                          key={dotIdx}
                          style={[
                            styles.indicatorDot,
                            isSelected && styles.indicatorDotWhite,
                            isToday && !isSelected && styles.indicatorDotBlue,
                          ]}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.dotsPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calendar Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendSelectedSquare} />
              <Text style={styles.legendText}>Selected</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendTodaySquare} />
              <Text style={styles.legendText}>Today</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendAvailableDot} />
              <Text style={styles.legendText}>Available</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendUnavailableSquare} />
              <Text style={styles.legendText}>Unavailable</Text>
            </View>
          </View>
        </View>

        {/* --- Day Detail & Tutoring Windows Card --- */}
        <View style={styles.detailCard}>
          {/* Day Title & Open Blocks badge */}
          <View style={styles.detailTitleRow}>
            <View>
              <Text style={styles.detailDayTitle}>
                Thursday, Mar {selectedDay}
              </Text>
              <Text style={styles.detailSubtext}>
                Set tutoring windows open for bookings
              </Text>
            </View>

            <View style={styles.openBlocksPill}>
              <Text style={styles.openBlocksText}>{activeBlocksCount} Open Blocks</Text>
            </View>
          </View>

          {/* Window 1: Morning Window */}
          <View style={styles.windowItem}>
            <View style={styles.windowLeft}>
              <View style={[styles.windowIconWrap, { backgroundColor: '#FED7AA' }]}>
                <Ionicons name="sunny-outline" size={20} color="#C2410C" />
              </View>
              <View>
                <Text style={styles.windowTitle}>Morning Window</Text>
                <Text style={styles.windowTimeText}>9:00 AM – 12:00 PM</Text>
              </View>
            </View>

            <Switch
              value={windows.morning}
              onValueChange={(val) => setWindows({ ...windows, morning: val })}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          {/* Window 2: Afternoon Window */}
          <View style={styles.windowItem}>
            <View style={styles.windowLeft}>
              <View style={[styles.windowIconWrap, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="partly-sunny-outline" size={20} color="#3730A3" />
              </View>
              <View>
                <Text style={styles.windowTitle}>Afternoon Window</Text>
                <Text style={styles.windowTimeText}>1:00 PM – 5:00 PM</Text>
              </View>
            </View>

            <Switch
              value={windows.afternoon}
              onValueChange={(val) => setWindows({ ...windows, afternoon: val })}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          {/* Window 3: Evening Window */}
          <View style={styles.windowItem}>
            <View style={styles.windowLeft}>
              <View style={[styles.windowIconWrap, { backgroundColor: '#A7F3D0' }]}>
                <Ionicons name="moon-outline" size={19} color="#065F46" />
              </View>
              <View>
                <Text style={styles.windowTitle}>Evening Window</Text>
                <Text style={styles.windowTimeText}>6:00 PM – 9:00 PM</Text>
              </View>
            </View>

            <Switch
              value={windows.evening}
              onValueChange={(val) => setWindows({ ...windows, evening: val })}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          {/* Action Row: Copy to all Thursdays & Clear Day */}
          <View style={styles.scheduleActionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.copyBtn}
              onPress={handleCopyToAllThursdays}
            >
              <Text style={styles.copyBtnText}>Copy to all Thursdays</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.clearBtn}
              onPress={handleClearDay}
            >
              <Text style={styles.clearBtnText}>Clear Day</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- High Demand Window Insights Card --- */}
        <View style={styles.demandInsightCard}>
          <View style={styles.demandLeft}>
            <View style={styles.trendCircle}>
              <Feather name="trending-up" size={19} color="#2563EB" />
            </View>
            <View style={styles.demandMeta}>
              <Text style={styles.demandTitle}>High Demand Window</Text>
              <Text style={styles.demandSubtext}>
                Thursdays receive 34% more booking requests
              </Text>
            </View>
          </View>

          <MaterialCommunityIcons name="chart-bell-curve" size={24} color="#CBD5E1" />
        </View>

        {/* --- Save Availability Primary Button --- */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.saveAvailabilityBtn}
          onPress={handleSaveAvailability}
          disabled={isSaving}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveAvailabilityBtnText}>
            {isSaving ? 'Saving Schedule...' : 'Save Availability'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- Fixed Bottom Tab Bar Navigation --- */}
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
            name="calendar"
            size={22}
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
          <View style={styles.badgeWrapper}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={23}
              color={activeBottomTab === 'requests' ? '#2563EB' : '#64748B'}
            />
            <View style={styles.redBadgeCircle}>
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
      <TutorBottomNav activeTab="calendar" />
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
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerBrandBadge: {
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
    paddingTop: 12,
    paddingBottom: 32,
  },
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  timezoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  timezoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navArrowBtn: {
    padding: 6,
  },
  monthSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#0252D4',
    shadowColor: '#0252D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    backgroundColor: '#DBEAFE',
  },
  dayCellUnavailable: {
    opacity: 0.45,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  dayTextUnavailable: {
    color: '#94A3B8',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 6,
    marginTop: 2,
  },
  dotsPlaceholder: {
    height: 6,
    marginTop: 2,
  },
  indicatorDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  indicatorDotWhite: {
    backgroundColor: '#FFFFFF',
  },
  indicatorDotBlue: {
    backgroundColor: '#1D4ED8',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSelectedSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#0252D4',
  },
  legendTodaySquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#DBEAFE',
  },
  legendAvailableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  legendUnavailableSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailDayTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  openBlocksPill: {
    backgroundColor: '#CCFBF1',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  openBlocksText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  windowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  windowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  windowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  windowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  windowTimeText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scheduleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  copyBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  clearBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  demandInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 18,
  },
  demandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trendCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demandMeta: {
    flex: 1,
  },
  demandTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  demandSubtext: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  saveAvailabilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 26,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveAvailabilityBtnText: {
    fontSize: 16,
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
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  badgeWrapper: {
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