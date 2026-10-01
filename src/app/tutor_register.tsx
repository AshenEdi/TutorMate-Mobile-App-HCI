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
  ActivityIndicator,
  Modal,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const SPECIALTY_OPTIONS = [
  'Mathematics (Calculus, Linear Algebra, SAT)',
  'Computer Science (Python, Java, Web Dev)',
  'Physical Sciences (Physics, Chemistry, Engineering)',
  'Biological Sciences (Biology, Biochemistry, MCAT)',
  'Humanities & Social Sciences (History, Psychology, Writing)',
  'Languages & Literature (English, Spanish, French, Mandarin)',
  'Business & Economics (Finance, Accounting, Economics)',
];

const PREDEFINED_CHIPS = [
  'AP Calculus',
  'Linear Algebra',
  'SAT Math',
  'Statistics',
  'Python',
  'Physics',
  'Chemistry',
  'Essay Writing',
];

const PRESET_RATES = [25, 45, 65, 85, 105, 120];

export default function TutorRegisterScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();

  const [fullName, setFullName] = useState('Marcus Vance');
  const [email, setEmail] = useState('m.vance@princeton.edu');
  const [password, setPassword] = useState('V@nceAcademic2024!');
  const [confirmPassword, setConfirmPassword] = useState('V@nceAcademic2024!');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dropdown & Specialty State
  const [specialty, setSpecialty] = useState(SPECIALTY_OPTIONS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>(['AP Calculus', 'Linear Algebra']);

  // Education & Hourly Rate State
  const [education, setEducation] = useState('Princeton University • Ph.D. Mathematics');
  const [hourlyRate, setHourlyRate] = useState<number>(55);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [sliderWidth, setSliderWidth] = useState<number>(300);

  // Chip Toggle logic
  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter((c) => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  // Slider touch/click handling
  const handleSliderTouch = (event: GestureResponderEvent) => {
    const touchX = event.nativeEvent.locationX;
    const percentage = Math.max(0, Math.min(1, touchX / sliderWidth));
    const calculatedRate = Math.round(20 + percentage * (120 - 20));
    setHourlyRate(calculatedRate);
  };

  // Registration Submit logic
  const handleContinue = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword || !education.trim()) {
      Alert.alert('Tutor Registration', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Tutor Registration', 'Passwords do not match.');
      return;
    }
    if (!agreedTerms) {
      Alert.alert(
        'Tutor Registration',
        'Please certify age and agree to Tutor Service Terms & Screening Policy.'
      );
      return;
    }

    const fullSpecialtyString = `${specialty}${
      selectedChips.length > 0 ? ` (${selectedChips.join(', ')})` : ''
    }`;

    const { error } = await signUp({
      email: trimmedEmail,
      password,
      fullName: trimmedName,
      role: 'tutor',
      extra: {
        education: education.trim(),
        specialty: fullSpecialtyString,
        hourly_rate: hourlyRate,
      },
    });

    if (error) {
      Alert.alert('Registration Failed', error);
      return;
    }

    // Directly navigate to login page upon registration
    router.replace('/login');
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

            <Text style={styles.headerTitle}>Tutor Registration</Text>
          </View>

          {/* Title Header Section */}
          <View style={styles.titleSection}>
            <View style={styles.joinBadge}>
              <Ionicons name="school" size={13} color="#1D61F2" />
              <Text style={styles.joinBadgeText}>BECOME A MENTOR</Text>
            </View>

            <Text style={styles.mainHeading}>Apply to Tutor</Text>
            <Text style={styles.subHeading}>
              Earn up to <Text style={styles.highlightPrice}>$45+/hr</Text> sharing your academic
              passion with motivated students worldwide.
            </Text>
          </View>

          {/* Role Segment Toggle */}
          <View style={styles.roleToggleContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.roleOption, styles.roleOptionInactive]}
              onPress={() => router.push('/student_register')}>
              <Ionicons name="book-outline" size={16} color="#64748B" />
              <Text style={[styles.roleOptionText, styles.roleOptionTextInactive]}>
                I am a Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.roleOption, styles.roleOptionActive]}
              onPress={() => {}}>
              <Ionicons name="person-circle" size={17} color="#FFFFFF" />
              <Text style={[styles.roleOptionText, styles.roleOptionTextActive]}>
                I want to Tutor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tutor Registration Form */}
          <View style={styles.formContainer}>
            {/* Full Legal Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Full Legal Name</Text>
                <Text style={styles.labelHint}>For background verification</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="id-card-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Marcus Vance"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Institutional / Academic Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Institutional / Academic Email</Text>
                <Text style={styles.fastTrackHint}>Fast-track verification</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="m.vance@princeton.edu"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.eduNoticeRow}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#1D61F2" />
                <Text style={styles.eduNoticeText}>
                  Use your .edu or affiliated university address for instant badge status.
                </Text>
              </View>
            </View>

            {/* Create Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Create Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="V@nceAcademic2024!"
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
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="refresh-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="V@nceAcademic2024!"
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

            {/* Primary Teaching Specialty Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Primary Teaching Specialty</Text>
              
              {/* Dropdown Selector Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.selectWrapper}
                onPress={() => setIsDropdownOpen(true)}>
                <Ionicons name="book-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <Text style={styles.selectText} numberOfLines={1}>
                  {specialty}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#1D61F2" />
              </TouchableOpacity>

              {/* Interactive Specialty Chips */}
              <Text style={styles.chipHeaderLabel}>Sub-Specialties / Topics (Tap to select):</Text>
              <View style={styles.chipRow}>
                {PREDEFINED_CHIPS.map((chip) => {
                  const isSelected = selectedChips.includes(chip);
                  return (
                    <TouchableOpacity
                      key={chip}
                      activeOpacity={0.7}
                      style={[styles.chip, isSelected ? styles.chipActive : styles.chipInactive]}
                      onPress={() => toggleChip(chip)}>
                      <Text
                        style={[
                          styles.chipText,
                          isSelected ? styles.chipActiveText : styles.chipInactiveText,
                        ]}>
                        {chip} {isSelected ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Highest Education & Alma Mater */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Highest Education & Alma Mater</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="school-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Princeton University • Ph.D. Mathematics"
                  placeholderTextColor="#94A3B8"
                  value={education}
                  onChangeText={setEducation}
                />
              </View>
            </View>

            {/* Expected Hourly Rate Selector & Interactive Slider */}
            <View style={styles.rateContainer}>
              <View style={styles.rateHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Expected Hourly Rate</Text>
                  <Text style={styles.rateSubtext}>Recommended STEM: $35 - $65/hr</Text>
                </View>

                {/* Rate Stepper Controls & Badge */}
                <View style={styles.rateStepperWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.stepperButton}
                    onPress={() => setHourlyRate((r) => Math.max(20, r - 5))}>
                    <Ionicons name="remove" size={16} color="#0052CC" />
                  </TouchableOpacity>

                  <View style={styles.rateBadge}>
                    <Text style={styles.rateBadgeText}>
                      <Text style={styles.ratePrice}>${hourlyRate.toFixed(2)}</Text> /hr
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.stepperButton}
                    onPress={() => setHourlyRate((r) => Math.min(120, r + 5))}>
                    <Ionicons name="add" size={16} color="#0052CC" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Interactive Rate Slider Track */}
              <View style={styles.sliderTrackContainer}>
                <Pressable
                  style={styles.sliderBackgroundTrack}
                  onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                  onPress={handleSliderTouch}>
                  <View
                    style={[
                      styles.sliderFillTrack,
                      { width: `${Math.max(0, Math.min(100, ((hourlyRate - 20) / (120 - 20)) * 100))}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.sliderThumb,
                      { left: `${Math.max(0, Math.min(92, ((hourlyRate - 20) / (120 - 20)) * 92))}%` },
                    ]}
                  />
                </Pressable>

                <View style={styles.sliderLabelsRow}>
                  <Text style={styles.sliderLabelText}>$20</Text>
                  <Text style={styles.sliderLabelText}>$50</Text>
                  <Text style={styles.sliderLabelText}>$80</Text>
                  <Text style={styles.sliderLabelText}>$120+</Text>
                </View>
              </View>

              {/* Preset Rate Quick Buttons */}
              <View style={styles.presetButtonsRow}>
                {PRESET_RATES.map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    activeOpacity={0.7}
                    style={[
                      styles.presetBadge,
                      hourlyRate === rate && styles.presetBadgeSelected,
                    ]}
                    onPress={() => setHourlyRate(rate)}>
                    <Text
                      style={[
                        styles.presetBadgeText,
                        hourlyRate === rate && styles.presetBadgeTextSelected,
                      ]}>
                      ${rate}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Terms & Background Check Certification */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.termsBox}
              onPress={() => setAgreedTerms(!agreedTerms)}>
              <View style={[styles.checkboxSquare, agreedTerms && styles.checkboxSquareSelected]}>
                {agreedTerms && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                {"I certify that I am 18+ years old, holder of valid academic credentials, and agree to TutorMate's "}
                <Text style={styles.termsLink}>Tutor Service Terms</Text>{' and '}
                <Text style={styles.termsLink}>Background Screening Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* Primary Continue Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.continueButton, loading && { opacity: 0.6 }]}
              onPress={handleContinue}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Fast Credentials Import Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>FAST CREDENTIALS IMPORT</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Import Grid (Google & LinkedIn) */}
            <View style={styles.socialGrid}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.socialButton}
                onPress={() => Alert.alert('Google Credentials', 'Importing credentials from Google.')}>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.socialButton}
                onPress={() => Alert.alert('LinkedIn Import', 'Importing credentials from LinkedIn.')}>
                <Ionicons name="logo-linkedin" size={19} color="#0A66C2" />
                <Text style={styles.socialButtonText}>LinkedIn</Text>
              </TouchableOpacity>
            </View>

            {/* Already verified footer */}
            <View style={styles.loginFooter}>
              <Text style={styles.loginPrefix}>Already verified as a tutor? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Log in here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Specialty Dropdown Modal Picker */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Primary Specialty</Text>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={true}>
              {SPECIALTY_OPTIONS.map((item) => {
                const isSelected = specialty === item;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.7}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSpecialty(item);
                      setIsDropdownOpen(false);
                    }}>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}>
                      {item}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#1D61F2" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  highlightPrice: {
    color: '#1D61F2',
    fontWeight: '800',
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
    backgroundColor: '#0052CC',
  },
  roleOptionInactive: {
    backgroundColor: 'transparent',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
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
  fastTrackHint: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  eduNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  eduNoticeText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  chipHeaderLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#EEF4FE',
    borderColor: '#1D61F2',
  },
  chipActiveText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D61F2',
  },
  chipInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  chipInactiveText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  chipText: {
    fontSize: 11.5,
  },
  rateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rateStepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF4FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rateBadge: {
    backgroundColor: '#EEF4FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  rateBadgeText: {
    fontSize: 11,
    color: '#64748B',
  },
  ratePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0052CC',
  },
  sliderTrackContainer: {
    gap: 6,
    paddingVertical: 4,
  },
  sliderBackgroundTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFillTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1D61F2',
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0052CC',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    top: -6,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sliderLabelText: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 2,
  },
  presetBadge: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBadgeSelected: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
  },
  presetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  presetBadgeTextSelected: {
    color: '#FFFFFF',
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
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareSelected: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
  },
  termsText: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  termsLink: {
    color: '#1D61F2',
    fontWeight: '700',
  },
  continueButton: {
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
  continueButtonText: {
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
    fontSize: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  modalItemTextSelected: {
    color: '#1D61F2',
    fontWeight: '700',
  },
});
