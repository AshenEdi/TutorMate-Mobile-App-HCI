import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.iconInner}>
              <Ionicons name="book" size={32} color="#fff" />
            </View>
            <View style={styles.badgeDot} />
          </View>
          
          <Text style={styles.title}>TutorMate</Text>
          
          <View style={styles.vettedBadge}>
            <MaterialCommunityIcons name="check-decagram" size={16} color="#0B57D0" />
            <Text style={styles.vettedText}>VETTED MENTORS & TUTORS</Text>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.journeyIcon}>
              <Ionicons name="map-outline" size={20} color="#0B57D0" />
            </View>
            <Text style={styles.journeyText}>Personalized Journey</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#000" />
              <Text style={styles.ratingText}>4.9 / 5</Text>
            </View>
          </View>

          {/* Features Row */}
          <View style={styles.featuresRow}>
            <View style={styles.featureBox}>
              <Ionicons name="school-outline" size={24} color="#0B57D0" />
              <Text style={styles.featureTitle}>Top Tutors</Text>
              <Text style={styles.featureSub}>1-on-1 Help</Text>
            </View>
            <View style={styles.featureBox}>
              <Ionicons name="time-outline" size={24} color="#0B795B" />
              <Text style={styles.featureTitle}>Flexible</Text>
              <Text style={styles.featureSub}>Your Schedule</Text>
            </View>
            <View style={styles.featureBox}>
              <Ionicons name="trending-up" size={24} color="#B36B00" />
              <Text style={styles.featureTitle}>A+ Grades</Text>
              <Text style={styles.featureSub}>Proven Growth</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Connect with expert tutors, boost your grades, and master any subject at your own pace.
          </Text>

          {/* Testimonial Section */}
          <View style={styles.testimonialContainer}>
            <View style={styles.avatars}>
              <View style={[styles.avatar, { backgroundColor: '#E4EEFC', zIndex: 3 }]}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View style={[styles.avatar, { backgroundColor: '#D1F4E0', marginLeft: -12, zIndex: 2 }]}>
                <Text style={styles.avatarText}>SK</Text>
              </View>
              <View style={[styles.avatar, { backgroundColor: '#FFE6C7', marginLeft: -12, zIndex: 1 }]}>
                <Text style={styles.avatarText}>AL</Text>
              </View>
            </View>
            <View style={styles.testimonialTextContainer}>
              <Text style={styles.testimonialQuote}>"Improved my Calculus grade from C to A in 4 weeks!"</Text>
              <Text style={styles.testimonialSub}>Joined by 12,000+ active students</Text>
            </View>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Log In</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Link>

          <Link href="/signup" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="person-add-outline" size={20} color="#0B57D0" style={{ marginRight: 8 }} />
              <Text style={styles.secondaryButtonText}>Create Free Account</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Need help? </Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Contact Support <Ionicons name="open-outline" size={12} color="#0B57D0" /></Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconInner: {
    width: 80,
    height: 80,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    backgroundColor: '#059669',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#F8FAFC',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  vettedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  vettedText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  journeyIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  journeyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 10,
    color: '#64748B',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  testimonialContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  avatars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  testimonialTextContainer: {
    flex: 1,
  },
  testimonialQuote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  testimonialSub: {
    fontSize: 10,
    color: '#64748B',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#0B57D0',
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E4EEFC',
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#0B57D0',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B57D0',
  },
});
