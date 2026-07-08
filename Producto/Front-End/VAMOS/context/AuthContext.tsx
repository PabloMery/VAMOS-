// context/AuthContext.tsx
//
// Provider de autenticación.
// FIX: usa saveTokens/getToken/deleteTokens de apiClient.ts
// para que haya UNA SOLA fuente de verdad de tokens.
// Antes usaba llaves distintas ('accessToken' vs 'vamos_access_token')
// y el apiClient nunca encontraba el token.

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import {
  saveTokens as guardarTokensEnStore,
  getToken,
  deleteTokens as borrarTokensDelStore,
} from '../services/apiClient';

// ── Tipos ──────────────────────────────────────
type UsuarioVAMOS = {
  id:           number;
  email:        string;
  nombre:       string;
  apellido:     string;
  avatar_url:   string | null;
  fecha_nacimiento:  string | null;
  es_nuevo?:    boolean;
};

type AuthContextType = {
  usuario:        UsuarioVAMOS | null;
  accessToken:    string | null;
  estaLogueado:   boolean;
  necesitaFecha:  boolean;
  cargando:       boolean;
  guardarSesion:     (access: string, refresh: string, usuario: UsuarioVAMOS) => Promise<void>;
  cerrarSesion:      () => Promise<void>;
  completarRegistro: () => Promise<void>;
};

// Llave para guardar el objeto usuario (esto no lo maneja apiClient)
const USUARIO_KEY = 'vamos_usuario';

// ── Contexto ───────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario,        setUsuario]        = useState<UsuarioVAMOS | null>(null);
  const [accessToken,    setAccessToken]    = useState<string | null>(null);
  const [cargando,       setCargando]       = useState(true);
  const [necesitaFecha,  setNecesitaFecha]  = useState(false);

  // Al abrir la app, revisar si hay sesión guardada
  useEffect(() => {
    async function cargarSesion() {
      try {
        // Usa getToken de apiClient (llave 'vamos_access_token')
        const token   = await getToken();
        const userStr = await SecureStore.getItemAsync(USUARIO_KEY);

        if (token && userStr) {
          const usuarioParsed = JSON.parse(userStr);
          setAccessToken(token);
          setUsuario(usuarioParsed);
          setNecesitaFecha(!usuarioParsed.fecha_nacimiento);
          console.log('✅ Sesión cargada desde SecureStore');
        } else {
          console.log('⏭️ No hay sesión guardada');
        }
      } catch (e) {
        console.log('Error cargando sesión:', e);
      } finally {
        setCargando(false);
      }
    }

    cargarSesion();
  }, []);

  async function guardarSesion(
    access:  string,
    refresh: string,
    usr: UsuarioVAMOS
  ) {
    // Guardar tokens con apiClient (usa 'vamos_access_token' y 'vamos_refresh_token')
    await guardarTokensEnStore(access, refresh);
    // Guardar usuario aparte
    await SecureStore.setItemAsync(USUARIO_KEY, JSON.stringify(usr));

    setAccessToken(access);
    setUsuario(usr);
    setNecesitaFecha(!usr.fecha_nacimiento);

    console.log('✅ Sesión guardada para:', usr.email);
  }

  // Se llama cuando el usuario completa el formulario de fecha nacimiento
  async function completarRegistro() {
    setNecesitaFecha(false);

    if (usuario) {
      const usuarioActualizado = { ...usuario, es_nuevo: false };
      await SecureStore.setItemAsync(USUARIO_KEY, JSON.stringify(usuarioActualizado));
      setUsuario(usuarioActualizado);
    }
  }

  async function cerrarSesion() {
    // Cerrar sesión en Google para que la próxima vez pida elegir cuenta
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.log('Google signOut falló (puede que no hubiera sesión):', e);
    }

    // Borrar tokens con apiClient
    await borrarTokensDelStore();
    // Borrar usuario
    await SecureStore.deleteItemAsync(USUARIO_KEY);

    setAccessToken(null);
    setUsuario(null);
    setNecesitaFecha(false);

    console.log('👋 Sesión cerrada');
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      accessToken,
      estaLogueado:  !!accessToken,
      necesitaFecha,
      cargando,
      guardarSesion,
      cerrarSesion,
      completarRegistro,
    }}>
      {children}
    </AuthContext.Provider>
  );
}