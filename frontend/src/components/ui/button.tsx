import * as React from "react"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, variant = 'default', size = 'md', ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  
  const variants = {
    default: 'bg-black text-white hover:bg-black/90 focus-visible:ring-black',
    outline: 'border-2 border-black text-black hover:bg-black/10 focus-visible:ring-black',
    secondary: 'bg-black/20 text-black hover:bg-black/30 focus-visible:ring-black',
    ghost: 'text-black hover:bg-black/10 focus-visible:ring-black',
    destructive: 'bg-black text-white hover:bg-black/90 focus-visible:ring-black'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
