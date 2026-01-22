import { useConvexAuth } from "convex/react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );

  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(auth)/sign-in" />;
}
