import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Zap } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "WORKFLOWS", icon: LayoutGrid },
  { to: "/executions", label: "EXECUTIONS", icon: Zap },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="app-sidebar">
      {/* Branding */}
      <div className="app-sidebar__brand">
        <Link to="/dashboard" className="app-sidebar__logo-link">
          <span className="app-sidebar__chevron">≫</span>
          <span className="app-sidebar__title">TRADINGFLOW</span>
        </Link>
        <span className="app-sidebar__version">v0.1.0 // OPERATIONAL</span>
      </div>

      {/* Navigation */}
      <nav className="app-sidebar__nav">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || 
            (to === "/dashboard" && (location.pathname === "/dashboard" || location.pathname.startsWith("/workflows") || location.pathname === "/create-workflow"));
          return (
            <Link
              key={to}
              to={to}
              className={`app-sidebar__nav-item ${isActive ? "app-sidebar__nav-item--active" : ""}`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
