import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SavedEventsProvider } from './context/SavedEventsContext';
import { GruposProvider } from './context/GruposContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GruposProvider>
    <SavedEventsProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SavedEventsProvider>
    </GruposProvider>
  );
}