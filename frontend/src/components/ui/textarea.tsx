import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded border border-(--color-hairline) bg-(--color-canvas) text-(--color-ink) px-4 py-3 text-body placeholder:text-(--color-muted) focus-visible:outline-none focus-visible:border-(--color-ink) disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
