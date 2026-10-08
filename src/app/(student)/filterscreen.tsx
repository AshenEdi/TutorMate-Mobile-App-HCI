import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
    Alert,
    PanResponder,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SearchFilterScreen() {
  const router = useRouter();
  const filterParams = useLocalSearchParams<{
    subject?: string;
    timeSlot?: string;
    rating?: string;
    minPrice?: string;
    maxPrice?: string;
  }>();

  // State Management
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState((filterParams.subject ?? "").trim());
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState((filterParams.timeSlot ?? "").trim());
  const [selectedRating, setSelectedRating] = useState((filterParams.rating ?? "").trim());
  const [availability, setAvailability] = useState<{
    morning: string | null;
    afternoon: string | null;
    evening: string | null;
  }>({ morning: null, afternoon: null, evening: null });
  const [availabilityDates, setAvailabilityDates] = useState<string[]>([]);
  const [priceHistogram, setPriceHistogram] = useState<number[]>([]);
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 0]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 0]);
  const [priceRangePanHandlers, setPriceRangePanHandlers] = useState<
    ReturnType<typeof PanResponder.create>["panHandlers"] | null
  >(null);
  const sliderWidth = useRef(0);
  const priceBoundsRef = useRef(priceBounds);
  const selectedPriceRangeRef = useRef(selectedPriceRange);
  const activeThumbRef = useRef<"min" | "max">("min");

  useEffect(() => {
    priceBoundsRef.current = priceBounds;
    selectedPriceRangeRef.current = selectedPriceRange;
  }, [priceBounds, selectedPriceRange]);

  const getPriceRangeValue = (value: number, min: number, max: number) => {
    if (!Number.isFinite(value) || max <= min) return 0;
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  };

  const [activeMinPrice, activeMaxPrice] = selectedPriceRange;
  const minRangePercent = getPriceRangeValue(activeMinPrice, priceBounds[0], priceBounds[1]);
  const maxRangePercent = getPriceRangeValue(activeMaxPrice, priceBounds[0], priceBounds[1]);
  const activeMinPercent = Math.min(Math.max(minRangePercent, 0), 100);
  const activeMaxPercent = Math.min(Math.max(maxRangePercent, 0), 100);

  useEffect(() => {
    const updatePriceAtPosition = (locationX: number) => {
      const [minBound, maxBound] = priceBoundsRef.current;
      const width = sliderWidth.current;
      if (width <= 0 || maxBound <= minBound) return;

      const percent = Math.min(1, Math.max(0, locationX / width));
      const nextPrice = Math.round(minBound + percent * (maxBound - minBound));
      const [currentMin, currentMax] = selectedPriceRangeRef.current;
      const nextRange: [number, number] =
        activeThumbRef.current === "min"
          ? [Math.min(nextPrice, currentMax), currentMax]
          : [currentMin, Math.max(nextPrice, currentMin)];
      selectedPriceRangeRef.current = nextRange;
      setSelectedPriceRange(nextRange);
    };

    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const position = event.nativeEvent.locationX;
        const percent = sliderWidth.current > 0 ? position / sliderWidth.current : 0;
        const [minBound, maxBound] = priceBoundsRef.current;
        const [currentMin, currentMax] = selectedPriceRangeRef.current;
        const minPercent = maxBound > minBound
          ? ((currentMin - minBound) / (maxBound - minBound)) * 100
          : 0;
        const maxPercent = maxBound > minBound
          ? ((currentMax - minBound) / (maxBound - minBound)) * 100
          : 0;
        const minDistance = Math.abs(percent * 100 - minPercent);
        const maxDistance = Math.abs(percent * 100 - maxPercent);
        activeThumbRef.current = minDistance <= maxDistance ? "min" : "max";
        updatePriceAtPosition(position);
      },
      onPanResponderMove: (event) => updatePriceAtPosition(event.nativeEvent.locationX),
    });
    setPriceRangePanHandlers(responder.panHandlers);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFilterOptions() {
      try {
        const [tutorsResult, availabilityResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("specialty, hourly_rate")
            .eq("role", "tutor")
            .not("specialty", "is", null),
          supabase
            .from("tutor_availability")
            .select("date, morning_window, afternoon_window, evening_window")
            .gte("date", new Date().toISOString().split("T")[0])
            .order("date", { ascending: true }),
        ]);
        if (tutorsResult.error) throw tutorsResult.error;
        if (availabilityResult.error) throw availabilityResult.error;

        const tutorRows = tutorsResult.data ?? [];
        const distinctSubjects = Array.from(
          new Set(
            tutorRows
              .map((tutor) => tutor.specialty?.trim())
              .filter((specialty): specialty is string => Boolean(specialty)),
          ),
        );
        const rates = tutorRows
          .filter((tutor) => tutor.hourly_rate != null)
          .map((tutor) => Number(tutor.hourly_rate))
          .filter((rate) => Number.isFinite(rate) && rate >= 0);
        const minRate = rates.length ? Math.min(...rates) : 0;
        const maxRate = rates.length ? Math.max(...rates) : 0;
        const histogram = Array.from({ length: 9 }, () => 0);
        rates.forEach((rate) => {
          const bin = maxRate === minRate
            ? 0
            : Math.min(8, Math.floor(((rate - minRate) / (maxRate - minRate)) * 9));
          histogram[bin] += 1;
        });
        const maximumBinCount = Math.max(...histogram, 1);
        const scaledHistogram = histogram.map((count) =>
          count ? (count / maximumBinCount) * 95 : 0,
        );

        const rows = availabilityResult.data ?? [];
        const formatWindow = (value: unknown): string | null => {
          if (typeof value === "string") return value.trim() || null;
          if (Array.isArray(value)) {
            const values = value.map((item) =>
              typeof item === "string" ? item : JSON.stringify(item),
            );
            return values.filter(Boolean).join(", ") || null;
          }
          if (value && typeof value === "object") {
            return Object.values(value as Record<string, unknown>)
              .map(String)
              .join(" - ");
          }
          return null;
        };
        const combineWindows = (
          values: (string | null)[],
        ): string | null => {
          const uniqueWindows = Array.from(
            new Set(values.filter((value): value is string => Boolean(value))),
          );
          return uniqueWindows.length ? uniqueWindows.join(", ") : null;
        };
        const dates = Array.from(
          new Set(
            rows
              .map((row) => row.date)
              .filter((date): date is string => Boolean(date)),
          ),
        );

        if (isMounted) {
          setSubjects(distinctSubjects);
          setSelectedSubject((current) => current || distinctSubjects[0] || "");
          setAvailability({
            morning: combineWindows(rows.map((row) => formatWindow(row.morning_window))),
            afternoon: combineWindows(rows.map((row) => formatWindow(row.afternoon_window))),
            evening: combineWindows(rows.map((row) => formatWindow(row.evening_window))),
          });
          setAvailabilityDates(dates);
          setPriceBounds([minRate, maxRate]);
          const requestedMin = filterParams.minPrice?.trim()
            ? Number(filterParams.minPrice)
            : Number.NaN;
          const requestedMax = filterParams.maxPrice?.trim()
            ? Number(filterParams.maxPrice)
            : Number.NaN;
          const initialMin = Number.isFinite(requestedMin)
            ? Math.min(maxRate, Math.max(minRate, requestedMin))
            : minRate;
          const initialMax = Number.isFinite(requestedMax)
            ? Math.min(maxRate, Math.max(initialMin, requestedMax))
            : maxRate;
          setSelectedPriceRange([initialMin, initialMax]);
          setPriceHistogram(scaledHistogram);
        }
      } catch (error) {
        console.error("Failed to load tutor filter options:", error);
        Alert.alert("Error", "Unable to load tutor filters.");
      }
    }

    void loadFilterOptions();
    return () => {
      isMounted = false;
    };
  }, [filterParams.maxPrice, filterParams.minPrice]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP NAVBAR --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/(student)/searchscreen");
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.brandTitleContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="book" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitleText}>Search</Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/(student)/StudentProfile")}
        >
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- PAGE HEADER --- */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Fine-tune Your Match</Text>
            <Text style={styles.pageSubtitle}>
              Find the mentor tailored to your pace and goals.
            </Text>
          </View>
        </View>

        {/* --- SECTION 1: SUBJECT --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderTitleRow}>
              <Ionicons
                name="book-outline"
                size={18}
                color="#2563EB"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cardSectionTitle}>Subject</Text>
            </View>
            <View style={styles.coreBadge}>
              <Text style={styles.coreBadgeText}>Core</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.dropdownSelector}
            activeOpacity={0.8}
            onPress={() => setSubjectDropdownOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel={`Subject: ${selectedSubject || "No subjects available"}`}
            accessibilityState={{ expanded: subjectDropdownOpen }}
          >
            <View style={styles.dropdownLeft}>
              <View style={styles.blueDot} />
              <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode="tail">
                {selectedSubject || "No subjects available"}
              </Text>
            </View>
            <Ionicons
              name={subjectDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#64748B"
              style={styles.dropdownChevron}
            />
          </TouchableOpacity>
          {subjectDropdownOpen && subjects.length > 0 && (
            <View style={styles.subjectOptions}>
              {subjects.map((subject) => {
                const isSelected = subject === selectedSubject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={styles.subjectOption}
                    onPress={() => {
                      setSelectedSubject(subject);
                      setSubjectDropdownOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.subjectOptionText,
                        isSelected && styles.subjectOptionTextSelected,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {subject}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* --- SECTION 2: AVAILABILITY --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderTitleRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color="#2563EB"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cardSectionTitle}>Availability</Text>
            </View>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>
                {availabilityDates.length} Dates
              </Text>
            </View>
          </View>

          {/* Time Blocks */}
          <View style={styles.timeBlocksRow}>
            {/* Morning */}
            <TouchableOpacity
              style={[
                styles.timeBlock,
                selectedTimeSlot === "morning" && styles.timeBlockActive,
              ]}
              onPress={() =>
                setSelectedTimeSlot((current) => current === "morning" ? "" : "morning")
              }
            >
              <Ionicons
                name="sunny-outline"
                size={22}
                color={selectedTimeSlot === "morning" ? "#FFFFFF" : "#1E293B"}
              />
              <Text
                style={[
                  styles.timeBlockTitle,
                  selectedTimeSlot === "morning" && styles.timeBlockTitleActive,
                ]}
              >
                Morning
              </Text>
              <Text
                style={[
                  styles.timeBlockSub,
                  selectedTimeSlot === "morning" && styles.timeBlockSubActive,
                ]}
              >
                {availability.morning || "No availability"}
              </Text>
            </TouchableOpacity>

            {/* Afternoon */}
            <TouchableOpacity
              style={[
                styles.timeBlock,
                selectedTimeSlot === "afternoon" && styles.timeBlockActive,
              ]}
              onPress={() =>
                setSelectedTimeSlot((current) => current === "afternoon" ? "" : "afternoon")
              }
            >
              <Ionicons
                name="sunny"
                size={22}
                color={selectedTimeSlot === "afternoon" ? "#FFFFFF" : "#1E293B"}
              />
              <Text
                style={[
                  styles.timeBlockTitle,
                  selectedTimeSlot === "afternoon" &&
                    styles.timeBlockTitleActive,
                ]}
              >
                Afternoon
              </Text>
              <Text
                style={[
                  styles.timeBlockSub,
                  selectedTimeSlot === "afternoon" && styles.timeBlockSubActive,
                ]}
              >
                {availability.afternoon || "No availability"}
              </Text>
            </TouchableOpacity>

            {/* Evening */}
            <TouchableOpacity
              style={[
                styles.timeBlock,
                selectedTimeSlot === "evening" && styles.timeBlockActive,
              ]}
              onPress={() =>
                setSelectedTimeSlot((current) => current === "evening" ? "" : "evening")
              }
            >
              <Ionicons
                name="moon-outline"
                size={20}
                color={selectedTimeSlot === "evening" ? "#FFFFFF" : "#1E293B"}
              />
              <Text
                style={[
                  styles.timeBlockTitle,
                  selectedTimeSlot === "evening" && styles.timeBlockTitleActive,
                ]}
              >
                Evening
              </Text>
              <Text
                style={[
                  styles.timeBlockSub,
                  selectedTimeSlot === "evening" && styles.timeBlockSubActive,
                ]}
              >
                {availability.evening || "No availability"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* --- SECTION 3: TUTOR RATING --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderTitleRow}>
            <Ionicons
              name="star"
              size={18}
              color="#D97706"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.cardSectionTitle}>Tutor Rating</Text>
          </View>

          {["4.5", "4.0", "3.5"].map((score) => {
            const item = { id: score, score };
            const isChecked = selectedRating === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.ratingOptionRow,
                  isChecked && styles.ratingOptionRowActive,
                ]}
                onPress={() =>
                  setSelectedRating((current) => current === item.id ? "" : item.id)
                }
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      isChecked && styles.checkboxChecked,
                    ]}
                  >
                    {isChecked && (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    )}
                  </View>

                  <Text style={styles.ratingScoreText}>{item.score}</Text>

                  {/* Star Rating Group */}
                  <View style={styles.starsGroup}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= 4
                            ? "star"
                            : star === 5 && item.id === "4.5"
                              ? "star-half"
                              : "star"
                        }
                        size={14}
                        color="#D97706"
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>

                  <Text style={styles.aboveText}>& above</Text>
                </View>

              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- SECTION 4: PRICE RANGE --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderTitleRow}>
              <Ionicons
                name="cash-outline"
                size={18}
                color="#2563EB"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cardSectionTitle}>Price Range</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>
                ${activeMinPrice.toFixed(0)}/hr — ${activeMaxPrice.toFixed(0)}/hr
              </Text>
            </View>
          </View>

          {/* Histogram Chart */}
          <View style={styles.histogramContainer}>
            {priceHistogram.map((height, idx) => {
              const isHighlighted = idx >= 3 && idx <= 5;
              return (
                <View
                  key={idx}
                  style={[
                    styles.histogramBar,
                    { height: height * 0.4 },
                    isHighlighted ? styles.barActive : styles.barInactive,
                  ]}
                />
              );
            })}
          </View>

          {/* Range Track */}
          <View
            style={styles.sliderTrackContainer}
            onLayout={(event) => {
              sliderWidth.current = event.nativeEvent.layout.width;
            }}
            {...(priceRangePanHandlers ?? {})}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Hourly price range"
            accessibilityHint="Drag or tap to adjust the minimum and maximum hourly price"
            accessibilityValue={{
              min: priceBounds[0],
              max: priceBounds[1],
              now: activeMinPrice,
              text: `$${activeMinPrice} to $${activeMaxPrice} per hour`,
            }}
          >
            <View style={styles.sliderTrackBackground}>
              <View
                style={[
                  styles.sliderTrackActive,
                  {
                    left: `${Math.min(activeMinPercent, activeMaxPercent)}%`,
                    width: `${Math.max(8, Math.abs(activeMaxPercent - activeMinPercent))}%`,
                  },
                ]}
              />
              <View style={[styles.sliderHandle, { left: `${activeMinPercent}%` }]} />
              <View style={[styles.sliderHandle, { left: `${activeMaxPercent}%` }]} />
            </View>
          </View>

          <View style={styles.priceMinMaxRow}>
            <Text style={styles.minMaxText}>Min: ${activeMinPrice.toFixed(0)}/hr</Text>
            <Text style={styles.minMaxText}>Max: ${activeMaxPrice.toFixed(0)}/hr</Text>
          </View>
        </View>

        {/* --- SECTION 5: VETTES EXPERTS BANNER --- */}
        <View style={styles.vettedCard}>
          <Ionicons
            name="people-outline"
            size={40}
            color="#2563EB"
            style={styles.vettedAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.vettedTitle}>All Vetted Experts</Text>
            <Text style={styles.vettedSubtitle}>
              Background checked & verified alumni.
            </Text>
          </View>
          <View style={styles.verifiedCheckCircle}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        </View>

        {/* --- BOTTOM ACTION BUTTONS --- */}
        <TouchableOpacity
          style={styles.applyBtn}
          activeOpacity={0.85}
          onPress={() => {
            router.push({
              pathname: "/(student)/searchscreen",
              params: {
                subject: selectedSubject,
                timeSlot: selectedTimeSlot,
                rating: selectedRating,
                minPrice: String(activeMinPrice),
                maxPrice: String(activeMaxPrice),
              },
            });
          }}
        >
          <Text style={styles.applyBtnText}>Apply Filters</Text>
          <View style={styles.tutorsCountBadge}>
            <Text style={styles.tutorsCountText}>(Applied)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            setSelectedSubject(subjects[0] || "");
            setSelectedTimeSlot("");
            setSelectedRating("");
            router.push({
              pathname: "/(student)/searchscreen",
              params: {
                subject: "",
                timeSlot: "",
                rating: "",
                minPrice: "",
                maxPrice: "",
              },
            });
          }}
        >
          <Text style={styles.resetBtnText}>Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        {[
          { name: "Home", icon: "school-outline", active: false },
          { name: "Search", icon: "search", active: true },
          { name: "Sessions", icon: "calendar-outline", active: false },
          { name: "Messages", icon: "chatbox-outline", active: false },
          { name: "Profile", icon: "person-outline", active: false },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (tab.name === "Home") router.push("/(student)/dashboard");
              else if (tab.name === "Search") router.push("/(student)/searchscreen");
              else if (tab.name === "Sessions") router.push("/(student)/MySessions");
              else if (tab.name === "Messages") router.push("/(student)/MessagesInbox");
              else if (tab.name === "Profile") router.push("/(student)/StudentProfile");
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={tab.active ? "#2563EB" : "#9CA3AF"}
            />
            <Text
              style={[styles.tabLabel, tab.active && styles.tabLabelActive]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  coreBadge: {
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coreBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F766E",
  },
  selectedBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
  },
  dropdownSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginRight: 10,
  },
  dropdownText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  dropdownChevron: {
    flexShrink: 0,
    marginLeft: 8,
  },
  subjectOptions: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    overflow: "hidden",
  },
  subjectOption: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  subjectOptionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: "#334155",
  },
  subjectOptionTextSelected: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
  timeBlocksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeBlock: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 3,
  },
  timeBlockActive: {
    backgroundColor: "#0256D0",
  },
  timeBlockTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 6,
  },
  timeBlockTitleActive: {
    color: "#FFFFFF",
  },
  timeBlockSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  timeBlockSubActive: {
    color: "#BFDBFE",
  },
  sliderTrackContainer: {
    marginTop: 10,
    marginBottom: 8,
    paddingVertical: 10,
  },
  sliderTrackBackground: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    position: "relative",
    justifyContent: "center",
    overflow: "visible",
  },
  sliderTrackActive: {
    position: "absolute",
    height: 6,
    backgroundColor: "#2563EB",
    borderRadius: 3,
  },
  sliderHandle: {
    position: "absolute",
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#2563EB",
    marginLeft: -9,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  ratingOptionRowActive: {
    backgroundColor: "#EFF6FF",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  ratingScoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginRight: 6,
  },
  starsGroup: {
    flexDirection: "row",
    marginRight: 4,
  },
  aboveText: {
    fontSize: 12,
    color: "#64748B",
  },
  countTag: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countTagText: {
    fontSize: 11,
    color: "#475569",
  },
  pricePill: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pricePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
  },
  histogramContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 45,
    marginTop: 10,
    marginBottom: 4,
  },
  histogramBar: {
    width: 22,
    borderRadius: 4,
  },
  barActive: {
    backgroundColor: "#2563EB",
  },
  barInactive: {
    backgroundColor: "#E0E7FF",
  },
  priceMinMaxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  minMaxText: {
    fontSize: 11,
    color: "#64748B",
  },
  vettedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  vettedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  vettedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  vettedSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  verifiedCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0D9488",
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0256D0",
    borderRadius: 24,
    paddingVertical: 14,
    marginBottom: 10,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginRight: 6,
  },
  tutorsCountBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tutorsCountText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  resetBtn: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 10,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  tabItem: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
