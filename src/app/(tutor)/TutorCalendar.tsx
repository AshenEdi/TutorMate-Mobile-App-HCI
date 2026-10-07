import {
    Feather,
    Ionicons,
    MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { supabase } from '../../../lib/supabase';
import { TutorBottomNav } from '../../components/TutorBottomNav';
import { getCurrentTutorId } from '../../lib/tutorData';

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

export default function ManageScheduleScreen() {
  const router = useRouter();
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [dbAvailability, setDbAvailability] = useState<Record<number, WindowSchedule>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const shortMonthName = currentDate.toLocaleString('en-US', { month: 'short' });
  const monthYearTitle = `${monthName} ${year}`;

  // Calculate correct day of week for selected day
  const selectedFullDate = new Date(year, month, selectedDay);
  const dayOfWeekName = selectedFullDate.toLocaleDateString('en-US', { weekday: 'long' });
  const selectedDateHeaderTitle = `${dayOfWeekName}, ${shortMonthName} ${selectedDay}`;

  // Check if selected date is in the past
  const isPastDate = (() => {
    const selectedDateObj = new Date(year, month, selectedDay, 23, 59, 59);
    const now = new Date();
    return selectedDateObj < now;
  })();

  // Availability windows state
  const [windows, setWindows] = useState<WindowSchedule>({
    morning: false,
    afternoon: false,
    evening: false,
  });

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    const maxDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    setCurrentDate(newDate);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    const maxDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    setCurrentDate(newDate);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      try {
        const monthStr = String(month + 1).padStart(2, '0');
        const daysInMonthCount = new Date(year, month + 1, 0).getDate();
        const startDateStr = `${year}-${monthStr}-01`;
        const endDateStr = `${year}-${monthStr}-${String(daysInMonthCount).padStart(2, '0')}`;

        const tutorId = await getCurrentTutorId();
        const { data, error } = await supabase
          .from('tutor_availability')
          .select('date, morning_window, afternoon_window, evening_window')
          .eq('tutor_id', tutorId)
          .gte('date', startDateStr)
          .lte('date', endDateStr);
        if (error) throw error;
        if (!isMounted) return;
        const map: Record<number, WindowSchedule> = {};
        (data ?? []).forEach((row) => {
          const dayNum = Number(row.date.split('-')[2]);
          map[dayNum] = {
            morning: row.morning_window,
            afternoon: row.afternoon_window,
            evening: row.evening_window,
          };
        });
        setDbAvailability(map);
        setWindows(map[selectedDay] ?? { morning: false, afternoon: false, evening: false });
      } catch (err) {
        console.error('Failed to load tutor availability:', err);
        if (isMounted) Alert.alert('Availability error', err instanceof Error ? err.message : 'Unable to load availability.');
      }
    }

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [currentDate, selectedDay, month, year]);

  const activeBlocksCount = [windows.morning, windows.afternoon, windows.evening].filter(
    Boolean
  ).length;

  const handleSaveAvailability = async () => {
    if (isPastDate) {
      Alert.alert('Past Date', 'Availability settings cannot be changed for past dates.');
      return;
    }

    try {
      setIsSaving(true);
      const monthStr = String(month + 1).padStart(2, '0');
      const tutorId = await getCurrentTutorId();

      const dayStr = String(selectedDay).padStart(2, '0');
      const formattedDate = `${year}-${monthStr}-${dayStr}`;

      const { error } = await supabase.from('tutor_availability').upsert(
        {
          tutor_id: tutorId,
          date: formattedDate,
          morning_window: windows.morning,
          afternoon_window: windows.afternoon,
          evening_window: windows.evening,
          timezone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tutor_id,date' }
      );

      if (error) {
        console.error('Supabase availability save error:', error);
        Alert.alert('Database Error', `Failed to save to Supabase: ${error.message}`);
        return;
      }

      setDbAvailability((prev) => ({
        ...prev,
        [selectedDay]: windows,
      }));

      Alert.alert('Success', `Availability for ${monthName} ${selectedDay}, ${year} saved to database!`);
    } catch (e: any) {
      console.error('Save error:', e);
      Alert.alert('Error', e?.message || 'Unable to save availability settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDay = () => {
    if (isPastDate) {
      Alert.alert('Past Date', 'Availability settings cannot be cleared for past dates.');
      return;
    }

    setWindows({
      morning: false,
      afternoon: false,
      evening: false,
    });
  };

  const handleCopyToAllMatchingDays = async () => {
    if (isPastDate) {
      Alert.alert('Past Date', 'Availability settings cannot be copied for past dates.');
      return;
    }

    const targetDayOfWeek = selectedFullDate.getDay();
    const daysInMonthCount = new Date(year, month + 1, 0).getDate();
    const matchingDays: number[] = [];

    for (let d = 1; d <= daysInMonthCount; d++) {
      if (new Date(year, month, d).getDay() === targetDayOfWeek) {
        matchingDays.push(d);
      }
    }

    try {
      setIsSaving(true);
      const monthStr = String(month + 1).padStart(2, '0');
      const tutorId = await getCurrentTutorId();

      const rows = matchingDays.map((d) => ({
        tutor_id: tutorId,
        date: `${year}-${monthStr}-${String(d).padStart(2, '0')}`,
        morning_window: windows.morning,
        afternoon_window: windows.afternoon,
        evening_window: windows.evening,
        timezone,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('tutor_availability')
        .upsert(rows, { onConflict: 'tutor_id,date' });

      if (error) {
        Alert.alert('Database Error', `Failed to copy schedule: ${error.message}`);
        return;
      }

      const mapUpdate = { ...dbAvailability };
      matchingDays.forEach((d) => {
        mapUpdate[d] = windows;
      });
      setDbAvailability(mapUpdate);

      Alert.alert('Success', `Availability schedule copied to all ${dayOfWeekName}s in ${monthName} ${year}!`);
    } catch (e: any) {
      console.error('Copy error:', e);
      Alert.alert('Error', e?.message || 'Schedule copy failed.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic Calendar Grid data
  const calendarDays: CalendarCell[] = (() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonthCount = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonthCount = new Date(year, month, 0).getDate();
    const today = new Date();

    const cells: CalendarCell[] = [];

    // Previous Month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonthCount - i,
        isCurrentMonth: false,
        status: 'unavailable',
        dotsCount: 0,
      });
    }

    // Current Month days
    for (let d = 1; d <= daysInMonthCount; d++) {
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === d;

      const avail = dbAvailability[d];
      const dots = avail
        ? [avail.morning, avail.afternoon, avail.evening].filter(Boolean).length
        : 0;

      const statusVal: CalendarCell['status'] =
        d === selectedDay ? 'selected' : isToday ? 'today' : dots > 0 ? 'available' : 'unavailable';

      cells.push({
        day: d,
        isCurrentMonth: true,
        status: statusVal,
        dotsCount: dots,
      });
    }

    // Next Month padding
    const remainingCells = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        status: 'unavailable',
        dotsCount: 0,
      });
    }

    return cells;
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Top App Header --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.headerBackBtn}
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

        <View style={styles.headerBrandBadge}>
          <Ionicons name="book" size={19} color="#FFFFFF" />
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
              onPress={handlePrevMonth}
            >
              <Ionicons name="chevron-back" size={18} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} style={styles.monthSelectorBtn}>
              <Text style={styles.monthTitleText}>{monthYearTitle}</Text>
              <Ionicons name="chevron-down" size={15} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.navArrowBtn}
              onPress={handleNextMonth}
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
          {isPastDate && (
            <View style={styles.pastDateBanner}>
              <Ionicons name="lock-closed" size={15} color="#B45309" />
              <Text style={styles.pastDateText}>
                Past Date — Read Only (Availability Locked)
              </Text>
            </View>
          )}

          {/* Day Title & Open Blocks badge */}
          <View style={styles.detailTitleRow}>
            <View>
              <Text style={styles.detailDayTitle}>
                {selectedDateHeaderTitle}
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
              disabled={isPastDate}
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
              disabled={isPastDate}
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
              disabled={isPastDate}
              value={windows.evening}
              onValueChange={(val) => setWindows({ ...windows, evening: val })}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          {/* Action Row: Copy to all matching weekdays & Clear Day */}
          <View style={styles.scheduleActionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.copyBtn, isPastDate && styles.disabledActionBtn]}
              onPress={handleCopyToAllMatchingDays}
              disabled={isPastDate || isSaving}
            >
              <Text style={[styles.copyBtnText, isPastDate && styles.disabledActionText]}>Copy to all {dayOfWeekName}s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.clearBtn, isPastDate && styles.disabledActionBtn]}
              onPress={handleClearDay}
              disabled={isPastDate || isSaving}
            >
              <Text style={[styles.clearBtnText, isPastDate && styles.disabledActionText]}>Clear Day</Text>
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
          style={[styles.saveAvailabilityBtn, isPastDate && styles.saveBtnDisabled]}
          onPress={handleSaveAvailability}
          disabled={isSaving || isPastDate}
        >
          <Ionicons name={isPastDate ? "lock-closed-outline" : "checkmark-circle-outline"} size={20} color="#FFFFFF" />
          <Text style={styles.saveAvailabilityBtnText}>
            {isPastDate ? "Past Date (Locked)" : isSaving ? "Saving Schedule..." : "Save Availability"}
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
  pastDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pastDateText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
  },
  disabledActionBtn: {
    opacity: 0.45,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  disabledActionText: {
    color: '#94A3B8',
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
});