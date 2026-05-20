// components/AIChatModal.tsx

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTheme } from "@/hooks/useTheme";
import { askVambot, EventoVambot } from "@/app/services/Vambotapi";
import { useUserLocation } from "@/hooks/useUserLocation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EventosAdjuntos = EventoVambot[];

type Message = {
  id: string;
  text: string;
  from: "user" | "ai";
  eventos?: EventosAdjuntos; // solo los mensajes del bot pueden traer eventos
};

type Props = { visible: boolean; onClose: () => void };

// ─────────────────────────────────────────────────────────────────────────────

export function AIChatModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const { location } = useUserLocation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      from: "ai",
      text: "¡Hola! Soy Vambot, tu asistente de eventos. ¿Qué tipo de actividades te interesan?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const listRef = useRef<FlatList>(null);

  // ── Escuchar teclado ──────────────────────────────────────────────────────
  useEffect(() => {
    const show =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(show, (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const onHide = Keyboard.addListener(hide, () => setKbHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const texto = input.trim();
    if (!texto || isLoading) return;

    // 1. Agregar mensaje del usuario
    const userMsg: Message = {
      id: Date.now().toString(),
      from: "user",
      text: texto,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // 2. Preparar coordenadas si tenemos ubicación
      const coords = location
        ? { latitud: location.latitude, longitud: location.longitude }
        : undefined;

      // 3. Llamar a Vambot
      const respuesta = await askVambot(texto, coords);

      // 4. Agregar respuesta del bot con eventos si hay
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "ai",
        text: respuesta.respuesta_texto,
        eventos:
          respuesta.eventos_encontrados.length > 0
            ? respuesta.eventos_encontrados
            : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      // 5. Mostrar error como mensaje del bot (no crashea la app)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "ai",
        text: error.message ?? "No pude conectarme al servidor. Intenta de nuevo.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Render de una tarjeta de evento ───────────────────────────────────────
  const renderEventoCard = (evento: EventoVambot, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.eventoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => {
        if (evento.link_url) Linking.openURL(evento.link_url);
      }}
      activeOpacity={evento.link_url ? 0.7 : 1}
    >
      <View style={styles.eventoHeader}>
        <Ionicons name="calendar-outline" size={14} color={theme.colors.confirm} />
        <Text style={[styles.eventoFecha, { color: theme.colors.confirm }]}>
          {evento.fecha}
        </Text>
        {!evento.datos_frescos && (
          <View style={[styles.frescosBadge, { backgroundColor: theme.colors.warning + "20" }]}>
            <Ionicons name="alert-circle-outline" size={11} color={theme.colors.warning} />
            <Text style={[styles.frescosText, { color: theme.colors.warning }]}>
              Podría estar desactualizado
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.eventoTitulo, { color: theme.colors.text }]} numberOfLines={2}>
        {evento.titulo}
      </Text>
      {evento.link_url ? (
        <View style={styles.eventoLinkRow}>
          <Ionicons name="open-outline" size={12} color={theme.colors.primary} />
          <Text style={[styles.eventoLink, { color: theme.colors.primary }]}>
            Ver más
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  // ── Render de una burbuja ─────────────────────────────────────────────────
  const renderBubble = ({ item }: { item: Message }) => (
    <View>
      <View
        style={[
          styles.bubble,
          item.from === "user"
            ? [styles.bubbleUser, { backgroundColor: theme.colors.confirm }]
            : [styles.bubbleAI, { backgroundColor: theme.colors.primary }],
        ]}
      >
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>

      {/* Tarjetas de eventos debajo de la burbuja del bot */}
      {item.eventos && item.eventos.length > 0 && (
        <View style={styles.eventosContainer}>
          {item.eventos.map((ev, i) => renderEventoCard(ev, i))}
        </View>
      )}
    </View>
  );

  // ── Indicador de "escribiendo..." ─────────────────────────────────────────
  const renderTypingIndicator = () => {
    if (!isLoading) return null;
    return (
      <View style={[styles.bubble, styles.bubbleAI, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="white" />
          <Text style={[styles.bubbleText, { marginLeft: 8 }]}>Buscando eventos...</Text>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      keyboardOffset={kbHeight}
    >
      <View style={styles.inner}>
        {/* Encabezado */}
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.avatarDot,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Ionicons name="sparkles" size={14} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              VamBot
            </Text>
            <Text
              style={[styles.headerSub, { color: theme.colors.subtext }]}
            >
              Te recomiendo actividades cerca tuyo
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={theme.colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Mensajes */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: theme.spacing.sm },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={renderBubble}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input */}
        <View
          style={[
            styles.inputRow,
            {
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              paddingBottom: theme.spacing.md,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Pregúntame sobre eventos..."
            placeholderTextColor={theme.colors.subtle}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={!isLoading}
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  input.trim() && !isLoading
                    ? theme.colors.primary
                    : theme.colors.surface,
              },
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons
              name="paper-plane"
              size={20}
              color={
                input.trim() && !isLoading
                  ? theme.colors.confirm
                  : theme.colors.subtext
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  inner: {
    flex: 1,
    flexDirection: "column",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  avatarDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },

  list: { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },

  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAI: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { color: "white", fontSize: 15, lineHeight: 21 },

  typingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // ── Tarjetas de eventos ──────────────────────────────────────────────────
  eventosContainer: {
    marginTop: 6,
    marginLeft: 0,
    maxWidth: "85%",
    gap: 6,
  },
  eventoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  eventoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  eventoFecha: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventoTitulo: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  eventoLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  eventoLink: {
    fontSize: 12,
    fontWeight: "600",
  },
  frescosBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  frescosText: {
    fontSize: 10,
    fontWeight: "500",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});