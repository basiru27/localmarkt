import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-app py-12 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-text mb-2">Page Not Found</h2>
      <p className="text-text-secondary mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">
        Go to Home
      </Link>
    </div>
  );
}
