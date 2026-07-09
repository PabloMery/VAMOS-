import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { apiRequest } from '@/services/apiClient'; 
import { useAuth } from '@/context/AuthContext'; 

export default function FechaNacimientoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { cerrarSesion } = useAuth(); // Necesitamos esto para expulsarlos si mienten con la edad

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Función para calcular la edad exacta
  const calcularEdad = (fechaNacimiento: Date) => {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    
    // Si aún no ha llegado su mes de cumpleaños, o es el mes pero no ha llegado el día, restamos 1 año
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    // En Android el picker se cierra solo al seleccionar, en iOS no
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      setError(null); // Limpiamos errores al cambiar la fecha
    }
  };

  // 2. Función para guardar y validar
  const { completarRegistro } = useAuth();

  const guardarFecha = async () => {
    const edad = calcularEdad(date);
    if (edad < 18) {
      setError("Lo sentimos, debes tener al menos 18 años para usar VAMOS.");
      return;
    }

    setLoading(true);
    try {
      const fechaFormateada = date.toISOString().split('T')[0];
      await apiRequest('/usuarios/perfil/', {
        method: 'PATCH',
        auth: true, 
        body: { fecha_nacimiento: fechaFormateada }
      });

      await completarRegistro(); // ← esto actualiza el contexto y dispara la redirección
      router.replace('/(tabs)');   
    } catch (e) {
      setError("Hubo un problema al guardar tu fecha. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para cancelar si son menores de edad y quieren salir
  const cancelarYSalir = async () => {
    await cerrarSesion(); // Borra los tokens del SecureStore
    router.replace('/'); // Vuelve al Login
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.colors.text }]}>¿Cuándo naciste?</Text>
        <Text style={[styles.subtitulo, { color: theme.colors.subtext }]}>
          Necesitamos tu fecha de nacimiento para asegurarnos de que tienes la edad adecuada para usar la aplicación.
        </Text>
      </View>

      <View style={styles.content}>
        {/* Botón para abrir el calendario en Android/iOS */}
        <TouchableOpacity 
          style={[styles.dateSelector, { borderColor: theme.colors.border }]} 
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.dateText, { color: theme.colors.primary }]}>
            {date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner" // O 'default', 'inline' dependiendo de tu diseño
            maximumDate={new Date()} // No pueden nacer en el futuro
            onChange={onChangeDate}
          />
        )}

        {/* Cierre en iOS */}
        {showPicker && Platform.OS === 'ios' && (
          <TouchableOpacity onPress={() => setShowPicker(false)}>
            <Text style={{ color: theme.colors.primary, textAlign: 'center', marginTop: 10 }}>Confirmar fecha</Text>
          </TouchableOpacity>
        )}

        {error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.botonGuardar, { backgroundColor: theme.colors.primary }]}
          onPress={guardarFecha}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBoton}>Continuar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={cancelarYSalir} style={{ marginTop: 20 }}>
          <Text style={[styles.textoCancelar, { color: theme.colors.subtext }]}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 60,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  dateSelector: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '600',
  },
  footer: {
    marginBottom: 40,
  },
  botonGuardar: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoCancelar: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  }
});