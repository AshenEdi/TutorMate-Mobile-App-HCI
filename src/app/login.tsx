import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  useAuth,
  UserRole,
} from '../context/AuthContext';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RoleType = 'Student' | 'Tutor' | 'Admin';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleType>('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (role: RoleType) => {
    setSelectedRole(role);
    if (errorMessage) setErrorMessage(null);
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email or username and password.');
      return;
    }

    const targetRole = selectedRole.toLowerCase() as UserRole;
    const { error, role: userRole } = await signIn(trimmedEmail, password, targetRole);

    if (error) {
      if (error.toLowerCase().includes('invalid login credentials') || error.toLowerCase().includes('invalid grant')) {
        setErrorMessage('Invalid email or password. Please verify your credentials and try again.');
      } else {
        setErrorMessage(error);
      }
      return;
    }

    if (userRole === 'admin') {
      router.replace('/(admin)/dashboard');
    } else if (userRole === 'tutor') {
      router.replace('/(tutor)/dashboard');
    } else {
      router.replace('/(student)/dashboard');
    }
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

            <View style={styles.headerTitleRow}>
              <View style={styles.logoBadge}>
                <Ionicons name="book" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>Login</Text>
            </View>
          </View>

          {/* Banner Welcome Back Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerTag}>TUTORMATE PORTAL</Text>
              <Text style={styles.bannerTitle}>Welcome Back!</Text>
              <Text style={styles.bannerSubtitle}>
                Ready to catch up on your learning goals today?
              </Text>
            </View>

            <View style={styles.bannerRight}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
                }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Role Selector Tabs */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.roleTab,
                selectedRole === 'Student' ? styles.roleTabActive : styles.roleTabInactive,
              ]}
              onPress={() => handleRoleChange('Student')}>
              <Ionicons
                name={selectedRole === 'Student' ? 'person' : 'person-outline'}
                size={16}
                color={selectedRole === 'Student' ? '#FFFFFF' : '#0052CC'}
              />
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'Student' ? styles.roleTextActive : styles.roleTextInactive,
                ]}>
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.roleTab,
                selectedRole === 'Tutor' ? styles.roleTabActive : styles.roleTabInactive,
              ]}
              onPress={() => handleRoleChange('Tutor')}>
              <Ionicons
                name={selectedRole === 'Tutor' ? 'people' : 'people-outline'}
                size={16}
                color={selectedRole === 'Tutor' ? '#FFFFFF' : '#0052CC'}
              />
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'Tutor' ? styles.roleTextActive : styles.roleTextInactive,
                ]}>
                Tutor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.roleTab,
                selectedRole === 'Admin' ? styles.roleTabActive : styles.roleTabInactive,
              ]}
              onPress={() => handleRoleChange('Admin')}>
              <Ionicons
                name={selectedRole === 'Admin' ? 'shield-checkmark' : 'shield-outline'}
                size={16}
                color={selectedRole === 'Admin' ? '#FFFFFF' : '#0052CC'}
              />
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'Admin' ? styles.roleTextActive : styles.roleTextInactive,
                ]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* UI Error Message Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" style={styles.errorIcon} />
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>Invalid Credentials</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setErrorMessage(null)}
                  style={styles.errorCloseButton}>
                  <Ionicons name="close" size={18} color="#991B1B" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Username</Text>
              <View style={[styles.inputWrapper, !!errorMessage && styles.inputWrapperError]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={errorMessage ? '#DC2626' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    selectedRole === 'Tutor'
                      ? 'tutor@email.com'
                      : selectedRole === 'Admin'
                      ? 'admin@email.com'
                      : 'student@email.com'
                  }
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert('Forgot Password', 'Password reset instructions have been sent to your email.')}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, !!errorMessage && styles.inputWrapperError]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={errorMessage ? '#DC2626' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
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

            {/* Remember Me Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberText}>Remember me on this device</Text>
            </TouchableOpacity>

            {/* Login Primary Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Login</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.googleButton}
              onPress={() => Alert.alert('Google Sign-In', 'Google authentication initiated.')}>
              <View style={styles.googleIconCircle}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerFooter}>
              <Text style={styles.registerPrefix}>{"Don't have an account? "}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/student_register')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Safety Badge */}
            <View style={styles.safetyBadge}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0D9488" />
              <Text style={styles.safetyText}>Verified student & mentor safety protection</Text>
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
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1D61F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerCard: {
    backgroundColor: '#E4EFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 8,
    gap: 4,
  },
  bannerTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D61F2',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
    marginTop: 2,
  },
  bannerRight: {
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#BFDBFE',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF5FF',
    borderRadius: 25,
    padding: 4,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: '#0052CC',
  },
  roleTabInactive: {
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  roleTextInactive: {
    color: '#0052CC',
  },
  formContainer: {
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  errorIcon: {
    marginTop: 1,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12.5,
    color: '#B91C1C',
    lineHeight: 17,
  },
  errorCloseButton: {
    padding: 2,
    marginTop: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0052CC',
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
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
  },
  rememberText: {
    fontSize: 13,
    color: '#475569',
  },
  loginButton: {
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
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginButtonDisabled: {
    opacity: 0.6,
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
    fontSize: 12.5,
    color: '#94A3B8',
  },
  googleButton: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  registerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  registerPrefix: {
    fontSize: 13,
    color: '#64748B',
  },
  registerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0052CC',
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
    alignSelf: 'center',
    marginTop: 6,
  },
  safetyText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
});
