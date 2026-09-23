import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-soft/30">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="secondary"
          className="text-body-sm"
        >
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="secondary"
          className="text-body-sm"
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-body-sm text-muted">
            Showing <span className="text-ink">{totalItems === 0 ? 0 : startItem}</span> to{' '}
            <span className="text-ink">{endItem}</span> of{' '}
            <span className="text-ink">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="secondary"
              className="rounded-l-md rounded-r-none border-hairline px-2 py-2 focus:z-20 text-muted hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed h-9"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="px-4 py-2 border-y border-hairline text-body-sm text-ink bg-canvas flex items-center h-9">
              Page {currentPage} of {Math.max(1, totalPages)}
            </div>
            <Button
              variant="secondary"
              className="rounded-r-md rounded-l-none border-hairline px-2 py-2 focus:z-20 text-muted hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed h-9"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
