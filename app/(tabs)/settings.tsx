import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export default function SettingsScreen() {
  const { signOut } = useAuthActions();

  async function handleLogout() {
    await signOut();
  }

  return (
    <View className="flex-1 p-4">
      <View className="flex-1" />
      <Button variant="destructive" onPress={handleLogout}>
        <Icon as={LogOut} className="size-4 text-white" />
        <Text>Log Out</Text>
      </Button>
    </View>
  );
}
