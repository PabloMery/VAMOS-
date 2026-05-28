// app/_layout.tsx
//
// Layout raíz. Providers + listener de Branch deep links.
// La lógica de redirección por auth vive en app/index.tsx.

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SavedEventsProvider } from '@/context/SavedEventsContext';
import { GruposProvider } from '../context/GruposContext';
import { AuthProvider } from '../context/AuthContext';
import { useBranchLinks } from '@/hooks/useBranchLinks';

// Componente interno que usa los hooks (necesita estar dentro de los providers)
function AppContent() {
  const colorScheme = useColorScheme();

  // Escuchar links de Branch para invitaciones a grupos
  useBranchLinks();

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
          <AppContent />
        </SavedEventsProvider>
      </GruposProvider>
    </AuthProvider>
  );
}