import { config } from "dotenv";
import Stripe from "stripe";

config({ path: ".env.local" });

export const testStripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
