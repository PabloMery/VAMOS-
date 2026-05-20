// components/DateSelector.tsx

import { useTheme } from "@/hooks/useTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  date:     Date;
  onChange: (date: Date) => void;
};

// Formatea "Martes 22 de Abril"
function formatDate(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function DateSelector({ date, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>

      <View style={styles.row}>
        {/* Flecha izquierda */}
        <TouchableOpacity
          onPress={() => onChange(addDays(date, -1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Fecha tapeable — abre el picker */}
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={15} color={colors.confirm} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(date)}
          </Text>
        </TouchableOpacity>

        {/* Flecha derecha */}
        <TouchableOpacity
          onPress={() => onChange(addDays(date, 1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={(_, selected) => {
            setShowPicker(false);
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 100,
  },
  row:      { flexDirection: "row", alignItems: "center", gap: 8 },
  dateBtn:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  dateText: { fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
});