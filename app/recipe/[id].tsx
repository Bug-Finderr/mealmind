import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, Timer, Users } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const recipe = useQuery(
    api.recipes.getById,
    id ? { id: id as Id<"recipes"> } : "skip",
  );

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text variant="muted">Loading recipe...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Fixed Header */}
      <View className="absolute top-0 right-0 left-0 z-10 px-4 pt-14 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full bg-background/80"
          style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          <Icon as={ArrowLeft} className="size-5" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-24 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pb-4">
          <Text variant="h3">{recipe.title}</Text>
          <Text variant="muted" className="mt-2">
            {recipe.description}
          </Text>

          {/* Meta badges */}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-row items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5">
              <Icon as={Clock} className="size-4 text-muted-foreground" />
              <Text variant="small" className="text-muted-foreground">
                {recipe.cookTimeMinutes} min
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5">
              <Icon as={Users} className="size-4 text-muted-foreground" />
              <Text variant="small" className="text-muted-foreground">
                {recipe.servings} servings
              </Text>
            </View>
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full bg-primary/10 px-3 py-1"
                >
                  <Text className="text-primary text-xs capitalize">{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ingredients Section */}
        <View className="px-5 py-4">
          <Text variant="h4" className="mb-3">
            Ingredients
          </Text>
          <View className="gap-2">
            {recipe.ingredients.map((ing, i) => (
              <View
                key={i.toString()}
                className="flex-row items-center justify-between border-border border-b py-2"
              >
                <Text className="capitalize">{ing.name}</Text>
                <Text variant="muted">
                  {ing.amount}
                  {ing.unit ? ` ${ing.unit}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Steps Section */}
        <View className="px-5 py-4">
          <Text variant="h4" className="mb-3">
            Instructions
          </Text>
          <View className="gap-4">
            {recipe.steps.map((step) => (
              <View key={step.order} className="flex-row gap-3">
                <View className="size-7 items-center justify-center rounded-full bg-primary">
                  <Text className="font-semibold text-primary-foreground text-sm">
                    {step.order}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="leading-relaxed">{step.instruction}</Text>
                  {step.timerMinutes != null && step.timerMinutes > 0 && (
                    <View className="mt-2 flex-row items-center gap-1.5">
                      <Icon as={Timer} className="size-4 text-primary" />
                      <Text className="text-primary text-sm">
                        {step.timerMinutes} min
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
