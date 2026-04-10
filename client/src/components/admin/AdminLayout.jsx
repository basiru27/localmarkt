import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/listings', label: 'Listings' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/logs', label: 'Audit Logs', superAdminOnly: true },
];

export default function AdminLayout() {
  const { profile, isSuperAdmin } = useAuth();

  return (
    <div className="container-app py-5 sm:py-6">
      <div className="mb-5">
        <Link to="/" className="text-sm text-text-secondary hover:text-primary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5">
        <aside className="card-static p-4 h-fit">
          <div className="mb-4 pb-4 border-b border-border-light">
            <h1 className="text-lg font-bold text-text">Admin Console</h1>
            <p className="text-sm text-text-secondary mt-1">
              {profile?.display_name || 'Administrator'}
            </p>
            <p className="text-xs text-text-muted uppercase tracking-wide mt-1">{profile?.role || 'admin'}</p>
          </div>

          <nav className="space-y-1" aria-label="Admin navigation">
            {navItems
              .filter((item) => !item.superAdminOnly || isSuperAdmin)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary font-semibold'
                        : 'text-text-secondary hover:bg-gray-50 hover:text-text'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
