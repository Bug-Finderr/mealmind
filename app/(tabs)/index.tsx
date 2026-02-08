import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Camera,
  ChefHat,
  ImageIcon,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraPreviewModal } from "@/components/camera-preview-modal";
import { ExtractedIngredientsModal } from "@/components/extracted-ingredients-modal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import { useIngredients } from "@/hooks/use-ingredients";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [input, setInput] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>(
    [],
  );
  const [showModal, setShowModal] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCameraPreview, setShowCameraPreview] = useState(false);

  const { ingredients, add, remove, clear, addMultiple } = useIngredients();
  const user = useQuery(api.users.currentUser);
  const generateRecipe = useAction(api.recipes.generate);
  const extractIngredients = useAction(api.ai.extractIngredients);
  const isPremium = user?.isPremium ?? false;

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    add(name);
    setInput("");
  };

  const handleRemove = (name: string) => {
    remove(name);
  };

  const handleClear = () => {
    clear();
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const recipeId = await generateRecipe({
        ingredients,
        userPrompt: userPrompt.trim(),
      });
      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Could not generate recipe. Please try again.";
      Alert.alert("Generation Failed", message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCamera = async (existing: string[] = []) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      if (!isPremium) {
        await processImages([result.assets[0].base64]);
      } else {
        const updated = [...existing, result.assets[0].base64];
        setCapturedImages(updated);
        setShowCameraPreview(true);
      }
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsMultipleSelection: isPremium,
      selectionLimit: isPremium ? 5 : 1,
    });

    if (!result.canceled) {
      const images = result.assets
        .map((a) => a.base64)
        .filter((b): b is string => !!b);
      if (images.length > 0) await processImages(images);
    }
  };

  const processImages = async (images: string[]) => {
    setIsExtracting(true);
    try {
      const extracted = await extractIngredients({ images });
      setExtractedIngredients(extracted);
      setShowModal(true);
    } catch {
      Alert.alert(
        "Extraction Failed",
        "Could not identify ingredients. Please try again.",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractCaptured = async () => {
    setShowCameraPreview(false);
    const images = capturedImages;
    setCapturedImages([]);
    await processImages(images);
  };

  const discardCaptured = () => {
    setShowCameraPreview(false);
    setCapturedImages([]);
  };

  const handleAddExtracted = (selected: string[]) => {
    addMultiple(selected);
    setExtractedIngredients([]);
  };

  const hasIngredients = ingredients.length > 0;
  const isBusy = isGenerating || isExtracting;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <Text variant="h3">What's in your kitchen?</Text>
        <Text variant="muted" className="mt-1">
          Add ingredients or scan with camera
        </Text>
      </View>

      {/* Search Input */}
      <View className="px-5">
        <View className="flex-row items-center gap-2">
          <Input
            className="h-12 flex-1"
            placeholder="Add ingredient..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isBusy}
          />
          <Button
            className="h-12"
            onPress={handleAdd}
            disabled={!input.trim() || isBusy}
          >
            <Icon as={Plus} className="size-5 text-primary-foreground" />
          </Button>
        </View>

        {/* Scan Buttons */}
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => handleCamera()}
            disabled={isBusy}
            className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card"
            style={{ opacity: isBusy ? 0.5 : 1 }}
          >
            {isExtracting ? (
              <Spinner className="size-4" />
            ) : (
              <Icon as={Camera} className="size-4 text-muted-foreground" />
            )}
            <Text variant="small" className="text-muted-foreground">
              Camera
            </Text>
          </Pressable>
          <Pressable
            onPress={handleGallery}
            disabled={isBusy}
            className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card"
            style={{ opacity: isBusy ? 0.5 : 1 }}
          >
            <Icon as={ImageIcon} className="size-4 text-muted-foreground" />
            <Text variant="small" className="text-muted-foreground">
              Gallery
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Ingredients List */}
      <View className="mt-4 flex-1 px-5">
        {hasIngredients ? (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="small" className="font-medium">
                {ingredients.length} ingredient
                {ingredients.length !== 1 ? "s" : ""}
              </Text>
              <Pressable
                onPress={handleClear}
                hitSlop={8}
                disabled={isBusy}
                className="flex-row items-center gap-1"
                style={{ opacity: isBusy ? 0.5 : 1 }}
              >
                <Icon as={Trash2} className="size-3.5 text-destructive" />
                <Text className="text-destructive text-sm">Clear</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="flex-row flex-wrap gap-2 pb-4"
            >
              {ingredients.map((name) => (
                <View
                  key={name}
                  className="flex-row items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pr-2 pl-3"
                >
                  <Text className="max-w-11/12 capitalize">{name}</Text>
                  <Pressable
                    onPress={() => handleRemove(name)}
                    hitSlop={4}
                    disabled={isBusy}
                    className="rounded-full bg-muted p-1"
                  >
                    <Icon as={X} className="size-3 text-muted-foreground" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-4">
            <View className="size-20 items-center justify-center rounded-full bg-muted/30">
              <Icon as={ChefHat} className="size-10 text-muted-foreground/50" />
            </View>
            <View className="items-center gap-1">
              <Text className="font-medium text-muted-foreground">
                No ingredients yet
              </Text>
              <Text
                variant="small"
                className="text-center text-muted-foreground/70"
              >
                Add ingredients manually or scan{"\n"}your fridge with the
                camera
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Section */}
      <View
        className="border-border border-t bg-card px-5 pt-4 pb-5"
        style={{ marginBottom: Math.max(keyboardHeight - 50, 0) }}
      >
        {/* userPrompt Input */}
        <View className="mb-4">
          <Text variant="small" className="mb-3 text-muted-foreground">
            What are you in the mood for? (optional)
          </Text>
          <Input
            className="min-h-16 rounded-b-none"
            placeholder="e.g. quick dinner, comfort food, healthy..."
            value={userPrompt}
            onChangeText={setUserPrompt}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isBusy}
          />
        </View>

        {/* Generate Button */}
        <View className="rounded-md bg-card">
          <Button
            className="h-14"
            onPress={handleGenerate}
            disabled={!hasIngredients || isBusy}
          >
            {isGenerating ? (
              <Spinner className="text-primary-foreground" />
            ) : (
              <Icon as={Sparkles} className="size-5 text-primary-foreground" />
            )}
            <Text className="font-semibold text-base">
              {isGenerating ? "Generating..." : "Generate Recipe"}
            </Text>
          </Button>
        </View>
      </View>

      {/* Extraction Modal */}
      <ExtractedIngredientsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        ingredients={extractedIngredients}
        onAdd={handleAddExtracted}
      />

      <CameraPreviewModal
        visible={showCameraPreview}
        images={capturedImages}
        onTakeAnother={() => {
          setShowCameraPreview(false);
          handleCamera(capturedImages);
        }}
        onExtract={handleExtractCaptured}
        onDiscard={discardCaptured}
      />
    </View>
  );
}
