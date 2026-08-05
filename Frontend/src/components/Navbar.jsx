import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { clearStoredAuth, getDashboardPath, getStoredUser, normalizeRole } from "../utils/auth";
import siteLogo from "../assets/medixo logo .jpeg";

function Icon({ name }) {
  const paths = {
    phone: (
      <path d="M7.3 2.8 9 6.6 7.5 8.1c.8 1.6 2 2.8 3.6 3.6l1.5-1.5 3.8 1.7-.7 3.2c-.1.6-.7 1-1.3 1A12.5 12.5 0 0 1 1.9 3.6c0-.6.4-1.1 1-1.3l3.2-.7 1.2 1.2Z" />
    ),
    mail: (
      <path d="M2.5 4.5h13v9h-13v-9Zm.5.5 6 4.7L15 5" />
    ),
    app: (
      <path d="M5 2.5h6A1.5 1.5 0 0 1 12.5 4v10A1.5 1.5 0 0 1 11 15.5H5A1.5 1.5 0 0 1 3.5 14V4A1.5 1.5 0 0 1 5 2.5Zm2 11h2" />
    ),
    order: (
      <path d="M4 3h8l2 2v10H4V3Zm8 0v3h3M6.5 8h5M6.5 11h5" />
    ),
    help: (
      <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-3.2v-.1m-2-5a2 2 0 1 1 3.2 1.6c-.8.6-1.2.9-1.2 1.7" />
    ),
    search: (
      <path d="m13.5 13.5-3.1-3.1m1-4.1a5.1 5.1 0 1 1-10.2 0 5.1 5.1 0 0 1 10.2 0Z" />
    ),
    menu: (
      <path d="M3 5h10M3 8h10M3 11h10" />
    ),
  };

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Logo() {
  return (
    <span className="brand">
      <img src={siteLogo} alt="Medixo logo" className="brand-logo" />
      <span>
        Medi
        <span className="brand-x">x</span>
        <span className="brand-o">o</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileAuthMenu, setShowMobileAuthMenu] = useState(false);
  const role = normalizeRole(user?.role);

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const toggleAuthMenu = () => setShowAuthMenu((active) => !active);
  const closeAuthMenu = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setShowAuthMenu(false);
    }
  };

  const toggleMobileMenu = () => setShowMobileMenu((active) => !active);
  const toggleMobileAuthMenu = () => setShowMobileAuthMenu((active) => !active);
  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setShowMobileAuthMenu(false);
  };
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      closeMobileMenu();
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    setShowMobileMenu(false);
    navigate("/");
  };

  return (
    <header className="site-header">
      <nav className="main-nav shell" aria-label="Primary navigation">
        <Link to="/" aria-label="Medixo homepage">
          <Logo />
        </Link>

        <div className="nav-links">
          {role === "doctor" ? (
            <>
              <Link to="/doctor-dashboard">Home</Link>
              <Link to="/doctor-dashboard">My Appointments</Link>
              <Link to="/doctor-dashboard">Clinic Details</Link>
              <Link to="/doctor-dashboard">Availability</Link>
            </>
          ) : role === "super_admin" ? (
            <>
              <Link to="/admin-dashboard">Home</Link>
              <Link to="/admin-dashboard">Doctors</Link>
              <Link to="/admin-dashboard">Appointments</Link>
            </>
          ) : role === "laboratory" ? (
            <>
              <Link to="/laboratory-dashboard">Home</Link>
              <Link to="/laboratory-dashboard">Test Bookings</Link>
              <Link to="/laboratory-dashboard">Reports</Link>
            </>
          ) : role === "staff" ? (
            <>
              <Link to="/staff-dashboard">Home</Link>
              <Link to="/staff-dashboard">Appointments</Link>
              <Link to="/staff-dashboard">Patients</Link>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/doctors">Doctors</Link>
              <Link to="/#specializations">Specializations</Link>
              <Link to="/#hospitals">Hospitals</Link>
              <Link to="/#lab-tests">Lab Tests</Link>
              <Link to="/#health-packages">Health Packages</Link>
            </>
          )}
        </div>

        <div className="nav-actions">
          <button className="icon-button" aria-label="Search">
            <Icon name="search" />
          </button>
          {user ? (
            <>
              <Link to={getDashboardPath(user.role)} className="ghost-button">Dashboard</Link>
              <button type="button" className="primary-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <div className="auth-dropdown" tabIndex={0} onBlur={closeAuthMenu}>
              <button
                type="button"
                className="ghost-button auth-dropdown-toggle"
                onClick={toggleAuthMenu}
                aria-expanded={showAuthMenu}
                aria-haspopup="menu"
              >
                Login / Sign Up
              </button>

              {showAuthMenu && (
                <div className="auth-dropdown-panel" role="menu">
                  <Link to="/login" className="auth-dropdown-item" role="menuitem" onClick={() => setShowAuthMenu(false)}>
                    Patient Login
                  </Link>
                  <Link to="/doctor-login" className="auth-dropdown-item" role="menuitem" onClick={() => setShowAuthMenu(false)}>
                    Doctor Login
                  </Link>
                  <Link to="/staff-login" className="auth-dropdown-item" role="menuitem" onClick={() => setShowAuthMenu(false)}>
                    Staff Login
                  </Link>
                  <Link to="/signup" className="primary-button auth-dropdown-item auth-dropdown-action" role="menuitem" onClick={() => setShowAuthMenu(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="mobile-menu" aria-label="Open menu" aria-expanded={showMobileMenu} onClick={toggleMobileMenu}>
          <Icon name="menu" />
        </button>

        {showMobileMenu && (
          <div className="mobile-menu-panel open" role="dialog" aria-modal="true" aria-label="Mobile menu" onClick={handleOverlayClick}>
            <div className="mobile-menu-inner">
              <div className="mobile-menu-header">
                <span className="mobile-menu-title">Menu</span>
                <button type="button" className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
                  ×
                </button>
              </div>

              <div className="mobile-menu-links">
                {role === "doctor" ? (
                  <>
                    <Link to="/doctor-dashboard" onClick={closeMobileMenu}>Home</Link>
                    <Link to="/doctor-dashboard" onClick={closeMobileMenu}>My Appointments</Link>
                    <Link to="/doctor-dashboard" onClick={closeMobileMenu}>Clinic Details</Link>
                    <Link to="/doctor-dashboard" onClick={closeMobileMenu}>Availability</Link>
                  </>
                ) : role === "super_admin" ? (
                  <>
                    <Link to="/admin-dashboard" onClick={closeMobileMenu}>Home</Link>
                    <Link to="/admin-dashboard" onClick={closeMobileMenu}>Doctors</Link>
                    <Link to="/admin-dashboard" onClick={closeMobileMenu}>Appointments</Link>
                  </>
                ) : role === "laboratory" ? (
                  <>
                    <Link to="/laboratory-dashboard" onClick={closeMobileMenu}>Home</Link>
                    <Link to="/laboratory-dashboard" onClick={closeMobileMenu}>Test Bookings</Link>
                    <Link to="/laboratory-dashboard" onClick={closeMobileMenu}>Reports</Link>
                  </>
                ) : role === "staff" ? (
                  <>
                    <Link to="/staff-dashboard" onClick={closeMobileMenu}>Home</Link>
                    <Link to="/staff-dashboard" onClick={closeMobileMenu}>Appointments</Link>
                    <Link to="/staff-dashboard" onClick={closeMobileMenu}>Patients</Link>
                  </>
                ) : (
                  <>
                    <Link to="/" onClick={closeMobileMenu}>Home</Link>
                    <Link to="/doctors" onClick={closeMobileMenu}>Doctors</Link>
                    <Link to="/#specializations" onClick={closeMobileMenu}>Specializations</Link>
                    <Link to="/#hospitals" onClick={closeMobileMenu}>Hospitals</Link>
                    <Link to="/#lab-tests" onClick={closeMobileMenu}>Lab Tests</Link>
                    <Link to="/#health-packages" onClick={closeMobileMenu}>Health Packages</Link>
                  </>
                )}
              </div>

              <div className="mobile-menu-section">
                {user ? (
                  <>
                    <Link to={getDashboardPath(user.role)} className="mobile-menu-link" onClick={closeMobileMenu}>
                      Dashboard
                    </Link>
                    <button type="button" className="mobile-menu-action mobile-menu-logout" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="mobile-menu-auth-toggle"
                      onClick={toggleMobileAuthMenu}
                      aria-expanded={showMobileAuthMenu}
                    >
                      Login / Sign Up
                    </button>

                    {showMobileAuthMenu && (
                      <div className="mobile-menu-auth-panel">
                        <Link to="/login" className="mobile-menu-link" onClick={closeMobileMenu}>
                          Patient Login
                        </Link>
                        <Link to="/doctor-login" className="mobile-menu-link" onClick={closeMobileMenu}>
                          Doctor Login
                        </Link>
                        <Link to="/staff-login" className="mobile-menu-link" onClick={closeMobileMenu}>
                          Staff Login
                        </Link>
                        <Link to="/signup" className="mobile-menu-action" onClick={closeMobileMenu}>
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
