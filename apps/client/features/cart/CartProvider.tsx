"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  addCartItem,
  deleteCartItem,
  updateCartItemQuantity,
  type CartItem,
} from "@/features/cart/actions";
import type { Product } from "@/features/products/queries";

type CartAction =
  | { type: "add"; product: Product; quantity: number }
  | { type: "update"; productId: string; quantity: number }
  | { type: "remove"; productId: string };

const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case "add": {
      const existing = state.find(
        (item) => item.product.id === action.product.id,
      );

      if (existing) {
        return state.map((item) =>
          item.product.id === action.product.id
            ? { ...item, quantity: item.quantity + action.quantity }
            : item,
        );
      }

      return [...state, { product: action.product, quantity: action.quantity }];
    }
    case "update": {
      if (action.quantity <= 0) {
        return state.filter((item) => item.product.id !== action.productId);
      }

      return state.map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item,
      );
    }
    case "remove":
      return state.filter((item) => item.product.id !== action.productId);
  }
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  isPending: boolean;
  addItem: (product: Product, quantity?: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  initialItems,
  children,
}: {
  initialItems: CartItem[];
  children: ReactNode;
}) {
  const [items, setItems] = useState(initialItems);
  const [optimisticItems, applyOptimistic] = useOptimistic(items, cartReducer);
  const [isPending, startTransition] = useTransition();

  const addItem = (product: Product, quantity = 1) => {
    startTransition(async () => {
      applyOptimistic({ type: "add", product, quantity });
      const updated = await addCartItem(product.id, quantity);
      setItems(updated);
    });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    startTransition(async () => {
      applyOptimistic({ type: "update", productId, quantity });
      const updated = await updateCartItemQuantity(productId, quantity);
      setItems(updated);
    });
  };

  const removeItem = (productId: string) => {
    startTransition(async () => {
      applyOptimistic({ type: "remove", productId });
      const updated = await deleteCartItem(productId);
      setItems(updated);
    });
  };

  const count = optimisticItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: optimisticItems,
        count,
        isPending,
        addItem,
        updateItemQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
