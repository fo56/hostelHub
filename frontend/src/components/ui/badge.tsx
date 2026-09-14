import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'secondary';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let variantClasses = "";
  switch (variant) {
    case 'success':
      variantClasses = "bg-(--color-canvas) text-(--color-semantic-success) border border-(--color-semantic-success)/20";
      break;
    case 'warning':
      variantClasses = "bg-(--color-canvas) text-(--color-semantic-warning) border border-(--color-semantic-warning)/20";
      break;
    case 'error':
      variantClasses = "bg-(--color-canvas) text-(--color-semantic-error) border border-(--color-semantic-error)/20";
      break;
    case 'outline':
      variantClasses = "border border-(--color-hairline) text-(--color-ink) bg-transparent";
      break;
    case 'secondary':
      variantClasses = "bg-(--color-surface-soft) text-(--color-ink) border border-(--color-hairline-soft)";
      break;
    default:
      variantClasses = "bg-(--color-primary) text-(--color-on-primary) border border-transparent";
      break;
  }

  return (
    <span
      className={`inline-flex items-center text-caption px-2.5 py-1 rounded ${variantClasses} ${className || ""}`}
      {...props}
    />
  )
}

export { Badge }
