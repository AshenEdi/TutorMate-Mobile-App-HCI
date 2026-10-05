import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type TutorBottomTab =
  | "sessions"
  | "calendar"
  | "requests"
  | "messages"
  | "profile";

interface TutorBottomNavProps {
  activeTab: TutorBottomTab;
}

export function TutorBottomNav({ activeTab }: TutorBottomNavProps) {
  const router = useRouter();

  const handleTabPress = (tab: TutorBottomTab) => {
    if (tab === "profile") {
      router.replace("/(tutor)/TutorProfile");
    } else if (tab === "sessions") {
      router.replace("/(tutor)/TutorUpcomingSessions");
    } else if (tab === "calendar") {
      router.replace("/(tutor)/TutorCalendar");
    } else if (tab === "messages") {
      router.replace("/(tutor)/TutorMessages");
    } else if (tab === "requests") {
      router.replace("/(tutor)/dashboard");
    }
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleTabPress("sessions")}
      >
        <MaterialCommunityIcons
          name="ticket-confirmation-outline"
          size={22}
          color={activeTab === "sessions" ? "#2563EB" : "#64748B"}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === "sessions" && styles.navLabelActive,
          ]}
        >
          Sessions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleTabPress("calendar")}
      >
        <Ionicons
          name="calendar-outline"
          size={21}
          color={activeTab === "calendar" ? "#2563EB" : "#64748B"}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === "calendar" && styles.navLabelActive,
          ]}
        >
          Calendar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleTabPress("requests")}
      >
        <View style={styles.badgeWrap}>
          <MaterialCommunityIcons
            name="card-account-details-outline"
            size={23}
            color={activeTab === "requests" ? "#2563EB" : "#64748B"}
          />
          <View style={styles.redBadge}>
            <Text style={styles.redBadgeText}>2</Text>
          </View>
        </View>
        <Text
          style={[
            styles.navLabel,
            activeTab === "requests" && styles.navLabelActive,
          ]}
        >
          Requests
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleTabPress("messages")}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={21}
          color={activeTab === "messages" ? "#2563EB" : "#64748B"}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === "messages" && styles.navLabelActive,
          ]}
        >
          Messages
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleTabPress("profile")}
      >
        <Ionicons
          name="person-circle-outline"
          size={23}
          color={activeTab === "profile" ? "#2563EB" : "#64748B"}
        />
        <Text
          style={[
            styles.navLabel,
            activeTab === "profile" && styles.navLabelActive,
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingVertical: 8,
    paddingBottom: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  badgeWrap: {
    position: "relative",
  },
  redBadge: {
    position: "absolute",
    top: -4,
    right: -7,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  redBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  navLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 3,
  },
  navLabelActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
