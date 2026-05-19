
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SavedEventsProvider } from './context/SavedEventsContext';
import { AuthProvider } from './context/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <SavedEventsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="fecha-nacimiento" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          
          <StatusBar style="auto" />
        </ThemeProvider>
      </SavedEventsProvider>
    </AuthProvider>
  );
}