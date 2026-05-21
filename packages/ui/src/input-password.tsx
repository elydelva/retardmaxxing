"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";

const InputPassword = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "type"> & {
    icon?: React.ReactNode;
  }
>(({ className, icon, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">{icon}</div>
      )}
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        className={cn(icon && "pl-12 pr-12")}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
InputPassword.displayName = "InputPassword";

export { InputPassword };
