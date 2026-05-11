import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import OfflineBanner from './OfflineBanner';

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
    </div>
  );
}
