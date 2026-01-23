import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Check, LogOut, Pencil, User, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);
  const updateName = useMutation(api.users.updateName);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

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

  if (user === undefined)
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator />
      </View>
    );

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
