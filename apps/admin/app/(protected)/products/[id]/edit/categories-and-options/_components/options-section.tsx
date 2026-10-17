"use client"

import { useState, useTransition } from "react"
import { Plus, X } from "lucide-react"

import {
  createProductOption,
  deleteProductOption,
  addProductOptionValue,
  deleteProductOptionValue,
} from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Badge } from "@repo/ui/badge"
import { Input } from "@repo/ui/input"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"

interface OptionValue {
  id: string
  value: string
}

interface Option {
  id: string
  name: string
  values: OptionValue[]
}

interface OptionsSectionProps {
  productId: string
  options: Option[]
}

type PendingAction =
  | { kind: "create-option"; name: string }
  | { kind: "delete-option"; optionId: string; name: string }
  | { kind: "add-value"; optionId: string; optionName: string; value: string }
  | {
      kind: "delete-value"
      optionId: string
      valueId: string
      optionName: string
      value: string
    }

function isDestructive(action: PendingAction) {
  return action.kind === "delete-option" || action.kind === "delete-value"
}

function getDialogContent(action: PendingAction) {
  switch (action.kind) {
    case "create-option":
      return {
        title: "Create option",
        description: `Create the option "${action.name}"?`,
        confirmLabel: "Create",
      }
    case "delete-option":
      return {
        title: "Delete option",
        description: `Delete "${action.name}" and all its values? This can't be undone.`,
        confirmLabel: "Delete",
      }
    case "add-value":
      return {
        title: "Add value",
        description: `Add "${action.value}" to ${action.optionName}?`,
        confirmLabel: "Add",
      }
    case "delete-value":
      return {
        title: "Delete value",
        description: `Delete "${action.value}" from ${action.optionName}?`,
        confirmLabel: "Delete",
      }
  }
}

export function OptionsSection({
  productId,
  options: initialOptions,
}: OptionsSectionProps) {
  const [, startTransition] = useTransition()
  const [options, setOptions] = useState(initialOptions)
  const [newOptionName, setNewOptionName] = useState("")
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({})
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  )
  const [isConfirming, setIsConfirming] = useState(false)

  function requestCreateOption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = newOptionName.trim()
    if (!trimmedName) return
    setPendingAction({ kind: "create-option", name: trimmedName })
  }

  function requestDeleteOption(option: Option) {
    setPendingAction({
      kind: "delete-option",
      optionId: option.id,
      name: option.name,
    })
  }

  function requestAddValue(option: Option) {
    const draft = valueDrafts[option.id]?.trim()
    if (!draft) return
    setPendingAction({
      kind: "add-value",
      optionId: option.id,
      optionName: option.name,
      value: draft,
    })
  }

  function requestDeleteValue(option: Option, value: OptionValue) {
    setPendingAction({
      kind: "delete-value",
      optionId: option.id,
      valueId: value.id,
      optionName: option.name,
      value: value.value,
    })
  }

  function handleConfirm() {
    if (!pendingAction) return
    const action = pendingAction

    setIsConfirming(true)
    startTransition(async () => {
      if (action.kind === "create-option") {
        await toast
          .promise(createProductOption(productId, action.name), {
            loading: { title: "Adding option..." },
            success: (option) => {
              setOptions((prev) => [...prev, { ...option, values: [] }])
              setNewOptionName("")
              setPendingAction(null)
              return { title: "Option added" }
            },
            error: (error: Error) => ({
              title: "Failed to add option",
              description: error.message,
            }),
          })
          .catch(() => {})
      } else if (action.kind === "delete-option") {
        await toast
          .promise(deleteProductOption(productId, action.optionId), {
            loading: { title: "Removing option..." },
            success: () => {
              setOptions((prev) =>
                prev.filter((option) => option.id !== action.optionId)
              )
              setPendingAction(null)
              return { title: "Option removed" }
            },
            error: (error: Error) => ({
              title: "Failed to remove option",
              description: error.message,
            }),
          })
          .catch(() => {})
      } else if (action.kind === "add-value") {
        await toast
          .promise(
            addProductOptionValue(productId, action.optionId, action.value),
            {
              loading: { title: "Adding value..." },
              success: (optionValue) => {
                setOptions((prev) =>
                  prev.map((option) =>
                    option.id === action.optionId
                      ? { ...option, values: [...option.values, optionValue] }
                      : option
                  )
                )
                setValueDrafts((prev) => ({ ...prev, [action.optionId]: "" }))
                setPendingAction(null)
                return { title: "Value added" }
              },
              error: (error: Error) => ({
                title: "Failed to add value",
                description: error.message,
              }),
            }
          )
          .catch(() => {})
      } else if (action.kind === "delete-value") {
        await toast
          .promise(deleteProductOptionValue(productId, action.valueId), {
            loading: { title: "Removing value..." },
            success: () => {
              setOptions((prev) =>
                prev.map((option) =>
                  option.id === action.optionId
                    ? {
                        ...option,
                        values: option.values.filter(
                          (v) => v.id !== action.valueId
                        ),
                      }
                    : option
                )
              )
              setPendingAction(null)
              return { title: "Value removed" }
            },
            error: (error: Error) => ({
              title: "Failed to remove value",
              description: error.message,
            }),
          })
          .catch(() => {})
      }
      setIsConfirming(false)
    })
  }

  const dialogContent = pendingAction && getDialogContent(pendingAction)

  return (
    <section>
      <h2 className="text-sm font-medium text-foreground/80">Options</h2>
      <div className="mt-3 flex flex-col gap-4">
        {options.map((option) => (
          <div key={option.id} className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{option.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => requestDeleteOption(option)}
              >
                <X className="size-4" />
              </Button>
            </div>
            {option.values.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {option.values.map((value) => (
                  <Badge key={value.id} variant="secondary" className="gap-1">
                    {value.value}
                    <button
                      type="button"
                      onClick={() => requestDeleteValue(option, value)}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Add a value"
                value={valueDrafts[option.id] ?? ""}
                onChange={(event) =>
                  setValueDrafts((prev) => ({
                    ...prev,
                    [option.id]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    requestAddValue(option)
                  }
                }}
                className="h-8 border-border bg-transparent text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => requestAddValue(option)}
              >
                Add
              </Button>
            </div>
          </div>
        ))}

        <form onSubmit={requestCreateOption} className="flex gap-2">
          <Input
            placeholder="e.g. Size, Color"
            value={newOptionName}
            onChange={(event) => setNewOptionName(event.target.value)}
            className="h-9 border-border bg-transparent"
          />
          <Button type="submit" variant="outline">
            <Plus className="size-4" />
            Add option
          </Button>
        </form>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={dialogContent?.title}
        description={dialogContent?.description}
        confirmLabel={dialogContent?.confirmLabel}
        destructive={pendingAction !== null && isDestructive(pendingAction)}
        disabled={isConfirming}
        onConfirm={handleConfirm}
      />
    </section>
  )
}
