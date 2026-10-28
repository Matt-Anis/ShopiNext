"use client"

import * as React from "react"
import { Loader2, Lock, MessageSquare, Send } from "lucide-react"

import { Avatar, AvatarFallback } from "@repo/ui/avatar"
import { Button } from "@repo/ui/button"
import { Textarea } from "@repo/ui/textarea"
import { addStaffNote } from "@/features/orders/actions"
import type { OrderNoteItem } from "@/features/orders/queries"

interface OrderStaffNotesProps {
  orderId: string
  notes: OrderNoteItem[]
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

export function OrderStaffNotes({ orderId, notes }: OrderStaffNotesProps) {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add note")
      }
    })
  }

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

      <div className="flex flex-col gap-4">
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
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end">
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

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground italic px-1">
            No internal staff notes on this order yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex flex-col gap-2 rounded-2xl border border-border p-4 bg-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>
                        {getInitials(note.author?.name || "Staff")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {note.author?.name || "Staff Member"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {note.author?.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {note.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pl-8">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
