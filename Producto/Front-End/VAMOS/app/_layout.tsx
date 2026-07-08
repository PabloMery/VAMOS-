// app/_layout.tsx
//
// Layout raíz. Providers + listener de Branch deep links.
// La lógica de redirección por auth vive en app/index.tsx.

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SavedEventsProvider } from '@/context/SavedEventsContext';
import { GruposProvider } from '../context/GruposContext';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useThemeMode } from '../context/ThemeContext';

// Componente interno que usa los hooks (necesita estar dentro de los providers)
function AppContent() {
  const { esquemaActivo } = useThemeMode();

  return (
    <NavigationThemeProvider value={esquemaActivo === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="fecha-nacimiento" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GruposProvider>
          <SavedEventsProvider>
            <AppContent />
          </SavedEventsProvider>
        </GruposProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}