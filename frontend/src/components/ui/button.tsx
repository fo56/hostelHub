import * as React from "react"

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon' | 'icon-inverse'

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
  }
>(({ className, variant = 'primary', ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  
  const variants = {
    primary: 'bg-(--color-primary) text-(--color-on-primary) text-body-sm rounded px-3 py-1.5 min-h-[36px]',
    secondary: 'bg-(--color-canvas) text-(--color-ink) border border-(--color-hairline) text-body-sm rounded px-3 py-1.5 min-h-[36px]',
    tertiary: 'bg-(--color-canvas) text-(--color-ink) text-body-sm underline rounded px-2 py-1.5 min-h-[36px]',
    icon: 'bg-(--color-surface-soft) text-(--color-ink) rounded-full w-9 h-9 min-h-[36px]',
    'icon-inverse': 'bg-(--color-on-inverse-soft) text-(--color-inverse-ink) rounded-full w-9 h-9 min-h-[36px]',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
