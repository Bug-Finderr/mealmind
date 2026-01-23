import { ChevronRight, Clock, Users } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { Doc } from "@/convex/_generated/dataModel";

type RecipeCardProps = {
  recipe: Doc<"recipes">;
  onPress: () => void;
};

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4 active:bg-muted/50"
    >
      <View className="flex-1 gap-2">
        <Text className="font-semibold text-base">{recipe.title}</Text>
        <Text
          variant="muted"
          className="text-sm"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {recipe.description}
        </Text>

        {/* Meta badges */}
        <View className="flex-row gap-3">
          <View className="flex-row items-center gap-1">
            <Icon as={Clock} className="size-3.5 text-muted-foreground" />
            <Text variant="small" className="text-muted-foreground">
              {recipe.cookTimeMinutes} min
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon as={Users} className="size-3.5 text-muted-foreground" />
            <Text variant="small" className="text-muted-foreground">
              {recipe.servings}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <View
                key={tag}
                className="rounded-full bg-primary/10 px-2 py-0.5"
              >
                <Text className="text-primary text-xs capitalize">{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Icon as={ChevronRight} className="size-5 text-muted-foreground" />
    </Pressable>
  );
}
