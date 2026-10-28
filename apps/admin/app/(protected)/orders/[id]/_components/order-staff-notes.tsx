"use client"

import * as React from "react"
import { ArrowDown, Loader2, Lock, MessageSquare, Send } from "lucide-react"

import { Avatar, AvatarFallback } from "@repo/ui/avatar"
import { Button } from "@repo/ui/button"
import { Marker, MarkerContent } from "@repo/ui/marker"
import { ScrollArea } from "@repo/ui/scroll-area"
import { Textarea } from "@repo/ui/textarea"
import { addStaffNote } from "@/features/orders/actions"
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

  const scrollRootRef = React.useRef<HTMLDivElement>(null)
  const bottomSentinelRef = React.useRef<HTMLDivElement>(null)

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
                  <Marker variant="separator">
                    <MarkerContent className="text-xs font-medium text-muted-foreground">
                      {group.label}
                    </MarkerContent>
                  </Marker>

                  <div className="flex flex-col gap-1.5">
                    {group.notes.map((note) => {
                      const isOwn =
                        Boolean(currentUserId) &&
                        note.author?.id === currentUserId

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
                            </div>

                            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                              {note.content}
                            </p>
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border p-4 bg-muted/10"
    >
      <Textarea
        placeholder="Add a private note for staff regarding this order..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Press Enter to post, Shift+Enter for new line
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !content.trim()}
        >
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Post Note
        </Button>
      </div>
    </form>
  )
}
