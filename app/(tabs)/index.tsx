import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text variant="h3">Welcome to MealMind</Text>
      <Text variant="muted" className="mt-2">
        Your meal planning companion
      </Text>
    </View>
  );
}
