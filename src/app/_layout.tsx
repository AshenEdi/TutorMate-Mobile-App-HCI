import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

// ─── Inner layout that has access to auth context ─────────────────────────────
function AppNavigator() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const currentSegment = (segments[0] as string) || '';
    const inAuthGroup =
      currentSegment === '(student)' ||
      currentSegment === '(tutor)' ||
      currentSegment === '(admin)' ||
      currentSegment === 'dashboard';
    const isAuthScreen =
      currentSegment === 'login' ||
      currentSegment === 'student_register' ||
      currentSegment === 'tutor_register';

    if (session && profile) {
      // Prevent cross-role access to protected route groups
      if (currentSegment === '(student)' && profile.role !== 'student') {
        if (profile.role === 'tutor') {
          router.replace('/(tutor)/dashboard');
        } else if (profile.role === 'admin') {
          router.replace('/(admin)/dashboard');
        }
      } else if (currentSegment === '(tutor)' && profile.role !== 'tutor') {
        if (profile.role === 'student') {
          router.replace('/(student)/dashboard');
        } else if (profile.role === 'admin') {
          router.replace('/(admin)/dashboard');
        }
      } else if (currentSegment === '(admin)' && profile.role !== 'admin') {
        if (profile.role === 'tutor') {
          router.replace('/(tutor)/dashboard');
        } else {
          router.replace('/(student)/dashboard');
        }
      } else if (!inAuthGroup && !isAuthScreen) {
        // Cold start or welcome screen redirect to correct role dashboard
        if (profile.role === 'admin') {
          router.replace('/(admin)/dashboard');
        } else if (profile.role === 'tutor') {
          router.replace('/(tutor)/dashboard');
        } else {
          router.replace('/(student)/dashboard');
        }
      }
    } else if (!session) {
      if (inAuthGroup) {
        router.replace('/welcome');
      }
    }
  }, [session, profile, loading, segments]);

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

// ─── Root layout wraps everything with AuthProvider ───────────────────────────
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
