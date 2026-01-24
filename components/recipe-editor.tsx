import { Clock, Minus, Plus, Save, Timer, Users, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { TextArea } from "@/components/ui/textarea";
import type { Ingredient, RecipeData, Step } from "@/types/recipe";

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
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCookTime, setEditCookTime] = useState("30");
  const [editServings, setEditServings] = useState("1");
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>([]);
  const [editSteps, setEditSteps] = useState<Step[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state from recipe when modal opens
  useEffect(() => {
    if (visible && recipe) {
      setEditTitle(recipe.title);
      setEditDescription(recipe.description);
      setEditCookTime(String(recipe.meta?.cookTimeMinutes ?? 30));
      setEditServings(String(recipe.meta?.servings ?? 1));
      setEditIngredients([...recipe.ingredients]);
      setEditSteps([...recipe.steps]);
      setEditTags([...(recipe.meta?.tags ?? [])]);
      setTagInput("");
    }
  }, [visible, recipe]);

  // Ingredient helpers
  const addIngredient = () => {
    setEditIngredients([
      ...editIngredients,
      { name: "", amount: "", unit: "" },
    ]);
  };

  const removeIngredient = (index: number) => {
    setEditIngredients(editIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
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

  // Step helpers
  const addStep = () => {
    setEditSteps([
      ...editSteps,
      { order: editSteps.length + 1, instruction: "" },
    ]);
  };

  const removeStep = (index: number) => {
    setEditSteps(editSteps.filter((_, i) => i !== index));
  };

  const updateStep = (
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

  // Tag helpers
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

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        title: editTitle,
        description: editDescription,
        ingredients: editIngredients.filter((i) => i.name.trim()),
        steps: editSteps
          .filter((s) => s.instruction.trim())
          .map((s, i) => ({ ...s, order: i + 1 })),
        meta: {
          cookTimeMinutes: Math.max(1, parseInt(editCookTime, 10) || 1),
          servings: Math.max(1, parseInt(editServings, 10) || 1),
          tags: editTags,
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
          <Pressable onPress={onClose} hitSlop={8}>
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
                  value={editCookTime}
                  onChangeText={setEditCookTime}
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
                value={editServings}
                onChangeText={setEditServings}
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
            {editIngredients.map((ing, i) => (
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
            {editSteps.map((step, i) => (
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
                      // Allow empty and numeric input while typing
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
            onPress={handleSave}
            disabled={!editTitle.trim() || isSaving}
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
