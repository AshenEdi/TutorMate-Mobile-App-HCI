import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type UserRole = 'student' | 'tutor';

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Calculate password strength segments (0 to 4)
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.max(score, 1);
  };

  const strengthScore = getPasswordStrength();

  const handleRegister = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Registration', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Registration', 'Passwords do not match.');
      return;
    }
    if (!agreedTerms) {
      Alert.alert('Registration', 'Please agree to the Terms of Service & Privacy Policy.');
      return;
    }
    Alert.alert('Account Created!', `Welcome to TutorMate, ${fullName}!`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push('/welcome');
                }
              }}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {role === 'student' ? 'Student Registration' : 'Tutor Registration'}
            </Text>
          </View>

          {/* Title Header Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleLeft}>
              <View style={styles.joinBadge}>
                <Ionicons name="school" size={13} color="#1D61F2" />
                <Text style={styles.joinBadgeText}>JOIN TUTORMATE</Text>
              </View>

              <Text style={styles.mainHeading}>Create Account</Text>
              <Text style={styles.subHeading}>
                Find the perfect mentor to accelerate your growth.
              </Text>
            </View>

            <View style={styles.bookIconBadge}>
              <Ionicons name="book-outline" size={24} color="#1D61F2" />
            </View>
          </View>

          {/* Role Segment Toggle */}
          <View style={styles.roleToggleContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.roleOption,
                role === 'student' ? styles.roleOptionActive : styles.roleOptionInactive,
              ]}
              onPress={() => setRole('student')}>
              <Ionicons
                name="book-outline"
                size={16}
                color={role === 'student' ? '#1D61F2' : '#64748B'}
              />
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'student' ? styles.roleOptionTextActive : styles.roleOptionTextInactive,
                ]}>
                I am a Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.roleOption,
                role === 'tutor' ? styles.roleOptionActive : styles.roleOptionInactive,
              ]}
              onPress={() => router.push('/tutor_register')}>
              <Ionicons
                name="easel-outline"
                size={16}
                color={role === 'tutor' ? '#1D61F2' : '#64748B'}
              />
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'tutor' ? styles.roleOptionTextActive : styles.roleOptionTextInactive,
                ]}>
                I want to Tutor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <Text style={styles.labelHint}>Required</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Alex Montgomery"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <Text style={styles.labelHint}>For session updates</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="alex.montgomery@university.edu"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Create Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Create Password</Text>
                <Text style={styles.labelHint}>Min. 8 chars</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator Bars */}
              <View style={styles.strengthBarContainer}>
                {[1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthBarSegment,
                      strengthScore >= index && styles.strengthBarActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="refresh-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Privacy Box */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.termsBox}
              onPress={() => setAgreedTerms(!agreedTerms)}>
              <View style={[styles.radioCircle, agreedTerms && styles.radioCircleSelected]}>
                {agreedTerms && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                By registering, I confirm I am at least 13 years old and agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* Register Primary Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.registerButton}
              onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Register</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Grid (Google & Apple) */}
            <View style={styles.socialGrid}>
              {/* Google Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.socialButton}
                onPress={() => Alert.alert('Google Sign Up', 'Google Registration initiated.')}>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              {/* Apple Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.socialButton}
                onPress={() => Alert.alert('Apple ID', 'Apple ID Sign Up initiated.')}>
                <Ionicons name="logo-apple" size={19} color="#0F172A" />
                <Text style={styles.socialButtonText}>Apple ID</Text>
              </TouchableOpacity>
            </View>

            {/* Social Proof Peer Banner */}
            <View style={styles.peerBanner}>
              <View style={styles.avatarStack}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
                  }}
                  style={[styles.avatarImage, { zIndex: 3 }]}
                />
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
                  }}
                  style={[styles.avatarImage, { marginLeft: -10, zIndex: 2 }]}
                />
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100',
                  }}
                  style={[styles.avatarImage, { marginLeft: -10, zIndex: 1 }]}
                />
              </View>

              <View style={styles.peerTextContent}>
                <Text style={styles.peerTitle}>Over 14,200 active learners</Text>
                <Text style={styles.peerSubtext}>Join verified peer study groups today</Text>
              </View>

              <Ionicons name="checkmark-circle" size={20} color="#0D9488" />
            </View>

            {/* Already have an account footer */}
            <View style={styles.loginFooter}>
              <Text style={styles.loginPrefix}>Already have an account? </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Login ›</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    flex: 1,
    gap: 4,
  },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 5,
  },
  joinBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D61F2',
    letterSpacing: 0.5,
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  subHeading: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  bookIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF5FF',
    borderRadius: 25,
    padding: 4,
    gap: 6,
  },
  roleOption: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  roleOptionActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  roleOptionInactive: {
    backgroundColor: 'transparent',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleOptionTextActive: {
    color: '#1D61F2',
  },
  roleOptionTextInactive: {
    color: '#64748B',
  },
  formContainer: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  labelHint: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  strengthBarActive: {
    backgroundColor: '#3B82F6',
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginVertical: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  termsLink: {
    color: '#1D61F2',
    fontWeight: '700',
  },
  registerButton: {
    height: 50,
    backgroundColor: '#0052CC',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
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
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  googleIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  peerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  peerTextContent: {
    flex: 1,
  },
  peerTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  peerSubtext: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginPrefix: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0052CC',
  },
});
