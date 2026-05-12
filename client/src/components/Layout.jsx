import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import OfflineBanner from './OfflineBanner';

function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ backgroundColor: '#0B6E4F' }}
      aria-label="Back to top"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a 
        href="#main-content" 
        className="absolute -left-[9999px] focus:fixed focus:left-2 focus:top-2 focus:z-[9999] focus:bg-white focus:border focus:border-primary focus:p-2 focus:text-[14px] focus:outline-none"
      >
        Skip to main content
      </a>
      <OfflineBanner />
      <Header />
      <main id="main-content" className="flex-1" tabIndex="-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
