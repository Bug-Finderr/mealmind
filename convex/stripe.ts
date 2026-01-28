import { getAuthUserId } from "@convex-dev/auth/server";
import Stripe from "stripe";
import { action } from "./_generated/server";

export const createPaymentIntent = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 999, // $9.99 in cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret };
  },
});
