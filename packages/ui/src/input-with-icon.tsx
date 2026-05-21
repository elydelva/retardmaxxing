"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";

const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & {
    icon: React.ReactNode;
  }
>(({ className, icon, ...props }, ref) => {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">{icon}</div>
      <Input ref={ref} className={cn("pl-12")} {...props} />
    </div>
  );
});
InputWithIcon.displayName = "InputWithIcon";

export { InputWithIcon };
