import * as React from "react"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={`flex h-10 w-full rounded-lg border-2 border-black/20 bg-white px-4 py-2 text-sm placeholder:text-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className || ''}`}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
