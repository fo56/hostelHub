import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onChange?: (e: any) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, onChange, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Extract options from children
    const options: { value: string; label: string }[] = []
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const optionChild = child as React.ReactElement<{ value?: string; children?: any }>;
        options.push({
          value: optionChild.props.value || optionChild.props.children,
          label: optionChild.props.children
        })
      }
    })

    const selectedOption = options.find((opt) => opt.value === value)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (val: string) => {
      if (onChange) {
        // Create a fake event object to match the expected onChange signature
        onChange({ target: { value: val } } as any)
      }
      setIsOpen(false)
    }

    return (
      <div className={`relative ${className || ""}`} ref={containerRef}>
        <div
          className={`flex items-center justify-between bg-surface text-body-sm px-3 py-2 border border-(--color-hairline) rounded transition-all cursor-pointer hover:border-(--color-ink)/50 ${
            isOpen ? "border-(--color-ink) ring-1 ring-(--color-ink)" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? "text-ink" : "text-muted"}>
            {selectedOption ? selectedOption.label : "Select..."}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-surface border border-hairline rounded shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="max-h-60 overflow-auto custom-scrollbar p-1">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 text-body-sm rounded cursor-pointer transition-colors ${
                    opt.value === value
                      ? "bg-ink text-canvas font-medium"
                      : "text-ink hover:bg-surface-soft"
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Hidden native select for form integration/refs if needed */}
        <select
          ref={ref}
          value={value}
          onChange={(e) => handleSelect(e.target.value)}
          className="hidden"
          disabled={disabled}
          {...props}
        >
          {children}
        </select>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
