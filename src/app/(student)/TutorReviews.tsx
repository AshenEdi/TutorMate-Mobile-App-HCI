import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Review = {
  id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at?: string | null;
  student?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  verified?: boolean;
  subject?: string | null;
  likes?: number | null;
};

const STATS = [
  { icon: "thumbs-up-outline", value: "98%", label: "Recommend" },
  { icon: "time-outline", value: "99%", label: "On-time" },
  { icon: "flash-outline", value: "<15m", label: "Reply" },
];

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

export default function TutorReviewsScreen() {
  const router = useRouter();
  const { tutorId: routeTutorId } = useLocalSearchParams<{ tutorId?: string | string[] }>();
  const [tutor, setTutor] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const tutorId = Array.isArray(routeTutorId) ? routeTutorId[0] : routeTutorId;

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadTutorAndReviews() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted) setCurrentUserId(user?.id ?? null);

        let activeTutorId = tutorId;
        if (!activeTutorId) {
          const { data: firstTutor, error: firstTutorError } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "tutor")
            .limit(1)
            .single();
          if (firstTutorError) throw firstTutorError;
          activeTutorId = firstTutor.id;
        }

        const { data: tutorData, error: tutorError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", activeTutorId)
          .single();
        if (tutorError) throw tutorError;

        const { data: reviewData, error: reviewsError } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at, student_id")
          .eq("tutor_id", activeTutorId)
          .order("created_at", { ascending: false });
        if (reviewsError) throw reviewsError;

        const studentIds = [...new Set((reviewData || [])
          .map((review) => review.student_id)
          .filter(Boolean))];
        const { data: studentProfiles, error: studentProfilesError } = studentIds.length
          ? await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .in("id", studentIds)
          : { data: [], error: null };
        if (studentProfilesError) throw studentProfilesError;

        const studentProfilesById = Object.fromEntries(
          (studentProfiles || []).map((profile) => [profile.id, profile]),
        );
        const reviewsWithStudents = (reviewData || []).map((review) => ({
          ...review,
          student: studentProfilesById[review.student_id] || null,
        }));

        if (isMounted) {
          setTutor(tutorData);
          setReviews(reviewsWithStudents);
        }
      } catch (error) {
        console.error("Failed to load tutor reviews:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadTutorAndReviews();
    return () => {
      isMounted = false;
    };
  }, [tutorId]);

  const handleEditPress = (review: Review) => {
    setEditRating(Number(review.rating));
    setEditComment(review.comment || "");
    setEditingReview(review);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;

    if (!Number.isInteger(editRating) || editRating < 1 || editRating > 5 || !editComment.trim()) {
      showMessage("Error", "Please select a rating from 1 to 5 and enter a review comment.");
      return;
    }

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ rating: editRating, comment: editComment })
        .eq("id", editingReview.id);
      if (error) throw error;

      setReviews((currentReviews) => currentReviews.map((review) => (
        review.id === editingReview.id
          ? { ...review, rating: editRating, comment: editComment }
          : review
      )));
      setEditingReview(null);
      showMessage("Success", "Review updated successfully.");
    } catch (error) {
      showMessage("Error", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePress = (review: Review) => {
    setDeletingReview(review);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", deletingReview.id);
      if (error) throw error;

      setReviews((currentReviews) => currentReviews.filter(
        (review) => review.id !== deletingReview.id,
      ));
      setDeletingReview(null);
      showMessage("Success", "Review deleted successfully.");
    } catch (error) {
      showMessage("Error", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => Number(review.rating) === stars).length;
    return {
      stars,
      percentage: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
    };
  });
  const tutorRate = Number(tutor?.hourly_rate) || 45;

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
              <Image source={{ uri: tutor?.avatar_url || DEFAULT_AVATAR }} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.tutorMainInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.tutorName}>{tutor?.full_name || "Tutor"}</Text>
                <View style={styles.topRatedBadge}>
                  <Text style={styles.topRatedText}>Top Rated</Text>
                </View>
              </View>
              <Text style={styles.tutorTitle}>{tutor?.specialty || "Tutor"}</Text>
              <View style={styles.degreeRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.degreeText}>{tutor?.education || "Verified Tutor"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- RATING BREAKDOWN CARD --- */}
        <View style={styles.card}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingLeft}>
              <Text style={styles.bigRating}>{averageRating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={16} color="#D97706" />
                ))}
              </View>
              <Text style={styles.reviewsCountText}>{reviews.length} Reviews</Text>
            </View>

            <View style={styles.ratingRight}>
              {ratingDistribution.map((item) => (
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
          <Text style={styles.totalReviewsText}>{reviews.length} Total</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
          <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}>
            <Text style={[styles.filterPillText, styles.filterPillTextActive]}>All ({reviews.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterPillText}>5 Star</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterPillText}>With Photos</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- REVIEW CARDS --- */}
        {loading && <ActivityIndicator size="large" color="#2563EB" />}
        {!loading && reviews.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.reviewText}>No reviews yet</Text>
          </View>
        )}
        {reviews.map((review) => (
          <View key={review.id} style={styles.card}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewUserRow}>
                <Image
                  source={{ uri: review.student?.avatar_url || DEFAULT_AVATAR }}
                  style={styles.reviewAvatar}
                />
                <View style={styles.reviewUserInfo}>
                  <View style={styles.reviewNameRow}>
                    <Text style={styles.reviewName}>
                      {review.student?.full_name || "Anonymous Student"}
                    </Text>
                    {review.verified && (
                      <View style={styles.reviewVerifiedBadge}>
                        <Ionicons name="checkmark" size={8} color="#10B981" style={{ marginRight: 2 }} />
                        <Text style={styles.reviewVerifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reviewSubText}>
                    {review.subject || "Tutoring session"} • {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                  </Text>
                </View>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name={s <= Number(review.rating) ? "star" : "star-outline"} size={14} color="#D97706" />
                ))}
              </View>
            </View>

            <Text style={styles.reviewText}>{review.comment || ""}</Text>

            <View style={styles.reviewFooter}>
              {currentUserId !== null && review.student_id === currentUserId ? (
                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    onPress={() => handleEditPress(review)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit review"
                  >
                    <Ionicons name="pencil-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePress(review)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Delete review"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.tagContainer} />
              )}
              <View style={styles.likeContainer}>
                <Ionicons name="thumbs-up-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.likeText}>{Number(review.likes) || 0}</Text>
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
              Only students who complete verified live lessons can submit a review.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* --- FIXED BOTTOM BOOKING BAR --- */}
      <View style={styles.bookingBar}>
        <View style={styles.bookingLeft}>
          <Image source={{ uri: tutor?.avatar_url || DEFAULT_AVATAR }} style={styles.smallAvatar} />
          <View style={styles.bookingPriceInfo}>
            <Text style={styles.bookingPrice}>${tutorRate}<Text style={styles.bookingUnit}>/hr</Text></Text>
            <View style={styles.bookingSlotRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.bookingSlotText}>Available for booking</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookSessionBtn}
          onPress={() => router.push(`/(student)/SessionBooking?tutorId=${tutor?.id || tutorId || ""}`)}
        >
          <Text style={styles.bookSessionText}>Book Session</Text>
          <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={editingReview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingReview(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!savingEdit) setEditingReview(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Close edit review modal"
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            <View style={styles.modalStarRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setEditRating(star)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
                >
                  <Ionicons
                    name={star <= editRating ? "star" : "star-outline"}
                    size={32}
                    color={star <= editRating ? "#F59E0B" : "#CBD5E1"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.editReviewInput}
              value={editComment}
              onChangeText={setEditComment}
              placeholder="Write your review..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditingReview(null)}
                disabled={savingEdit}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton, savingEdit && styles.modalButtonDisabled]}
                onPress={() => void handleSaveEdit()}
                disabled={savingEdit}
                accessibilityRole="button"
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deletingReview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingReview(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!deleting) setDeletingReview(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Close delete review modal"
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Review</Text>
            <Text style={styles.deleteReviewMessage}>
              Are you sure you want to delete this review? This cannot be undone.
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDeletingReview(null)}
                disabled={deleting}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton, deleting && styles.modalButtonDisabled]}
                onPress={() => void handleConfirmDelete()}
                disabled={deleting}
                accessibilityRole="button"
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {deleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  reviewActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 420,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  modalStarRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  editReviewInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    color: "#0F172A",
    marginBottom: 20,
  },
  deleteReviewMessage: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modalCancelButton: {
    backgroundColor: "#F1F5F9",
  },
  modalSaveButton: {
    backgroundColor: "#2563EB",
  },
  modalDeleteButton: {
    backgroundColor: "#EF4444",
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
