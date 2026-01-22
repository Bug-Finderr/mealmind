import { useAuthActions } from "@convex-dev/auth/react";
import { Link, Stack, useRouter } from "expo-router";
import { Loader2 } from "lucide-react-native";
import * as React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("InvalidAccountId") ||
    message.includes("Could not find account")
  )
    return "No account found with this email";
  if (
    message.includes("InvalidSecret") ||
    message.includes("InvalidCredentials")
  )
    return "Incorrect password";
  if (message.includes("InvalidPassword")) return "Invalid password format";

  return "Sign in failed. Please try again.";
}

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSignIn() {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.replace("/(tabs)");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Sign In" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1 justify-center p-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-6">
            <View className="gap-2">
              <Text variant="h3" className="text-center">
                Welcome back
              </Text>
              <Text variant="muted" className="text-center">
                Sign in to your account
              </Text>
            </View>

            <View className="gap-4">
              <View className="gap-2">
                <Text variant="small">Email</Text>
                <Input
                  placeholder="email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <View className="gap-2">
                <Text variant="small">Password</Text>
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  editable={!isLoading}
                />
              </View>

              {error && (
                <Text className="text-destructive text-sm">{error}</Text>
              )}

              <Button onPress={handleSignIn} disabled={isLoading}>
                {isLoading && (
                  <Icon as={Loader2} className="size-4 animate-spin" />
                )}
                <Text>{isLoading ? "Signing in..." : "Sign In"}</Text>
              </Button>
            </View>

            <View className="flex-row items-center justify-center gap-1">
              <Text variant="muted">Don't have an account?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Button variant="link" className="h-auto p-0">
                  <Text>Sign up</Text>
                </Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
