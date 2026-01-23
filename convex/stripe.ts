import Stripe from "stripe";
import { action } from "./_generated/server";

export const createPaymentIntent = action({
  args: {},
  handler: async () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 999, // $9.99 in cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret };
  },
});
