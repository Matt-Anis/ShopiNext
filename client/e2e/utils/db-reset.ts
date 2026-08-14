import { testDb } from "./db";
import { user, verification } from "@/lib/auth-schema";
import { cart, products } from "@/db/schema";

export async function resetAuthTables() {
  await testDb.delete(user);
  await testDb.delete(verification);
}

// `images` and `cart_items` cascade-delete with their parent row, so
// clearing `products` and `cart` is enough to reset the cart feature's
// tables between tests.
export async function resetCartTables() {
  await testDb.delete(cart);
  await testDb.delete(products);
}
