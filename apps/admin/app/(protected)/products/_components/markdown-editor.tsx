"use client"

import * as React from "react"
import { Textarea } from "@repo/ui/textarea"
import { Markdown } from "@repo/ui/markdown"
import { cn } from "@repo/ui/utils"

interface MarkdownEditorProps {
  id?: string
  name?: string
  defaultValue?: string
  placeholder?: string
  className?: string
  testId?: string
}

export function MarkdownEditor({
  id = "description",
  name = "description",
  defaultValue = "",
  placeholder,
  className,
  testId,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = React.useState<"write" | "preview">("write")
  const [value, setValue] = React.useState(defaultValue)

  return (
    <div className="flex flex-col gap-2">
      <div
        role="tablist"
        aria-label="Markdown editor tabs"
        className="flex items-center gap-1 border-b border-border pb-1"
      >
        <button
          type="button"
          role="tab"
          id={`${id}-tab-write`}
          aria-selected={activeTab === "write"}
          aria-controls={`${id}-panel-write`}
          onClick={() => setActiveTab("write")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            activeTab === "write"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          Write
        </button>
        <button
          type="button"
          role="tab"
          id={`${id}-tab-preview`}
          aria-selected={activeTab === "preview"}
          aria-controls={`${id}-panel-preview`}
          onClick={() => setActiveTab("preview")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            activeTab === "preview"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          Preview
        </button>
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel-write`}
        aria-labelledby={`${id}-tab-write`}
        className={cn(activeTab !== "write" && "hidden")}
      >
        <Textarea
          id={id}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className={cn("min-h-36 border-border bg-transparent", className)}
          data-testid={testId}
        />
      </div>

      {activeTab === "preview" && (
        <div
          role="tabpanel"
          id={`${id}-panel-preview`}
          aria-labelledby={`${id}-tab-preview`}
          className="max-h-72 min-h-36 overflow-y-auto rounded-md border border-border bg-muted/10 p-3 text-sm"
        >
          {value.trim() ? (
            <Markdown content={value} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Nothing to preview
            </p>
          )}
        </div>
      )}
    </div>
  )
}
