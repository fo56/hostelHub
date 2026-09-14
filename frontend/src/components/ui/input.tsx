import * as React from "react"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={`flex w-full rounded border border-(--color-hairline) bg-(--color-canvas) text-(--color-ink) px-4 py-3 min-h-[44px] text-body placeholder:text-(--color-muted) focus-visible:outline-none focus-visible:border-(--color-ink) disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className || ''}`}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
