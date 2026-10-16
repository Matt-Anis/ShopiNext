"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "../lib/utils"
import { Input } from "./input"
import { Label } from "./label"

function FloatingLabelInput({
  id,
  label,
  className,
  type,
  disabled,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === "password"
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="relative">
      <Input
        id={id}
        type={resolvedType}
        placeholder=" "
        disabled={disabled}
        className={cn(
          "peer border-border bg-transparent focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40",
          isPassword && "pr-9",
          className
        )}
        {...props}
      />
      <Label
        htmlFor={id}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 bg-transparent px-1 text-sm font-normal text-muted-foreground transition-all duration-150 peer-focus:top-0 peer-focus:bg-card peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:bg-card peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </Label>
      {isPassword && (
        <button
          type="button"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
}

export { FloatingLabelInput }
