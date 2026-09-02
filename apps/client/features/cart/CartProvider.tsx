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
  type CartItemVariant,
} from "@/features/cart/actions";

type CartAction =
  | { type: "add"; variant: CartItemVariant; quantity: number }
  | { type: "update"; variantId: string; quantity: number }
  | { type: "remove"; variantId: string };

const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case "add": {
      const existing = state.find(
        (item) => item.variant.id === action.variant.id,
      );

      if (existing) {
        return state.map((item) =>
          item.variant.id === action.variant.id
            ? { ...item, quantity: item.quantity + action.quantity }
            : item,
        );
      }

      return [...state, { variant: action.variant, quantity: action.quantity }];
    }
    case "update": {
      if (action.quantity <= 0) {
        return state.filter((item) => item.variant.id !== action.variantId);
      }

      return state.map((item) =>
        item.variant.id === action.variantId
          ? { ...item, quantity: action.quantity }
          : item,
      );
    }
    case "remove":
      return state.filter((item) => item.variant.id !== action.variantId);
  }
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  isPending: boolean;
  addItem: (variant: CartItemVariant, quantity?: number) => void;
  updateItemQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
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

  const addItem = (variant: CartItemVariant, quantity = 1) => {
    startTransition(async () => {
      applyOptimistic({ type: "add", variant, quantity });
      const updated = await addCartItem(variant.id, quantity);
      setItems(updated);
    });
  };

  const updateItemQuantity = (variantId: string, quantity: number) => {
    startTransition(async () => {
      applyOptimistic({ type: "update", variantId, quantity });
      const updated = await updateCartItemQuantity(variantId, quantity);
      setItems(updated);
    });
  };

  const removeItem = (variantId: string) => {
    startTransition(async () => {
      applyOptimistic({ type: "remove", variantId });
      const updated = await deleteCartItem(variantId);
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
