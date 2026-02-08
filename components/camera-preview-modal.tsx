import { Camera, Sparkles, X } from "lucide-react-native";
import { Image, Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

type CameraPreviewModalProps = {
  visible: boolean;
  images: string[];
  onTakeAnother: () => void;
  onExtract: () => void;
  onDiscard: () => void;
};

export function CameraPreviewModal({
  visible,
  images,
  onTakeAnother,
  onExtract,
  onDiscard,
}: CameraPreviewModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDiscard}
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="m-5 w-full max-w-sm rounded-2xl bg-card p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-semibold text-lg">
              {images.length} of 5 photos
            </Text>
            <Pressable onPress={onDiscard} hitSlop={8}>
              <Icon as={X} className="size-6 text-muted-foreground" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerClassName="gap-2"
          >
            {images.map((img) => (
              <Image
                key={img.slice(-20)}
                source={{ uri: `data:image/jpeg;base64,${img}` }}
                className="size-20 rounded-lg"
              />
            ))}
          </ScrollView>

          <View className="gap-2">
            {images.length < 5 && (
              <Button variant="secondary" onPress={onTakeAnother}>
                <Icon as={Camera} className="size-4" />
                <Text>Take Another</Text>
              </Button>
            )}
            <Button onPress={onExtract}>
              <Icon as={Sparkles} className="size-4 text-primary-foreground" />
              <Text>Extract Ingredients</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
