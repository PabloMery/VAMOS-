import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';

// Necesario para que el navegador cierre correctamente al volver a la app
WebBrowser.maybeCompleteAuthSession();

const API_URL = 'http://10.0.2.2:8000/api/usuarios'; // Android emulator
// const API_URL = 'http://TU_IP_LOCAL:8000/api/usuarios'; // Celular físico

type UsuarioVAMOS = {
  id:         number;
  email:      string;
  nombre:     string;
  apellido:   string;
  avatar_url: string | null;
};

type AuthState = {
  accessToken:  string | null;
  refreshToken: string | null;
  usuario:      UsuarioVAMOS | null;
};

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken:  null,
    refreshToken: null,
    usuario:      null,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'TU_GOOGLE_CLIENT_ID_ANDROID.apps.googleusercontent.com',
    // webClientId: 'TU_GOOGLE_CLIENT_ID_WEB.apps.googleusercontent.com', // opcional
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        enviarTokenAlBackend(authentication.idToken);
      }
    }
  }, [response]);

  async function enviarTokenAlBackend(idToken: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/google/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id_token: idToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al autenticar');
      }

      const data = await res.json();

      setAuthState({
        accessToken:  data.access,
        refreshToken: data.refresh,
        usuario:      data.usuario,
      });

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function cerrarSesion() {
    setAuthState({
      accessToken:  null,
      refreshToken: null,
      usuario:      null,
    });
  }

  return {
    usuario:      authState.usuario,
    accessToken:  authState.accessToken,
    estaLogueado: !!authState.accessToken,
    loading,
    error,
    iniciarSesion: () => promptAsync(),
    cerrarSesion,
  };
}