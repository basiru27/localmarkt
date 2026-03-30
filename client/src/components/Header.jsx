import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import PendingSyncBadge from './PendingSyncBadge';

export default function Header() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { isOnline } = useOffline();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-40 shadow-md">
      <div className="container-app">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold">GamMarket</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-4">
            {!isOnline && (
              <span className="text-xs bg-yellow-500 px-2 py-1 rounded">Offline</span>
            )}
            
            <PendingSyncBadge />

            {isAuthenticated ? (
              <>
                <Link
                  to="/listings/new"
                  className="hidden sm:inline-flex btn bg-white text-primary hover:bg-gray-100 text-sm py-1.5"
                >
                  Post Listing
                </Link>
                <Link
                  to="/listings/new"
                  className="sm:hidden text-2xl leading-none"
                  aria-label="Post Listing"
                >
                  +
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-1 text-sm">
                    <span className="hidden sm:inline">{user?.email?.split('@')[0]}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 hidden group-hover:block">
                    <Link
                      to="/my-listings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Listings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm hover:underline">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn bg-white text-primary hover:bg-gray-100 text-sm py-1.5"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
