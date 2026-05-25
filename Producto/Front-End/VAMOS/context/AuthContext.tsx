import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

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
  const [necesitaFecha, setNecesitaFecha] = useState(false);

  // Al abrir la app, revisar si hay sesión guardada
  useEffect(() => {
    async function cargarSesion() {
      try {
        const token   = await SecureStore.getItemAsync('accessToken');
        const userStr = await SecureStore.getItemAsync('usuario');

        if (token && userStr) {
          const usuarioParsed = JSON.parse(userStr);
          setAccessToken(token);
          setUsuario(usuarioParsed);
          setNecesitaFecha(!usuarioParsed.fecha_nacimiento);
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
    usuario: UsuarioVAMOS
  ) {
    await SecureStore.setItemAsync('accessToken',  access);
    await SecureStore.setItemAsync('refreshToken', refresh);
    await SecureStore.setItemAsync('usuario',      JSON.stringify(usuario));

    setAccessToken(access);
    setUsuario(usuario);

    // Si es usuario nuevo lo marcamos para redirigir a fecha nacimiento
    setNecesitaFecha(!usuario.fecha_nacimiento);  
  }

  // Se llama cuando el usuario completa el formulario de fecha nacimiento
  async function completarRegistro() {
    setNecesitaFecha(false);

    if (usuario) {
      const usuarioActualizado = { ...usuario, es_nuevo: false };
      await SecureStore.setItemAsync('usuario', JSON.stringify(usuarioActualizado));
      setUsuario(usuarioActualizado);
    }
  }

  async function cerrarSesion() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('usuario');

    setAccessToken(null);
    setUsuario(null);
  }

  return (
  <AuthContext.Provider value={{
    usuario,
    accessToken,
    estaLogueado:  !!accessToken,
    necesitaFecha,        // ← esta línea
    cargando,
    guardarSesion,
    cerrarSesion,
    completarRegistro,
  }}>
    {children}
  </AuthContext.Provider>
);
}