import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, initializing } = useAuth();
  const location = useLocation();

  if (initializing || loading) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading authentication status"
      >
        <span style={{ fontWeight: 800, fontSize: '2rem' }}>
          <span style={{ color: '#C8622A' }}>G</span>Markt
        </span>
        <div className="w-10 h-10 rounded-full border-4 border-[#C8622A] border-t-transparent animate-spin" aria-hidden="true" />
        <p className="text-[#6B6B6B] text-sm">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
