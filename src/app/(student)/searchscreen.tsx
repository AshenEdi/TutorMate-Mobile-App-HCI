import { FontAwesome5, Ionicons } from "@expo/vector-icons";
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

const TUTORS: Tutor[] = [
  {
    id: "1",
    name: "Dr. Sarah Jenkins",
    title: "AP Calculus & Algebra",
    rating: 4.9,
    reviews: 128,
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    statusBadge: {
      text: "Available Today • 3 Slots",
      icon: "calendar-outline",
      bgColor: "#CCFBF1",
      textColor: "#0F766E",
      hasOnlineDot: true,
    },
    degreeBadge: {
      text: "Ph.D. Princeton",
      icon: "school-outline",
      bgColor: "#E0E7FF",
      textColor: "#3730A3",
    },
    hourlyRate: 45,
    points: 128,
  },
  {
    id: "2",
    name: "Elena Rostova",
    title: "Organic Chemistry & Bio",
    rating: 4.8,
    reviews: 94,
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    isVerified: true,
    statusBadge: {
      text: "Tomorrow • 10:00 AM",
      icon: "time-outline",
      bgColor: "#DBEAFE",
      textColor: "#1E40AF",
    },
    degreeBadge: {
      text: "MCAT Specialist",
      icon: "ribbon-outline",
      bgColor: "#E0E7FF",
      textColor: "#3730A3",
    },
    hourlyRate: 40,
    points: 30,
  },
  {
    id: "3",
    name: "David Kim, M.S.",
    title: "Computer Science & Python",
    rating: 5.0,
    reviews: 210,
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    isVerified: true,
    statusBadge: {
      text: "Next Mon • Flexible",
      icon: "calendar-outline",
      bgColor: "#E0E7FF",
      textColor: "#3730A3",
    },
    degreeBadge: {
      text: "Top Rated",
      icon: "flame-outline",
      bgColor: "#FEF3C7",
      textColor: "#92400E",
    },
    hourlyRate: 55,
    points: 40,
  },
];

export default function TutorSearchScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP NAVBAR --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.brandIcon}>
          <Ionicons name="book" size={18} color="#FFFFFF" />
        </View>

        <TouchableOpacity style={styles.profileButton}>
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
            Showing 3 verified mentor matches
          </Text>
          <TouchableOpacity style={styles.sortButton}>
            <Ionicons name="swap-vertical" size={14} color="#2563EB" />
            <Text style={styles.sortText}>Best Match</Text>
          </TouchableOpacity>
        </View>

        {/* --- TUTOR LIST CARDS --- */}
        {TUTORS.map((tutor) => (
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
                <TouchableOpacity style={styles.flagButton}>
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
                <View style={styles.pointsBadge}>
                  <Ionicons name="star" size={12} color="#D97706" />
                  <Text style={styles.pointsText}>{tutor.points}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => router.push("/(student)/SessionBooking")}
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
        ))}
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
          <TouchableOpacity key={tab.name} style={styles.tabItem}>
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
});
