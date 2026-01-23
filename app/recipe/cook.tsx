import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function CookingModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const recipe = useQuery(
    api.recipes.getById,
    id ? { id: id as Id<"recipes"> } : "skip",
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const step = recipe?.steps[currentStep];
  const totalSteps = recipe?.steps.length ?? 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Initialize timer when step changes
  useEffect(() => {
    if (step?.timerMinutes) setTimeLeft(step.timerMinutes * 60);
    else setTimeLeft(0);
    setIsRunning(false);
  }, [step?.timerMinutes]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const resetTimer = () => {
    setIsRunning(false);
    if (step?.timerMinutes) setTimeLeft(step.timerMinutes * 60);
  };

  const goToPrevStep = () => {
    if (!isFirstStep) setCurrentStep((s) => s - 1);
  };

  const goToNextStep = () => {
    if (!isLastStep) setCurrentStep((s) => s + 1);
  };

  const handleFinish = () => {
    router.back();
  };

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text variant="muted">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 border-border border-b px-4 pt-14 pb-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="size-10 items-center justify-center rounded-full bg-muted/50"
        >
          <Icon as={ArrowLeft} className="size-5" />
        </Pressable>
        <View className="flex-1">
          <Text variant="small" className="text-muted-foreground">
            Cooking
          </Text>
          <Text className="font-semibold" numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center px-5">
        {/* Progress */}
        <View className="items-center gap-3 pb-6">
          <Text variant="muted">
            Step {currentStep + 1} of {totalSteps}
          </Text>
          <View className="flex-row gap-2">
            {recipe.steps.map(({ order }) => (
              <View
                key={order}
                className={`size-2.5 rounded-full ${
                  order - 1 < currentStep
                    ? "bg-primary"
                    : order - 1 === currentStep
                      ? "bg-primary"
                      : "bg-muted"
                }`}
              />
            ))}
          </View>
        </View>

        {/* Step Card */}
        <View className="rounded-2xl border border-border bg-card p-6">
          <View className="mb-4 flex-row items-center gap-3">
            <View className="size-8 items-center justify-center rounded-full bg-primary">
              <Text className="font-bold text-primary-foreground">
                {currentStep + 1}
              </Text>
            </View>
            <Text variant="small" className="text-muted-foreground">
              Instruction
            </Text>
          </View>
          <Text className="text-lg leading-relaxed">{step?.instruction}</Text>
        </View>

        {/* Timer Section */}
        {step?.timerMinutes && step.timerMinutes > 0 && (
          <View className="mt-8 items-center gap-4">
            <View
              className={`rounded-2xl px-8 py-4 ${
                timeLeft === 0 && !isRunning
                  ? "bg-green-500/20"
                  : isRunning
                    ? "bg-primary/20"
                    : "bg-muted/50"
              }`}
            >
              <Text
                className={`font-bold font-mono text-5xl ${
                  timeLeft === 0 && !isRunning
                    ? "text-green-600"
                    : isRunning
                      ? "text-primary"
                      : "text-foreground"
                }`}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>

            <View className="flex-row gap-3">
              {isRunning ? (
                <Button
                  variant="secondary"
                  className="h-12 px-6"
                  onPress={() => setIsRunning(false)}
                >
                  <Icon as={Pause} className="size-5" />
                  <Text>Pause</Text>
                </Button>
              ) : (
                <Button
                  className="h-12 px-6"
                  onPress={() => timeLeft > 0 && setIsRunning(true)}
                  disabled={timeLeft === 0}
                >
                  <Icon as={Play} className="size-5 text-primary-foreground" />
                  <Text>{timeLeft === 0 ? "Done" : "Start"}</Text>
                </Button>
              )}
              <Button
                variant="outline"
                className="h-12 px-6"
                onPress={resetTimer}
              >
                <Icon as={RotateCcw} className="size-5" />
                <Text>Reset</Text>
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* Navigation */}
      <View className="gap-3 border-border border-t p-5">
        <View className="flex-row gap-3">
          <Button
            variant="outline"
            className="h-14 flex-1"
            onPress={goToPrevStep}
            disabled={isFirstStep}
          >
            <Icon as={ChevronLeft} className="size-5" />
            <Text>Previous</Text>
          </Button>
          {isLastStep ? (
            <Button className="h-14 flex-1" onPress={handleFinish}>
              <Icon as={Check} className="size-5 text-primary-foreground" />
              <Text>Finish</Text>
            </Button>
          ) : (
            <Button className="h-14 flex-1" onPress={goToNextStep}>
              <Text>Next</Text>
              <Icon
                as={ChevronRight}
                className="size-5 text-primary-foreground"
              />
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
