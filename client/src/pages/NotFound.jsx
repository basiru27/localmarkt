import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4">
      <div className="text-center animate-fade-in">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[150px] sm:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-cyan-500 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-3">
          Page Not Found
        </h1>
        <p className="text-text-secondary mb-8 max-w-md mx-auto leading-relaxed">
          Oops! The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary px-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Home
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="btn-secondary px-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-text-muted mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/" className="text-primary hover:text-primary-dark font-medium transition-colors">
              Browse Listings
            </Link>
            <span className="text-border">|</span>
            <Link to="/listings/new" className="text-primary hover:text-primary-dark font-medium transition-colors">
              Post a Listing
            </Link>
            <span className="text-border">|</span>
            <Link to="/login" className="text-primary hover:text-primary-dark font-medium transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
