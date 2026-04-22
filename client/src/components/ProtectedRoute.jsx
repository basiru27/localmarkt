import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading authentication status"
      >
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 rounded-full border-4 border-primary-50 animate-pulse" aria-hidden="true" />
          {/* Spinner */}
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" aria-hidden="true" />
          {/* Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0B6E4F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M3 6l2 13h14L21 6M3 6l1.5-3h15L21 6" stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="9" cy="21" r="1" fill="#ffffff"/>
                <circle cx="15" cy="21" r="1" fill="#ffffff"/>
                <path d="M9 10v5M12 9v6M15 10v5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
        <p className="text-text-secondary text-sm">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
