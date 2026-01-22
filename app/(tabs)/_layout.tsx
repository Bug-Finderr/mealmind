import { Tabs } from "expo-router";
import { Home, Settings } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Icon as={Home} className="size-5" style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Icon as={Settings} className="size-5" style={{ color }} />
          ),
        }}
      />
    </Tabs>
  );
}
