import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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
import { TutorBottomNav } from "../../components/TutorBottomNav";

// --- TYPES ---
export interface NavItem {
  id: string;
  name: string;
  icon: string;
  activeIcon: string;
  badge?: number;
}

interface ActiveSessionUser {
  id: string;
  name: string;
  time: string;
  avatar: string;
  isOnline?: boolean;
}

interface MessageCard {
  id: string;
  name: string;
  gradeSubject: string;
  avatar?: string;
  initials?: string;
  time: string;
  isReadByOther?: boolean;
  message: string;
  isFromYou?: boolean;
  unreadCount?: number;
  isOnline?: boolean;
  attachmentBadge?: {
    icon: string;
    text: string;
  };
  statusPill?: {
    icon: string;
    text: string;
    bgColor: string;
    textColor: string;
  };
  scheduledTime?: string;
  actionButton?: {
    label: string;
    type: "primary" | "link";
  };
  footerLabel?: string;
  tagPill?: {
    icon: string;
    text: string;
  };
}

// --- REUSABLE NAVBAR COMPONENT ---
interface BottomNavBarProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const navTabs: NavItem[] = [
    { id: "1", name: "Sessions", icon: "school-outline", activeIcon: "school" },
    {
      id: "2",
      name: "Calendar",
      icon: "calendar-outline",
      activeIcon: "calendar",
    },
    {
      id: "3",
      name: "Requests",
      icon: "document-text-outline",
      activeIcon: "document-text",
      badge: 2,
    },
    {
      id: "4",
      name: "Messages",
      icon: "chatbox-outline",
      activeIcon: "chatbox",
    },
    { id: "5", name: "Profile", icon: "person-outline", activeIcon: "person" },
  ];

  return (
    <View style={navStyles.tabBar}>
      {navTabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.id}
            style={navStyles.tabItem}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <View style={navStyles.iconWrapper}>
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.icon) as any}
                size={22}
                color={isActive ? "#0256D0" : "#9CA3AF"}
              />
              {tab.badge && (
                <View style={navStyles.badge}>
                  <Text style={navStyles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text
              style={[navStyles.tabLabel, isActive && navStyles.tabLabelActive]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// --- MOCK DATA ---
const ACTIVE_SESSIONS: ActiveSessionUser[] = [
  {
    id: "1",
    name: "Alex R.",
    time: "3:00 PM",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop",
    isOnline: true,
  },
  {
    id: "2",
    name: "Maya L.",
    time: "5:30 PM",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    isOnline: true,
  },
  {
    id: "3",
    name: "Marcus",
    time: "Tomorrow",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Chloe B.",
    time: "Review",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  },
];

const RECENT_MESSAGES: MessageCard[] = [
  {
    id: "1",
    name: "Alex Rivera",
    gradeSubject: "Grade 12 • AP Calculus BC",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop",
    time: "2:28 PM",
    isOnline: true,
    message:
      '"Hi Dr. Jenkins! I got stuck on question 4 on polar coordinates. Can we review that in 30 mins?"',
    attachmentBadge: {
      icon: "document-text-outline",
      text: "Practice Test PDF",
    },
    statusPill: {
      icon: "flash-outline",
      text: "Starts in 32m • Room #calc-bc-882",
      bgColor: "#CCFBF1",
      textColor: "#0F766E",
    },
    unreadCount: 2,
  },
  {
    id: "2",
    name: "Maya Lin",
    gradeSubject: "College Fresh • Multivariable Calc",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    time: "1:15 PM",
    isReadByOther: true,
    isOnline: true,
    message: '"Thank you for sending the partial derivatives...',
    scheduledTime: "Today at 5:30 PM",
    actionButton: {
      label: "View Whiteboard →",
      type: "link",
    },
  },
  {
    id: "3",
    name: "Marcus Sterling",
    gradeSubject: "Grade 11 • AP Calculus AB",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    time: "Yesterday",
    isFromYou: true,
    message: "You: I reviewed your practice quiz. Great job on the",
    scheduledTime: "Tomorrow 4:00 PM",
    footerLabel: "Homework graded",
  },
  {
    id: "4",
    name: "Jordan Taylor",
    gradeSubject: "Parent Inquiry • SAT Math Prep",
    initials: "JT",
    time: "Mar 14",
    message: '"Hi Dr. Jenkins, do you have any weekend slots for...',
    tagPill: {
      icon: "star-outline",
      text: "Prospective Student",
    },
    actionButton: {
      label: "Reply",
      type: "primary",
    },
  },
];

// --- MAIN SCREEN ---
export default function TutorMessagesScreen() {
  const [activeTab, setActiveTab] = useState("Messages");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- BRAND TOP NAVBAR --- */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="book" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>TutorMate</Text>
        </View>

        <Text style={styles.headerSubtitle}>Tutor Messages</Text>

        <TouchableOpacity style={styles.profileAvatar}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
            }}
            style={styles.avatarImg}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- SEARCH BAR WITH VOICE & FILTER --- */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#2563EB"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student messages, subjects..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.micButton}>
              <Feather name="mic" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={18} color="#0256D0" />
          </TouchableOpacity>
        </View>

        {/* --- ACTIVE SESSIONS TODAY --- */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color="#2563EB"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.sectionTitle}>Active Sessions Today</Text>
          </View>
          <Text style={styles.bookedText}>3 Booked</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeSessionsContainer}
        >
          {ACTIVE_SESSIONS.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.sessionUserCard}
              activeOpacity={0.8}
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.sessionAvatar}
                />
                {user.isOnline && <View style={styles.onlineDot} />}
              </View>
              <Text style={styles.sessionUserName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.sessionUserTime}>{user.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- RECENT MESSAGES --- */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          <TouchableOpacity style={styles.markReadBtn}>
            <Text style={styles.markReadText}>Mark all read</Text>
            <Ionicons
              name="checkmark-done"
              size={14}
              color="#2563EB"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        {/* MESSAGES LIST */}
        {RECENT_MESSAGES.map((msg) => (
          <TouchableOpacity
            key={msg.id}
            style={styles.messageCard}
            activeOpacity={0.9}
          >
            {/* Header: User Info & Time */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarWrapper}>
                {msg.avatar ? (
                  <Image
                    source={{ uri: msg.avatar }}
                    style={styles.msgAvatar}
                  />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{msg.initials}</Text>
                  </View>
                )}
                {msg.isOnline && <View style={styles.onlineDotMsg} />}
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{msg.name}</Text>
                <Text style={styles.userGrade}>{msg.gradeSubject}</Text>
              </View>

              <View style={styles.timeContainer}>
                <View style={styles.timeRow}>
                  {msg.isReadByOther && (
                    <Ionicons
                      name="checkmark-done"
                      size={14}
                      color="#2563EB"
                      style={{ marginRight: 2 }}
                    />
                  )}
                  <Text style={styles.timeText}>{msg.time}</Text>
                </View>
              </View>
            </View>

            {/* Message Body */}
            <Text style={styles.messageText} numberOfLines={2}>
              {msg.message}
            </Text>

            {/* Attachment Badge */}
            {msg.attachmentBadge && (
              <View style={styles.attachmentPill}>
                <Ionicons
                  name={msg.attachmentBadge.icon as any}
                  size={14}
                  color="#2563EB"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.attachmentText}>
                  {msg.attachmentBadge.text}
                </Text>
              </View>
            )}

            {/* Tag Pill for Prospective Student */}
            {msg.tagPill && (
              <View style={styles.tagPill}>
                <Ionicons
                  name={msg.tagPill.icon as any}
                  size={12}
                  color="#475569"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.tagPillText}>{msg.tagPill.text}</Text>
              </View>
            )}

            {/* Card Footer Actions */}
            <View style={styles.cardFooter}>
              {/* Left Side Pill / Time */}
              {msg.statusPill ? (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: msg.statusPill.bgColor },
                  ]}
                >
                  <Ionicons
                    name={msg.statusPill.icon as any}
                    size={12}
                    color={msg.statusPill.textColor}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: msg.statusPill.textColor },
                    ]}
                  >
                    {msg.statusPill.text}
                  </Text>
                </View>
              ) : msg.scheduledTime ? (
                <View style={styles.scheduledPill}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color="#64748B"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.scheduledText}>{msg.scheduledTime}</Text>
                </View>
              ) : (
                <View />
              )}

              {/* Right Side Actions / Unread Badges */}
              {msg.unreadCount ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{msg.unreadCount}</Text>
                </View>
              ) : msg.actionButton?.type === "link" ? (
                <TouchableOpacity style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>
                    {msg.actionButton.label}
                  </Text>
                </TouchableOpacity>
              ) : msg.actionButton?.type === "primary" ? (
                <TouchableOpacity style={styles.primaryReplyBtn}>
                  <Text style={styles.primaryReplyText}>
                    {msg.actionButton.label}
                  </Text>
                </TouchableOpacity>
              ) : msg.footerLabel ? (
                <Text style={styles.footerLabelText}>{msg.footerLabel}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* --- REUSABLE BOTTOM NAVBAR --- */}
      <TutorBottomNav activeTab="messages" />
    </SafeAreaView>
  );
}

// --- STYLES ---
const navStyles = StyleSheet.create({
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
  iconWrapper: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
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
    color: "#0256D0",
    fontWeight: "700",
  },
});

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
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  micButton: {
    padding: 4,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  bookedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  activeSessionsContainer: {
    paddingBottom: 16,
  },
  sessionUserCard: {
    alignItems: "center",
    marginRight: 16,
    width: 64,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  sessionAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  onlineDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0D9488",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sessionUserName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  sessionUserTime: {
    fontSize: 11,
    color: "#2563EB",
    marginTop: 1,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  msgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  initialsAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#9A3412",
  },
  onlineDotMsg: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0D9488",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  userGrade: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  messageText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    marginBottom: 10,
  },
  attachmentPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scheduledPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scheduledText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0256D0",
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  primaryReplyBtn: {
    backgroundColor: "#0256D0",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
  },
  primaryReplyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerLabelText: {
    fontSize: 11,
    color: "#64748B",
  },
});
