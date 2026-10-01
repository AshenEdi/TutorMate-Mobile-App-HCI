import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {/* Top App Logo Box */}
          <View style={styles.logoSection}>
            <View style={styles.logoCardOuter}>
              <View style={styles.logoCardInner}>
                <Ionicons name="book" size={32} color="#FFFFFF" />
              </View>
              {/* Online Green Indicator Dot */}
              <View style={styles.onlineDot} />
            </View>

            {/* App Name */}
            <Text style={styles.appName}>TutorMate</Text>

            {/* Sub Badge */}
            <View style={styles.badgeContainer}>
              <Ionicons name="checkmark-circle" size={15} color="#1D61F2" />
              <Text style={styles.badgeText}>VETTED MENTORS & TUTORS</Text>
            </View>
          </View>

          {/* Main Content White Card */}
          <View style={styles.mainCard}>
            {/* Header Row inside card */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.personalizedTitleRow}>
                <View style={styles.bookIconContainer}>
                  <Ionicons name="book-outline" size={17} color="#1D61F2" />
                </View>
                <Text style={styles.personalizedText}>Personalized Journey</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ 4.9 / 5</Text>
              </View>
            </View>

            {/* 3 Feature Cards Grid */}
            <View style={styles.featureGrid}>
              {/* Top Tutors */}
              <View style={styles.featureCard}>
                <Ionicons name="school-outline" size={22} color="#1D61F2" />
                <Text style={styles.featureTitle}>Top Tutors</Text>
                <Text style={styles.featureSubtitle}>1-on-1 Help</Text>
              </View>

              {/* Flexible */}
              <View style={styles.featureCard}>
                <Ionicons name="time-outline" size={22} color="#0D9488" />
                <Text style={styles.featureTitle}>Flexible</Text>
                <Text style={styles.featureSubtitle}>Your Schedule</Text>
              </View>

              {/* A+ Grades */}
              <View style={styles.featureCard}>
                <Ionicons name="trending-up-outline" size={22} color="#D97706" />
                <Text style={styles.featureTitle}>A+ Grades</Text>
                <Text style={styles.featureSubtitle}>Proven Growth</Text>
              </View>
            </View>

            {/* Description Text */}
            <Text style={styles.descriptionText}>
              Connect with expert tutors, boost your grades, and master any subject
              at your own pace.
            </Text>

            {/* Social Proof / Testimonial Box */}
            <View style={styles.socialProofBox}>
              <View style={styles.avatarStack}>
                <View style={[styles.avatar, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.avatarText, { color: '#1E40AF' }]}>JD</Text>
                </View>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: '#CCFBF1', marginLeft: -9 },
                  ]}>
                  <Text style={[styles.avatarText, { color: '#0F766E' }]}>SK</Text>
                </View>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: '#FFEDD5', marginLeft: -9 },
                  ]}>
                  <Text style={[styles.avatarText, { color: '#C2410C' }]}>AL</Text>
                </View>
              </View>

              <View style={styles.socialProofContent}>
                <Text style={styles.quoteText} numberOfLines={1}>
                  “Improved my Calculus grade from ...
                </Text>
                <Text style={styles.joinedText}>Joined by 12,000+ active students</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons Section */}
          <View style={styles.actionSection}>
            {/* Primary Log In Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.loginButton}
              onPress={() => router.push('/login')}>
              <Text style={styles.loginButtonText}>Log In</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Secondary Create Account Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.createAccountButton}
              onPress={() => router.push('/student_register')}>
              <Ionicons name="person-add-outline" size={18} color="#0052CC" />
              <Text style={styles.createAccountText}>Create Free Account</Text>
            </TouchableOpacity>

            {/* Tertiary Link */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.exploreLink}
              onPress={() => router.push('/login')}>
              <Text style={styles.exploreLinkText}>Explore tutors first →</Text>
            </TouchableOpacity>

            {/* Footer Support Link */}
            <View style={styles.supportFooter}>
              <Text style={styles.supportPrefix}>Need help? </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.supportButton}
                onPress={() => { }}>
                <Text style={styles.supportText}>Contact Support</Text>
                <Ionicons name="open-outline" size={13} color="#0052CC" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FD',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
  },
  logoCardOuter: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  logoCardInner: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#1D61F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#0D9488',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D61F2',
    letterSpacing: 0.5,
  },
  mainCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personalizedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EEF4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personalizedText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#78350F',
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featureTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  socialProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  socialProofContent: {
    flex: 1,
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  joinedText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0052CC',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0052CC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 82, 204, 0.2)',
      },
    }),
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createAccountButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#E6F0FF',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createAccountText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0052CC',
  },
  exploreLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  exploreLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  supportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  supportPrefix: {
    fontSize: 12.5,
    color: '#64748B',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  supportText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0052CC',
    textDecorationLine: 'underline',
  },
});

