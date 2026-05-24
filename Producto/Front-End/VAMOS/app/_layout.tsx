import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { SavedEventsProvider } from '@/context/SavedEventsContext';
import { GruposProvider } from '../context/GruposContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootNavigator() {
  const { estaLogueado, necesitaFecha, cargando } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
  if (cargando) return;

  const enTabs        = segments[0] === '(tabs)';
  const enFechaNac    = segments[0] === 'fecha-nacimiento';
  const enLogin       = segments[0] === 'login';
  
  // ← reemplaza la comparación problemática por esto
  const enInicio      = !segments[0] || enLogin || (segments as string[])[0] === 'index';

  if (!estaLogueado && !enInicio) {
    router.replace('/');
    return;
  }

  if (estaLogueado && necesitaFecha && !enFechaNac) {
    router.replace('/fecha-nacimiento');
    return;
  }

  if (estaLogueado && !necesitaFecha && !enTabs) {
    router.replace('/(tabs)');
  }
}, [estaLogueado, necesitaFecha, cargando, segments]);

  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="fecha-nacimiento" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GruposProvider>
        <SavedEventsProvider>
          <RootNavigator />
        </SavedEventsProvider>
      </GruposProvider>
    </AuthProvider>
  );
}