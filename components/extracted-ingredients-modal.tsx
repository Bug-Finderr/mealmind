import { Check, Loader2, Plus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type ExtractedIngredientsModalProps = {
  visible: boolean;
  onClose: () => void;
  ingredients: string[];
  onAdd: (selected: string[]) => Promise<void>;
};

export function ExtractedIngredientsModal({
  visible,
  onClose,
  ingredients,
  onAdd,
}: ExtractedIngredientsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  // Reset selection when modal opens with new ingredients
  useEffect(() => {
    if (visible && ingredients.length > 0) {
      setSelected(new Set(ingredients));
    }
  }, [visible, ingredients]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setIsAdding(true);
    try {
      await onAdd([...selected]);
      onClose();
    } finally {
      setIsAdding(false);
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
          <Text variant="h4">Found Ingredients</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon as={X} className="size-6 text-muted-foreground" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-5">
          <Text variant="muted" className="mb-4">
            Tap to select ingredients to add
          </Text>
          <View className="gap-2">
            {ingredients.map((name) => {
              const isSelected = selected.has(name);
              return (
                <Pressable
                  key={name}
                  onPress={() => toggle(name)}
                  className={cn(
                    "flex-row items-center justify-between rounded-lg border p-4",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border",
                  )}
                >
                  <Text className="capitalize">{name}</Text>
                  {isSelected && (
                    <Icon as={Check} className="size-5 text-primary" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="border-border border-t p-5">
          <Button
            className="h-14"
            onPress={handleAdd}
            disabled={selected.size === 0 || isAdding}
          >
            {isAdding ? (
              <Icon
                as={Loader2}
                className="size-5 animate-spin text-primary-foreground"
              />
            ) : (
              <Icon as={Plus} className="size-5 text-primary-foreground" />
            )}
            <Text className="font-semibold text-base">
              {isAdding
                ? "Adding..."
                : `Add ${selected.size} Ingredient${selected.size !== 1 ? "s" : ""}`}
            </Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
