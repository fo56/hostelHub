import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  it('should not render anything if there is only 1 page and no items', () => {
    const { container } = render(
      <Pagination 
        currentPage={1} 
        totalPages={1} 
        totalItems={0} 
        itemsPerPage={10} 
        onPageChange={() => {}} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render the correct text for item range', () => {
    render(
      <Pagination 
        currentPage={2} 
        totalPages={5} 
        totalItems={45} 
        itemsPerPage={10} 
        onPageChange={() => {}} 
      />
    );
    // On page 2, with 10 items per page, it should show 11 to 20
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        totalItems={45} 
        itemsPerPage={10} 
        onPageChange={() => {}} 
      />
    );
    
    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    prevButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('should disable Next button on last page', () => {
    render(
      <Pagination 
        currentPage={5} 
        totalPages={5} 
        totalItems={45} 
        itemsPerPage={10} 
        onPageChange={() => {}} 
      />
    );
    
    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    nextButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('should call onPageChange with correct value when Next is clicked', () => {
    const onPageChangeMock = vi.fn();
    render(
      <Pagination 
        currentPage={2} 
        totalPages={5} 
        totalItems={45} 
        itemsPerPage={10} 
        onPageChange={onPageChangeMock} 
      />
    );
    
    // There are mobile and desktop buttons, click the desktop one (last one usually)
    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[1]); // Click desktop next button
    
    expect(onPageChangeMock).toHaveBeenCalledWith(3);
  });

  it('should call onPageChange with correct value when Previous is clicked', () => {
    const onPageChangeMock = vi.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        totalItems={45} 
        itemsPerPage={10} 
        onPageChange={onPageChangeMock} 
      />
    );
    
    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    fireEvent.click(prevButtons[1]); // Click desktop prev button
    
    expect(onPageChangeMock).toHaveBeenCalledWith(2);
  });
});
