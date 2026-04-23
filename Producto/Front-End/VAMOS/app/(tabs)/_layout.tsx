import Entypo from "@expo/vector-icons/Entypo";
import { Tabs } from "expo-router";
import { Text } from "react-native";

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6f00ff",
      }}
    >
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificaciones",
          tabBarIcon: ({ focused }) => <Entypo name="bell" size={24} color="#ff7300" />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ focused }) => <Entypo name="map" size={24} color="#ff7300" />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Guardados",
          tabBarIcon: ({ focused }) => <Entypo name="save" size={24} color="#ff7300" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <Entypo name="user" size={24} color="#ff7300" />,
        }}
      />
    </Tabs>
  );
}