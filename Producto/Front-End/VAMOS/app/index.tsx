import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/app/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export default function IndexScreen() {
  const { estaLogueado, cargando, esUsuarioNuevo } = useAuth();
  const theme = useTheme();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!estaLogueado) return <Redirect href="/login" />;
  if (esUsuarioNuevo) return <Redirect href="/fecha-nacimiento" />;
  return <Redirect href="/(tabs)" />;
}