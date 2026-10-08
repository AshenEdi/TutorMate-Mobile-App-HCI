import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

// --- TYPES ---
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  highlight_text?: string;
  is_unread: boolean;
  category: string;
  reference_id?: string;
  created_at: string;
  
  // Computed fields for UI
  timestamp?: string;
  timeGroup?: "TODAY" | "YESTERDAY" | "EARLIER THIS WEEK";
  rating?: number;
}

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "sessions", label: "Sessions" },
  { id: "messages", label: "Messages" },
  { id: "reminders", label: "Reminders" },
];

const STUDENT_NAV_TABS = [
  { name: "Home", icon: "school-outline" },
  { name: "Search", icon: "search-outline" },
  { name: "Sessions", icon: "calendar-outline" },
  { name: "Messages", icon: "chatbox-outline" },
  { name: "Profile", icon: "person-outline" },
] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("all");
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      await fetchNotifications();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            console.log('New notification received:', payload);
            fetchNotifications(); // Refresh the list
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Process data for UI
      const processedData = (data || []).map((item: any) => {
        const date = new Date(item.created_at);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));

        let timestamp = "";
        let timeGroup: "TODAY" | "YESTERDAY" | "EARLIER THIS WEEK" = "EARLIER THIS WEEK";

        if (diffDays === 0) {
          timeGroup = "TODAY";
          timestamp = diffHours > 0 ? `${diffHours}h ago` : `${diffMins}m ago`;
        } else if (diffDays === 1) {
          timeGroup = "YESTERDAY";
          timestamp = "1d ago";
        } else {
          timeGroup = "EARLIER THIS WEEK";
          timestamp = `${diffDays}d ago`;
        }

        return {
          ...item,
          timestamp,
          timeGroup
        };
      });

      setNotificationsList(processedData);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_unread: false })
      .eq("user_id", user.id)
      .eq("is_unread", true);

    setNotificationsList((prev) =>
      prev.map((item: NotificationItem) => ({ ...item, is_unread: false })),
    );
  };

  const renderTimeGroup = (
    groupName: "TODAY" | "YESTERDAY" | "EARLIER THIS WEEK",
    subtitle?: string,
  ) => {
    const items = notificationsList.filter((n) => n.timeGroup === groupName);
    if (items.length === 0) return null;

    return (
      <View key={groupName}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{groupName}</Text>
          {subtitle && <Text style={styles.groupSubtitle}>{subtitle}</Text>}
        </View>

        {items.map((item) => (
          <View key={item.id} style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              {/* Icon Container with Unread Dot */}
              <View style={styles.iconWrapper}>
                <View
                  style={[
                    styles.iconBg,
                    item.type === "session" && { backgroundColor: "#2563EB" },
                    item.type === "message" && { backgroundColor: "#E0F2FE" },
                    item.type === "wallet" && { backgroundColor: "#FEF3C7" },
                    item.type === "booking" && { backgroundColor: "#CCFBF1" },
                    item.type === "material" && { backgroundColor: "#DBEAFE" },
                    item.type === "review" && { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  {item.type === "session" && (
                    <Ionicons name="videocam" size={18} color="#FFFFFF" />
                  )}
                  {item.type === "message" && (
                    <Ionicons name="chatbox" size={16} color="#0284C7" />
                  )}
                  {item.type === "wallet" && (
                    <Ionicons name="wallet" size={16} color="#D97706" />
                  )}
                  {item.type === "booking" && (
                    <Ionicons name="calendar" size={16} color="#0D9488" />
                  )}
                  {item.type === "material" && (
                    <Ionicons name="document-text" size={16} color="#2563EB" />
                  )}
                  {item.type === "review" && (
                    <Ionicons name="star" size={16} color="#D97706" />
                  )}
                </View>

                {item.is_unread && <View style={styles.unreadDot} />}
              </View>

              {/* Text Info */}
              <View style={styles.cardInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>

                {/* Specific Layouts based on notification type */}
                {item.type === "message" ? (
                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteText}>{item.description}</Text>
                  </View>
                ) : (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}

                {/* Sub Features / Badges */}
                {item.type === "session" && (
                  <View style={styles.sessionFooterRow}>
                    <View style={styles.verifiedRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={14}
                        color="#0D9488"
                      />
                      <Text style={styles.verifiedText}>
                        Room locked & verified
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.joinBtn}>
                      <Ionicons
                        name="open-outline"
                        size={14}
                        color="#FFFFFF"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.joinBtnText}>Join Room</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.type === "message" && (
                  <TouchableOpacity style={styles.replyBtn}>
                    <Ionicons
                      name="return-up-back-outline"
                      size={14}
                      color="#2563EB"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.replyBtnText}>Reply</Text>
                  </TouchableOpacity>
                )}

                {item.type === "wallet" && (
                  <TouchableOpacity style={styles.receiptBtn}>
                    <Ionicons
                      name="receipt-outline"
                      size={14}
                      color="#1E293B"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.receiptBtnText}>View Receipt</Text>
                  </TouchableOpacity>
                )}

                {item.type === "booking" && (
                  <TouchableOpacity style={styles.calendarBtn}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#2563EB"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.calendarBtnText}>Add to Calendar</Text>
                  </TouchableOpacity>
                )}

                {item.type === "material" && (
                  <TouchableOpacity style={styles.downloadBtn}>
                    <Ionicons
                      name="download-outline"
                      size={14}
                      color="#1E293B"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.downloadBtnText}>Download</Text>
                  </TouchableOpacity>
                )}

                {item.type === "review" && (
                  <View style={styles.ratingRow}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={
                            star <= (item.rating || 0) ? "star" : "star-outline"
                          }
                          size={16}
                          color="#D97706"
                          style={{ marginRight: 4 }}
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingText}>Great (4/5)</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- BRAND HEADER --- */}
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- PAGE TITLE & MARK ALL READ --- */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.pageTitleRow}>
            <Text style={styles.pageHeaderTitle}>Notifications</Text>
            <View style={styles.headerActiveDot} />
          </View>

          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={handleMarkAllRead}
          >
            <Ionicons
              name="checkmark-done"
              size={14}
              color="#2563EB"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* --- NOTIFICATION PREFERENCES BANNER --- */}
        <TouchableOpacity style={styles.prefBanner}>
          <View style={styles.prefIconBg}>
            <Ionicons name="options-outline" size={18} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Notification Preferences</Text>
            <Text style={styles.prefSubtitle}>
              Push, SMS, and WhatsApp alerts active
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* --- CATEGORY TABS --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, isSelected && styles.tabPillSelected]}
                onPress={() => setSelectedTab(tab.id)}
              >
                <Text
                  style={[styles.tabText, isSelected && styles.tabTextSelected]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- NOTIFICATION GROUPS --- */}
        {renderTimeGroup("TODAY", "3 unread")}
        {renderTimeGroup("YESTERDAY", "Read")}
        {renderTimeGroup("EARLIER THIS WEEK")}
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        {STUDENT_NAV_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (tab.name === "Home") {
                router.push("/(student)/dashboard");
              } else if (tab.name === "Search") {
                router.push("/(student)/searchscreen");
              } else if (tab.name === "Sessions") {
                router.push("/(student)/MySessions");
              } else if (tab.name === "Messages") {
                router.push("/(student)/MessagesInbox");
              } else {
                router.push("/(student)/StudentProfile");
              }
            }}
          >
            <View style={styles.tabIconWrapper}>
              <Ionicons
                name={tab.icon}
                size={22}
                color="#9CA3AF"
              />
            </View>
            <Text style={styles.tabLabel}>{tab.name}</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  pageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pageHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 6,
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  moreBtn: {
    padding: 4,
  },
  prefBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  prefIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  prefSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  tabsContainer: {
    paddingBottom: 16,
  },
  tabPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  tabPillSelected: {
    backgroundColor: "#0256D0",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  tabTextSelected: {
    color: "#FFFFFF",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  groupSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
  },
  iconWrapper: {
    position: "relative",
    marginRight: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 6,
  },
  timestamp: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  quoteBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  quoteText: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
  },
  sessionFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 4,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0256D0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  replyBtn: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
  },
  replyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  receiptBtn: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  receiptBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  calendarBtn: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  calendarBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  downloadBtn: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  starsRow: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
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
  tabIconWrapper: {
    position: "relative",
  },
  tabBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
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
