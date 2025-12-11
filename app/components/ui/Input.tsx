import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-3 rounded-md border bg-white/50 text-foreground placeholder:text-gray-400 transition-all duration-200",
          "focus:outline-none focus:border-[#D97757] focus:bg-white focus:shadow-sm",
          error ? "border-[#944C4C] focus:border-[#944C4C]" : "border-input",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
