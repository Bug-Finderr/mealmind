import { useAuthActions } from "@convex-dev/auth/react";
import { Link, Stack } from "expo-router";
import { Loader2 } from "lucide-react-native";
import * as React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("already exists") ||
    message.includes("AccountAlreadyExists")
  )
    return "An account with this email already exists";
  if (message.includes("InvalidPassword"))
    return "Password must be at least 8 characters";
  if (message.includes("invalid email") || message.includes("InvalidEmail"))
    return "Please enter a valid email address";

  return "Sign up failed. Please try again.";
}

export default function SignUpScreen() {
  const { signIn } = useAuthActions();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSignUp() {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn("password", { email, password, flow: "signUp" });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Sign Up" }} />
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
                Create account
              </Text>
              <Text variant="muted" className="text-center">
                Enter your details to get started
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
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  editable={!isLoading}
                />
              </View>

              <View className="gap-2">
                <Text variant="small">Confirm Password</Text>
                <Input
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  editable={!isLoading}
                />
              </View>

              {error && (
                <Text className="text-destructive text-sm">{error}</Text>
              )}

              <Button onPress={handleSignUp} disabled={isLoading}>
                {isLoading && (
                  <Icon as={Loader2} className="size-4 animate-spin" />
                )}
                <Text>{isLoading ? "Creating account..." : "Sign Up"}</Text>
              </Button>

              <View className="flex-row items-center gap-4">
                <View className="h-px flex-1 bg-border" />
                <Text variant="muted" className="text-xs">
                  OR
                </Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <GoogleSignInButton onError={setError} />
            </View>

            <View className="flex-row items-center justify-center gap-1">
              <Text variant="muted">Already have an account?</Text>
              <Link href="/(auth)/sign-in" asChild>
                <Button variant="link" className="h-auto p-0">
                  <Text>Sign in</Text>
                </Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
