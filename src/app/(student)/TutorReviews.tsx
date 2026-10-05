import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

// --- MOCK DATA ---
const TUTOR = {
  name: "Dr. Sarah Jenkins",
  title: "AP Calculus & Multivariable Specialist",
  degree: "Ph.D. Applied Math • MIT Alum",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  rating: 4.9,
  reviewsCount: 128,
  rate: "$45",
  nextSlot: "Next slot today 4 PM",
};

const RATING_DISTRIBUTION = [
  { stars: 5, percentage: 88 },
  { stars: 4, percentage: 9 },
  { stars: 3, percentage: 2 },
  { stars: 2, percentage: 1 },
  { stars: 1, percentage: 0 },
];

const STATS = [
  { icon: "thumbs-up-outline", value: "98%", label: "Recommend" },
  { icon: "time-outline", value: "99%", label: "On-time" },
  { icon: "flash-outline", value: "<15m", label: "Reply" },
];

const REVIEWS = [
  {
    id: "1",
    user: "Maya A.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    verified: true,
    stars: 5,
    subject: "AP Calculus BC",
    time: "2 days ago",
    text: "Dr. Sarah explained Taylor Series and differential equations better in one hour than my lecture did all month! Got an A on my midterm after being completely lost. Her visual diagrams are pure magic.",
    tags: ["Taylor Series", "ODEs"],
    likes: 24,
  },
  {
    id: "2",
    user: "Liam T.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    verified: true,
    stars: 5,
    subject: "College Freshman",
    time: "1 week ago",
    text: "Super structured notes and sent high-yield practice problems right after our call. Highly recommended for university-level calculus! She doesn't just give answers, she builds true intuition.",
    tags: ["PDF Notes Shared"],
    likes: 18,
  },
  {
    id: "3",
    user: "Sophia R.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
    verified: true,
    stars: 5,
    subject: "High School Junior",
    time: "2 weeks ago",
    text: "Very patient and encouraging. Solved tough integration by parts techniques step by step. I used to panic during timed tests, but she showed me a calming breakdown routine.",
    tags: ["Anxiety Relief"],
    likes: 11,
  },
];

