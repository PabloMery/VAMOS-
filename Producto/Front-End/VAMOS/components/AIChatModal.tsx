// components/AIChatModal.tsx

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Message = { id: string; text: string; from: "user" | "ai" };
type Props   = { visible: boolean; onClose: () => void };

// ─────────────────────────────────────────────────────────────────────────────

export function AIChatModal({ visible, onClose }: Props) {
  const theme = useTheme();

  const [messages, setMessages] = useState<Message[]>([{
    id: "0", from: "ai",
    text: "¡Hola! Soy Vambot, tu asistente de eventos. ¿Qué tipo de actividades te interesan?",
  }]);
  const [input, setInput] = useState("");
  // Altura del teclado — se pasa a BottomSheet para subir el panel
  const [kbHeight, setKbHeight] = useState(0);
  const listRef = useRef<FlatList>(null);

  // ── Escuchar teclado ──────────────────────────────────────────────────────
  // No usamos KeyboardAvoidingView porque no funciona bien con position:absolute.
  // En su lugar, pasamos la altura del teclado a BottomSheet y este sube el panel.
  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(show, (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const onHide = Keyboard.addListener(hide, () => setKbHeight(0));
    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), from: "user", text: input.trim() };
    // Placeholder hasta conectar Vambot con Django
    const aiMsg: Message   = { id: (Date.now() + 1).toString(), from: "ai", text: "El asistente estará disponible pronto..." };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    // keyboardOffset sube el panel para que el input quede sobre el teclado
    <BottomSheet visible={visible} onClose={onClose} keyboardOffset={kbHeight}>

      {/*
        Layout de columna: header (fijo) + FlatList (flex:1) + inputRow (fijo).
        Como BottomSheet usa `top` animado y `bottom:0`, el panel ocupa
        exactamente el área visible → flex funciona y el input siempre se ve.
      */}
      <View style={styles.inner}>

        {/* Encabezado */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={[styles.avatarDot, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="sparkles" size={14} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>VamBot</Text>
            <Text style={[styles.headerSub, { color: theme.colors.subtext }]}>
              Te recomiendo actividades cerca tuyo
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={theme.colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Mensajes — ocupa todo el espacio disponible entre header e input */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: theme.spacing.sm },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.from === "user"
                  ? [styles.bubbleUser, { backgroundColor: theme.colors.confirm }]
                  : [styles.bubbleAI,   { backgroundColor: theme.colors.primary }],
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
        />

        {/* Input — siempre al fondo del área visible gracias al flex layout */}
        <View style={[
          styles.inputRow,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.card,
            paddingBottom: theme.spacing.md,
          },
        ]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={theme.colors.subtle}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: input.trim() ? theme.colors.primary : theme.colors.surface },
            ]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons
              name="paper-plane"
              size={20}
              color={input.trim() ? theme.colors.confirm : theme.colors.subtext}
            />
          </TouchableOpacity>
        </View>

      </View>
    </BottomSheet>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Columna que llena todo el espacio que le da BottomSheet
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
  avatarDot:   { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  headerText:  { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  headerSub:   { fontSize: 12, marginTop: 1 },

  // flex: 1 hace que la lista crezca para llenar el espacio entre header e input
  list:        { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },

  bubble:      { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser:  { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAI:    { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText:  { color: "white", fontSize: 15, lineHeight: 21 },

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