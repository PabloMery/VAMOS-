import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export default function FechaNacimientoScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  // Extraemos el token del contexto para autorizar la petición
  const { accessToken, completarRegistro } = useAuth(); 
  
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para manejar el cambio en el input y poner las barras automáticamente (DD/MM/AAAA)
  const manejarCambioFecha = (texto: string) => {
    let textoLimpio = texto.replace(/[^0-9]/g, '');
    if (textoLimpio.length > 2) textoLimpio = textoLimpio.substring(0, 2) + '/' + textoLimpio.substring(2);
    if (textoLimpio.length > 5) textoLimpio = textoLimpio.substring(0, 5) + '/' + textoLimpio.substring(5);
    setFecha(textoLimpio.substring(0, 10));
  };

  const guardarFecha = async () => {
    if (fecha.length < 10) {
      Alert.alert('Formato inválido', 'Por favor usa el formato DD/MM/AAAA');
      return;
    }

    setLoading(true);
    try {
      // 1. Enviamos el dato a nuestro Django (Asegúrate de que esta URL coincida con tu backend)
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/usuarios/perfil/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` // 👈 Pase VIP
        },
        // Django suele requerir formato AAAA-MM-DD para bases de datos, lo transformamos:
        body: JSON.stringify({ 
          fecha_nacimiento: fecha.split('/').reverse().join('-') 
        }),
      });

      if (!res.ok) throw new Error('Error al guardar en el servidor');

      // 2. Actualizamos el estado global (AuthContext) para que sepa que ya no es nuevo
      await completarRegistro();

      // 3. ¡Bienvenido a VAMOS! Lo mandamos al mapa
      router.replace('/(tabs)');

    } catch (error) {
      console.log('Error al guardar fecha:', error);
      Alert.alert('Error', 'No pudimos guardar tu información. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.colors.text }]}>
          Ya casi estamos
        </Text>
        <Text style={[styles.subtitulo, { color: theme.colors.subtext }]}>
          Necesitamos tu fecha de nacimiento para recomendarte los mejores eventos municipales.
        </Text>
      </View>

      <View style={styles.formulario}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Fecha de Nacimiento
        </Text>
        <TextInput
          style={[
            styles.input, 
            { 
              backgroundColor: theme.colors.card, 
              color: theme.colors.text,
              borderColor: theme.colors.border 
            }
          ]}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={theme.colors.subtle}
          keyboardType="numeric"
          value={fecha}
          onChangeText={manejarCambioFecha}
          maxLength={10}
        />

        <TouchableOpacity
          style={[
            styles.botonGuardar, 
            { 
              backgroundColor: fecha.length === 10 ? theme.colors.primary : theme.colors.border 
            }
          ]}
          onPress={guardarFecha}
          disabled={loading || fecha.length < 10}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBoton}>Comenzar a explorar</Text>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  header: {
    marginBottom: 40,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 24,
  },
  formulario: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
  },
  botonGuardar: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});