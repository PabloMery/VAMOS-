import { useColors } from "@/hooks/useColors";
import Entypo from "@expo/vector-icons/Entypo";
import { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Message = {
  id: string;
  text: string;
  from: "user" | "ai";
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AIChatModal({ visible, onClose }: Props) {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      from: "ai",
      text: "¡Hola! Soy tu asistente de eventos ¿Qué tipo de actividades te interesan?",
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  function sendMessage() {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      from: "user",
      text: input.trim(),
    };

    // Respuesta placeholder hasta que tu compañero conecte la IA
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      from: "ai",
      text: "El asistente estará disponible pronto...",
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: colors.card }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              El VamBot
            </Text>
            <Text style={[styles.headerSub, { color: colors.subtext }]}>
              Te recomiendo actividades cerca tuyo
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.subtext }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Mensajes */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.from === "user"
                      ? [styles.bubbleUser, { backgroundColor: "#ff7300" }]  
                      : [styles.bubbleAI, { backgroundColor: "#6f00ff" }], 
              ]}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                }}
              >
                {item.text}
              </Text>
            </View>
          )}
        />

        {/* Input */}
        <View style={[styles.inputRow, { borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.subtle}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.purple }]}
            onPress={sendMessage}
          >
            <Text style={styles.sendText}><Entypo name="paper-plane" size={24} color="#ff7300" /></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    height: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "bold" },
  headerSub: { fontSize: 12, marginTop: 2 },
  closeButton: { padding: 4 },
  closeText: { fontSize: 18 },
  messageList: { padding: 16, gap: 10 },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
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
  sendText: { color: "white", fontSize: 16 },
});