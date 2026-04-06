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
    <nav 
      className="flex flex-col sm:flex-row items-center justify-between mt-8 mb-4 gap-4"
      aria-label="Pagination"
    >
      <p className="text-sm text-text-secondary" aria-live="polite">
        Showing <span className="font-semibold text-text">{startItem}</span> to <span className="font-semibold text-text">{endItem}</span> of <span className="font-semibold text-text">{totalItems}</span> results
      </p>
      
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          disabled={!hasPrevPage}
          className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          aria-label="Go to previous page"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        <div className="hidden sm:flex items-center gap-1 mx-2" role="list">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span 
                key={`ellipsis-${index}`} 
                className="w-10 h-10 flex items-center justify-center text-text-secondary"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage 
                    ? 'bg-primary text-white' 
                    : 'text-text hover:bg-gray-100'
                }`}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        {/* Mobile page indicator */}
        <span className="sm:hidden px-4 text-sm text-text-secondary">
          Page <span className="font-semibold text-text">{currentPage}</span> of <span className="font-semibold text-text">{totalPages}</span>
        </span>
        
        <button
          onClick={handleNext}
          disabled={!hasNextPage}
          className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          aria-label="Go to next page"
        >
          Next
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
