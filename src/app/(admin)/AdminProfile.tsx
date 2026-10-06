import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AdminProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const adminName = profile?.full_name || "Jordan Hayes";
  const adminEmail = profile?.email || "jordan.hayes@tutormate.internal";

  const completeLogout = async () => {
    setLogoutError(null);
    setIsLoggingOut(true);
    try {
      await signOut();
      router.replace("/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      void completeLogout();
      return;
    }

    Alert.alert(
      "Log Out of Admin Console",
      "Are you sure you want to end your administrative session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => void completeLogout(),
        },
      ]
    );
  };

  const handleEditEmail = () => {
    Alert.alert(
      "Admin Email Settings",
      "Primary admin email is linked to organizational Single Sign-On (SSO). Contact IT Infrastructure to update your routing address."
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Change Master Password",
      "A secure password reset link has been dispatched to your verified admin email address."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Top Navigation Bar --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Admin Profile</Text>

        <View style={styles.profileAvatarTop}>
          <Ionicons name="person" size={17} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- Card 1: Admin Hero Identity Card --- */}
        <View style={styles.heroCard}>
          {/* Top Badges Row */}
          <View style={styles.heroBadgesRow}>
            <View style={styles.superAdminPill}>
              <Ionicons name="shield-checkmark" size={12} color="#0052CC" />
              <Text style={styles.superAdminText}>Super Admin</Text>
            </View>

            <View style={styles.activeVerifiedPill}>
              <View style={styles.activeGreenDot} />
              <Text style={styles.activeVerifiedText}>Active • Verified</Text>
            </View>
          </View>

          {/* Avatar with Camera Overlay */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  profile?.avatar_url ||
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
              }}
              style={styles.avatarImage}
            />
            <TouchableOpacity
              style={styles.cameraOverlayBtn}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  "Update Profile Photo",
                  "Choose a photo from your library or take a new photo."
                )
              }
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Name & Title */}
          <Text style={styles.adminName}>{adminName}</Text>
          <Text style={styles.adminRoleTitle}>
            Lead Platform Moderator • Trust & Safety
          </Text>

          {/* Staff ID Pill */}
          <View style={styles.staffIdPill}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={15}
              color="#64748B"
            />
            <Text style={styles.staffIdLabel}>Staff ID: </Text>
            <Text style={styles.staffIdValue}>#ADM-0104</Text>
          </View>
        </View>

        {/* --- Card 2: Account Credentials & Security Section --- */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <Ionicons name="sync-outline" size={16} color="#0052CC" />
              <Text style={styles.sectionTitleText}>Account Credentials</Text>
            </View>

            <View style={styles.securityHeaderRight}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#0D9488" />
              <Text style={styles.securityHeaderText}>Enforced High Security</Text>
            </View>
          </View>

          {/* Row 1: Admin Email */}
          <View style={styles.credentialItem}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemLabel}>Admin Email</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>Verified</Text>
              </View>
            </View>

            <View style={styles.emailValueRow}>
              <Text style={styles.itemValueText}>{adminEmail}</Text>
              <TouchableOpacity
                style={styles.circleIconBtn}
                activeOpacity={0.7}
                onPress={handleEditEmail}
              >
                <Feather name="edit-2" size={14} color="#0052CC" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Master Password */}
          <View style={styles.credentialItem}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemLabel}>
                Master Password <Text style={styles.updatedSubtext}>• Updated 42d ago</Text>
              </Text>
            </View>

            <View style={styles.passwordValueRow}>
              <Text style={styles.dotsPassword}>•••••••••••••</Text>
              <TouchableOpacity
                style={styles.changePasswordBtn}
                activeOpacity={0.8}
                onPress={handleChangePassword}
              >
                <Text style={styles.changePasswordText}>Change</Text>
                <MaterialCommunityIcons
                  name="key-outline"
                  size={14}
                  color="#0052CC"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 3: Two-Factor Auth (2FA) */}
          <View style={styles.twoFactorItem}>
            <View style={styles.twoFactorIconCircle}>
              <MaterialCommunityIcons
                name="cellphone-key"
                size={18}
                color="#0D9488"
              />
            </View>

            <View style={styles.twoFactorContent}>
              <Text style={styles.twoFactorTitle}>Two-Factor Auth (2FA)</Text>
              <Text style={styles.twoFactorSubtitle}>
                Authenticator App (Duo / Google)
              </Text>
            </View>

            <Switch
              value={is2FAEnabled}
              onValueChange={setIs2FAEnabled}
              trackColor={{ false: "#CBD5E1", true: "#0052CC" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* --- Card 3: Log Out Section Card --- */}
        <View style={styles.logoutCard}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.85}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={18} color="#991B1B" />
            <Text style={styles.logoutButtonText}>
              {isLoggingOut ? "Logging Out..." : "Log Out of Admin Console"}
            </Text>
          </TouchableOpacity>

          {logoutError ? (
            <Text accessibilityRole="alert" style={styles.logoutErrorText}>
              {logoutError}
            </Text>
          ) : null}

          <Text style={styles.signedInAsText}>
            Signed in as {adminEmail}
          </Text>

          <View style={styles.footerCertContainer}>
            <Text style={styles.buildVersionText}>
              TutorMate Admin v2.4.1 (Build 890)
            </Text>
            <Text style={styles.certText}>
              • Strict SOC2 Type II Certified Session •
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  profileAvatarTop: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  heroBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  superAdminPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  superAdminText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0052CC",
  },
  activeVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  activeGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
  },
  activeVerifiedText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0D9488",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E2E8F0",
  },
  cameraOverlayBtn: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  adminName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  adminRoleTitle: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
    marginBottom: 10,
  },
  staffIdPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  staffIdLabel: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748B",
  },
  staffIdValue: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#1E293B",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  sectionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitleText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  securityHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  securityHeaderText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0D9488",
  },
  credentialItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 4,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  verifiedTag: {
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  verifiedTagText: {
    color: "#0D9488",
    fontSize: 10,
    fontWeight: "700",
  },
  emailValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  itemValueText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  circleIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  updatedSubtext: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "400",
  },
  passwordValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  dotsPassword: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 2,
  },
  changePasswordBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changePasswordText: {
    color: "#0052CC",
    fontSize: 12,
    fontWeight: "700",
  },
  twoFactorItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
  },
  twoFactorIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
  },
  twoFactorContent: {
    flex: 1,
    gap: 2,
  },
  twoFactorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  twoFactorSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
  },
  logoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 25,
    height: 48,
    width: "100%",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991B1B",
  },
  logoutErrorText: {
    fontSize: 12,
    color: "#B91C1C",
    textAlign: "center",
  },
  signedInAsText: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  footerCertContainer: {
    alignItems: "center",
    marginTop: 6,
    gap: 2,
  },
  buildVersionText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  certText: {
    fontSize: 10.5,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
