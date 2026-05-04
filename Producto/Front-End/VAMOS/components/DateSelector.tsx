import { useColors } from "@/hooks/useColors";
import Entypo from '@expo/vector-icons/Entypo';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
type Props = {
  date: Date;
  onChange: (date: Date) => void;
};

// Formatea "Martes 22 de Abril"
function formatDate(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function DateSelector({ date, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Ícono calendario  */}
      <TouchableOpacity 
        onPress={() => setShowPicker(true)} 
        style={styles.iconWrapper}
      >
        <Entypo name="calendar" size={24} color="#ff7300" />
      </TouchableOpacity>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onChange(addDays(date, -1))}>
          <Text style={[styles.arrow, { color: colors.purple }]}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPicker(true)}>
          <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange(addDays(date, 1))}>
          <Text style={[styles.arrow, { color: colors.purple }]}>▶</Text>
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
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10, // Un poco más de aire
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 100, // Asegura que esté por encima del mapa
  },
  iconWrapper: {
    marginBottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  arrow: {
    fontSize: 18,
    color: "#ff7300",
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",  // "martes" → "Martes"
    color: "#8c00ff",
  },
});