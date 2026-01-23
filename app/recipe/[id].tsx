import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Save,
  Timer,
  Users,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { TextArea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Ingredient = { name: string; amount: string; unit?: string };
type Step = { order: number; instruction: string; timerMinutes?: number };

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const recipe = useQuery(
    api.recipes.getById,
    id ? { id: id as Id<"recipes"> } : "skip",
  );
  const updateRecipe = useMutation(api.recipes.update);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCookTime, setEditCookTime] = useState(30);
  const [editServings, setEditServings] = useState(4);
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>([]);
  const [editSteps, setEditSteps] = useState<Step[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize editor state when opening
  const openEditor = () => {
    if (!recipe) return;
    setEditTitle(recipe.title);
    setEditDescription(recipe.description);
    setEditCookTime(recipe.cookTimeMinutes);
    setEditServings(recipe.servings);
    setEditIngredients([...recipe.ingredients]);
    setEditSteps([...recipe.steps]);
    setEditTags([...recipe.tags]);
    setTagInput("");
    setShowEditor(true);
  };

  // Editor helpers
  const addEditIngredient = () => {
    setEditIngredients([
      ...editIngredients,
      { name: "", amount: "", unit: "" },
    ]);
  };

  const removeEditIngredient = (index: number) => {
    setEditIngredients(editIngredients.filter((_, i) => i !== index));
  };

  const updateEditIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string,
  ) => {
    setEditIngredients(
      editIngredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing,
      ),
    );
  };

  const addEditStep = () => {
    setEditSteps([
      ...editSteps,
      { order: editSteps.length + 1, instruction: "" },
    ]);
  };

  const removeEditStep = (index: number) => {
    setEditSteps(editSteps.filter((_, i) => i !== index));
  };

  const updateEditStep = (
    index: number,
    field: keyof Step,
    value: string | number,
  ) => {
    setEditSteps(
      editSteps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step,
      ),
    );
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  const handleSaveRecipe = async () => {
    if (!editTitle.trim() || !id) return;
    setIsSaving(true);
    try {
      await updateRecipe({
        id: id as Id<"recipes">,
        recipe: {
          title: editTitle,
          description: editDescription,
          ingredients: editIngredients.filter((i) => i.name.trim()),
          steps: editSteps
            .filter((s) => s.instruction.trim())
            .map((s, i) => ({ ...s, order: i + 1 })),
          cookTimeMinutes: editCookTime,
          servings: editServings,
          tags: editTags,
        },
      });
      setShowEditor(false);
    } catch (error) {
      console.error("Failed to save recipe:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
      <View className="absolute top-0 right-0 left-0 z-10 flex-row items-center justify-between px-4 pt-14 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full bg-background/80"
          style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          <Icon as={ArrowLeft} className="size-5" />
        </Pressable>
        <Pressable
          onPress={openEditor}
          className="size-10 items-center justify-center rounded-full bg-background/80"
          style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          <Icon as={Pencil} className="size-5" />
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

      {/* Recipe Editor Modal */}
      <Modal
        visible={showEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditor(false)}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between border-border border-b px-5 py-4">
            <Text variant="h4">Edit Recipe</Text>
            <Pressable onPress={() => setShowEditor(false)} hitSlop={8}>
              <Icon as={X} className="size-6 text-muted-foreground" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="p-5 gap-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View className="gap-2">
              <Text variant="small" className="font-medium">
                Title
              </Text>
              <Input
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Recipe title"
              />
            </View>

            {/* Description */}
            <View className="gap-2">
              <Text variant="small" className="font-medium">
                Description
              </Text>
              <TextArea
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Brief description..."
              />
            </View>

            {/* Cook Time & Servings */}
            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Clock} className="size-4 text-muted-foreground" />
                  <Text variant="small" className="font-medium">
                    Cook Time
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Input
                    className="flex-1"
                    value={String(editCookTime)}
                    onChangeText={(t) => setEditCookTime(Number(t) || 0)}
                    keyboardType="numeric"
                  />
                  <Text variant="muted">min</Text>
                </View>
              </View>
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Users} className="size-4 text-muted-foreground" />
                  <Text variant="small" className="font-medium">
                    Servings
                  </Text>
                </View>
                <Input
                  value={String(editServings)}
                  onChangeText={(t) => setEditServings(Number(t) || 1)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Ingredients */}
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text variant="small" className="font-medium">
                  Ingredients
                </Text>
                <Pressable
                  onPress={addEditIngredient}
                  className="flex-row items-center gap-1"
                >
                  <Icon as={Plus} className="size-4 text-primary" />
                  <Text className="text-primary text-sm">Add</Text>
                </Pressable>
              </View>
              {editIngredients.map((ing, i) => (
                <View
                  key={i}
                  className="flex-row items-center gap-2 rounded-lg border border-border p-3"
                >
                  <Input
                    className="flex-1"
                    value={ing.name}
                    onChangeText={(v) => updateEditIngredient(i, "name", v)}
                    placeholder="Ingredient"
                  />
                  <Input
                    className="w-16"
                    value={ing.amount}
                    onChangeText={(v) => updateEditIngredient(i, "amount", v)}
                    placeholder="Qty"
                  />
                  <Input
                    className="w-16"
                    value={ing.unit ?? ""}
                    onChangeText={(v) => updateEditIngredient(i, "unit", v)}
                    placeholder="Unit"
                  />
                  <Pressable
                    onPress={() => removeEditIngredient(i)}
                    className="rounded-full bg-destructive/10 p-1.5"
                  >
                    <Icon as={Minus} className="size-4 text-destructive" />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Steps */}
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text variant="small" className="font-medium">
                  Steps
                </Text>
                <Pressable
                  onPress={addEditStep}
                  className="flex-row items-center gap-1"
                >
                  <Icon as={Plus} className="size-4 text-primary" />
                  <Text className="text-primary text-sm">Add</Text>
                </Pressable>
              </View>
              {editSteps.map((step, i) => (
                <View
                  key={i}
                  className="gap-2 rounded-lg border border-border p-3"
                >
                  <View className="flex-row items-start gap-3">
                    <View className="size-6 items-center justify-center rounded-full bg-primary">
                      <Text className="font-semibold text-primary-foreground text-xs">
                        {i + 1}
                      </Text>
                    </View>
                    <TextArea
                      className="flex-1"
                      size="sm"
                      value={step.instruction}
                      onChangeText={(v) => updateEditStep(i, "instruction", v)}
                      placeholder="Step instruction..."
                    />
                    <Pressable
                      onPress={() => removeEditStep(i)}
                      className="rounded-full bg-destructive/10 p-1.5"
                    >
                      <Icon as={Minus} className="size-4 text-destructive" />
                    </Pressable>
                  </View>
                  <View className="ml-9 flex-row items-center gap-2">
                    <Icon as={Timer} className="size-4 text-muted-foreground" />
                    <Input
                      className="w-16"
                      value={step.timerMinutes ? String(step.timerMinutes) : ""}
                      onChangeText={(v) =>
                        updateEditStep(i, "timerMinutes", Number(v) || 0)
                      }
                      keyboardType="numeric"
                      placeholder="0"
                    />
                    <Text variant="muted" className="text-sm">
                      min timer
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tags */}
            <View className="gap-3">
              <Text variant="small" className="font-medium">
                Tags
              </Text>
              <View className="flex-row gap-2">
                <Input
                  className="flex-1"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  placeholder="Add a tag..."
                  returnKeyType="done"
                  autoCapitalize="none"
                />
                <Button onPress={addTag} disabled={!tagInput.trim()}>
                  <Icon as={Plus} className="size-5 text-primary-foreground" />
                </Button>
              </View>
              {editTags.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {editTags.map((tag) => (
                    <View
                      key={tag}
                      className="flex-row items-center gap-1.5 rounded-full bg-primary/10 py-1.5 pr-2 pl-3"
                    >
                      <Text className="text-primary text-sm capitalize">
                        {tag}
                      </Text>
                      <Pressable
                        onPress={() => removeTag(tag)}
                        hitSlop={4}
                        className="rounded-full bg-primary/20 p-0.5"
                      >
                        <Icon as={X} className="size-3 text-primary" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View className="border-border border-t p-5">
            <Button
              className="h-14"
              onPress={handleSaveRecipe}
              disabled={!editTitle.trim() || isSaving}
            >
              {isSaving ? (
                <Icon
                  as={Loader2}
                  className="size-5 animate-spin text-primary-foreground"
                />
              ) : (
                <Icon as={Save} className="size-5 text-primary-foreground" />
              )}
              <Text className="font-semibold text-base">
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}
