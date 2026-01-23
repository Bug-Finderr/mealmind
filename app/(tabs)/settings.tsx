import { useAuthActions } from "@convex-dev/auth/react";
import { useStripe } from "@stripe/stripe-react-native";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Check,
  Crown,
  LogOut,
  Pencil,
  Sparkles,
  User,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthActions();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const user = useQuery(api.users.currentUser);
  const updateName = useMutation(api.users.updateName);
  const upgradeToPremium = useMutation(api.users.upgradeToPremium);
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

      // 1. Get clientSecret from backend
      const { clientSecret } = await createPaymentIntent();

      if (!clientSecret) {
        Alert.alert("Error", "Failed to create payment intent");
        return;
      }

      // 2. Initialize PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "MealMind",
      });

      if (initError) {
        Alert.alert("Error", initError.message);
        return;
      }

      // 3. Present PaymentSheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== "Canceled") {
          Alert.alert("Error", presentError.message);
        }
        return;
      }

      // 4. Update user's premium status
      await upgradeToPremium();
      Alert.alert("Success", "Welcome to Premium!");
    } catch (_error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (user === undefined)
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator />
      </View>
    );

  const isPremium = user?.isPremium;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-4">
        <Text className="font-bold text-2xl">Settings</Text>
      </View>

      {/* Profile Section */}
      <View className="items-center py-8">
        {/* Avatar Placeholder */}
        <View className="size-24 items-center justify-center rounded-full bg-muted">
          <Icon as={User} className="size-12 text-muted-foreground" />
        </View>
        {isPremium && (
          <View className="mt-2 flex-row items-center gap-1">
            <Icon as={Crown} className="size-4 text-yellow-500" />
            <Text className="font-medium text-sm text-yellow-600">Premium</Text>
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
                You have access to premium features!
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-3 text-muted-foreground text-sm">
                Unlock premium models for better recipe generation
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
      </View>

      {/* Spacer */}
      <View className="flex-1" />

      {/* Sign Out Button */}
      <View className="p-5">
        <Button variant="destructive" onPress={() => signOut()}>
          <Icon as={LogOut} className="size-4 text-white" />
          <Text>Log Out</Text>
        </Button>
      </View>
    </View>
  );
}
