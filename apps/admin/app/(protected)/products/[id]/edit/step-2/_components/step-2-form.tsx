"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

import {
  addProductCategory,
  removeProductCategory,
  createProductOption,
  deleteProductOption,
  addProductOptionValue,
  deleteProductOptionValue,
} from "@/features/products/actions"
import { createCategory } from "@/features/categories/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Badge } from "@repo/ui/badge"
import { Input } from "@repo/ui/input"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@repo/ui/combobox"

interface Category {
  id: string
  name: string
}

interface OptionValue {
  id: string
  value: string
}

interface Option {
  id: string
  name: string
  values: OptionValue[]
}

interface Step2FormProps {
  productId: string
  categories: Category[]
  selectedCategoryIds: string[]
  options: Option[]
}

export function Step2Form({
  productId,
  categories: initialCategories,
  selectedCategoryIds,
  options: initialOptions,
}: Step2FormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCategories)
  const [selectedNames, setSelectedNames] = useState(() =>
    initialCategories
      .filter((category) => selectedCategoryIds.includes(category.id))
      .map((category) => category.name)
  )
  const [categoryQuery, setCategoryQuery] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [options, setOptions] = useState(initialOptions)
  const [newOptionName, setNewOptionName] = useState("")
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({})
  const anchor = useComboboxAnchor()

  const categoryByName = useMemo(
    () => new Map(categories.map((category) => [category.name, category])),
    [categories]
  )
  const categoryNames = useMemo(
    () => categories.map((category) => category.name),
    [categories]
  )

  function handleCategoriesChange(names: string[]) {
    const added = names.filter((name) => !selectedNames.includes(name))
    const removed = selectedNames.filter((name) => !names.includes(name))
    const previous = selectedNames
    setSelectedNames(names)

    startTransition(async () => {
      for (const name of added) {
        const category = categoryByName.get(name)
        if (!category) continue

        await toast
          .promise(addProductCategory(productId, category.id), {
            loading: { title: "Updating categories..." },
            success: () => ({ title: "Categories updated" }),
            error: (error: Error) => {
              setSelectedNames(previous)
              return {
                title: "Failed to update categories",
                description: error.message,
              }
            },
          })
          .catch(() => {})
      }

      for (const name of removed) {
        const category = categoryByName.get(name)
        if (!category) continue

        await toast
          .promise(removeProductCategory(productId, category.id), {
            loading: { title: "Updating categories..." },
            success: () => ({ title: "Categories updated" }),
            error: (error: Error) => {
              setSelectedNames(previous)
              return {
                title: "Failed to update categories",
                description: error.message,
              }
            },
          })
          .catch(() => {})
      }
    })
  }

  function handleCreateCategory(name: string) {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setIsCreatingCategory(true)
    startTransition(async () => {
      const promise = createCategory(trimmedName, "")

      await toast
        .promise(promise, {
          loading: { title: "Creating category..." },
          success: (category) => {
            setCategories((prev) =>
              [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
            )
            setSelectedNames((prev) => [...prev, category.name])
            setCategoryQuery("")
            addProductCategory(productId, category.id).catch(() => {})
            return { title: "Category created" }
          },
          error: (error: Error) => ({
            title: "Failed to create category",
            description: error.message,
          }),
        })
        .catch(() => {})
      setIsCreatingCategory(false)
    })
  }

  function handleCreateOption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = newOptionName.trim()
    if (!trimmedName) return

    startTransition(async () => {
      const promise = createProductOption(productId, trimmedName)

      await toast
        .promise(promise, {
          loading: { title: "Adding option..." },
          success: (option) => {
            setOptions((prev) => [...prev, { ...option, values: [] }])
            setNewOptionName("")
            return { title: "Option added" }
          },
          error: (error: Error) => ({
            title: "Failed to add option",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleDeleteOption(optionId: string) {
    startTransition(async () => {
      const promise = deleteProductOption(productId, optionId)

      await toast
        .promise(promise, {
          loading: { title: "Removing option..." },
          success: () => {
            setOptions((prev) => prev.filter((option) => option.id !== optionId))
            return { title: "Option removed" }
          },
          error: (error: Error) => ({
            title: "Failed to remove option",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleAddValue(optionId: string) {
    const draft = valueDrafts[optionId]?.trim()
    if (!draft) return

    startTransition(async () => {
      const promise = addProductOptionValue(productId, optionId, draft)

      await toast
        .promise(promise, {
          loading: { title: "Adding value..." },
          success: (optionValue) => {
            setOptions((prev) =>
              prev.map((option) =>
                option.id === optionId
                  ? { ...option, values: [...option.values, optionValue] }
                  : option
              )
            )
            setValueDrafts((prev) => ({ ...prev, [optionId]: "" }))
            return { title: "Value added" }
          },
          error: (error: Error) => ({
            title: "Failed to add value",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleDeleteValue(optionId: string, valueId: string) {
    startTransition(async () => {
      const promise = deleteProductOptionValue(productId, valueId)

      await toast
        .promise(promise, {
          loading: { title: "Removing value..." },
          success: () => {
            setOptions((prev) =>
              prev.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      values: option.values.filter((v) => v.id !== valueId),
                    }
                  : option
              )
            )
            return { title: "Value removed" }
          },
          error: (error: Error) => ({
            title: "Failed to remove value",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-medium text-foreground/80">Categories</h2>
        <Combobox
          multiple
          items={categoryNames}
          value={selectedNames}
          onValueChange={handleCategoriesChange}
          inputValue={categoryQuery}
          onInputValueChange={setCategoryQuery}
        >
          <ComboboxChips ref={anchor} className="mt-3 w-full">
            <ComboboxValue>
              {(values: string[]) => (
                <>
                  {values.map((name) => (
                    <ComboboxChip key={name}>{name}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder="Add categories..." />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>
              {categoryQuery.trim() ? (
                <button
                  type="button"
                  disabled={isCreatingCategory}
                  onClick={() => handleCreateCategory(categoryQuery)}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="size-4" />
                  Create &quot;{categoryQuery.trim()}&quot;
                </button>
              ) : (
                "No categories found."
              )}
            </ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </section>

      <section>
        <h2 className="text-sm font-medium text-foreground/80">Options</h2>
        <div className="mt-3 flex flex-col gap-4">
          {options.map((option) => (
            <div
              key={option.id}
              className="rounded-2xl border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{option.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteOption(option.id)}
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
                        onClick={() => handleDeleteValue(option.id, value.id)}
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
                      handleAddValue(option.id)
                    }
                  }}
                  className="h-8 border-border bg-transparent text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddValue(option.id)}
                >
                  Add
                </Button>
              </div>
            </div>
          ))}

          <form onSubmit={handleCreateOption} className="flex gap-2">
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
      </section>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => router.push(`/products/${productId}/edit/step-3`)}
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/products")}
        >
          Save & exit
        </Button>
      </div>
    </div>
  )
}
