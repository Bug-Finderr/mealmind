import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Heart,
  Pencil,
  Timer,
  Users,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { RecipeEditor } from "@/components/recipe-editor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { RecipeData } from "@/types/recipe";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showEditor, setShowEditor] = useState(false);

  const recipe = useQuery(
    api.recipes.getById,
    id ? { id: id as Id<"recipes"> } : "skip",
  );
  const isFavorited = useQuery(
    api.favorites.isFavorited,
    id ? { recipeId: id as Id<"recipes"> } : "skip",
  );
  const updateRecipe = useMutation(api.recipes.update);
  const toggleFavorite = useMutation(api.favorites.toggle);

  const handleSave = async (data: RecipeData) => {
    if (!id) return;
    await updateRecipe({ id: id as Id<"recipes">, recipe: data });
  };

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <Spinner className="size-8 text-primary" />
        <Text variant="muted">Loading recipe...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Fixed Header */}
      <View className="absolute top-0 right-0 left-0 z-10 flex-row items-center justify-between px-4 pt-14 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full bg-background/80"
          style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          <Icon as={ArrowLeft} className="size-5" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() =>
              id && toggleFavorite({ recipeId: id as Id<"recipes"> })
            }
            className="size-10 items-center justify-center rounded-full bg-background/80"
            style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 }}
          >
            <Icon
              as={Heart}
              className="size-5"
              fill={isFavorited ? "#ef4444" : "transparent"}
              color={isFavorited ? "#ef4444" : undefined}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowEditor(true)}
            className="size-10 items-center justify-center rounded-full bg-background/80"
            style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 }}
          >
            <Icon as={Pencil} className="size-5" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-24 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pb-6">
          <Text variant="h3">{recipe.title}</Text>
          <Text variant="muted" className="mt-2 leading-relaxed">
            {recipe.description}
          </Text>

          {/* Meta Cards */}
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-border bg-card p-4">
              <Icon as={Clock} className="size-5 text-muted-foreground" />
              <Text className="font-semibold text-lg text-muted-foreground">
                {recipe.cookTimeMinutes}
              </Text>
              <Text variant="small" className="text-muted-foreground">
                minutes
              </Text>
            </View>
            <View className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-border bg-card p-4">
              <Icon as={Users} className="size-5 text-muted-foreground" />
              <Text className="font-semibold text-lg text-muted-foreground">
                {recipe.servings}
              </Text>
              <Text variant="small" className="text-muted-foreground">
                servings
              </Text>
            </View>
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerClassName="gap-2"
            >
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full bg-primary/10 px-3.5 py-1.5"
                >
                  <Text className="text-primary text-sm capitalize">{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Ingredients Section */}
        <View className="px-5 py-4">
          <Text variant="h4" className="mb-4">
            Ingredients ({recipe.ingredients.length})
          </Text>
          <View className="overflow-hidden rounded-xl border border-border bg-card">
            {recipe.ingredients.map((ing, i) => (
              <View
                key={ing.name}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  i < recipe.ingredients.length - 1
                    ? "border-border border-b"
                    : ""
                }`}
              >
                <Text className="flex-1 capitalize">{ing.name}</Text>
                <Text className="font-medium text-muted-foreground">
                  {ing.amount}
                  {ing.unit ? ` ${ing.unit}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Steps Section */}
        <View className="px-5 py-4">
          <Text variant="h4" className="mb-4">
            Instructions ({recipe.steps.length} steps)
          </Text>
          <View className="gap-3">
            {recipe.steps.map((step) => (
              <View
                key={step.order}
                className="rounded-xl border border-border bg-card p-4"
              >
                <View className="flex-row items-start gap-3">
                  <View className="size-7 items-center justify-center rounded-full bg-primary">
                    <Text className="font-semibold text-primary-foreground text-sm">
                      {step.order}
                    </Text>
                  </View>
                  <Text className="flex-1 leading-relaxed">
                    {step.instruction}
                  </Text>
                </View>
                {step.timerMinutes != null && step.timerMinutes > 0 && (
                  <View className="mt-3 ml-10 flex-row items-center gap-1.5 self-start rounded-lg bg-primary/10 px-3 py-2">
                    <Icon as={Timer} className="size-4 text-primary" />
                    <Text className="font-medium text-primary text-sm">
                      {step.timerMinutes} min
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Start Cooking Button */}
      <View className="border-border border-t p-5">
        <Button
          className="h-14"
          onPress={() => router.push(`/recipe/cook?id=${id}`)}
        >
          <Icon as={ChefHat} className="size-5 text-primary-foreground" />
          <Text className="font-semibold text-base">Start Cooking</Text>
        </Button>
      </View>

      {/* Recipe Editor Modal */}
      <RecipeEditor
        visible={showEditor}
        onClose={() => setShowEditor(false)}
        recipe={recipe}
        onSave={handleSave}
      />
    </View>
  );
}
