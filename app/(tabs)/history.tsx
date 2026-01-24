import { useMutation, usePaginatedQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Clock, Heart, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  FadeOutLeft,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecipeCard } from "@/components/recipe-card";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCachedData } from "@/hooks/use-cached-query";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "favorites";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [refreshing, setRefreshing] = useState(false);
  const openSwipeable = useRef<SwipeableMethods>(null);

  const { results, status, loadMore } = usePaginatedQuery(
    api.recipes.listPaginated,
    { favoritesOnly: filter === "favorites" },
    { initialNumItems: 15 },
  );
  const archiveRecipe = useMutation(api.recipes.archive);

  const isLoading = status === "LoadingFirstPage";
  const recipes = useCachedData(`history:${filter}`, results) ?? [];

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleEndReached = useCallback(() => {
    if (status === "CanLoadMore") loadMore(15);
  }, [status, loadMore]);

  const handleArchive = useCallback(
    (id: Id<"recipes">, title: string) => {
      openSwipeable.current?.close();
      Alert.alert(
        "Delete Recipe",
        `Are you sure you want to delete "${title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => archiveRecipe({ id }),
          },
        ],
      );
    },
    [archiveRecipe],
  );

  const renderRightActions = useCallback(
    (id: Id<"recipes">, title: string) => (
      <Pressable
        onPress={() => handleArchive(id, title)}
        className="mb-3 ml-2 h-full w-20 items-center justify-center rounded-xl bg-destructive"
      >
        <Icon as={Trash2} className="size-6 text-white" />
      </Pressable>
    ),
    [handleArchive],
  );

  const renderItem = useCallback(
    ({ item }: { item: Doc<"recipes"> }) => (
      <Animated.View exiting={FadeOutLeft} layout={LinearTransition}>
        <ReanimatedSwipeable
          ref={openSwipeable}
          renderRightActions={() => renderRightActions(item._id, item.title)}
          overshootRight={false}
        >
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item._id}`)}
          />
        </ReanimatedSwipeable>
      </Animated.View>
    ),
    [router, renderRightActions],
  );

  const renderFooter = useCallback(() => {
    if (status === "LoadingMore")
      return (
        <View className="items-center py-4">
          <Spinner className="text-muted-foreground" />
        </View>
      );

    return null;
  }, [status]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View className="items-center py-20">
          <Spinner className="size-8 text-primary" />
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center gap-3 px-5 pt-20">
        <View className="rounded-full bg-muted/50 p-4">
          <Icon
            as={filter === "favorites" ? Heart : Clock}
            className="size-10 text-muted-foreground"
          />
        </View>
        <Text variant="muted" className="text-center">
          {filter === "favorites" ? "No favorites yet" : "No recipes yet"}
        </Text>
        <Text variant="small" className="text-center text-muted-foreground">
          {filter === "favorites"
            ? "Tap the heart icon on any recipe to save it here"
            : "Generate your first recipe from the Home tab"}
        </Text>
      </View>
    );
  }, [isLoading, filter]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text variant="h3">History</Text>
        <Text variant="muted" className="mt-1">
          Your recipe history
        </Text>
      </View>

      {/* Filter Toggle */}
      <View className="px-5 pb-3">
        <View className="flex-row rounded-lg bg-muted p-1">
          <Pressable
            className={cn(
              "flex-1 flex-row items-center justify-center gap-2 rounded-md py-2",
              filter === "all" && "bg-background shadow-sm",
            )}
            onPress={() => setFilter("all")}
          >
            <Icon
              as={Clock}
              className={cn(
                "size-4",
                filter === "all" ? "text-foreground" : "text-muted-foreground",
              )}
            />
            <Text
              className={cn(
                "font-medium text-sm",
                filter === "all" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex-1 flex-row items-center justify-center gap-2 rounded-md py-2",
              filter === "favorites" && "bg-background shadow-sm",
            )}
            onPress={() => setFilter("favorites")}
          >
            <Icon
              as={Heart}
              className={cn(
                "size-4",
                filter === "favorites"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            />
            <Text
              className={cn(
                "font-medium text-sm",
                filter === "favorites"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Favorites
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Recipe List */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}
