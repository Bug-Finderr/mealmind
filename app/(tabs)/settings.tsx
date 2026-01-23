import { useAuthActions } from "@convex-dev/auth/react";
import { useStripe } from "@stripe/stripe-react-native";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Bot,
  Check,
  ChevronDown,
  Crown,
  Lock,
  LogOut,
  Pencil,
  Sparkles,
  User,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

type ModelSelectorProps = {
  label: string;
  value: string;
  models: Array<{
    key: string;
    name: string;
    provider: string;
    tier: string;
  }>;
  isPremium: boolean;
  onChange: (key: string) => void;
};

function ModelSelector({
  label,
  value,
  models,
  isPremium,
  onChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedModel = models.find((m) => m.key === value);

  return (
    <>
      <View className="mb-3">
        <Text className="mb-2 text-muted-foreground text-sm">{label}</Text>
        <Pressable
          className="flex-row items-center justify-between rounded-lg border border-border bg-background p-3"
          onPress={() => setOpen(true)}
        >
          <Text>{selectedModel?.name ?? "Select model"}</Text>
          <Icon as={ChevronDown} className="size-4 text-muted-foreground" />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setOpen(false)}
        >
          <View className="m-5 w-full max-w-sm rounded-2xl bg-card p-4">
            <Text className="mb-4 font-semibold text-lg">{label}</Text>
            {models.map((model) => {
              const isLocked = model.tier === "paid" && !isPremium;
              const isSelected = model.key === value;

              return (
                <Pressable
                  key={model.key}
                  className={cn(
                    "mb-2 flex-row items-center justify-between rounded-lg border p-3",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border",
                    isLocked && "opacity-50",
                  )}
                  onPress={() => {
                    if (!isLocked) {
                      onChange(model.key);
                      setOpen(false);
                    }
                  }}
                  disabled={isLocked}
                >
                  <View className="flex-row items-center gap-2">
                    <Text
                      className={cn(
                        isSelected ? "font-medium text-primary" : "",
                      )}
                    >
                      {model.name}
                    </Text>
                    {model.tier === "paid" && (
                      <View className="rounded bg-yellow-500/20 px-1.5 py-0.5">
                        <Text className="text-xs text-yellow-600">PRO</Text>
                      </View>
                    )}
                  </View>
                  {isLocked ? (
                    <Icon as={Lock} className="size-4 text-muted-foreground" />
                  ) : isSelected ? (
                    <Icon as={Check} className="size-4 text-primary" />
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable
              className="mt-2 items-center p-2"
              onPress={() => setOpen(false)}
            >
              <Text className="text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthActions();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const user = useQuery(api.users.currentUser);
  const models = useQuery(api.models.list);
  const updateName = useMutation(api.users.updateName);
  const upgradeToPremium = useMutation(api.users.upgradeToPremium);
  const updateModelPrefs = useMutation(api.users.updateModelPreferences);
  const createPaymentIntent = useAction(api.stripe.createPaymentIntent);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);

  const startEditing = () => {
    setEditName(user?.name ?? "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName("");
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateName({ name: editName.trim() });
    setIsEditing(false);
  };

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);

      const { clientSecret } = await createPaymentIntent();

      if (!clientSecret) {
        Alert.alert("Error", "Failed to create payment intent");
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "MealMind",
      });

      if (initError) {
        Alert.alert("Error", initError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== "Canceled") {
          Alert.alert("Error", presentError.message);
        }
        return;
      }

      await upgradeToPremium();
      Alert.alert("Success", "Welcome to Premium!");
    } catch (_error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (user === undefined || models === undefined)
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator />
      </View>
    );

  const isPremium = user?.isPremium ?? false;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 py-4">
          <Text className="font-bold text-2xl">Settings</Text>
        </View>

        {/* Profile Section */}
        <View className="items-center py-6">
          <View className="size-20 items-center justify-center rounded-full bg-muted">
            <Icon as={User} className="size-10 text-muted-foreground" />
          </View>
          {isPremium && (
            <View className="mt-2 flex-row items-center gap-1">
              <Icon as={Crown} className="size-4 text-yellow-500" />
              <Text className="font-medium text-sm text-yellow-600">
                Premium
              </Text>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View className="gap-4 px-5">
          {/* Name Field */}
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="mb-2 text-muted-foreground text-sm">Name</Text>
            {isEditing ? (
              <View className="flex-row items-center gap-2">
                <Input
                  className="flex-1"
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  autoFocus
                />
                <Pressable
                  className="size-10 items-center justify-center rounded-lg bg-primary"
                  onPress={handleSave}
                >
                  <Icon as={Check} className="size-5 text-primary-foreground" />
                </Pressable>
                <Pressable
                  className="size-10 items-center justify-center rounded-lg bg-muted"
                  onPress={cancelEditing}
                >
                  <Icon as={X} className="size-5 text-muted-foreground" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                className="flex-row items-center justify-between"
                onPress={startEditing}
              >
                <Text className="text-lg">{user?.name || "Add your name"}</Text>
                <Icon as={Pencil} className="size-5 text-muted-foreground" />
              </Pressable>
            )}
          </View>

          {/* Email Field (read-only) */}
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="mb-2 text-muted-foreground text-sm">Email</Text>
            <Text className="text-lg">{user?.email ?? "—"}</Text>
          </View>

          {/* Premium Section */}
          <View
            className={cn(
              "rounded-xl border p-4",
              isPremium
                ? "border-yellow-500/30 bg-yellow-500/10"
                : "border-border bg-card",
            )}
          >
            <View className="mb-2 flex-row items-center gap-2">
              <Icon
                as={Sparkles}
                className={cn(
                  "size-5",
                  isPremium ? "text-yellow-500" : "text-muted-foreground",
                )}
              />
              <Text
                className={cn(
                  "font-medium",
                  isPremium ? "text-yellow-600" : "text-foreground",
                )}
              >
                Premium
              </Text>
            </View>

            {isPremium ? (
              <View className="flex-row items-center gap-2">
                <Icon as={Check} className="size-4 text-green-500" />
                <Text className="text-muted-foreground">
                  All AI models unlocked
                </Text>
              </View>
            ) : (
              <>
                <Text className="mb-3 text-muted-foreground text-sm">
                  Unlock premium AI models for better recipes
                </Text>
                <Button onPress={handleUpgrade} disabled={isUpgrading}>
                  {isUpgrading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon
                        as={Sparkles}
                        className="size-4 text-primary-foreground"
                      />
                      <Text>Upgrade for $9.99</Text>
                    </>
                  )}
                </Button>
              </>
            )}
          </View>

          {/* AI Models Section */}
          <View className="rounded-xl border border-border bg-card p-4">
            <View className="mb-3 flex-row items-center gap-2">
              <Icon as={Bot} className="size-5 text-muted-foreground" />
              <Text className="font-medium">AI Models</Text>
            </View>

            <ModelSelector
              label="Image Analysis"
              value={user?.imageAnalysisModel ?? "gemini-3-flash-preview"}
              models={models}
              isPremium={isPremium}
              onChange={(key) => updateModelPrefs({ imageAnalysisModel: key })}
            />

            <ModelSelector
              label="Recipe Generation"
              value={user?.recipeGenerationModel ?? "gemini-3-flash-preview"}
              models={models}
              isPremium={isPremium}
              onChange={(key) =>
                updateModelPrefs({ recipeGenerationModel: key })
              }
            />

            {!isPremium && (
              <View className="mt-2 flex-row items-center gap-2">
                <Icon as={Lock} className="size-3 text-muted-foreground" />
                <Text className="text-muted-foreground text-xs">
                  Upgrade to unlock premium models
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Spacer */}
        <View className="h-8" />
      </ScrollView>

      {/* Sign Out Button */}
      <View className="border-border border-t p-5">
        <Button variant="destructive" onPress={() => signOut()}>
          <Icon as={LogOut} className="size-4 text-white" />
          <Text>Log Out</Text>
        </Button>
      </View>
    </View>
  );
}
