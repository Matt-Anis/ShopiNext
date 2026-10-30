"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Lock,
  MessageSquare,
  Pencil,
  Trash2,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@repo/ui/avatar"
import { Button } from "@repo/ui/button"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { Marker, MarkerContent } from "@repo/ui/marker"
import { ScrollArea } from "@repo/ui/scroll-area"
import { Textarea } from "@repo/ui/textarea"
import { toast } from "@repo/ui/toast"
import {
  addStaffNote,
  updateStaffNote,
  deleteStaffNote,
} from "@/features/orders/actions"
import type { OrderNoteItem } from "@/features/orders/queries"

interface OrderStaffNotesProps {
  orderId: string
  notes: OrderNoteItem[]
  currentUserId?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatDateGroup(date: Date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()

  if (isSameDay(d, today)) return "Today"
  if (isSameDay(d, yesterday)) return "Yesterday"

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })
}

function getDateKey(date: Date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function OrderStaffNotes({
  orderId,
  notes,
  currentUserId,
}: OrderStaffNotesProps) {
  const [showJumpToLatest, setShowJumpToLatest] = React.useState(false)
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null)
  const [editingContent, setEditingContent] = React.useState("")
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = React.useState(false)
  const [noteToDelete, setNoteToDelete] = React.useState<OrderNoteItem | null>(null)
  const [isActionPending, startActionTransition] = React.useTransition()

  const scrollRootRef = React.useRef<HTMLDivElement>(null)
  const bottomSentinelRef = React.useRef<HTMLDivElement>(null)

  function handleStartEdit(note: OrderNoteItem) {
    setEditingNoteId(note.id)
    setEditingContent(note.content)
  }

  function handleCancelEdit() {
    setEditingNoteId(null)
    setEditingContent("")
    setIsConfirmUpdateOpen(false)
  }

  function handleConfirmUpdate() {
    if (!editingNoteId || !editingContent.trim()) return

    const noteId = editingNoteId
    const content = editingContent

    startActionTransition(async () => {
      const promise = updateStaffNote(noteId, content)
      await toast
        .promise(promise, {
          loading: { title: "Updating staff note..." },
          success: () => {
            handleCancelEdit()
            return { title: "Staff note updated" }
          },
          error: (error: Error) => ({
            title: "Failed to update note",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleConfirmDelete() {
    if (!noteToDelete) return

    const noteId = noteToDelete.id

    startActionTransition(async () => {
      const promise = deleteStaffNote(noteId)
      await toast
        .promise(promise, {
          loading: { title: "Deleting staff note..." },
          success: () => {
            setNoteToDelete(null)
            return { title: "Staff note deleted" }
          },
          error: (error: Error) => ({
            title: "Failed to delete note",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  const groupedNotes = React.useMemo(() => {
    const groups: { dateKey: string; label: string; notes: OrderNoteItem[] }[] = []
    const sorted = [...notes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    for (const note of sorted) {
      const key = getDateKey(note.createdAt)
      let group = groups.find((g) => g.dateKey === key)
      if (!group) {
        group = {
          dateKey: key,
          label: formatDateGroup(note.createdAt),
          notes: [],
        }
        groups.push(group)
      }
      group.notes.push(note)
    }

    return groups
  }, [notes])

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      bottomSentinelRef.current?.scrollIntoView({ behavior, block: "end" })
    },
    []
  )

  React.useEffect(() => {
    scrollToBottom("auto")
  }, [scrollToBottom])

  React.useEffect(() => {
    const rootEl =
      scrollRootRef.current?.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]'
      ) ?? scrollRootRef.current

    if (!rootEl) return

    const handleScroll = () => {
      const distanceFromBottom =
        rootEl.scrollHeight - rootEl.scrollTop - rootEl.clientHeight
      setShowJumpToLatest(distanceFromBottom > 80)
    }

    rootEl.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      rootEl.removeEventListener("scroll", handleScroll)
    }
  }, [notes.length])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Internal Staff Notes ({notes.length})
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" />
          <span>Staff only · Private</span>
        </div>
      </div>

      <div className="relative">
        <ScrollArea
          ref={scrollRootRef}
          className="h-80 sm:h-96 w-full rounded-2xl border border-border bg-muted/5 p-4"
        >
          {groupedNotes.length === 0 ? (
            <div className="flex h-full min-h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground italic">
                No internal staff notes on this order yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pr-3">
              {groupedNotes.map((group) => (
                <div key={group.dateKey} className="flex flex-col gap-3">
                  <Marker variant="separator" className="w-1/2 mx-auto py-1">
                    <MarkerContent className="text-xs font-medium text-muted-foreground">
                      {group.label}
                    </MarkerContent>
                  </Marker>

                  <div className="flex flex-col gap-1.5">
                    {group.notes.map((note) => {
                      const isOwn =
                        Boolean(currentUserId) &&
                        note.author?.id === currentUserId
                      const isEditing = editingNoteId === note.id
                      const isPolluted =
                        editingContent.trim() !== note.content &&
                        editingContent.trim().length > 0
                      const isEdited =
                        Boolean(note.updatedAt && note.createdAt) &&
                        new Date(note.updatedAt).getTime() >
                          new Date(note.createdAt).getTime() + 1000

                      return (
                        <div
                          key={note.id}
                          className="group -mx-2 flex items-start gap-3 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-muted/40"
                        >
                          <Avatar size="lg" className="shrink-0 mt-0.5">
                            <AvatarFallback className="text-xs font-semibold">
                              {getInitials(note.author?.name || "Staff")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">
                                  {note.author?.name || "Staff Member"}
                                </span>
                                {isOwn && (
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    You
                                  </span>
                                )}
                                <span className="text-[11px] text-muted-foreground">
                                  {new Date(note.createdAt).toLocaleTimeString(
                                    undefined,
                                    {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                                {isEdited && (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    (edited)
                                  </span>
                                )}
                              </div>

                              {isOwn && !isEditing && (
                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleStartEdit(note)}
                                    disabled={isActionPending}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Edit note"
                                    aria-label="Edit note"
                                  >
                                    <Pencil className="size-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setNoteToDelete(note)}
                                    disabled={isActionPending}
                                    className="text-muted-foreground hover:text-destructive"
                                    title="Delete note"
                                    aria-label="Delete note"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="flex items-start gap-1 rounded-xl border border-border bg-background p-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
                                <Textarea
                                  value={editingContent}
                                  onChange={(e) =>
                                    setEditingContent(e.target.value)
                                  }
                                  disabled={isActionPending}
                                  autoFocus
                                  rows={1}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      e.preventDefault()
                                      handleCancelEdit()
                                    } else if (
                                      e.key === "Enter" &&
                                      !e.shiftKey &&
                                      isPolluted
                                    ) {
                                      e.preventDefault()
                                      setIsConfirmUpdateOpen(true)
                                    }
                                  }}
                                  className="min-h-[28px] max-h-[120px] flex-1 resize-none border-0 bg-transparent p-1 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
                                />
                                <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                                  {isPolluted && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      disabled={isActionPending}
                                      onClick={() =>
                                        setIsConfirmUpdateOpen(true)
                                      }
                                      className="text-primary hover:bg-primary/10 hover:text-primary"
                                      title="Save changes"
                                      aria-label="Save changes"
                                    >
                                      <Check className="size-3" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    disabled={isActionPending}
                                    onClick={handleCancelEdit}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Cancel edit"
                                    aria-label="Cancel edit"
                                  >
                                    <X className="size-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                                {note.content}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomSentinelRef} className="h-px w-full" />
            </div>
          )}
        </ScrollArea>

        {showJumpToLatest && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 h-7 rounded-full px-3 text-xs shadow-md border border-border bg-background/95 backdrop-blur hover:bg-muted"
          >
            <ArrowDown className="size-3 mr-1" />
            Jump to latest
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={isConfirmUpdateOpen}
        onOpenChange={setIsConfirmUpdateOpen}
        title="Update staff note"
        description="Are you sure you want to save these changes to your note?"
        confirmLabel="Save changes"
        disabled={isActionPending}
        onConfirm={handleConfirmUpdate}
      />

      <ConfirmDialog
        open={noteToDelete !== null}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
        title="Delete staff note"
        description="Are you sure you want to delete this staff note? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        disabled={isActionPending}
        onConfirm={handleConfirmDelete}
      />

      <OrderStaffNoteForm
        orderId={orderId}
        onSuccess={() => setTimeout(() => scrollToBottom("smooth"), 100)}
      />
    </section>
  )
}

interface OrderStaffNoteFormProps {
  orderId: string
  onSuccess?: () => void
}

function OrderStaffNoteForm({ orderId, onSuccess }: OrderStaffNoteFormProps) {
  const [content, setContent] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [content, adjustHeight])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        await addStaffNote(orderId, content)
        setContent("")
        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add note")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-muted/10 p-2 transition-[color,box-shadow,border-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <Textarea
          ref={textareaRef}
          placeholder="Send a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          className="min-h-[36px] max-h-[84px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2.5 py-2 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        />

        <Button
          type="submit"
          size="icon-sm"
          disabled={isPending || !content.trim()}
          className="shrink-0 rounded-lg"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
          <span className="sr-only">Send note</span>
        </Button>
      </div>

      {error && <p className="px-1 text-xs text-destructive">{error}</p>}
    </form>
  )
}
