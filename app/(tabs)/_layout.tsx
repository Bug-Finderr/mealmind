import { Tabs } from "expo-router";
import { Clock, Home, Settings } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Icon as={Home} className="size-5" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <Icon as={Clock} className="size-5" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Icon as={Settings} className="size-5" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
