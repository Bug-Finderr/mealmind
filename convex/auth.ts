import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Google],
  callbacks: {
    async redirect({ redirectTo }) {
      const allowedPrefixes = ["mealmind://", "exp://"];
      if (allowedPrefixes.some((prefix) => redirectTo.startsWith(prefix)))
        return redirectTo;
      throw new Error(`Invalid redirectTo: ${redirectTo}`);
    },
  },
});
