import { Loader2, type LucideIcon } from "lucide-react-native";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

type SpinnerProps = {
  className?: string;
  icon?: LucideIcon;
};

export function Spinner({
  className,
  icon: IconComponent = Loader2,
}: SpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon as={IconComponent} className={cn("size-5", className)} />
    </Animated.View>
  );
}
