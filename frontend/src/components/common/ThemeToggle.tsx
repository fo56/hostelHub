import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/button'
import { Moon, Sun } from 'lucide-react'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button 
      variant="icon" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="bg-transparent border-none hover:bg-(--color-surface-soft) text-(--color-ink) -none"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </Button>
  )
}
