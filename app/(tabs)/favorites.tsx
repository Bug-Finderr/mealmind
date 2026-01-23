import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecipeCard } from "@/components/recipe-card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const favorites = useQuery(api.favorites.list) ?? [];

  if (favorites.length === 0)
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="px-5 pt-4 pb-2">
          <Text variant="h3">Favorites</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3 px-5">
          <View className="rounded-full bg-muted/50 p-4">
            <Icon as={Heart} className="size-10 text-muted-foreground" />
          </View>
          <Text variant="muted" className="text-center">
            No favorites yet
          </Text>
          <Text variant="small" className="text-center text-muted-foreground">
            Tap the heart icon on any recipe to save it here
          </Text>
        </View>
      </View>
    );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-4 pb-2">
        <Text variant="h3">Favorites</Text>
        <Text variant="muted" className="mt-1">
          {favorites.length} saved recipe{favorites.length !== 1 && "s"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 gap-3"
        showsVerticalScrollIndicator={false}
      >
        {favorites.map((recipe) => (
          <RecipeCard
            key={recipe._id}
            recipe={recipe}
            onPress={() => router.push(`/recipe/${recipe._id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
