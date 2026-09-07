import { testDb } from "./db";
import {
  adminSession,
  adminAccount,
  adminUser,
  adminVerification,
} from "@repo/db/admin/auth-schema";
import {
  categories,
  productCategories,
  products,
  productOptions,
  productOptionValues,
  productVariants,
  variantOptionValues,
  images,
  cart,
  cartItems,
  orders,
  orderItems,
} from "@repo/db/public/schema";

export async function resetAuthTables() {
  await testDb.delete(adminSession);
  await testDb.delete(adminAccount);
  await testDb.delete(adminUser);
  await testDb.delete(adminVerification);
}

export async function resetCategoryTables() {
  await testDb.delete(productCategories);
  await testDb.delete(categories);
}

export async function resetProductTables() {
  await testDb.delete(orderItems);
  await testDb.delete(orders);
  await testDb.delete(cartItems);
  await testDb.delete(cart);
  await testDb.delete(variantOptionValues);
  await testDb.delete(productVariants);
  await testDb.delete(productOptionValues);
  await testDb.delete(productOptions);
  await testDb.delete(productCategories);
  await testDb.delete(images);
  await testDb.delete(products);
}
