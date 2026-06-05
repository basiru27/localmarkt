import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, ShoppingBag, Heart, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import PendingSyncBadge from './PendingSyncBadge';
import AvatarImage from './AvatarImage';
import NotificationBell from './NotificationBell';
import SearchInput from './SearchInput';

export default function Header() {
  const { user, profile, signOut, isAuthenticated, isAdmin } = useAuth();
  const { isOnline, canInstall, installApp } = useOffline();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const showSearch = location.pathname === '/';
  const navigate = useNavigate();
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileMenuButtonRef.current?.focus();
        }
        if (dropdownOpen) {
          setDropdownOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, dropdownOpen]);

  // Scroll lock when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [mobileMenuOpen]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const menuElement = mobileMenuRef.current;
    if (!menuElement) return;

    const focusableElements = menuElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    // Focus first element on open
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTabKey);
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setDropdownOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`navbar sticky top-0 z-40 bg-white transition-shadow duration-200 safe-top ${isScrolled ? 'shadow-sm' : ''}`}>
      <div className="container-app w-full">
        <div className="flex items-center justify-between h-full gap-2 lg:gap-4">
          {/* Logo */}
          <div className="flex-1 lg:flex-initial">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="flex flex-col justify-center">
                <span className="font-bold text-2xl tracking-tight leading-none">
                  <span className="text-[#C8622A]">G</span>
                  <span className="text-[#1A1A1A]">Markt</span>
                </span>
                <span className="text-xs text-[#6B6B6B] tracking-wide uppercase font-medium mt-0.5 hidden sm:block">
                  The Gambia's Marketplace
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Search - lg+ only (feed page only) */}
          {showSearch && (
            <div className="hidden lg:block flex-1 max-w-md">
              <SearchInput
                placeholder="Search listings..."
                onSearch={(q) => {
                  if (q) navigate(`/?search=${encodeURIComponent(q)}`);
                  else if (location.pathname === '/') navigate('/');
                }}
                inputClassName="pl-10 pr-10 h-9 bg-gray-100 rounded-full text-sm border border-gray-200 focus:border-[#C8622A] focus:bg-white focus:ring-1 focus:ring-[#C8622A]/20"
              />
            </div>
          )}

          {/* Desktop Navigation - lg+ */}
          <nav className="hidden lg:flex items-center gap-1">
            {!isAuthenticated && (
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.7"/>
                </svg>
                Browse
              </Link>
            )}

            {isAuthenticated && (
              <>
                <Link
                  to="/my-listings"
                  className={`nav-link ${location.pathname.startsWith('/my-listings') ? 'active' : ''}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M8 4V2M16 4V2M3 9h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                  My Listings
                </Link>
              </>
            )}


          </nav>

          {/* Right Section */}
          <div className="flex flex-1 lg:flex-initial items-center justify-end gap-2">
            {/* Status indicators */}
            {!isOnline && (
              <span className="text-gray-400" title="Offline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                  <path d="M8.5 8.5a10 10 0 0 1 11.25 1.5"></path>
                  <path d="M5.5 5.5A15.96 15.96 0 0 0 1 9.5"></path>
                  <path d="M12 12.5a4 4 0 0 1 3.5 1.5"></path>
                  <path d="M9 9a7.96 7.96 0 0 0-4.5 2.5"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </span>
            )}
            
            <PendingSyncBadge />

            {canInstall && (
              <button
                onClick={installApp}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF3E8] text-[#C8622A] text-sm font-medium rounded-lg shadow-sm hover:bg-[#FCE6D3] transition-colors"
                aria-label="Install App"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install App
              </button>
            )}

            {isAuthenticated ? (
              <>
                {/* Post Listing Button - Desktop */}
                <Link
                  to="/listings/new"
                  className="hidden sm:inline-flex items-center gap-2 bg-[#C8622A] hover:bg-[#B5561F] text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                  Post Listing
                </Link>

                <NotificationBell />

                {/* Post Listing Button - Mobile */}
                <Link
                  to="/listings/new"
                  className="sm:hidden flex items-center justify-center bg-[#C8622A] text-white w-[44px] h-[44px] rounded-xl shadow-sm active:scale-95 transition-all duration-200"
                  aria-label="Post Listing"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </Link>

                {/* User Dropdown */}
                <div className="relative hidden md:block">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] justify-center sm:justify-start"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <AvatarImage 
                      src={profile?.avatar_url} 
                      name={profile?.display_name || user?.user_metadata?.display_name || user?.email}
                      size="sm"
                      className="ring-2 ring-[#E8A838]"
                    />
                    <span className="hidden md:block truncate max-w-[100px]" style={{ fontSize: '13px', fontWeight: 500, color: '#0a1f17' }}>
                      {profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                    </span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" stroke="#4a7060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setDropdownOpen(false)}
                        aria-hidden="true"
                      />
                      <div 
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-border-light py-2 z-20 animate-fade-in-down"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="px-4 py-2 border-b border-border-light">
                          <p className="text-sm font-semibold text-text truncate">
                            {profile?.display_name || user?.user_metadata?.display_name || 'User'}
                          </p>
                          <p className="text-xs text-text-muted truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-gray-50 hover:text-text transition-colors min-h-[44px]"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </Link>
                        <Link
                          to="/my-listings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-gray-50 hover:text-text transition-colors min-h-[44px]"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          My Listings
                        </Link>
                        <Link
                          to="/saved"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-gray-50 hover:text-text transition-colors min-h-[44px]"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Saved Listings
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-gray-50 hover:text-text transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Admin Console
                          </Link>
                        )}

                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
                          role="menuitem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="btn-ghost hidden sm:inline-flex"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              ref={mobileMenuButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-text"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/20"
              aria-hidden="true"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav
              id="mobile-menu"
              ref={mobileMenuRef}
              className="md:hidden fixed inset-y-0 right-0 z-50 w-[280px] bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-slide-in-right"
              aria-label="Mobile navigation"
            >
              {/* Drawer Header: Avatar + Name */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <AvatarImage 
                      src={profile?.avatar_url} 
                      name={profile?.display_name || user?.user_metadata?.display_name || user?.email}
                      size="md"
                      className="ring-2 ring-[#E8A838]"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 truncate max-w-[180px]">
                        {profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                      </span>
                      <span className="text-xs text-gray-500 truncate max-w-[180px]">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5EFE8] flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-900">Guest User</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 overflow-y-auto py-2">
                {canInstall && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      installApp();
                    }}
                    className="flex items-center gap-3 px-4 h-12 text-primary hover:bg-primary-50 font-medium text-left"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install App
                  </button>
                )}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 h-12 ${isActive('/') ? 'bg-primary-50 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-50'}`}
                >
                  <Home size={20} />
                  Browse Listings
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/my-listings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 h-12 ${isActive('/my-listings') ? 'bg-primary-50 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-50'}`}
                    >
                      <ShoppingBag size={20} />
                      My Listings
                    </Link>
                    <Link
                      to="/saved"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 h-12 ${isActive('/saved') ? 'bg-primary-50 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-50'}`}
                    >
                      <Heart size={20} />
                      Saved Listings
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 h-12 ${isActive('/profile') ? 'bg-primary-50 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-50'}`}
                    >
                      <User size={20} />
                      My Profile
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 h-12 ${location.pathname.startsWith('/admin') ? 'bg-primary-50 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-50'}`}
                  >
                    <Settings size={20} />
                    Admin Console
                  </Link>
                )}

                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 px-4 h-12 mt-auto mb-4 border-t border-gray-100 pt-4 text-red-600 hover:bg-red-50 font-medium text-left w-full"
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                ) : (
                  <div className="mt-auto mb-4 border-t border-gray-100 pt-4 px-4 flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-ghost justify-center w-full"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary justify-center w-full"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
