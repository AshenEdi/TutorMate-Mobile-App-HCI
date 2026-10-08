import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
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
} from "react-native";

// --- TYPES ---
interface CategoryPill {
  id: string;
  label: string;
  icon?: string;
  iconType?: "ionicons" | "font-awesome";
}

interface Tutor {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  avatar: string;
  isVerified?: boolean;
  statusBadge: {
    text: string;
    icon: string;
    bgColor: string;
    textColor: string;
    hasOnlineDot?: boolean;
  };
  degreeBadge: {
    text: string;
    icon: string;
    bgColor: string;
    textColor: string;
  };
  hourlyRate: number;
  points: number;
  availabilityWindows?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

// --- MOCK DATA ---
const CATEGORIES: CategoryPill[] = [
  { id: "1", label: "All Subjects" },
  { id: "2", label: "Math", icon: "calculator-outline", iconType: "ionicons" },
  { id: "3", label: "Sciences", icon: "flask", iconType: "font-awesome" },
  {
    id: "4",
    label: "Coding",
    icon: "code-slash-outline",
    iconType: "ionicons",
  },
];

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

export default function TutorSearchScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    subject?: string;
    timeSlot?: string;
    rating?: string;
    minPrice?: string;
    maxPrice?: string;
  }>();

  const [activeCategory, setActiveCategory] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [tutorsList, setTutorsList] = useState<Tutor[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchTutorsAndAvailability() {
      try {
        // 1. Fetch saved local profiles from AsyncStorage
        let savedEditProfile: any = null;
        let savedProfile: any = null;
        try {
          const editStr = await AsyncStorage.getItem('@tutormate_tutor_edit_profile');
          if (editStr) savedEditProfile = JSON.parse(editStr);
          const profStr = await AsyncStorage.getItem('@tutormate_tutor_profile');
          if (profStr) savedProfile = JSON.parse(profStr);
        } catch {}

        // 2. Fetch current logged-in auth user
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // 3. Fetch ALL tutor profiles explicitly using select('*')
        const { data: dbProfilesRaw, error: dbProfilesError } = await supabase
          .from('profiles')
          .select('*');

        if (dbProfilesError) {
          console.warn("[searchscreen] Supabase profiles fetch error:", dbProfilesError.message);
        }

        // 4. Calculate local dates (today & tomorrow YMD)
        const now = new Date();
        const todayY = now.getFullYear();
        const todayM = String(now.getMonth() + 1).padStart(2, '0');
        const todayD = String(now.getDate()).padStart(2, '0');
        const todayYMD = `${todayY}-${todayM}-${todayD}`;

        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomY = tomorrow.getFullYear();
        const tomM = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const tomD = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowYMD = `${tomY}-${tomM}-${tomD}`;

        // 5. Fetch availability from Supabase starting from today
        const { data: availData } = await supabase
          .from('tutor_availability')
          .select('*')
          .gte('date', todayYMD)
          .order('date', { ascending: true });

        const mapByTutor: Record<string, any[]> = {};

        if (availData) {
          availData.forEach((row: any) => {
            if (!mapByTutor[row.tutor_id]) mapByTutor[row.tutor_id] = [];
            mapByTutor[row.tutor_id].push(row);
          });
        }

        // 6. Merge availability from AsyncStorage schedule keys
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          const schedKeys = allKeys.filter((k) => k.startsWith('@tutormate_schedule_availability_v1'));
          const currentTutorId = currentUser?.id || 'demo-tutor-1';

          for (const key of schedKeys) {
            const parts = key.split('_');
            if (parts.length >= 6) {
              const y = parts[4];
              const m = parts[5];
              const val = await AsyncStorage.getItem(key);
              if (val) {
                const dayMap = JSON.parse(val);
                Object.keys(dayMap).forEach((dNumStr) => {
                  const dNum = parseInt(dNumStr, 10);
                  const windows = dayMap[dNumStr];
                  const dStr = String(dNum).padStart(2, '0');
                  const dateYMD = `${y}-${m}-${dStr}`;

                  if (dateYMD >= todayYMD && (windows.morning || windows.afternoon || windows.evening)) {
                    if (!mapByTutor[currentTutorId]) mapByTutor[currentTutorId] = [];
                    const existingIdx = mapByTutor[currentTutorId].findIndex((r) => r.date === dateYMD);
                    const rowObj = {
                      tutor_id: currentTutorId,
                      date: dateYMD,
                      morning_window: windows.morning,
                      afternoon_window: windows.afternoon,
                      evening_window: windows.evening,
                    };
                    if (existingIdx >= 0) {
                      mapByTutor[currentTutorId][existingIdx] = rowObj;
                    } else {
                      mapByTutor[currentTutorId].push(rowObj);
                    }
                  }
                });
              }
            }
          }
        } catch (e) {
          console.warn("AsyncStorage availability parsing warning:", e);
        }

        function calculateStatusBadge(tutorId: string) {
          const rows = mapByTutor[tutorId] || [];
          const todayRow = rows.find((r) => r.date === todayYMD);

          if (todayRow) {
            const slots = [todayRow.morning_window, todayRow.afternoon_window, todayRow.evening_window].filter(Boolean).length;
            if (slots > 0) {
              return {
                text: `Available Today • ${slots} Slot${slots > 1 ? 's' : ''}`,
                icon: "calendar-outline",
                bgColor: "#CCFBF1",
                textColor: "#0F766E",
                hasOnlineDot: true,
              };
            }
          }

          const tomorrowRow = rows.find((r) => r.date === tomorrowYMD);
          if (tomorrowRow) {
            const slots = [tomorrowRow.morning_window, tomorrowRow.afternoon_window, tomorrowRow.evening_window].filter(Boolean).length;
            if (slots > 0) {
              return {
                text: `Tomorrow • ${slots} Slot${slots > 1 ? 's' : ''}`,
                icon: "time-outline",
                bgColor: "#DBEAFE",
                textColor: "#1E40AF",
                hasOnlineDot: false,
              };
            }
          }

          const upcomingRow = rows.find((r) => {
            const slots = [r.morning_window, r.afternoon_window, r.evening_window].filter(Boolean).length;
            return slots > 0;
          });

          if (upcomingRow) {
            const [y, m, d] = upcomingRow.date.split('-');
            const dateFormatted = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const slots = [upcomingRow.morning_window, upcomingRow.afternoon_window, upcomingRow.evening_window].filter(Boolean).length;
            return {
              text: `${dateFormatted} • ${slots} Slot${slots > 1 ? 's' : ''}`,
              icon: "calendar-outline",
              bgColor: "#E0E7FF",
              textColor: "#3730A3",
              hasOnlineDot: false,
            };
          }

          return {
            text: "Flexible • Contact",
            icon: "calendar-outline",
            bgColor: "#F1F5F9",
            textColor: "#64748B",
            hasOnlineDot: false,
          };
        }

        // 7. Build a lookup map: profileId → profile row
        const profileMap: Record<string, any> = {};
        (dbProfilesRaw || []).forEach((p: any) => {
          profileMap[p.id] = p;
        });

        // 8. Collect all tutor IDs to display:
        //    • Profiles with role='tutor'
        //    • Any tutor_id that appears in availability (may not have profile row yet)
        const tutorIdSet = new Set<string>();
        (dbProfilesRaw || []).forEach((p: any) => {
          if (p.role && p.role.toLowerCase() === 'tutor') tutorIdSet.add(p.id);
        });
        Object.keys(mapByTutor).forEach((tid) => tutorIdSet.add(tid));
        // Fallback: no tutors found → show all profiles
        if (tutorIdSet.size === 0 && (dbProfilesRaw || []).length > 0) {
          (dbProfilesRaw || []).forEach((p: any) => tutorIdSet.add(p.id));
        }
        const tutorIds = Array.from(tutorIdSet);

        const mergedList: Tutor[] = tutorIds.map((tid, idx) => {
          const p = profileMap[tid] || {};
          const statusBadge = calculateStatusBadge(tid);
          const isCurrentUser = !!(currentUser && currentUser.id === tid);

          // Name resolution priority:
          // 1. DB full_name (written by EditTutorProfile upsert)
          // 2. DB name field
          // 3. Auth user metadata (set at signup)
          // 4. AsyncStorage edit profile
          // 5. AsyncStorage saved profile
          // 6. Email username from DB or auth
          // 7. Generic fallback
          const tutorName =
            p.full_name ||
            p.name ||
            (isCurrentUser ? (currentUser?.user_metadata?.full_name ?? null) : null) ||
            (isCurrentUser ? (savedEditProfile?.fullName ?? null) : null) ||
            (isCurrentUser ? (savedProfile?.fullName ?? null) : null) ||
            (p.email ? p.email.split('@')[0] : null) ||
            (isCurrentUser && currentUser?.email ? currentUser.email.split('@')[0] : null) ||
            savedEditProfile?.fullName ||
            savedProfile?.fullName ||
            `Tutor ${idx + 1}`;

          // Title / specialty
          const tutorTitle =
            p.specialty ||
            (Array.isArray(p.subjects) ? p.subjects.join(', ') : p.subjects) ||
            p.title ||
            p.bio ||
            (isCurrentUser ? (savedEditProfile?.bio ?? null) : null) ||
            'AP Calculus & STEM Specialist';

          // Degree
          const tutorDegree =
            p.education ||
            p.degree ||
            p.degree_credentials ||
            (isCurrentUser ? (savedEditProfile?.degreeCredentials ?? null) : null) ||
            (isCurrentUser ? (savedProfile?.degree ?? null) : null) ||
            'Certified Educator';

          // Rate
          let tutorRate = Number(p.hourly_rate) || 0;
          if (!tutorRate && isCurrentUser) tutorRate = Number(savedEditProfile?.hourlyRate) || 0;
          if (!tutorRate) tutorRate = 45 + idx * 5;

          // Avatar
          const tutorAvatar =
            p.avatar_url ||
            (isCurrentUser ? (savedEditProfile?.avatarUrl ?? null) : null) ||
            (isCurrentUser ? (savedProfile?.avatarUrl ?? null) : null) ||
            DEFAULT_AVATAR;

          const tutorRows = mapByTutor[tid] || [];
          const hasMorning = tutorRows.some((r) => r.morning_window);
          const hasAfternoon = tutorRows.some((r) => r.afternoon_window);
          const hasEvening = tutorRows.some((r) => r.evening_window);

          return {
            id: tid,
            name: tutorName,
            title: tutorTitle,
            rating: Number(p.rating) || 4.9,
            reviews: Number(p.reviews) || 128,
            avatar: tutorAvatar,
            isVerified: true,
            statusBadge,
            degreeBadge: {
              text: tutorDegree,
              icon: 'school-outline',
              bgColor: '#E0E7FF',
              textColor: '#3730A3',
            },
            hourlyRate: tutorRate,
            points: Number(p.points) || 128,
            availabilityWindows: {
              morning: hasMorning,
              afternoon: hasAfternoon,
              evening: hasEvening,
            },
          };
        });

        if (isMounted) {
          setTutorsList(mergedList);
        }
      } catch (err) {
        console.warn("Failed to fetch tutors and availability for search screen:", err);
      }
    }

    fetchTutorsAndAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTutors = tutorsList.filter((tutor) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.degreeBadge.text.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Apply route filter parameters from filterscreen.tsx
    if (searchParams.rating) {
      const minRating = parseFloat(searchParams.rating);
      if (!isNaN(minRating) && tutor.rating < minRating) return false;
    }

    if (searchParams.minPrice) {
      const minP = parseFloat(searchParams.minPrice);
      if (!isNaN(minP) && tutor.hourlyRate < minP) return false;
    }

    if (searchParams.maxPrice) {
      const maxP = parseFloat(searchParams.maxPrice);
      if (!isNaN(maxP) && tutor.hourlyRate > maxP) return false;
    }

    if (searchParams.timeSlot && tutor.availabilityWindows) {
      const slot = searchParams.timeSlot as 'morning' | 'afternoon' | 'evening';
      if (slot && !tutor.availabilityWindows[slot]) {
        return false;
      }
    }

    if (activeCategory === "1") return true;

    const catObj = CATEGORIES.find((c) => c.id === activeCategory);
    if (!catObj) return true;

    const catLabel = catObj.label.toLowerCase();
    const tutorText = `${tutor.title} ${tutor.degreeBadge.text}`.toLowerCase();

    if (catLabel.includes("math")) {
      return tutorText.includes("math") || tutorText.includes("calc") || tutorText.includes("algeb") || tutorText.includes("stat");
    }
    if (catLabel.includes("science")) {
      return tutorText.includes("chem") || tutorText.includes("bio") || tutorText.includes("physic") || tutorText.includes("scien") || tutorText.includes("mcat");
    }
    if (catLabel.includes("coding")) {
      return tutorText.includes("cod") || tutorText.includes("python") || tutorText.includes("comput") || tutorText.includes("java") || tutorText.includes("web");
    }

    return tutorText.includes(catLabel);
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP NAVBAR --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(student)/dashboard")}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.brandIcon}>
          <Ionicons name="book" size={18} color="#FFFFFF" />
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
        {/* --- SEARCH & FILTER BAR --- */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#94A3B8"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search subjects, skills, or tutors..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => router.push("/(student)/filterscreen")}
          >
            <Ionicons name="options-outline" size={20} color="#0284C7" />
            <View style={styles.filterActiveDot} />
          </TouchableOpacity>
        </View>

        {/* --- CATEGORY TABS --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                {cat.icon &&
                  (cat.iconType === "font-awesome" ? (
                    <FontAwesome5
                      name={cat.icon}
                      size={12}
                      color={isActive ? "#FFFFFF" : "#475569"}
                      style={styles.pillIcon}
                    />
                  ) : (
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={isActive ? "#FFFFFF" : "#475569"}
                      style={styles.pillIcon}
                    />
                  ))}
                <Text
                  style={[
                    styles.categoryLabel,
                    isActive && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- RESULTS SUBHEADER --- */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            Showing {filteredTutors.length} verified mentor match{filteredTutors.length !== 1 ? 'es' : ''}
          </Text>
          <TouchableOpacity style={styles.sortButton}>
            <Ionicons name="swap-vertical" size={14} color="#2563EB" />
            <Text style={styles.sortText}>Best Match</Text>
          </TouchableOpacity>
        </View>

        {/* --- TUTOR LIST CARDS --- */}
        {filteredTutors.map((tutor) => {
          return (
            <View key={tutor.id} style={styles.card}>
              {/* Header: Profile, Name & Flags */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: tutor.avatar }} style={styles.avatar} />
                  {tutor.isVerified && (
                    <View style={styles.verifiedCheck}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={styles.tutorDetails}>
                  <Text style={styles.tutorName}>{tutor.name}</Text>
                  <Text style={styles.tutorTitle}>{tutor.title}</Text>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#D97706" />
                    <Text style={styles.ratingValue}>
                      {tutor.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingDot}>•</Text>
                    <Text style={styles.reviewsText}>
                      {tutor.reviews} reviews
                    </Text>
                  </View>
                </View>

                {/* Action Buttons: Flag & Bookmark */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.flagButton}
                    onPress={() => router.push("/(student)/SubmitReport")}
                  >
                    <Ionicons name="flag-outline" size={14} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={() => toggleBookmark(tutor.id)}
                  >
                    <Ionicons
                      name={bookmarks[tutor.id] ? "bookmark" : "bookmark-outline"}
                      size={16}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                {/* Status Badge */}
                <View style={styles.badgeWrapper}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: tutor.statusBadge.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={tutor.statusBadge.icon as any}
                      size={12}
                      color={tutor.statusBadge.textColor}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        { color: tutor.statusBadge.textColor },
                      ]}
                    >
                      {tutor.statusBadge.text}
                    </Text>
                  </View>
                  {tutor.statusBadge.hasOnlineDot && (
                    <View style={styles.onlineDot} />
                  )}
                </View>

              {/* Degree / Extra Badge */}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: tutor.degreeBadge.bgColor },
                ]}
              >
                <Ionicons
                  name={tutor.degreeBadge.icon as any}
                  size={12}
                  color={tutor.degreeBadge.textColor}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: tutor.degreeBadge.textColor },
                  ]}
                >
                  {tutor.degreeBadge.text}
                </Text>
              </View>
            </View>

            {/* Footer: Rate & Action Button */}
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.rateLabel}>Hourly Rate</Text>
                <Text style={styles.rateAmount}>
                  ${tutor.hourlyRate}
                  <Text style={styles.rateUnit}> /hr</Text>
                </Text>
              </View>

              <View style={styles.footerRight}>
                <TouchableOpacity 
                  onPress={() => router.push("/(student)/TutorReviews")}
                  activeOpacity={0.7}
                >
                  <View style={styles.pointsBadge}>
                    <Ionicons name="star" size={12} color="#D97706" />
                    <Text style={styles.pointsText}>{tutor.points}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => router.push({ pathname: "/(student)/SessionBooking", params: { tutorId: tutor.id } })}
                >
                  <Text style={styles.bookButtonText}>Book Session</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
        {filteredTutors.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={48} color="#94A3B8" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No Tutors Available</Text>
            <Text style={styles.emptySubtitle}>
              No verified tutors found matching your search query or selected category.
            </Text>
          </View>
        )}
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
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 14,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    position: "relative",
  },
  filterActiveDot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#0D9488",
  },
  categoriesContainer: {
    paddingBottom: 16,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: "#0284C7",
  },
  pillIcon: {
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  categoryLabelActive: {
    color: "#FFFFFF",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  resultsText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  verifiedCheck: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0D9488",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  tutorDetails: {
    flex: 1,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  tutorTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 4,
  },
  ratingDot: {
    fontSize: 12,
    color: "#CBD5E1",
    marginHorizontal: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: "#64748B",
  },
  cardActions: {
    flexDirection: "row",
  },
  flagButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  bookmarkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  badgeWrapper: {
    position: "relative",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  onlineDot: {
    position: "absolute",
    bottom: -3,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0D9488",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  rateLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  rateAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  rateUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748B",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 4,
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0256D0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
