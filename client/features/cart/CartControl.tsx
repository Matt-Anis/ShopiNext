"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { useCart } from "@/features/cart/CartProvider";
import { cn } from "@/lib/utils";
import type { Product } from "@/features/products/queries";

export function CartControl({
  product,
  size = "default",
  className,
}: {
  product: Product;
  size?: "default" | "lg";
  className?: string;
}) {
  const { items, addItem, updateItemQuantity, removeItem, isPending } =
    useCart();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const quantity =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;

  const handleAdd = () => {
    addItem(product, 1);
  };

  const handleDecrement = () => {
    if (quantity <= 1) {
      setRemoveDialogOpen(true);
      return;
    }

    updateItemQuantity(product.id, quantity - 1);
  };

  const handleIncrement = () => {
    updateItemQuantity(product.id, quantity + 1);
  };

  const handleConfirmRemove = () => {
    removeItem(product.id);
    setRemoveDialogOpen(false);
  };

  const buttonSize = size === "lg" ? "lg" : "default";
  const iconButtonSize = size === "lg" ? "icon-lg" : "icon";

  return (
    <>
      {quantity === 0 ? (
        <Button
          type="button"
          size={buttonSize}
          className={cn("w-full", className)}
          onClick={handleAdd}
          disabled={isPending}
          data-testid="cart-control-add"
        >
          Add to Cart
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
            disabled={isPending}
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
              {product.name} will be removed from your cart.
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
