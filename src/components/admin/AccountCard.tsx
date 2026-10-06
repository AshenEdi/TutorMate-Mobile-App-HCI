import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type AccountCardType = "tutor" | "student" | "dispute";

export interface AccountData {
  id: string;
  type: AccountCardType;
  name: string;
  avatar: string;
  badgeText: string;
  badgeType: "active" | "good_standing" | "dispute" | "pending";
  subtitle: string;
  hourlyRate?: string;
  rating?: number;
  reviewsCount?: number;
  accountId?: string;
  completedSessions?: number;
  lastActive?: string;
  disputeTag?: string;
  disputeReportCount?: string;
  disputeDescription?: string;
}

interface AccountCardProps {
  data: AccountData;
  onViewDetails?: (item: AccountData) => void;
  onAuditProfile?: (item: AccountData) => void;
  onReviewCase?: (item: AccountData) => void;
}

export function AccountCard({
  data,
  onViewDetails,
  onAuditProfile,
  onReviewCase,
}: AccountCardProps) {
  return (
    <View style={styles.card}>
      {/* Top Header Section */}
      <View style={styles.topSection}>
        <Image source={{ uri: data.avatar }} style={styles.avatar} />

        <View style={styles.headerInfo}>
          {/* Name & Badge Row */}
          <View style={styles.nameRow}>
            <View style={styles.nameAndBadge}>
              <Text style={styles.nameText}>{data.name}</Text>

              {data.badgeType === "active" && (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark" size={10} color="#0D9488" />
                  <Text style={styles.activeBadgeText}>{data.badgeText}</Text>
                </View>
              )}

              {data.badgeType === "good_standing" && (
                <View style={styles.goodStandingBadge}>
                  <Ionicons name="checkmark-circle-outline" size={12} color="#0D9488" />
                  <Text style={styles.goodStandingBadgeText}>{data.badgeText}</Text>
                </View>
              )}
            </View>

            {/* Price (for tutors) or Dispute Label (for disputes) */}
            {data.type === "tutor" && data.hourlyRate && (
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>{data.hourlyRate}</Text>
                <Text style={styles.priceUnit}>/hr</Text>
              </View>
            )}

            {data.type === "dispute" && data.disputeTag && (
              <Text style={styles.disputeTagText}>{data.disputeTag}</Text>
            )}
          </View>

          {/* Pending Report Badge for Disputes */}
          {data.type === "dispute" && data.disputeReportCount && (
            <View style={styles.pendingReportBadge}>
              <Ionicons name="warning-outline" size={11} color="#B45309" />
              <Text style={styles.pendingReportText}>
                {data.disputeReportCount}
              </Text>
            </View>
          )}

          {/* Subtitle / Department / Grade */}
          <Text style={styles.subtitleText}>{data.subtitle}</Text>
        </View>
      </View>

      {/* --- Middle Content according to type --- */}

      {/* Tutor: Rating & ID bar */}
      {data.type === "tutor" && (
        <View style={styles.tutorRatingBar}>
          <View style={styles.ratingGroup}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {data.rating} ({data.reviewsCount} reviews)
            </Text>
          </View>
          <Text style={styles.dotDivider}>•</Text>
          <Text style={styles.idText}>ID: {data.accountId}</Text>
        </View>
      )}

      {/* Student: Completed Sessions and Activity */}
      {data.type === "student" && (
        <View style={styles.studentStatsBar}>
          <View style={styles.sessionsGroup}>
            <Ionicons name="calendar-outline" size={14} color="#0052CC" />
            <Text style={styles.sessionsText}>
              {data.completedSessions} Completed Sessions
            </Text>
          </View>
          <Text style={styles.lastActiveText}>{data.lastActive}</Text>
        </View>
      )}

      {/* Dispute: Alert message box */}
      {data.type === "dispute" && data.disputeDescription && (
        <View style={styles.disputeAlertBox}>
          <Ionicons
            name="flag"
            size={14}
            color="#BE123C"
            style={styles.flagIcon}
          />
          <Text style={styles.disputeAlertText}>{data.disputeDescription}</Text>
        </View>
      )}

      {/* --- Bottom Action Buttons --- */}
      <View style={styles.buttonRow}>
        {data.type === "tutor" && (
          <>
            <TouchableOpacity
              style={styles.softBlueButton}
              activeOpacity={0.8}
              onPress={() => onViewDetails?.(data)}
            >
              <Text style={styles.softBlueButtonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.solidBlueButton}
              activeOpacity={0.8}
              onPress={() => onAuditProfile?.(data)}
            >
              <Text style={styles.solidBlueButtonText}>Audit Profile</Text>
            </TouchableOpacity>
          </>
        )}

        {data.type === "student" && (
          <TouchableOpacity
            style={styles.fullWidthSoftButton}
            activeOpacity={0.8}
            onPress={() => onViewDetails?.(data)}
          >
            <Text style={styles.softBlueButtonText}>View Details & History</Text>
          </TouchableOpacity>
        )}

        {data.type === "dispute" && (
          <>
            <TouchableOpacity
              style={styles.solidRedButton}
              activeOpacity={0.8}
              onPress={() => onReviewCase?.(data)}
            >
              <MaterialCommunityIcons
                name="shield-alert-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.solidRedButtonText}>Review Case</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.softBlueButton}
              activeOpacity={0.8}
              onPress={() => onViewDetails?.(data)}
            >
              <Text style={styles.softBlueButtonText}>View Details</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameAndBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    flex: 1,
  },
  nameText: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  activeBadgeText: {
    color: "#0D9488",
    fontSize: 10.5,
    fontWeight: "700",
  },
  goodStandingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  goodStandingBadgeText: {
    color: "#0D9488",
    fontSize: 10.5,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0052CC",
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  disputeTagText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DC2626",
  },
  pendingReportBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 2,
  },
  pendingReportText: {
    color: "#B45309",
    fontSize: 10.5,
    fontWeight: "700",
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  tutorRatingBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  ratingGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  dotDivider: {
    color: "#94A3B8",
    fontSize: 12,
  },
  idText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  studentStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sessionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  lastActiveText: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748B",
  },
  disputeAlertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  flagIcon: {
    marginTop: 2,
  },
  disputeAlertText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#9F1239",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  softBlueButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  softBlueButtonText: {
    color: "#0052CC",
    fontSize: 13,
    fontWeight: "700",
  },
  solidBlueButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0052CC",
    justifyContent: "center",
    alignItems: "center",
  },
  solidBlueButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  fullWidthSoftButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  solidRedButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#B91C1C",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  solidRedButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
