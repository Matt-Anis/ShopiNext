import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FloatingLabelInput({
  id,
  label,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="relative">
      <Input
        id={id}
        placeholder=" "
        className={cn(
          "peer h-12 border-border bg-transparent pt-4 pb-1 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40",
          className,
        )}
        {...props}
      />
      <Label
        htmlFor={id}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2  bg-transparent px-1 text-sm font-normal text-muted-foreground transition-all duration-150 peer-focus:top-0  peer-focus:bg-card peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:bg-card peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </Label>
    </div>
  );
}

export { FloatingLabelInput };
