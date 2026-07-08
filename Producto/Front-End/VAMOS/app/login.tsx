// app/login.tsx
import { useAuth } from "@/context/AuthContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ── Logo estilizado ────────────────────────────────────────────────────────
// V → morado, amos → naranjo, ? → morado, ! → naranjo
function VamosLogo({ colors }: { colors: { primary: string; confirm: string } }) {
  return (
    <View style={styles.logoRow}>
      <Text style={[styles.logoChar, { color: colors.primary }]}>V</Text>
      <Text style={[styles.logoChar, { color: colors.confirm }]}>a</Text>
      <Text style={[styles.logoChar, { color: colors.confirm }]}>m</Text>
      <Text style={[styles.logoChar, { color: colors.confirm }]}>o</Text>
      <Text style={[styles.logoChar, { color: colors.confirm }]}>s</Text>
      <Text style={[styles.logoChar, { color: colors.primary }]}>?</Text>
      <Text style={[styles.logoChar, { color: colors.confirm }]}>!</Text>
    </View>
  );
}

export default function LoginScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const { guardarSesion, estaLogueado, necesitaFecha } = useAuth();
  const { iniciarSesion, response, loading, error } = useGoogleAuth();

  // Cuando Google responde exitosamente
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        manejarLoginExitoso(authentication.idToken);
      }
    }
  }, [response]);

  async function manejarLoginExitoso(idToken: string) {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/usuarios/auth/google/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        }
      );

      if (!res.ok) throw new Error("Error al autenticar");

      const data = await res.json();
      await guardarSesion(data.access, data.refresh, data.usuario);
    } catch (e) {
      console.log("Error en login:", e);
    }
  }

  // Redirigir según el estado
  useEffect(() => {
    if (estaLogueado) {
      if (necesitaFecha) {
        router.replace("/fecha-nacimiento" as any);
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [estaLogueado, necesitaFecha]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Parte superior: Logo + tagline ── */}
      <View style={styles.header}>
        <VamosLogo colors={colors} />
        <Text style={[styles.tagline, { color: colors.subtext }]}>
          Descubre eventos cerca de ti
        </Text>
      </View>

      {/* ── Ilustración central ── */}
      <View style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + "12" }]}>
          <View style={[styles.iconCircleInner, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="map" size={48} color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.centerText, { color: colors.textMuted }]}>
          Encuentra, guarda y confirma{"\n"}eventos en tu ciudad
        </Text>
      </View>

      {/* ── Parte inferior: Botones ── */}
      <View style={styles.footer}>
        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "15" }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.botonGoogle, { backgroundColor: colors.card }]}
          onPress={iniciarSesion}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Image
                source={{ uri: "https://www.google.com/favicon.ico" }}
                style={styles.iconoGoogle}
              />
              <Text style={[styles.textoBotonGoogle, { color: colors.text }]}>
                Continuar con Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.terminos, { color: colors.subtle }]}>
          Al continuar aceptas nuestros términos de uso
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },

  // ── Header ──
  header: {
    alignItems: "center",
    gap: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoChar: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    marginTop: 4,
  },

  // ── Centro ──
  center: {
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: "center", justifyContent: "center",
  },
  iconCircleInner: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center",
  },
  centerText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Footer ──
  footer: {
    gap: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  botonGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconoGoogle: {
    width: 20,
    height: 20,
  },
  textoBotonGoogle: {
    fontSize: 16,
    fontWeight: "700",
  },
  terminos: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
  },
});