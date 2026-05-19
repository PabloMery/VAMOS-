import { useAuth } from '@/app/context/AuthContext';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const theme                                        = useTheme();
  const router                                       = useRouter();
  const { guardarSesion, estaLogueado, esUsuarioNuevo } = useAuth();
  const { iniciarSesion, response, loading, error } = useGoogleAuth();

  // Cuando Google responde exitosamente
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        manejarLoginExitoso(authentication.idToken);
      }
    }
  }, [response]);

  async function manejarLoginExitoso(idToken: string) {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/usuarios/auth/google/`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ id_token: idToken }),
        }
      );

      if (!res.ok) throw new Error('Error al autenticar');

      const data = await res.json();
      await guardarSesion(data.access, data.refresh, data.usuario);

    } catch (e) {
      console.log('Error en login:', e);
    }
  }

  // Redirigir según el estado
  useEffect(() => {
    if (estaLogueado) {
      if (esUsuarioNuevo) {
        router.replace('/fecha-nacimiento' as any);
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [estaLogueado, esUsuarioNuevo]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Logo y título */}
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.colors.primary }]}>
          VAMOS
        </Text>
        <Text style={[styles.subtitulo, { color: theme.colors.subtext }]}>
          Descubre eventos en tu ciudad
        </Text>
      </View>

      {/* Botón de Google */}
      <View style={styles.footer}>
        {error && (
          <Text style={[styles.error, { color: theme.colors.danger }]}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.botonGoogle, { backgroundColor: theme.colors.card }]}
          onPress={iniciarSesion}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <>
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.iconoGoogle}
              />
              <Text style={[styles.textoBoton, { color: theme.colors.text }]}>
                Continuar con Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.terminos, { color: theme.colors.subtle }]}>
          Al continuar aceptas nuestros términos de uso
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop:  40,
  },
  titulo: {
    fontSize:   48,
    fontWeight: '800',
    letterSpacing: 4,
  },
  subtitulo: {
    fontSize:  16,
    marginTop: 8,
  },
  footer: {
    gap: 16,
  },
  botonGoogle: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        16,
    borderRadius:   12,
    gap:            12,
    elevation:      2,
    shadowColor:    '#000',
    shadowOpacity:  0.1,
    shadowRadius:   4,
  },
  iconoGoogle: {
    width:  20,
    height: 20,
  },
  textoBoton: {
    fontSize:   16,
    fontWeight: '600',
  },
  error: {
    textAlign: 'center',
    fontSize:  14,
  },
  terminos: {
    textAlign: 'center',
    fontSize:  12,
  },
});