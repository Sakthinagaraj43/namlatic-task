import { Link, NavLink, Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand-wordmark">
            Vespera Stays
          </Link>

          <nav className="header-nav" aria-label="Main navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Directory
            </NavLink>
            <NavLink
              to="/hotels/add"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Add Property
            </NavLink>
          </nav>

          <div className="header-actions">
            <Link to="/hotels/add" className="btn btn-primary btn-sm">
              <Plus size={16} aria-hidden="true" />
              <span>Add Hotel</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>&copy; {new Date().getFullYear()} Vespera Stays</span>
          <span>Architectural &amp; Boutique Hotel Directory</span>
        </div>
      </footer>
    </div>
  );
}
