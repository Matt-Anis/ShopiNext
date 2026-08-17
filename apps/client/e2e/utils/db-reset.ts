import { testDb } from "./db";
import { user, verification } from "@repo/db/public/auth-schema";
import { cart, orders, products } from "@repo/db/public/schema";

export async function resetAuthTables() {
  await testDb.delete(user);
  await testDb.delete(verification);
}

// `images` and `cart_items` cascade-delete with their parent row, so
// clearing `products` and `cart` is enough to reset the cart feature's
// tables between tests. `orders` is deleted first since order_items
// references products and would otherwise block the products delete.
export async function resetCartTables() {
  await testDb.delete(orders);
  await testDb.delete(cart);
  await testDb.delete(products);
}

// `order_items` cascade-deletes with its parent `orders` row.
export async function resetOrderTables() {
  await testDb.delete(orders);
}
