"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@repo/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@repo/ui/alert-dialog";
import { useCart } from "@/features/cart/CartProvider";
import { cn } from "@repo/ui/utils";
import type { CartItemVariant } from "@/features/cart/actions";

export function CartControl({
  variant,
  size = "default",
  className,
}: {
  variant: CartItemVariant;
  size?: "default" | "lg";
  className?: string;
}) {
  const { items, addItem, updateItemQuantity, removeItem, isPending } =
    useCart();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const quantity =
    items.find((item) => item.variant.id === variant.id)?.quantity ?? 0;

  const handleAdd = () => {
    addItem(variant, 1);
  };

  const handleDecrement = () => {
    if (quantity <= 1) {
      setRemoveDialogOpen(true);
      return;
    }

    updateItemQuantity(variant.id, quantity - 1);
  };

  const handleIncrement = () => {
    updateItemQuantity(variant.id, quantity + 1);
  };

  const handleConfirmRemove = () => {
    removeItem(variant.id);
    setRemoveDialogOpen(false);
  };

  const buttonSize = size === "lg" ? "lg" : "default";
  const iconButtonSize = size === "lg" ? "icon-lg" : "icon";
  const isOutOfStock = variant.stock <= 0;
  const atStockLimit = quantity >= variant.stock;

  return (
    <>
      {quantity === 0 ? (
        <Button
          type="button"
          size={buttonSize}
          className={cn("w-full", className)}
          onClick={handleAdd}
          disabled={isPending || isOutOfStock}
          data-testid="cart-control-add"
        >
          {isOutOfStock ? "Sold out" : "Add to Cart"}
        </Button>
      ) : (
        <div className="flex w-full items-center justify-between rounded-4xl border border-border p-1">
          <Button
            type="button"
            size={iconButtonSize}
            variant={quantity === 1 ? "destructive" : "ghost"}
            onClick={handleDecrement}
            disabled={isPending}
            data-testid="cart-control-decrement"
          >
            {quantity === 1 ? (
              <Trash2 className="size-4" />
            ) : (
              <Minus className="size-4" />
            )}
          </Button>
          <span className="text-sm font-medium" data-testid="cart-control-quantity">
            {quantity} in cart
          </span>
          <Button
            type="button"
            size={iconButtonSize}
            variant="ghost"
            onClick={handleIncrement}
            disabled={isPending || atStockLimit}
            data-testid="cart-control-increment"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>
              {variant.product.name} will be removed from your cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              data-testid="cart-remove-cancel-button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmRemove}
              data-testid="cart-remove-confirm-button"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
