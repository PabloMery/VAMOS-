// context/ThemeContext.tsx
//
// Guarda la preferencia de tema del usuario (claro / oscuro / sistema)
// y la persiste entre sesiones con AsyncStorage.
// useTheme() lee de aquí para saber qué esquema aplicar.

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ModoTema = 'light' | 'dark' | 'system';

type ThemeContextType = {
  modo: ModoTema;                       // lo que el usuario eligió
  esquemaActivo: 'light' | 'dark';      // el que realmente se aplica
  setModo: (m: ModoTema) => Promise<void>;
};

const THEME_KEY = 'vamos_tema';

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode debe usarse dentro de ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme() ?? 'light';
  const [modo, setModoState] = useState<ModoTema>('system');

  // Al abrir la app, cargar la preferencia guardada
  useEffect(() => {
    async function cargar() {
      try {
        const guardado = await AsyncStorage.getItem(THEME_KEY);
        if (guardado === 'light' || guardado === 'dark' || guardado === 'system') {
          setModoState(guardado);
        }
      } catch (e) {
        console.log('Error cargando tema:', e);
      }
    }
    cargar();
  }, []);

  async function setModo(nuevo: ModoTema) {
    setModoState(nuevo);
    await AsyncStorage.setItem(THEME_KEY, nuevo);
  }

  const esquemaActivo: 'light' | 'dark' =
    modo === 'system' ? sistema : modo;

  return (
    <ThemeContext.Provider value={{ modo, esquemaActivo, setModo }}>
      {children}
    </ThemeContext.Provider>
  );
}