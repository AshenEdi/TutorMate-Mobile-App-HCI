import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { AlertModal, AlertType } from "../../components/ui/AlertModal";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
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
interface StatCard {
  id: string;
  value: string;
  label: string;
  icon: string;
  iconColor: string;
  bgIconColor: string;
}

interface SubjectPill {
  id: string;
  name: string;
  dotColor: string;
  bgColor: string;
}

interface StudentProfileData {
  full_name: string | null;
  email: string | null;
  education: string | null;
  avatar_url: string | null;
  wallet_balance: number | null;
  session_credits?: number | null;
}

export interface TransactionItem {
  id: string;
  amount: number;
  type: "deposit" | "payment" | "refund" | string;
  description: string;
  created_at: string;
  status: string;
  reference?: string;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { profile: authProfile, user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);
  const [activeSubjects, setActiveSubjects] = useState<SubjectPill[]>([]);
  const [addFundsModalVisible, setAddFundsModalVisible] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("Profile");

  // --- TRANSACTION HISTORY STATES ---
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<"all" | "deposit" | "payment" | "refund">("all");
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onOk?: () => void;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showMessage = (
    title: string,
    message: string,
    onOk?: () => void,
    type: AlertType = "info"
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onOk,
    });
  };

  const resetPaymentForm = () => {
    setAddFundsAmount("");
    setSelectedQuickAmount(null);
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardholderName("");
  };

  const closeAddFundsModal = () => {
    setAddFundsModalVisible(false);
    resetPaymentForm();
  };

  const openTransactionHistory = async () => {
    setHistoryModalVisible(true);
    setLoadingTransactions(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      const activeUser = currentUser || user;
      if (!activeUser) {
        setLoadingTransactions(false);
        return;
      }

      // 1. Fetch from wallet_transactions table
      const { data: walletTx, error: txError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", activeUser.id)
        .order("created_at", { ascending: false });

      if (txError) {
        console.warn("Wallet transactions fetch note:", txError.message);
      }

      // 2. Fetch student bookings to ensure complete history
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, booking_ref, subject, total_price, status, created_at, session_date")
        .eq("student_id", activeUser.id)
        .order("created_at", { ascending: false });

      const combined: TransactionItem[] = [];
      const loggedBookingIds = new Set<string>();

      (walletTx ?? []).forEach((tx: any) => {
        if (tx.booking_id) loggedBookingIds.add(tx.booking_id);
        const amt = Number(tx.amount || 0);
        combined.push({
          id: tx.id,
          amount: amt,
          type: tx.type || (amt >= 0 ? "deposit" : "payment"),
          description: tx.description || (amt >= 0 ? "Wallet Top-up" : "Session Payment"),
          created_at: tx.created_at || new Date().toISOString(),
          status: "Completed",
          reference: tx.id ? `#TX-${tx.id.slice(0, 6).toUpperCase()}` : undefined,
        });
      });

      (bookingsData ?? []).forEach((b: any) => {
        if (!loggedBookingIds.has(b.id) && b.total_price) {
          combined.push({
            id: `bkg-${b.id}`,
            amount: -Math.abs(Number(b.total_price)),
            type: "payment",
            description: `Lesson: ${b.subject || "Tutoring Session"}`,
            created_at: b.created_at || (b.session_date ? `${b.session_date}T12:00:00Z` : new Date().toISOString()),
            status: b.status === "cancelled" ? "Cancelled" : "Completed",
            reference: b.booking_ref ? `#${b.booking_ref}` : `#BKG-${b.id.slice(0, 6).toUpperCase()}`,
          });
        }
      });

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(combined);
    } catch (err) {
      console.warn("Error fetching transaction history:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadStudentData() {
      if (authLoading) return;
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        let profileData: Record<string, any> | null = null;

        // Try selecting with session_credits first
        const primaryQuery = await supabase
          .from("profiles")
          .select("full_name, email, education, avatar_url, wallet_balance, session_credits")
          .eq("id", user.id)
          .maybeSingle();

        if (primaryQuery.error) {
          // Fallback if session_credits column does not exist yet
          const fallbackQuery = await supabase
            .from("profiles")
            .select("full_name, email, education, avatar_url, wallet_balance")
            .eq("id", user.id)
            .maybeSingle();

          if (fallbackQuery.data) {
            profileData = { ...fallbackQuery.data, session_credits: 0 };
          }
        } else if (primaryQuery.data) {
          profileData = primaryQuery.data;
        }

        // Secondary metrics queries (non-fatal)
        const [
          completedSessionsResult,
          mentorsResult,
          reviewsResult,
          subjectsResult,
        ] = await Promise.all([
          supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("student_id", user.id)
            .eq("status", "completed"),
          supabase
            .from("bookings")
            .select("tutor_id")
            .eq("student_id", user.id)
            .not("tutor_id", "is", null),
          supabase
            .from("reviews")
            .select("rating")
            .eq("student_id", user.id),
          supabase
            .from("bookings")
            .select("subject")
            .eq("student_id", user.id)
            .not("subject", "is", null),
        ]);

        const tutorIds = new Set(
          (mentorsResult.data ?? [])
            .map((booking: any) => booking.tutor_id)
            .filter((tutorId: any): tutorId is string => Boolean(tutorId)),
        );
        const ratings = (reviewsResult.data ?? [])
          .map((review: any) => Number(review.rating))
          .filter(Number.isFinite);
        const averageRating = ratings.length
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
          : 0;
        const subjectNames = Array.from(
          new Set(
            (subjectsResult.data ?? [])
              .map((booking: any) => booking.subject?.trim())
              .filter((subject: any): subject is string => Boolean(subject)),
          ),
        );
        const subjectColors = [
          { dotColor: "#2563EB", bgColor: "#EFF6FF" },
          { dotColor: "#0D9488", bgColor: "#E6FFFA" },
          { dotColor: "#F59E0B", bgColor: "#FEF3C7" },
          { dotColor: "#6B7280", bgColor: "#F1F5F9" },
        ];

        if (isMounted) {
          if (profileData) {
            setProfile({
              full_name: profileData.full_name || authProfile?.full_name || "",
              email: profileData.email || user.email || "",
              education: profileData.education || "",
              avatar_url: profileData.avatar_url || null,
              wallet_balance: profileData.wallet_balance == null ? 0 : Number(profileData.wallet_balance),
              session_credits: profileData.session_credits == null ? 0 : Number(profileData.session_credits),
            });
          }
          setSessionsCompleted(completedSessionsResult.count ?? 0);
          setMentorCount(tutorIds.size);
          setRatingAverage(averageRating);
          setActiveSubjects(
            subjectNames.map((name, index) => ({
              id: name,
              name,
              ...subjectColors[index % subjectColors.length],
            })),
          );
        }
      } catch (error) {
        console.warn("Non-fatal notice fetching student profile:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudentData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  const activeProfile = profile || authProfile;

  const userName =
    activeProfile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Student";
  const streak = 0;

  const profileStats: StatCard[] = [
    {
      id: "sessions",
      value: String(sessionsCompleted),
      label: "Sessions",
      icon: "checkmark-circle-outline",
      iconColor: "#2563EB",
      bgIconColor: "#EFF6FF",
    },
    {
      id: "streak",
      value: String(streak),
      label: "Streak",
      icon: "flame-outline",
      iconColor: "#D97706",
      bgIconColor: "#FEF3C7",
    },
    {
      id: "rating",
      value: ratingAverage ? ratingAverage.toFixed(1) : "0",
      label: "Rating",
      icon: "star-outline",
      iconColor: "#D97706",
      bgIconColor: "#FEF3C7",
    },
    {
      id: "mentors",
      value: String(mentorCount),
      label: "Mentors",
      icon: "school-outline",
      iconColor: "#0D9488",
      bgIconColor: "#CCFBF1",
    },
  ];
  const userAvatar =
    activeProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

  const onConfirmAddFunds = async () => {
    const amount = Number.parseFloat(addFundsAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("Error", "Enter a valid amount");
      return;
    }

    const cardDigits = cardNumber.replace(/\D/g, "");
    const expiryDigits = expiry.replace(/\D/g, "");
    const cvvDigits = cvv.replace(/\D/g, "");
    if (
      cardDigits.length !== 16 ||
      expiryDigits.length !== 4 ||
      (cvvDigits.length !== 3 && cvvDigits.length !== 4) ||
      !cardholderName.trim()
    ) {
      showMessage("Error", "Please fill all card details correctly");
      return;
    }

    setProcessingPayment(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      const activeUser = currentUser || user;
      if (!activeUser) {
        showMessage("Error", "Please sign in to add funds.");
        return;
      }

      const newBalance = (profile?.wallet_balance ?? 0) + amount;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", activeUser.id);
      if (updateError) {
        showMessage("Error", updateError.message);
        return;
      }

      const { error: insertError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: activeUser.id,
          amount,
          type: "deposit",
          description: "Wallet top-up",
        });
      if (insertError) {
        const { error: rollbackError } = await supabase
          .from("profiles")
          .update({ wallet_balance: profile?.wallet_balance ?? 0 })
          .eq("id", activeUser.id);
        if (rollbackError) {
          console.error("Failed to roll back wallet balance:", rollbackError);
        }
        showMessage("Error", insertError.message);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, education, avatar_url, wallet_balance")
        .eq("id", activeUser.id)
        .single();
      if (profileError) throw profileError;
      setProfile({
        ...data,
        wallet_balance: data.wallet_balance == null ? 0 : Number(data.wallet_balance),
      });
      closeAddFundsModal();
      showMessage("Success", "Funds added successfully!");
    } catch (error) {
      console.error("Failed to add wallet funds:", error);
      showMessage("Error", error instanceof Error ? error.message : "Unable to add funds.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- TOP BRAND BAR --- */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="book" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandName}>TutorMate</Text>
            <Text style={styles.brandTitle}>Profile</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push("/notification")}
        >
          <Ionicons name="notifications-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- PAGE SUBHEADER --- */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/(student)/dashboard");
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.pageHeaderTitle}>Account & Profile</Text>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => router.push("/(student)/EditStudentProfile")}
          >
            <Ionicons name="pencil-outline" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* --- PROFILE CARD --- */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: userAvatar,
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{userName}</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#2563EB"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.userTrack}>{profile?.education || "Education not provided"}</Text>
              <Text style={styles.userJoined}>{activeProfile?.email || user?.email || ""}</Text>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            {profileStats.map((stat) => (
              <View key={stat.id} style={styles.statBox}>
                <View
                  style={[
                    styles.statIconBg,
                    { backgroundColor: stat.bgIconColor },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={14}
                    color={stat.iconColor}
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- LEARNING WALLET CARD --- */}
        <View style={styles.card}>
          <View style={styles.walletHeader}>
            <View style={styles.walletHeaderLeft}>
              <View style={styles.walletIconBg}>
                <Ionicons name="wallet-outline" size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Learning Wallet</Text>
                <Text style={styles.cardSubtitle}>TutorMate Pass</Text>
              </View>
            </View>

          </View>

          {/* Balance Box */}
          <View style={styles.balanceBox}>
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <View style={styles.securedRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color="#2563EB"
                />
                <Text style={styles.securedText}>Secured</Text>
              </View>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>${(profile?.wallet_balance ?? 0).toFixed(2)}</Text>
              {(profile?.session_credits ?? 0) > 0 ? (
                <View style={{ backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="gift-outline" size={14} color="#059669" />
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#059669" }}>
                    {profile?.session_credits} Free Credit{profile?.session_credits !== 1 ? "s" : ""}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Wallet Actions */}
          <View style={styles.walletActions}>
            <TouchableOpacity
              style={styles.addFundsBtn}
              onPress={() => setAddFundsModalVisible(true)}
            >
              <Ionicons
                name="add"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.historyBtn}
              onPress={openTransactionHistory}
              activeOpacity={0.7}
            >
              <Ionicons
                name="receipt-outline"
                size={16}
                color="#1E293B"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.historyText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- ACTIVE SUBJECTS CARD --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.headerIconBg}>
                <Ionicons name="book-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Active Subjects</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editLink}>Edit &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Subject Pills */}
          <View style={styles.pillsWrap}>
            {activeSubjects.length === 0 ? (
              <Text style={styles.subjectPillText}>No active subjects</Text>
            ) : activeSubjects.map((subject) => (
              <View
                key={subject.id}
                style={[
                  styles.subjectPill,
                  { backgroundColor: subject.bgColor },
                ]}
              >
                <View
                  style={[
                    styles.pillDot,
                    { backgroundColor: subject.dotColor },
                  ]}
                />
                <Text style={styles.subjectPillText}>{subject.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- SUPPORT & COMMUNITY CARD --- */}
        <View style={styles.card}>
          <Text style={styles.subSectionTitle}>SUPPORT & COMMUNITY</Text>

          <TouchableOpacity style={styles.supportRow}>
            <View style={styles.supportIconBg}>
              <Ionicons name="help-buoy-outline" size={18} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Help & Academic Support</Text>
              <Text style={styles.supportSubtitle}>
                24/7 concierge for reschedule & questions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Become a Peer Tutor Callout */}
          <View style={styles.peerTutorCard}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="return-up-forward-outline"
                  size={16}
                  color="#2563EB"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.peerTutorTitle}>Become a Peer Tutor</Text>
              </View>
              <Text style={styles.peerTutorSubtitle}>
                Help underclassmen in Math & Physics
              </Text>
            </View>

            <TouchableOpacity style={styles.switchBtn}>
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- LOG OUT BUTTON --- */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await signOut();
            router.replace("/welcome");
          }}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#EF4444"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* --- FOOTER VERSION --- */}
        <Text style={styles.versionText}>
          TutorMate Mobile v2.4.1 (Build 184)
        </Text>
        <Text style={styles.taglineText}>
          Empowering Student Success Everywhere
        </Text>
      </ScrollView>

      <Modal
        visible={addFundsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAddFundsModal}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModal}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.paymentModalHeader}>
                <View>
                  <Text style={styles.paymentTitle}>Add Funds to Wallet</Text>
                  <Text style={styles.paymentSubtitle}>Secure payment powered by TutorMate Pay</Text>
                </View>
                <TouchableOpacity
                  style={styles.paymentCloseButton}
                  onPress={closeAddFundsModal}
                  accessibilityLabel="Close payment modal"
                >
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.paymentSectionTitle}>Choose an amount</Text>
              <View style={styles.amountOptions}>
                {[10, 25, 50, 100, 200].map((amount) => {
                  const isSelected = selectedQuickAmount === amount;
                  return (
                    <TouchableOpacity
                      key={amount}
                      style={[
                        styles.amountPill,
                        isSelected && styles.amountPillSelected,
                      ]}
                      onPress={() => {
                        setSelectedQuickAmount(amount);
                        setAddFundsAmount(String(amount));
                      }}
                    >
                      <Text
                        style={[
                          styles.amountPillText,
                          isSelected && styles.amountPillTextSelected,
                        ]}
                      >
                        ${amount}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.paymentFieldLabel}>Custom amount</Text>
              <View style={styles.paymentInputWrap}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.paymentInput}
                  value={addFundsAmount}
                  onChangeText={(text) => {
                    setAddFundsAmount(text.replace(/[^\d.]/g, ""));
                    setSelectedQuickAmount(null);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <Text style={styles.paymentSectionTitle}>Card details</Text>
              <Text style={styles.paymentFieldLabel}>Card Number</Text>
              <View style={styles.paymentInputWrap}>
                <TextInput
                  style={styles.paymentInput}
                  value={cardNumber}
                  onChangeText={(text) => {
                    const formatted = text
                      .replace(/\D/g, "")
                      .slice(0, 16)
                      .replace(/(\d{4})(?=\d)/g, "$1 ");
                    setCardNumber(formatted);
                  }}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={19}
                  autoComplete="cc-number"
                />
                <Ionicons name="card-outline" size={20} color="#64748B" />
              </View>

              <View style={styles.cardDetailsRow}>
                <View style={styles.cardDetailColumn}>
                  <Text style={styles.paymentFieldLabel}>Expiry</Text>
                  <View style={styles.paymentInputWrap}>
                    <TextInput
                      style={styles.paymentInput}
                      value={expiry}
                      onChangeText={(text) => {
                        const formatted = text
                          .replace(/\D/g, "")
                          .slice(0, 4)
                          .replace(/(\d{2})(?=\d)/, "$1/");
                        setExpiry(formatted);
                      }}
                      placeholder="MM/YY"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={5}
                      autoComplete="cc-exp"
                    />
                  </View>
                </View>
                <View style={styles.cardDetailColumn}>
                  <Text style={styles.paymentFieldLabel}>CVV</Text>
                  <View style={styles.paymentInputWrap}>
                    <TextInput
                      style={styles.paymentInput}
                      value={cvv}
                      onChangeText={(text) => setCvv(text.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      autoComplete="cc-csc"
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.paymentFieldLabel}>Cardholder Name</Text>
              <View style={styles.paymentInputWrap}>
                <TextInput
                  style={styles.paymentInput}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                  autoComplete="cc-name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.paymentTrustRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#0D9488" />
                <Text style={styles.paymentTrustText}>Your data is encrypted and secure</Text>
              </View>
              <View style={styles.cardBrands}>
                <Text style={styles.cardBrandVisa}>VISA</Text>
                <Text style={styles.cardBrandMastercard}>Mastercard</Text>
                <Text style={styles.cardBrandAmex}>AMEX</Text>
              </View>

              <TouchableOpacity
                style={styles.paymentPrimaryButton}
                onPress={onConfirmAddFunds}
                disabled={processingPayment}
              >
                <Text style={styles.paymentPrimaryButtonText}>
                  {processingPayment
                    ? "Processing..."
                    : `Add Funds • $${(Number.parseFloat(addFundsAmount) || 0).toFixed(2)}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.paymentCancelButton}
                onPress={closeAddFundsModal}
                disabled={processingPayment}
              >
                <Text style={styles.paymentCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- TRANSACTION HISTORY MODAL --- */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContainer}>
            <View style={styles.historyModalHeader}>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.historyModalTitle}>Transaction History</Text>
                  <View style={styles.historyCountBadge}>
                    <Text style={styles.historyCountText}>{transactions.length}</Text>
                  </View>
                </View>
                <Text style={styles.historyModalSubtitle}>
                  All wallet top-ups, lesson payments & refunds
                </Text>
              </View>
              <TouchableOpacity
                style={styles.paymentCloseButton}
                onPress={() => setHistoryModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Summary Banner */}
            <View style={styles.historySummaryBar}>
              <View style={styles.historySummaryItem}>
                <Text style={styles.historySummaryLabel}>Wallet Balance</Text>
                <Text style={styles.historySummaryValBlue}>
                  ${(profile?.wallet_balance ?? 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.historySummaryDivider} />
              <View style={styles.historySummaryItem}>
                <Text style={styles.historySummaryLabel}>Total Added</Text>
                <Text style={styles.historySummaryValGreen}>
                  +${transactions
                    .filter((t) => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}
                </Text>
              </View>
              <View style={styles.historySummaryDivider} />
              <View style={styles.historySummaryItem}>
                <Text style={styles.historySummaryLabel}>Total Spent</Text>
                <Text style={styles.historySummaryValRed}>
                  -${Math.abs(
                    transactions
                      .filter((t) => t.amount < 0)
                      .reduce((sum, t) => sum + t.amount, 0)
                  ).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.historyFilterRow}>
              {(["all", "deposit", "payment", "refund"] as const).map((filterKey) => {
                const isActive = transactionFilter === filterKey;
                const label =
                  filterKey === "all"
                    ? "All"
                    : filterKey === "deposit"
                    ? "Top-ups"
                    : filterKey === "payment"
                    ? "Lessons"
                    : "Refunds";
                return (
                  <TouchableOpacity
                    key={filterKey}
                    style={[styles.historyFilterChip, isActive && styles.historyFilterChipActive]}
                    onPress={() => setTransactionFilter(filterKey)}
                  >
                    <Text
                      style={[
                        styles.historyFilterChipText,
                        isActive && styles.historyFilterChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Transactions List */}
            {loadingTransactions ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={{ marginTop: 8, fontSize: 13, color: "#64748B" }}>
                  Loading transactions...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {(() => {
                  const filtered = transactions.filter((t) => {
                    if (transactionFilter === "deposit") return t.type === "deposit" || t.amount > 0;
                    if (transactionFilter === "payment") return t.type === "payment" || t.amount < 0;
                    if (transactionFilter === "refund") return t.type === "refund";
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <View style={styles.historyEmptyState}>
                        <Ionicons name="receipt-outline" size={44} color="#CBD5E1" />
                        <Text style={styles.historyEmptyTitle}>No Transactions Found</Text>
                        <Text style={styles.historyEmptySubtitle}>
                          {transactionFilter === "all"
                            ? "Your wallet deposits and lesson payments will be recorded here automatically."
                            : `No ${transactionFilter} records found.`}
                        </Text>
                      </View>
                    );
                  }

                  return filtered.map((tx) => {
                    const isCredit = tx.amount > 0 || tx.type === "deposit" || tx.type === "refund";
                    const isRefund = tx.type === "refund";

                    return (
                      <View key={tx.id} style={styles.txCard}>
                        <View
                          style={[
                            styles.txIconBg,
                            isRefund
                              ? { backgroundColor: "#EFF6FF" }
                              : isCredit
                              ? { backgroundColor: "#ECFDF5" }
                              : { backgroundColor: "#FEF2F2" },
                          ]}
                        >
                          <Ionicons
                            name={
                              isRefund
                                ? "refresh-circle"
                                : isCredit
                                ? "arrow-down-circle"
                                : "arrow-up-circle"
                            }
                            size={22}
                            color={isRefund ? "#2563EB" : isCredit ? "#059669" : "#DC2626"}
                          />
                        </View>

                        <View style={styles.txDetailsCol}>
                          <Text style={styles.txDescription} numberOfLines={1}>
                            {tx.description}
                          </Text>
                          <View style={styles.txMetaRow}>
                            {tx.reference && (
                              <Text style={styles.txRef}>{tx.reference} • </Text>
                            )}
                            <Text style={styles.txDate}>
                              {new Date(tx.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              •{" "}
                              {new Date(tx.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.txAmountCol}>
                          <Text
                            style={[
                              styles.txAmountText,
                              isCredit ? styles.txAmountCredit : styles.txAmountDebit,
                            ]}
                          >
                            {isCredit ? "+" : "-"}
                            ${Math.abs(tx.amount).toFixed(2)}
                          </Text>
                          <View
                            style={[
                              styles.txStatusPill,
                              tx.status === "Cancelled" && { backgroundColor: "#F1F5F9" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.txStatusText,
                                tx.status === "Cancelled" && { color: "#64748B" },
                              ]}
                            >
                              {tx.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  });
                })()}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.historyCloseBottomBtn}
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={styles.historyCloseBottomText}>Close History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        {[
          { name: "Home", icon: "home-outline", active: false },
          { name: "Search", icon: "search-outline", active: false },
          { name: "Sessions", icon: "calendar-outline", active: false },
          { name: "Messages", icon: "chatbox-outline", active: false },
          { name: "Profile", icon: "person-outline", active: true },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (tab.name === "Sessions") {
                router.push("/(student)/MySessions");
              } else if (tab.name === "Home") {
                router.push("/(student)/dashboard");
              } else if (tab.name === "Messages") {
                router.push("/(student)/MessagesInbox");
              } else if (tab.name === "Search") {
                router.push("/(student)/searchscreen");
              } else {
                setActiveTab(tab.name);
              }
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

      {/* --- IN-APP ALERT MODAL --- */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          const action = alertConfig.onOk;
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          action?.();
        }}
      />
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
  brandName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  brandTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: -2,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  pageHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  userTrack: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  userJoined: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  targetBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  targetText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 6,
  },
  targetHighlight: {
    fontWeight: "700",
    color: "#1E3A8A",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 3,
  },
  statIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  walletHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  autoReloadBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
    marginRight: 4,
  },
  autoReloadText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F766E",
  },
  balanceBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  balanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  securedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  securedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 2,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginRight: 8,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0D9488",
  },
  walletActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addFundsBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0256D0",
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 8,
  },
  addFundsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  historyBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 24,
    marginLeft: 8,
  },
  historyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  cardHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  editLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  subjectPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 10,
  },
  uniPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  uniPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  listRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  listRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  listRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  listRowSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  listRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3730A3",
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  supportIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  supportSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  peerTutorCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 12,
  },
  peerTutorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  peerTutorSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  switchBtn: {
    backgroundColor: "#0256D0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 24,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#94A3B8",
  },
  taglineText: {
    textAlign: "center",
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 2,
  },
  paymentModalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  paymentModal: {
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  paymentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  paymentSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  paymentCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  amountOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  amountPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
  },
  amountPillSelected: {
    backgroundColor: "#2563EB",
  },
  amountPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  amountPillTextSelected: {
    color: "#FFFFFF",
  },
  paymentFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  paymentInputWrap: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginRight: 6,
  },
  paymentInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: "#1E293B",
    paddingVertical: 11,
  },
  cardDetailsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardDetailColumn: {
    flex: 1,
  },
  paymentTrustRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  paymentTrustText: {
    fontSize: 11,
    color: "#0D9488",
    marginLeft: 5,
  },
  cardBrands: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    marginBottom: 18,
  },
  cardBrandVisa: {
    fontSize: 14,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#1A1F71",
  },
  cardBrandMastercard: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EB001B",
  },
  cardBrandAmex: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2E77BC",
  },
  paymentPrimaryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0256D0",
    borderRadius: 24,
    marginBottom: 10,
  },
  paymentPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  paymentCancelButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 22,
  },
  paymentCancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
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
  /* --- TRANSACTION HISTORY MODAL STYLES --- */
  historyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  historyModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  historyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  historyCountBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  historyModalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  historySummaryBar: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  historySummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  historySummaryLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  historySummaryValBlue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  historySummaryValGreen: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  historySummaryValRed: {
    fontSize: 14,
    fontWeight: "800",
    color: "#DC2626",
  },
  historySummaryDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  historyFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  historyFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  historyFilterChipActive: {
    backgroundColor: "#2563EB",
  },
  historyFilterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  historyFilterChipTextActive: {
    color: "#FFFFFF",
  },
  historyEmptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  historyEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 10,
  },
  historyEmptySubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  txIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  txDetailsCol: {
    flex: 1,
    marginRight: 8,
  },
  txDescription: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  txMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  txRef: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  txDate: {
    fontSize: 11,
    color: "#94A3B8",
  },
  txAmountCol: {
    alignItems: "flex-end",
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: "800",
  },
  txAmountCredit: {
    color: "#059669",
  },
  txAmountDebit: {
    color: "#0F172A",
  },
  txStatusPill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  txStatusText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#059669",
  },
  historyCloseBottomBtn: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  historyCloseBottomText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
});
