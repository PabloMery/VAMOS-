// components/JoinGroupModal.tsx
//
// Modal para unirse a un grupo ingresando el código de invitación.
// Se usa en saved.tsx con un botón "Unirse a grupo".

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useGrupos } from "@/context/GruposContext";
import { useSavedEvents } from "@/context/SavedEventsContext";
import { guardarEvento } from "@/services/savedEventsApi";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function JoinGroupModal({ visible, onClose }: Props) {
  const { colors, radius, spacing } = useTheme();
  const { unirseAGrupo } = useGrupos();
  const { refrescarEventos } = useSavedEvents();
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);

  const codigoLimpio = codigo.trim().toUpperCase();
  const puedeUnirse = codigoLimpio.length >= 4 && !cargando;

  const handleUnirse = async () => {
    if (!puedeUnirse) return;

    setCargando(true);
    try {
      const grupo = await unirseAGrupo(codigoLimpio);

      if (grupo) {
        // Confirmar el evento en el backend para que aparezca en "Confirmados"
        try {
          await guardarEvento(grupo.evento_id, "confirmed");
          await refrescarEventos();
        } catch {
          // No bloquear si falla — el grupo ya se unió
          console.warn("⚠️ No se pudo confirmar el evento automáticamente");
        }

        // Limpiar y cerrar el modal
        setCodigo("");
        onClose();

        // Navegar al grupo
        router.push({
          pathname: "/grupo/[id]",
          params: {
            id: String(grupo.id),
            eventoNombre: "",
            fechaEvento: "",
          },
        });
      }
    } catch (err: any) {
      Alert.alert(
        "No se pudo unir",
        err?.message ?? "Código inválido o hubo un error. Intenta de nuevo."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    setCodigo("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCerrar}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Fondo oscuro que cierra el modal */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCerrar} />

        {/* Contenido del modal */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.xl }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.titulo, { color: colors.text }]}>Unirse a un grupo</Text>
            <Text style={[styles.subtitulo, { color: colors.subtext }]}>
              Ingresa el código que te compartieron
            </Text>
          </View>

          {/* Input del código */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: codigo ? colors.primary : colors.border,
                borderRadius: radius.lg,
              },
            ]}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="Ej: NSU51U"
            placeholderTextColor={colors.subtext}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
            autoFocus
          />

          {/* Botones */}
          <View style={styles.botones}>
            <TouchableOpacity
              style={[
                styles.btnCancelar,
                { borderColor: colors.border, borderRadius: radius.lg },
              ]}
              onPress={handleCerrar}
            >
              <Text style={[styles.btnCancelarText, { color: colors.subtext }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnUnirse,
                {
                  backgroundColor: puedeUnirse ? colors.primary : colors.border,
                  borderRadius: radius.lg,
                },
              ]}
              onPress={handleUnirse}
              disabled={!puedeUnirse}
            >
              {cargando ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="enter-outline" size={18} color="white" />
                  <Text style={styles.btnUnirseText}>Unirse</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: {
    width: "85%",
    maxWidth: 340,
    padding: 24,
    gap: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    alignItems: "center",
    gap: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitulo: {
    fontSize: 14,
    textAlign: "center",
  },
  input: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  botones: {
    flexDirection: "row",
    gap: 12,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  btnCancelarText: {
    fontSize: 15,
    fontWeight: "600",
  },
  btnUnirse: {
    flex: 1,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnUnirseText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});