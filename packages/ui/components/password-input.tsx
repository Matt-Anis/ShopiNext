"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "../lib/utils"
import { Input } from "./input"

function PasswordInput({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="relative w-full">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-9", className)}
        disabled={disabled}
        {...props}
      />
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
    </div>
  )
}

export { PasswordInput }
