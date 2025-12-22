import * as React from "react"

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string
    onValueChange?: (value: string) => void
  }
>(({ defaultValue, onValueChange, children }, ref) => {
  const [value, setValue] = React.useState(defaultValue || '')

  const handleChange = (newValue: string) => {
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div ref={ref}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const displayName = (child.type as { displayName?: string })?.displayName
          if (displayName === 'TabsList') {
            return React.cloneElement(child as React.ReactElement<{ value?: string; onChange?: (v: string) => void }>, { value, onChange: handleChange })
          } else if (displayName === 'TabsContent') {
            const childProps = child.props as Record<string, unknown> | undefined
            return React.cloneElement(child as React.ReactElement<{ isActive?: boolean }>, { isActive: childProps?.value === value })
          }
        }
        return child
      })}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onChange?: (value: string) => void
  }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex items-center justify-center rounded-lg bg-black/5 p-1 ${className || ''}`}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value?: string
    disabled?: boolean
  }
>(({ className, value, disabled, ...props }, ref) => {
  const parent = React.useContext(TabsContext)
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 ${
        parent?.value === value
          ? 'bg-white text-black shadow'
          : 'text-black/60 hover:text-black'
      } ${className || ''}`}
      onClick={() => {
        if (!disabled && parent?.onChange) {
          parent.onChange(value || '')
        }
      }}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    isActive?: boolean
  }
>(({ className, isActive, ...props }, ref) => (
  <div
    ref={ref}
    hidden={!isActive}
    className={`ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${className || ''}`}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

const TabsContext = React.createContext<{
  value: string
  onChange: (value: string) => void
} | null>(null)

export { Tabs, TabsList, TabsTrigger, TabsContent }
