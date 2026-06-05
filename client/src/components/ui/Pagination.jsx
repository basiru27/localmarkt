export default function Pagination({ pagination, onPageChange }) {
  if (!pagination) return null;

  const currentPage = Number(pagination.page) || 1;
  const itemsPerPage = Number(pagination.limit) || 20;
  const totalItems = Number(pagination.total) || 0;
  const totalPages = Number(pagination.totalPages) || 0;
  
  if (totalPages <= 1 && totalItems === 0) return null;
  if (totalPages <= 1) return null;

  const hasNextPage = Boolean(pagination.hasNextPage);
  const hasPrevPage = Boolean(pagination.hasPrevPage);

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
        {/* Desktop: Previous button with text */}
        <button
          onClick={handlePrev}
          disabled={!hasPrevPage}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed hidden sm:inline-flex items-center"
           aria-label="Go to previous page"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {/* Mobile: Previous icon-only */}
        <button
          onClick={handlePrev}
          disabled={!hasPrevPage}
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-text-secondary hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
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
        <span className="sm:hidden px-4 text-sm text-text-secondary font-medium">
          <span className="font-semibold text-text">{currentPage}</span> / <span className="font-semibold text-text">{totalPages}</span>
        </span>
        
        {/* Mobile: Next icon-only */}
        <button
          onClick={handleNext}
          disabled={!hasNextPage}
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-text-secondary hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Desktop: Next button with text */}
        <button
          onClick={handleNext}
          disabled={!hasNextPage}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed hidden sm:inline-flex items-center"
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
