import {
  Feather,
  FontAwesome5,
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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { getOrCreateAdminConversation } from "../../lib/chat";

type DecisionType =
  | "full_refund"
  | "reschedule"
  | "partial_refund"
  | "dismiss";

export default function DisputeResolutionScreen() {
  const router = useRouter();
  const [selectedDecision, setSelectedDecision] =
    useState<DecisionType>("full_refund");

  const handleApproveResolution = () => {
    let decisionLabel = "Full Refund ($40.00)";
    if (selectedDecision === "reschedule") decisionLabel = "Reschedule at No Cost";
    if (selectedDecision === "partial_refund") decisionLabel = "Partial Split ($20/$20)";
    if (selectedDecision === "dismiss") decisionLabel = "Dispute Dismissed";

    Alert.alert(
      "Confirm Resolution Order",
      `Execute ${decisionLabel} for Case #DIS-8092?\n\nThis decision will update escrow accounts immediately and notify Marcus Sterling & Alex Rivera.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Execute",
          style: "default",
          onPress: () => {
            Alert.alert("Success", "Dispute resolved and escrow processed.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const handleContactParties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Authentication Required", "Please log in as an administrator.");
        return;
      }

      // Fetch tutor profile to initiate admin mediation conversation
      const { data: tutorProf } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "tutor")
        .limit(1)
        .maybeSingle();

      if (tutorProf?.id) {
        const convId = await getOrCreateAdminConversation(user.id, tutorProf.id, "tutor");
        if (convId) {
          router.push({ pathname: "/(admin)/ChatConversation" as any, params: { conversationId: convId } });
          return;
        }
      }
      router.push("/(admin)/ChatConversation" as any);
    } catch {
      router.push("/(admin)/ChatConversation" as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Top App Header --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#0052CC" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Session Dispute Resolution</Text>

        <TouchableOpacity
          style={styles.avatarButtonTop}
          activeOpacity={0.8}
          onPress={() => router.push("/(admin)/AdminProfile")}
        >
          <Ionicons name="person" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- Header Card: Case Meta --- */}
        <View style={styles.caseMetaCard}>
          <View style={styles.caseMetaTopRow}>
            <View>
              <Text style={styles.caseMetaLabel}>DISPUTE CASE</Text>
              <Text style={styles.caseIdText}>#DIS-8092</Text>
            </View>

            <View style={styles.activeDisputeBadge}>
              <View style={styles.redDot} />
              <Text style={styles.activeDisputeText}>Active Dispute #117</Text>
            </View>
          </View>

          <View style={styles.priorityRow}>
            <Ionicons name="time-outline" size={14} color="#DC2626" />
            <Text style={styles.priorityText}>
              Priority: Urgent • Auto-escalates in 02h 48m
            </Text>
          </View>
        </View>

        {/* --- Section 1: Parties Involved --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Parties Involved</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>1 Incident Under Review</Text>
            </TouchableOpacity>
          </View>

          {/* Student (Complainant) Card */}
          <View style={styles.partyCard}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
              }}
              style={styles.partyAvatar}
            />
            <View style={styles.partyInfo}>
              <View style={styles.partyNameRow}>
                <Text style={styles.partyName}>Marcus Sterling</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>Student</Text>
                </View>
                <View style={styles.complainantBadge}>
                  <Text style={styles.complainantBadgeText}>Complainant</Text>
                </View>
              </View>

              <Text style={styles.partyTrack}>Grade 12 • AP Calculus BC</Text>

              <View style={styles.partyStatsRow}>
                <Text style={styles.statMini}>ID: #STU-9821</Text>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statMini}>Sessions: 18 (11 hrs)</Text>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statGreen}>Prior Disputes: 0 Clean</Text>
              </View>
            </View>
          </View>

          {/* Tutor (Respondent) Card */}
          <View style={styles.partyCard}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
              }}
              style={styles.partyAvatar}
            />
            <View style={styles.partyInfo}>
              <View style={styles.partyNameRow}>
                <Text style={styles.partyName}>Alex Rivera</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>Tutor</Text>
                </View>
                <View style={styles.respondentBadge}>
                  <Text style={styles.respondentBadgeText}>Respondent</Text>
                </View>
              </View>

              <Text style={styles.partyTrack}>Physics Mentor • Univ Senior</Text>

              <View style={styles.partyStatsRow}>
                <Text style={styles.statMini}>Rating: ★ 4.6 (32)</Text>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statMini}>ID: #TUT-4482</Text>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statRed}>History: 1 Tardiness</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- Section 2: Session in Dispute --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Session in Dispute</Text>

          <View style={styles.sessionDetailsCard}>
            <View style={styles.sessionTopRow}>
              <View style={styles.examPrepBadge}>
                <Text style={styles.examPrepText}>EXAM PREP</Text>
              </View>
              <Text style={styles.escrowAmountText}>
                $40.00 <Text style={styles.escrowSubtext}>In Escrow</Text>
              </Text>
            </View>

            <Text style={styles.sessionTopicTitle}>AP Physics C Mechanics</Text>

            <View style={styles.sessionMetaItem}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={styles.sessionMetaText}>
                Oct 24, 2026 • 4:00 PM – 5:00 PM (60 min)
              </Text>
            </View>

            <View style={styles.sessionMetaItem}>
              <Ionicons name="videocam-outline" size={14} color="#64748B" />
              <Text style={styles.sessionMetaText}>
                Interactive Whiteboard & Video Room
              </Text>
            </View>
          </View>
        </View>

        {/* --- Section 3: Case Evidence & Timeline --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Case Evidence & Timeline</Text>
            <Text style={styles.evidenceSubtitle}>3 Verification Logs</Text>
          </View>

          {/* Timeline Item 1: Student Statement */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeftColumn}>
              <View style={[styles.timelineNode, { borderColor: "#0052CC" }]}>
                <View style={[styles.timelineNodeInner, { backgroundColor: "#0052CC" }]} />
              </View>
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineContentCard}>
              <View style={styles.timelineCardHeader}>
                <Text style={styles.timelineSender}>Student Statement</Text>
                <Text style={styles.timelineTime}>Oct 24 • 4:18 PM</Text>
              </View>
              <Text style={styles.quoteText}>
                &ldquo;Waited in the classroom for 25 minutes. Alex never joined the
                video room or answered my messages. I had an exam the next
                morning.&rdquo;
              </Text>

              {/* Attachment */}
              <TouchableOpacity
                style={styles.attachmentBox}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert(
                    "Screenshot Attachment",
                    "Viewing verified classroom attendance log screenshot (2.4 MB)."
                  )
                }
              >
                <Ionicons name="image-outline" size={18} color="#0052CC" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentName}>attachment_waitlog_418pm.png</Text>
                  <Text style={styles.attachmentMeta}>2.4 MB • Verified timestamp</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timeline Item 2: Automated Server Audit */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeftColumn}>
              <View style={[styles.timelineNode, { borderColor: "#0D9488" }]}>
                <View style={[styles.timelineNodeInner, { backgroundColor: "#0D9488" }]} />
              </View>
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.serverAuditCard}>
              <View style={styles.timelineCardHeader}>
                <View style={styles.serverAuditHeaderLeft}>
                  <Ionicons name="shield-checkmark" size={14} color="#0D9488" />
                  <Text style={styles.serverAuditTitle}>
                    Automated System Verification
                  </Text>
                </View>
                <Text style={styles.serverAuditStatus}>Server Audit</Text>
              </View>

              <View style={styles.auditLogGrid}>
                <View style={styles.auditLogRow}>
                  <Text style={styles.auditLogKey}>Room created:</Text>
                  <Text style={styles.auditLogVal}>3:58 PM UTC</Text>
                </View>
                <View style={styles.auditLogRow}>
                  <Text style={styles.auditLogKey}>Student connected:</Text>
                  <Text style={[styles.auditLogVal, { color: "#059669", fontWeight: "700" }]}>
                    3:59 PM (Active 26 min)
                  </Text>
                </View>
                <View style={styles.auditLogRow}>
                  <Text style={styles.auditLogKey}>Tutor connected:</Text>
                  <Text style={[styles.auditLogVal, { color: "#DC2626", fontWeight: "800" }]}>
                    No connection recorded
                  </Text>
                </View>
                <View style={styles.auditLogRow}>
                  <Text style={styles.auditLogKey}>Room terminated:</Text>
                  <Text style={styles.auditLogVal}>4:25 PM UTC</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Timeline Item 3: Tutor Explanation */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeftColumn}>
              <View style={[styles.timelineNode, { borderColor: "#64748B" }]}>
                <View style={[styles.timelineNodeInner, { backgroundColor: "#64748B" }]} />
              </View>
            </View>

            <View style={styles.timelineContentCard}>
              <View style={styles.timelineCardHeader}>
                <Text style={styles.timelineSender}>Tutor Explanation</Text>
                <Text style={styles.timelineTime}>Oct 24 • 6:30 PM</Text>
              </View>
              <Text style={styles.quoteText}>
                &ldquo;My campus Wi-Fi went down abruptly due to a power flicker in
                the dorms. I apologize and am willing to reschedule or offer full
                refund.&rdquo;
              </Text>
              <View style={styles.concessionRow}>
                <Ionicons name="checkmark-circle" size={14} color="#0D9488" />
                <Text style={styles.concessionText}>
                  Tutor concedes issue with no counter-claim
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- Section 4: Moderation Decision --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Moderation Decision</Text>
            <View style={styles.policyBadge}>
              <FontAwesome5 name="balance-scale" size={11} color="#0052CC" />
              <Text style={styles.policyBadgeText}>Policy Guided</Text>
            </View>
          </View>

          {/* Option 1: Full Refund + Tutor Strike */}
          <TouchableOpacity
            style={[
              styles.decisionCard,
              selectedDecision === "full_refund" && styles.decisionCardSelected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedDecision("full_refund")}
          >
            <View style={styles.decisionTopRow}>
              <View style={styles.decisionTitleRow}>
                <Text style={styles.decisionTitle}>Full Refund + Tutor Strike</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>Recommended</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  selectedDecision === "full_refund" && styles.radioCircleSelected,
                ]}
              >
                {selectedDecision === "full_refund" && <View style={styles.radioDot} />}
              </View>
            </View>
            <Text style={styles.decisionDesc}>
              Release $40.00 escrow back to Marcus. Issue 1 formal no-show penalty
              point to Alex Rivera.
            </Text>
          </TouchableOpacity>

          {/* Option 2: Reschedule Session at No Cost */}
          <TouchableOpacity
            style={[
              styles.decisionCard,
              selectedDecision === "reschedule" && styles.decisionCardSelected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedDecision("reschedule")}
          >
            <View style={styles.decisionTopRow}>
              <Text style={styles.decisionTitle}>Reschedule Session at No Cost</Text>
              <View
                style={[
                  styles.radioCircle,
                  selectedDecision === "reschedule" && styles.radioCircleSelected,
                ]}
              >
                {selectedDecision === "reschedule" && <View style={styles.radioDot} />}
              </View>
            </View>
            <Text style={styles.decisionDesc}>
              Maintain $40.00 in escrow and generate a complimentary re-booking
              token for student.
            </Text>
          </TouchableOpacity>

          {/* Option 3: Partial Refund & Escrow Split */}
          <TouchableOpacity
            style={[
              styles.decisionCard,
              selectedDecision === "partial_refund" && styles.decisionCardSelected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedDecision("partial_refund")}
          >
            <View style={styles.decisionTopRow}>
              <Text style={styles.decisionTitle}>Partial Refund & Escrow Split</Text>
              <View
                style={[
                  styles.radioCircle,
                  selectedDecision === "partial_refund" && styles.radioCircleSelected,
                ]}
              >
                {selectedDecision === "partial_refund" && <View style={styles.radioDot} />}
              </View>
            </View>
            <Text style={styles.decisionDesc}>
              $20.00 returned to Marcus. $20.00 released to tutor with no formal
              record mark.
            </Text>
          </TouchableOpacity>

          {/* Option 4: Dismiss Dispute */}
          <TouchableOpacity
            style={[
              styles.decisionCard,
              selectedDecision === "dismiss" && styles.decisionCardSelected,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedDecision("dismiss")}
          >
            <View style={styles.decisionTopRow}>
              <Text style={styles.decisionTitle}>Dismiss Dispute (Inconclusive)</Text>
              <View
                style={[
                  styles.radioCircle,
                  selectedDecision === "dismiss" && styles.radioCircleSelected,
                ]}
              >
                {selectedDecision === "dismiss" && <View style={styles.radioDot} />}
              </View>
            </View>
            <Text style={styles.decisionDesc}>
              Release full escrow to tutor. Case closed without corrective action.
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Section 5: Audit Trail & Resolution Memo --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Audit Trail & Resolution Memo</Text>
          <View style={styles.memoBox}>
            <Text style={styles.memoText}>
              Server logs confirm zero tutor connectivity. Tutor accepted fault via
              platform chat. Standard policy §4.2 applied.
            </Text>
          </View>
        </View>

        {/* --- Bottom Action Buttons --- */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.approveButton}
            activeOpacity={0.85}
            onPress={handleApproveResolution}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.approveButtonText}>
              Approve Full Refund ($40.00)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            activeOpacity={0.8}
            onPress={handleContactParties}
          >
            <Ionicons name="chatbubbles-outline" size={18} color="#0052CC" />
            <Text style={styles.contactButtonText}>
              Contact Parties via Admin Chat
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0052CC",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  avatarButtonTop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  caseMetaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  caseMetaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caseMetaLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  caseIdText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  activeDisputeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DC2626",
  },
  activeDisputeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0052CC",
  },
  evidenceSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  partyCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 10,
  },
  partyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  partyInfo: {
    flex: 1,
    gap: 2,
  },
  partyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  partyName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  roleTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  complainantBadge: {
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  complainantBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0D9488",
  },
  respondentBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  respondentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0052CC",
  },
  partyTrack: {
    fontSize: 11.5,
    color: "#64748B",
  },
  partyStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    flexWrap: "wrap",
  },
  statMini: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  statDivider: {
    color: "#CBD5E1",
    fontSize: 10,
  },
  statGreen: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "700",
  },
  statRed: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "700",
  },
  sessionDetailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  sessionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  examPrepBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examPrepText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0052CC",
    letterSpacing: 0.4,
  },
  escrowAmountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0052CC",
  },
  escrowSubtext: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  sessionTopicTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  sessionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionMetaText: {
    fontSize: 12,
    color: "#475569",
  },
  timelineItem: {
    flexDirection: "row",
    gap: 10,
  },
  timelineLeftColumn: {
    alignItems: "center",
    width: 20,
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  timelineNodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 6,
    marginBottom: 8,
  },
  timelineCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timelineSender: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  timelineTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
    fontStyle: "italic",
  },
  attachmentBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 2,
  },
  attachmentName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0052CC",
  },
  attachmentMeta: {
    fontSize: 10.5,
    color: "#64748B",
  },
  serverAuditCard: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 6,
    marginBottom: 8,
  },
  serverAuditHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serverAuditTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0D9488",
  },
  serverAuditStatus: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#0D9488",
  },
  auditLogGrid: {
    gap: 4,
    marginTop: 2,
  },
  auditLogRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  auditLogKey: {
    fontSize: 11.5,
    color: "#475569",
  },
  auditLogVal: {
    fontSize: 11.5,
    color: "#0F172A",
  },
  concessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  concessionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0D9488",
  },
  policyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  policyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0052CC",
  },
  decisionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  decisionCardSelected: {
    borderColor: "#0052CC",
    backgroundColor: "#F8FAFC",
  },
  decisionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  decisionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },
  decisionTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  recommendedBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0052CC",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: "#0052CC",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0052CC",
  },
  decisionDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    color: "#64748B",
  },
  memoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  memoText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
  },
  actionButtonsContainer: {
    gap: 10,
    marginTop: 4,
  },
  approveButton: {
    backgroundColor: "#0052CC",
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  contactButton: {
    backgroundColor: "#FFFFFF",
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  contactButtonText: {
    color: "#0052CC",
    fontSize: 13.5,
    fontWeight: "700",
  },
});
