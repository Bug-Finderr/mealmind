import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

const redirectTo = makeRedirectUri();

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePress() {
    setIsLoading(true);
    try {
      const { redirect } = await signIn("google", { redirectTo });

      if (Platform.OS === "web") {
        // Web handles redirect automatically
        return;
      }

      if (!redirect) {
        throw new Error("No redirect URL received");
      }

      const result = await openAuthSessionAsync(
        redirect.toString(),
        redirectTo,
      );

      if (result.type === "success") {
        const code = new URL(result.url).searchParams.get("code");
        if (code) {
          await signIn("google", { code });
          onSuccess?.();
        }
      } else if (result.type === "cancel") {
        // User cancelled, no error needed
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onPress={handlePress}
      disabled={isLoading}
      className="h-12"
    >
      {isLoading ? <Spinner /> : <GoogleIcon />}
      <Text>Continue with Google</Text>
    </Button>
  );
}
