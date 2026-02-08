import {
  Clock,
  Minus,
  Plus,
  Redo2,
  Save,
  Timer,
  Undo2,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { TextArea } from "@/components/ui/textarea";
import { useHistory } from "@/hooks/use-history";
import { cn } from "@/lib/utils";
import type { Ingredient, RecipeData, Step } from "@/types/recipe";

type EditorState = {
  title: string;
  description: string;
  cookTime: string;
  servings: string;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
};

const emptyState: EditorState = {
  title: "",
  description: "",
  cookTime: "30",
  servings: "1",
  ingredients: [],
  steps: [],
  tags: [],
};

type RecipeEditorProps = {
  visible: boolean;
  onClose: () => void;
  recipe: RecipeData;
  onSave: (recipe: RecipeData) => Promise<void>;
};

export function RecipeEditor({
  visible,
  onClose,
  recipe,
  onSave,
}: RecipeEditorProps) {
  const {
    state: ed,
    set,
    snapshot,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  } = useHistory<EditorState>(emptyState);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && recipe) {
      reset({
        title: recipe.title,
        description: recipe.description,
        cookTime: String(recipe.meta?.cookTimeMinutes ?? 30),
        servings: String(recipe.meta?.servings ?? 1),
        ingredients: [...recipe.ingredients],
        steps: [...recipe.steps],
        tags: [...(recipe.meta?.tags ?? [])],
      });
      setTagInput("");
    }
  }, [visible, recipe, reset]);

  // Discrete actions — snapshot before mutating
  const addIngredient = () => {
    snapshot();
    set((s) => ({
      ...s,
      ingredients: [...s.ingredients, { name: "", amount: "", unit: "" }],
    }));
  };

  const removeIngredient = (index: number) => {
    snapshot();
    set((s) => ({
      ...s,
      ingredients: s.ingredients.filter((_, i) => i !== index),
    }));
  };

  const addStep = () => {
    snapshot();
    set((s) => ({
      ...s,
      steps: [...s.steps, { order: s.steps.length + 1, instruction: "" }],
    }));
  };

  const removeStep = (index: number) => {
    snapshot();
    set((s) => ({ ...s, steps: s.steps.filter((_, i) => i !== index) }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !ed.tags.includes(tag)) {
      snapshot();
      set((s) => ({ ...s, tags: [...s.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    snapshot();
    set((s) => ({ ...s, tags: s.tags.filter((t) => t !== tag) }));
  };

  // Typing updates — no snapshot
  const updateField = <K extends keyof EditorState>(
    key: K,
    value: EditorState[K],
  ) => set((s) => ({ ...s, [key]: value }));

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string,
  ) =>
    set((s) => ({
      ...s,
      ingredients: s.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing,
      ),
    }));

  const updateStep = (
    index: number,
    field: keyof Step,
    value: string | number,
  ) =>
    set((s) => ({
      ...s,
      steps: s.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step,
      ),
    }));

  const handleSave = async () => {
    if (!ed.title.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        title: ed.title,
        description: ed.description,
        ingredients: ed.ingredients.filter((i) => i.name.trim()),
        steps: ed.steps
          .filter((s) => s.instruction.trim())
          .map((s, i) => ({ ...s, order: i + 1 })),
        meta: {
          cookTimeMinutes: Math.max(1, parseInt(ed.cookTime, 10) || 1),
          servings: Math.max(1, parseInt(ed.servings, 10) || 1),
          tags: ed.tags,
          aiGenerated: recipe.meta?.aiGenerated ?? true,
        },
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-border border-b px-5 py-4">
          <Text variant="h4">Edit Recipe</Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={undo}
              disabled={!canUndo}
              hitSlop={8}
              className={cn(!canUndo && "opacity-30")}
            >
              <Icon as={Undo2} className="size-5 text-foreground" />
            </Pressable>
            <Pressable
              onPress={redo}
              disabled={!canRedo}
              hitSlop={8}
              className={cn(!canRedo && "opacity-30")}
            >
              <Icon as={Redo2} className="size-5 text-foreground" />
            </Pressable>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon as={X} className="size-6 text-muted-foreground" />
            </Pressable>
          </View>
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
              value={ed.title}
              onChangeText={(v) => updateField("title", v)}
              placeholder="Recipe title"
            />
          </View>

          {/* Description */}
          <View className="gap-2">
            <Text variant="small" className="font-medium">
              Description
            </Text>
            <TextArea
              value={ed.description}
              onChangeText={(v) => updateField("description", v)}
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
                  value={ed.cookTime}
                  onChangeText={(v) => updateField("cookTime", v)}
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
                value={ed.servings}
                onChangeText={(v) => updateField("servings", v)}
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
                onPress={addIngredient}
                className="flex-row items-center gap-1"
              >
                <Icon as={Plus} className="size-4 text-primary" />
                <Text className="text-primary text-sm">Add</Text>
              </Pressable>
            </View>
            {ed.ingredients.map((ing, i) => (
              <View
                key={ing.name}
                className="flex-row items-center gap-2 rounded-lg border border-border p-3"
              >
                <Input
                  className="flex-1"
                  value={ing.name}
                  onChangeText={(v) => updateIngredient(i, "name", v)}
                  placeholder="Ingredient"
                />
                <Input
                  className="w-16"
                  value={ing.amount}
                  onChangeText={(v) => updateIngredient(i, "amount", v)}
                  placeholder="Qty"
                />
                <Input
                  className="w-16"
                  value={ing.unit ?? ""}
                  onChangeText={(v) => updateIngredient(i, "unit", v)}
                  placeholder="Unit"
                />
                <Pressable
                  onPress={() => removeIngredient(i)}
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
                onPress={addStep}
                className="flex-row items-center gap-1"
              >
                <Icon as={Plus} className="size-4 text-primary" />
                <Text className="text-primary text-sm">Add</Text>
              </Pressable>
            </View>
            {ed.steps.map((step, i) => (
              <View
                key={step.instruction}
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
                    onChangeText={(v) => updateStep(i, "instruction", v)}
                    placeholder="Step instruction..."
                  />
                  <Pressable
                    onPress={() => removeStep(i)}
                    className="rounded-full bg-destructive/10 p-1.5"
                  >
                    <Icon as={Minus} className="size-4 text-destructive" />
                  </Pressable>
                </View>
                <View className="ml-9 flex-row items-center gap-2">
                  <Icon as={Timer} className="size-4 text-muted-foreground" />
                  <Input
                    className="w-16"
                    value={
                      step.timerMinutes !== undefined
                        ? String(step.timerMinutes)
                        : ""
                    }
                    onChangeText={(v) => {
                      if (v === "" || /^\d*$/.test(v)) {
                        updateStep(
                          i,
                          "timerMinutes",
                          v === "" ? 0 : parseInt(v, 10) || 0,
                        );
                      }
                    }}
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
            {ed.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {ed.tags.map((tag) => (
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
            onPress={handleSave}
            disabled={!ed.title.trim() || isSaving}
          >
            {isSaving ? (
              <Spinner className="text-primary-foreground" />
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
  );
}
