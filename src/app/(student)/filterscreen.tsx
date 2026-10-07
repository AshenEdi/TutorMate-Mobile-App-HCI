import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
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

  // State Management
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("morning");
  const [selectedRating, setSelectedRating] = useState("4.5");

  // Histogram mock heights for price distribution
  const priceHistogram = [20, 32, 45, 80, 95, 75, 40, 25, 18];

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
            onPress={() => {
              const subjects = ["Mathematics", "Physics & Chemistry", "Computer Science", "Biology & MCAT", "SAT & Standardized"];
              const nextIdx = (subjects.indexOf(selectedSubject) + 1) % subjects.length;
              setSelectedSubject(subjects[nextIdx]);
            }}
          >
            <View style={styles.dropdownLeft}>
              <View style={styles.blueDot} />
              <Text style={styles.dropdownText}>{selectedSubject}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>
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
              <Text style={styles.selectedBadgeText}>1 Selected</Text>
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
              onPress={() => setSelectedTimeSlot("morning")}
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
                8 AM - 12 PM
              </Text>
            </TouchableOpacity>

            {/* Afternoon */}
            <TouchableOpacity
              style={[
                styles.timeBlock,
                selectedTimeSlot === "afternoon" && styles.timeBlockActive,
              ]}
              onPress={() => setSelectedTimeSlot("afternoon")}
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
                12 PM - 5 PM
              </Text>
            </TouchableOpacity>

            {/* Evening */}
            <TouchableOpacity
              style={[
                styles.timeBlock,
                selectedTimeSlot === "evening" && styles.timeBlockActive,
              ]}
              onPress={() => setSelectedTimeSlot("evening")}
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
                5 PM - 10 PM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Range Slider Representation */}
          <View style={styles.timeRangeLabels}>
            <Text style={styles.rangeLimitText}>Earliest: 08:00 AM</Text>
            <Text style={styles.rangeLimitText}>Latest: 10:00 PM</Text>
          </View>

          <View style={styles.sliderTrackBackground}>
            <View style={styles.sliderTrackActive} />
            <View style={[styles.sliderThumb, { left: "0%" }]} />
            <View style={[styles.sliderThumb, { left: "35%" }]} />
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

          {[
            { id: "4.5", score: "4.5", count: "94 tutors" },
            { id: "4.0", score: "4.0", count: "148 tutors" },
            { id: "3.5", score: "3.5", count: "172 tutors" },
          ].map((item) => {
            const isChecked = selectedRating === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.ratingOptionRow,
                  isChecked && styles.ratingOptionRowActive,
                ]}
                onPress={() => setSelectedRating(item.id)}
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

                <View style={styles.countTag}>
                  <Text style={styles.countTagText}>{item.count}</Text>
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
              <Text style={styles.pricePillText}>$20/hr — $80/hr</Text>
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
          <View style={styles.sliderTrackBackground}>
            <View
              style={[styles.sliderTrackActive, { left: "10%", width: "80%" }]}
            />
          </View>

          <View style={styles.priceMinMaxRow}>
            <Text style={styles.minMaxText}>Min: $15/hr</Text>
            <Text style={styles.minMaxText}>Max: $120/hr</Text>
          </View>
        </View>

        {/* --- SECTION 5: VETTES EXPERTS BANNER --- */}
        <View style={styles.vettedCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
            }}
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
                minPrice: "20",
                maxPrice: "80",
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
            setSelectedSubject("Mathematics");
            setSelectedTimeSlot("morning");
            setSelectedRating("4.5");
            router.push("/(student)/searchscreen");
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
    flexDirection: "row",
    alignItems: "center",
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
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
  timeRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rangeLimitText: {
    fontSize: 11,
    color: "#64748B",
  },
  sliderTrackBackground: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    position: "relative",
    justifyContent: "center",
    marginVertical: 6,
  },
  sliderTrackActive: {
    position: "absolute",
    left: 0,
    width: "35%",
    height: 6,
    backgroundColor: "#2563EB",
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#2563EB",
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
