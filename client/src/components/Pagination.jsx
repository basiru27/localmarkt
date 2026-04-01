import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, totalItems, itemsPerPage, hasNextPage, hasPrevPage } = pagination;

  const handlePrev = () => {
    if (hasPrevPage) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (hasNextPage) onPageChange(currentPage + 1);
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 mb-4 gap-4">
      <div className="text-sm text-text-secondary">
        Showing <span className="font-semibold text-text">{startItem}</span> to <span className="font-semibold text-text">{endItem}</span> of <span className="font-semibold text-text">{totalItems}</span> results
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          disabled={!hasPrevPage}
          className="btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="hidden sm:flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...'}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                page === currentPage 
                  ? 'bg-primary text-white' 
                  : page === '...' 
                    ? 'cursor-default text-text-secondary' 
                    : 'text-text hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleNext}
          disabled={!hasNextPage}
          className="btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
