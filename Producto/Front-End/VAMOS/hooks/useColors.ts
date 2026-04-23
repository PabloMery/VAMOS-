import { Colors } from "@/constants/colors";
import { useColorScheme } from "react-native";

export function useColors() {
  const scheme = useColorScheme();
  return Colors[scheme === "dark" ? "dark" : "light"];
}