export default function TutorReviewsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP HEADER BAR --- */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tutor Profile Detail</Text>
        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => router.push("/(student)/StudentProfile")}
        >
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- TUTOR INFO CARD --- */}
        <View style={styles.card}>
          <View style={styles.tutorHeader}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: TUTOR.avatar }} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.tutorMainInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.tutorName}>{TUTOR.name}</Text>
                <View style={styles.topRatedBadge}>
                  <Text style={styles.topRatedText}>Top Rated</Text>
                </View>
              </View>
              <Text style={styles.tutorTitle}>{TUTOR.title}</Text>
              <View style={styles.degreeRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.degreeText}>{TUTOR.degree}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- RATING BREAKDOWN CARD --- */}
        <View style={styles.card}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingLeft}>
              <Text style={styles.bigRating}>{TUTOR.rating}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={16} color="#D97706" />
                ))}
              </View>
              <Text style={styles.reviewsCountText}>{TUTOR.reviewsCount} Reviews</Text>
            </View>

            <View style={styles.ratingRight}>
              {RATING_DISTRIBUTION.map((item) => (
                <View key={item.stars} style={styles.distRow}>
                  <Text style={styles.distLabel}>{item.stars}</Text>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${item.percentage}%`, backgroundColor: item.percentage > 0 ? "#2563EB" : "#F1F5F9" }
                      ]} 
                    />
                  </View>
                  <Text style={styles.distPercentage}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            {STATS.map((stat, idx) => (
              <View key={idx} style={styles.statBadge}>
                <Ionicons name={stat.icon as any} size={18} color="#2563EB" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- STUDENT FEEDBACK HEADER --- */}
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackTitle}>Student Feedback</Text>
          <Text style={styles.totalReviewsText}>{TUTOR.reviewsCount} Total</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
          <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}>
            <Text style={[styles.filterPillText, styles.filterPillTextActive]}>All (128)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterPillText}>5 Star</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterPillText}>With Photos</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- REVIEW CARDS --- */}
        {REVIEWS.map((review) => (
          <View key={review.id} style={styles.card}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewUserRow}>
                <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                <View style={styles.reviewUserInfo}>
                  <View style={styles.reviewNameRow}>
                    <Text style={styles.reviewName}>{review.user}</Text>
                    {review.verified && (
                      <View style={styles.reviewVerifiedBadge}>
                        <Ionicons name="checkmark" size={8} color="#10B981" style={{ marginRight: 2 }} />
                        <Text style={styles.reviewVerifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reviewSubText}>{review.subject} • {review.time}</Text>
                </View>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={14} color="#D97706" />
                ))}
              </View>
            </View>

            <Text style={styles.reviewText}>{review.text}</Text>

            <View style={styles.reviewFooter}>
              <View style={styles.tagContainer}>
                {review.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Ionicons name="bookmark-outline" size={10} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.likeContainer}>
                <Ionicons name="thumbs-up-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.likeText}>{review.likes}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* --- VERIFIED INFO CARD --- */}
        <View style={styles.verifiedInfoCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#2563EB" style={styles.verifiedInfoIcon} />
          <View style={styles.verifiedInfoTextContainer}>
            <Text style={styles.verifiedInfoTitle}>100% Verified Reviews</Text>
            <Text style={styles.verifiedInfoDesc}>
              Only students who complete verified live lessons with Dr. Sarah can submit a review.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* --- FIXED BOTTOM BOOKING BAR --- */}
      <View style={styles.bookingBar}>
        <View style={styles.bookingLeft}>
          <Image source={{ uri: TUTOR.avatar }} style={styles.smallAvatar} />
          <View style={styles.bookingPriceInfo}>
            <Text style={styles.bookingPrice}>{TUTOR.rate}<Text style={styles.bookingUnit}>/hr</Text></Text>
            <View style={styles.bookingSlotRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.bookingSlotText}>{TUTOR.nextSlot}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookSessionBtn}
          onPress={() => router.push("/(student)/SessionBooking")}
        >
          <Text style={styles.bookSessionText}>Book Session</Text>
          <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/dashboard")}>
          <Ionicons name="home-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/searchscreen")}>
          <Ionicons name="search" size={22} color="#2563EB" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/MySessions")}>
          <Ionicons name="calendar-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Sessions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/MessagesInbox")}>
          <Ionicons name="chatbox-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push("/(student)/StudentProfile")}>
          <Ionicons name="person-outline" size={22} color="#9CA3AF" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 160,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  tutorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  tutorMainInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tutorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  topRatedBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  topRatedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  tutorTitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  degreeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  degreeText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: "row",
  },
  ratingLeft: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
  },
  bigRating: {
    fontSize: 40,
    fontWeight: "800",
    color: "#0F172A",
  },
  starsRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  reviewsCountText: {
    fontSize: 12,
    color: "#64748B",
  },
  ratingRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: "center",
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  distLabel: {
    fontSize: 12,
    color: "#64748B",
    width: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  distPercentage: {
    fontSize: 11,
    color: "#64748B",
    width: 30,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBadge: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 9,
    color: "#64748B",
    textTransform: "uppercase",
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  totalReviewsText: {
    fontSize: 13,
    color: "#64748B",
  },
  filterPills: {
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: "#2563EB",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reviewUserInfo: {
    marginLeft: 12,
  },
  reviewNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  reviewVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  reviewVerifiedText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10B981",
  },
  reviewSubText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  tagContainer: {
    flexDirection: "row",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  verifiedInfoCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  verifiedInfoIcon: {
    marginRight: 12,
  },
  verifiedInfoTextContainer: {
    flex: 1,
  },
  verifiedInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  verifiedInfoDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  bookingBar: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  bookingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bookingPriceInfo: {
    marginLeft: 10,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  bookingUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748B",
  },
  bookingSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  bookingSlotText: {
    fontSize: 11,
    color: "#64748B",
  },
  bookSessionBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bookSessionText: {
    fontSize: 14,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
