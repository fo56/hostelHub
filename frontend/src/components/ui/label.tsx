import * as React from "react"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-body-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink ${className || ''}`}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
