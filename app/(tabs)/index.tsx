import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Camera,
  ChefHat,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { ExtractedIngredientsModal } from "@/components/extracted-ingredients-modal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function HomeScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>(
    [],
  );
  const [showModal, setShowModal] = useState(false);

  const ingredients = useQuery(api.ingredients.list) ?? [];
  const addIngredient = useMutation(api.ingredients.add);
  const removeIngredient = useMutation(api.ingredients.remove);
  const clearIngredients = useMutation(api.ingredients.clear);
  const generateRecipe = useAction(api.recipes.generate);
  const extractIngredients = useAction(api.ai.extractIngredients);

  const handleAdd = async () => {
    const name = input.trim();
    if (!name) return;
    await addIngredient({ name });
    setInput("");
  };

  const handleRemove = (id: Id<"ingredients">) => {
    removeIngredient({ id });
  };

  const handleClear = () => {
    clearIngredients();
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const ingredientNames = ingredients.map((i) => i.name);
      const recipeId = await generateRecipe({ ingredients: ingredientNames });
      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      console.error("Failed to generate recipe:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await processImage(result.assets[0].base64);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await processImage(result.assets[0].base64);
    }
  };

  const processImage = async (base64: string) => {
    setIsExtracting(true);
    try {
      const extracted = await extractIngredients({ imageBase64: base64 });
      setExtractedIngredients(extracted);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to extract ingredients:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddExtracted = async (selected: string[]) => {
    await Promise.all(selected.map((name) => addIngredient({ name })));
    setExtractedIngredients([]);
  };

  const hasIngredients = ingredients.length > 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text variant="h3">What's in your kitchen?</Text>
        <Text variant="muted" className="mt-1">
          Add ingredients or scan with camera
        </Text>
      </View>

      {/* Input Row */}
      <View className="flex-row gap-2 px-5 py-3">
        <Input
          className="flex-1"
          placeholder="e.g. chicken, rice..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button onPress={handleAdd} disabled={!input.trim()}>
          <Icon as={Plus} className="size-5 text-primary-foreground" />
        </Button>
        <Button
          variant="secondary"
          onPress={handleCamera}
          disabled={isExtracting}
        >
          {isExtracting ? (
            <Icon as={Loader2} className="size-5 animate-spin" />
          ) : (
            <Icon as={Camera} className="size-5" />
          )}
        </Button>
      </View>

      {/* Quick Actions */}
      <View className="flex-row gap-2 px-5 pb-2">
        <Pressable
          onPress={handleGallery}
          disabled={isExtracting}
          className="flex-row items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5"
        >
          <Text variant="small" className="text-muted-foreground">
            Choose from gallery
          </Text>
        </Pressable>
      </View>

      {/* Ingredients */}
      <View className="flex-1 px-5">
        {hasIngredients ? (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="small" className="text-muted-foreground">
                {ingredients.length} ingredient
                {ingredients.length !== 1 && "s"} added
              </Text>
              <Pressable onPress={handleClear} hitSlop={8}>
                <Text className="text-destructive text-sm">Clear all</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="flex-row flex-wrap gap-2 pb-4"
            >
              {ingredients.map((item) => (
                <View
                  key={item._id}
                  className="flex-row items-center gap-2 rounded-full border border-border bg-secondary/50 py-2 pr-2 pl-4"
                >
                  <Text className="capitalize">{item.name}</Text>
                  <Pressable
                    onPress={() => handleRemove(item._id)}
                    hitSlop={4}
                    className="rounded-full bg-muted p-1"
                  >
                    <Icon as={X} className="size-3 text-muted-foreground" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-3">
            <View className="rounded-full bg-muted/50 p-4">
              <Icon as={ChefHat} className="size-10 text-muted-foreground" />
            </View>
            <Text variant="muted" className="text-center">
              Add some ingredients to get started
            </Text>
          </View>
        )}
      </View>

      {/* Generate Button */}
      <View className="p-5">
        <Button
          className="h-14"
          onPress={handleGenerate}
          disabled={!hasIngredients || isGenerating}
        >
          {isGenerating ? (
            <Icon
              as={Loader2}
              className="size-5 animate-spin text-primary-foreground"
            />
          ) : (
            <Icon as={Sparkles} className="size-5 text-primary-foreground" />
          )}
          <Text className="font-semibold text-base">
            {isGenerating ? "Generating..." : "Generate Recipe"}
          </Text>
        </Button>
      </View>

      {/* Extraction Modal */}
      <ExtractedIngredientsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        ingredients={extractedIngredients}
        onAdd={handleAddExtracted}
      />
    </View>
  );
}
