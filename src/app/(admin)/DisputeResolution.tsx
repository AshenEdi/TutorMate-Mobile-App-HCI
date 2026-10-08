import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { AlertModal, AlertType } from "../../components/ui/AlertModal";
import {
  DisputeRecord,
  getDisputeById,
  resolveDispute,
  deleteDispute,
} from "../../services/disputeService";

type DecisionType =
  | "full_refund"
  | "partial_refund"
  | "dismiss";

export default function DisputeResolutionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ caseId?: string; id?: string; code?: string }>();
  const activeId = params.caseId || params.id;

  const [dispute, setDispute] = useState<DisputeRecord | null>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>("full_refund");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    buttonText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onOk?: () => void;
    onConfirm?: () => void;
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
    type: AlertType = "info",
    buttonText: string = "Got it"
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttonText,
      showCancel: false,
      onOk,
    });
  };

  useEffect(() => {
    let isMounted = true;

    async function loadDisputeData() {
      try {
        let activeDispute: DisputeRecord | null = null;

        if (activeId) {
          activeDispute = await getDisputeById(activeId);
        }

        // If no specific ID or not found, try loading the most recent pending dispute
        if (!activeDispute) {
          const { data } = await supabase
            .from("disputes")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            activeDispute = data as DisputeRecord;
          }
        }

        if (isMounted && activeDispute) {
          setDispute(activeDispute);

          // Fetch student and tutor profiles
          const [studentRes, tutorRes, bookingRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", activeDispute.student_id).single(),
            supabase.from("profiles").select("*").eq("id", activeDispute.tutor_id).single(),
            activeDispute.booking_id
              ? supabase.from("bookings").select("*").eq("id", activeDispute.booking_id).single()
              : Promise.resolve({ data: null }),
          ]);

          if (isMounted) {
            setStudentProfile(studentRes.data);
            setTutorProfile(tutorRes.data);
            setBooking(bookingRes.data);
          }
        }
      } catch (err) {
        console.warn("Error loading dispute:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDisputeData();

    return () => {
      isMounted = false;
    };
  }, [activeId]);

  const escrowTotal = dispute ? Number(dispute.escrow_amount ?? 45) : 45;
  const halfAmount = (escrowTotal / 2).toFixed(2);

  // Dynamic Button Label
  const getActionBtnLabel = () => {
    switch (selectedDecision) {
      case "full_refund":
        return `Approve Full Refund ($${escrowTotal.toFixed(2)})`;
      case "partial_refund":
        return `Approve Partial Split ($${halfAmount}/$${halfAmount})`;
      case "dismiss":
        return `Dismiss Dispute & Release Escrow ($${escrowTotal.toFixed(2)})`;
    }
  };

  const handleApproveResolution = () => {
    if (!dispute) return;

    let decisionLabel = `Full Refund ($${escrowTotal.toFixed(2)})`;
    let refundAmount = escrowTotal;

    if (selectedDecision === "partial_refund") {
      decisionLabel = `Partial Split ($${halfAmount} Student / $${halfAmount} Tutor)`;
      refundAmount = escrowTotal / 2;
    } else if (selectedDecision === "dismiss") {
      decisionLabel = "Dispute Dismissed (No Refund to Student)";
      refundAmount = 0;
    }

    const studentName = dispute.student_name || studentProfile?.full_name || "Student";
    const tutorName = dispute.tutor_name || tutorProfile?.full_name || "Tutor";

    setAlertConfig({
      visible: true,
      type: "info",
      title: "Confirm Resolution Order",
      message: `Execute ${decisionLabel} for Case ${dispute.code}?\n\nThis decision will update balances immediately and notify ${studentName} & ${tutorName}.`,
      showCancel: true,
      cancelText: "Cancel",
      buttonText: "Confirm & Execute",
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        setIsSubmitting(true);
        const res = await resolveDispute({
          disputeId: dispute.id,
          decision: selectedDecision,
          refundAmount,
          resolutionNotes: `Admin resolution executed: ${decisionLabel}`,
          issueTutorStrike: selectedDecision === "full_refund",
          creditDurationMinutes: 60,
        });

        setIsSubmitting(false);

        if (res.success) {
          showMessage(
            "Order Executed Successfully!",
            `Dispute ${dispute.code} has been resolved. Funds of $${refundAmount.toFixed(2)} were processed and the case is closed.`,
            () => router.replace("/(admin)/dashboard"),
            "success",
            "Go to Dashboard →"
          );
        } else {
          showMessage("Error", res.error || "Failed to resolve dispute.", undefined, "error");
        }
      },
    });
  };

  const handleDeleteDispute = () => {
    if (!dispute) return;

    setAlertConfig({
      visible: true,
      type: "warning",
      title: "Delete Dispute Case",
      message: `Are you sure you want to permanently delete dispute ${dispute.code}?\n\nThis will remove the dispute from the system.`,
      showCancel: true,
      cancelText: "Cancel",
      buttonText: "Delete",
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        setIsSubmitting(true);
        const res = await deleteDispute(dispute.id);
        setIsSubmitting(false);

        if (res.success) {
          showMessage(
            "Dispute Deleted",
            `Dispute ${dispute.code} was permanently deleted.`,
            () => router.replace("/(admin)/dashboard"),
            "success",
            "Back to Dashboard"
          );
        } else {
          showMessage("Error", res.error || "Failed to delete dispute.", undefined, "error");
        }
      },
    });
  };

  const handleContactParties = () => {
    const sName = dispute?.student_name || "Student";
    const tName = dispute?.tutor_name || "Tutor";
    showMessage(
      "Admin Notice Channel",
      `Active administrative communication channel open for ${sName} and ${tName}.`,
      undefined,
      "info"
    );
  };

  const caseCode = dispute?.code || "#DIS-8092";
  const studentDisplayName = dispute?.student_name || studentProfile?.full_name || "Marcus Sterling";
  const tutorDisplayName = dispute?.tutor_name || tutorProfile?.full_name || "Alex Rivera";
  const subjectName = dispute?.subject || booking?.subject || "AP Physics C Mechanics";
  const sessionDateStr = booking?.session_date
    ? `${booking.session_date} • ${booking.time_slot || "4:00 PM – 5:00 PM"}`
    : "Oct 24, 2026 • 4:00 PM – 5:00 PM (60 min)";

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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={styles.deleteTopBtn}
            activeOpacity={0.8}
            onPress={handleDeleteDispute}
            accessibilityLabel="Delete dispute"
          >
            <Ionicons name="trash-outline" size={17} color="#DC2626" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButtonTop}
            activeOpacity={0.8}
            onPress={() => router.push("/(admin)/AdminProfile")}
          >
            <Ionicons name="person" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
              <Text style={styles.caseIdText}>{caseCode}</Text>
            </View>

            <View style={styles.activeDisputeBadge}>
              <View style={styles.redDot} />
              <Text style={styles.activeDisputeText}>
                {dispute?.status === "resolved" ? "Resolved" : "Active Dispute"}
              </Text>
            </View>
          </View>

          <View style={styles.priorityRow}>
            <Ionicons name="time-outline" size={14} color="#DC2626" />
            <Text style={styles.priorityText}>
              Priority: {dispute?.priority ? dispute.priority.toUpperCase() : "HIGH"} • Escrow Hold Active
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
                uri:
                  studentProfile?.avatar_url ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
              }}
              style={styles.partyAvatar}
            />
            <View style={styles.partyInfo}>
              <View style={styles.partyNameRow}>
                <Text style={styles.partyName}>{studentDisplayName}</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>Student</Text>
                </View>
                <View style={styles.complainantBadge}>
                  <Text style={styles.complainantBadgeText}>Complainant</Text>
                </View>
              </View>

              <Text style={styles.partyTrack}>
                {studentProfile?.education || "Grade 12 • AP Calculus BC"}
              </Text>

              <View style={styles.partyStatsRow}>
                <Text style={styles.statMini}>
                  ID: #{dispute?.student_id?.slice(0, 8).toUpperCase() || "STU-9821"}
                </Text>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statGreen}>Standing: Good</Text>
              </View>
            </View>
          </View>

          {/* Tutor (Respondent) Card */}
          <View style={styles.partyCard}>
            <Image
              source={{
                uri:
                  tutorProfile?.avatar_url ||
                  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
              }}
              style={styles.partyAvatar}
            />
            <View style={styles.partyInfo}>
              <View style={styles.partyNameRow}>
                <Text style={styles.partyName}>{tutorDisplayName}</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>Tutor</Text>
                </View>
                <View style={styles.respondentBadge}>
                  <Text style={styles.respondentBadgeText}>Respondent</Text>
                </View>
              </View>

              <Text style={styles.partyTrack}>
                {tutorProfile?.specialty || "Physics Mentor • Univ Senior"}
              </Text>

              <View style={styles.partyStatsRow}>
                <Text style={styles.statMini}>
                  Rating: ★ {tutorProfile?.rating || "4.8"}
                </Text>
                <Text style={styles.statDivider}>•</Text>
                <Text style={tutorProfile?.strikes_count ? styles.statRed : styles.statGreen}>
                  Strikes: {tutorProfile?.strikes_count ?? 0}
                </Text>
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
                <Text style={styles.examPrepText}>
                  {dispute?.category ? dispute.category.toUpperCase() : "EXAM PREP"}
                </Text>
              </View>
              <Text style={styles.escrowAmountText}>
                ${escrowTotal.toFixed(2)}{" "}
                <Text style={styles.escrowSubtext}>In Escrow</Text>
              </Text>
            </View>

            <Text style={styles.sessionTopicTitle}>{subjectName}</Text>

            <View style={styles.sessionMetaItem}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={styles.sessionMetaText}>{sessionDateStr}</Text>
            </View>

            <View style={styles.sessionMetaItem}>
              <Ionicons name="videocam-outline" size={14} color="#64748B" />
              <Text style={styles.sessionMetaText}>
                {booking?.delivery_format || "Interactive Whiteboard & Video Room"}
              </Text>
            </View>
          </View>
        </View>

        {/* --- Section 3: Case Evidence & Timeline --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Case Evidence & Timeline</Text>
            <Text style={styles.evidenceSubtitle}>Verified Audit Trail</Text>
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
                <Text style={styles.timelineTime}>
                  {dispute?.created_at
                    ? new Date(dispute.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "4:18 PM"}
                </Text>
              </View>
              <Text style={styles.quoteText}>
                &ldquo;{dispute?.student_statement || dispute?.reason || "Waited in classroom for 25 minutes with no tutor attendance."}&rdquo;
              </Text>

              {dispute?.student_attachment_url ? (
                <View style={styles.attachmentBox}>
                  <Ionicons name="image-outline" size={18} color="#0052CC" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachmentName}>screenshot_evidence.png</Text>
                    <Text style={styles.attachmentMeta}>Verified timestamp</Text>
                  </View>
                </View>
              ) : null}
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
                    Active (Recorded)
                  </Text>
                </View>
                <View style={styles.auditLogRow}>
                  <Text style={styles.auditLogKey}>Tutor connection:</Text>
                  <Text style={[styles.auditLogVal, { color: "#DC2626", fontWeight: "800" }]}>
                    No connection recorded
                  </Text>
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
                <Text style={styles.timelineTime}>
                  {dispute?.tutor_statement ? "Submitted" : "Pending Response"}
                </Text>
              </View>
              <Text style={styles.quoteText}>
                &ldquo;{dispute?.tutor_statement || "My campus Wi-Fi went down abruptly due to a power flicker. I apologize and accept full refund or reschedule."}&rdquo;
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
              Release ${escrowTotal.toFixed(2)} escrow back to {studentDisplayName}. Issue 1 formal no-show penalty point to {tutorDisplayName}.
            </Text>
          </TouchableOpacity>

          {/* Option 2: Partial Refund & Escrow Split */}
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
              ${halfAmount} returned to student. ${halfAmount} released to tutor with no formal record mark.
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

        {/* --- Bottom Action Buttons --- */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.approveButton}
            activeOpacity={0.85}
            onPress={handleApproveResolution}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.approveButtonText}>
              {isSubmitting ? "Executing Order..." : getActionBtnLabel()}
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

          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={handleDeleteDispute}
            disabled={isSubmitting}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Delete Dispute Record</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- POPUP ALERT MODAL --- */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={alertConfig.buttonText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={() => {
          const onOkAction = alertConfig.onOk;
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (onOkAction) onOkAction();
        }}
      />
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
  deleteTopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#FFF1F2",
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
});
