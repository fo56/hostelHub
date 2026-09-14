import * as React from "react"

const TabsContext = React.createContext<{
  value: string
  onChange: (value: string) => void
} | null>(null)

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string
    onValueChange?: (value: string) => void
  }
>(({ defaultValue, onValueChange, children, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue || '')

  const handleChange = (newValue: string) => {
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value, onChange: handleChange }}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex items-center justify-center rounded bg-(--color-canvas) p-1 gap-1 border border-(--color-hairline) ${className || ''}`}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
  }
>(({ className, value, disabled, ...props }, ref) => {
  const parent = React.useContext(TabsContext)
  const isSelected = parent?.value === value
  
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded px-4 py-2.5 min-h-[44px] text-body-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) disabled:pointer-events-none disabled:opacity-50 ${
 isSelected
 ? 'bg-(--color-primary) text-(--color-on-primary)'
 : 'bg-(--color-canvas) text-(--color-ink) hover:bg-(--color-surface-soft)'
 } ${className || ''}`}
      onClick={() => {
        if (!disabled && parent?.onChange) {
          parent.onChange(value)
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
    value: string
  }
>(({ className, value, ...props }, ref) => {
  const parent = React.useContext(TabsContext)
  const isActive = parent?.value === value
  
  return (
    <div
      ref={ref}
      hidden={!isActive}
      className={`ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${className || ''}`}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
