import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Boxes,
  ReceiptIndianRupee,
  BookOpen,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#2d2d44",
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#8b7cf7",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, size }) => <Boxes size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: ({ color, size }) => (
            <ReceiptIndianRupee size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="khata"
        options={{
          title: "Khata",
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
