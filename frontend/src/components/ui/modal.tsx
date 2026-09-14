import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

// Keep track of open modals to only close the top-most one on ESC
// Using a simple counter to generate unique IDs
let modalCounter = 0;
let activeModalIds: number[] = [];

export function Modal({ isOpen, onClose, title, children, className, maxWidth = "max-w-md" }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      const modalId = ++modalCounter;
      activeModalIds.push(modalId);
      
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Only the last opened modal should respond to ESC
          if (activeModalIds[activeModalIds.length - 1] === modalId) {
            onClose();
          }
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        activeModalIds = activeModalIds.filter(id => id !== modalId);
        window.removeEventListener('keydown', handleKeyDown);
        
        if (activeModalIds.length === 0) {
          document.body.style.overflow = '';
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className={`bg-canvas/95 backdrop-blur-md border border-hairline rounded w-full ${maxWidth} max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-200 ${className || ""}`}>
        {title && (
          <div className="flex justify-between items-center p-4 border-b border-hairline bg-surface-soft/50 sticky top-0 z-20">
            <h2 className="text-card-title">{title}</h2>
            <button 
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
