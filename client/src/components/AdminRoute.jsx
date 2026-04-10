import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children, requireSuperAdmin = false }) {
  const { isAuthenticated, isAdmin, isSuperAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading access control">
        <div className="spinner spinner-lg" aria-hidden="true" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
