import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearStoredAuth, getDashboardPath, getStoredUser, normalizeRole } from "../utils/auth";
import siteLogo from "../assets/medixo logo .jpeg";

function Icon({ name }) {
  const paths = {
    search: <path d="m13.5 13.5-3.1-3.1m1-4.1a5.1 5.1 0 1 1-10.2 0 5.1 5.1 0 0 1 10.2 0Z" />,
    menu: <path d="M3 5h10M3 8h10M3 11h10" />,
    close: <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" />,
    home: <path d="M2.5 7.5 8 3l5.5 4.5V14h-3.2V9.8H5.7V14H2.5V7.5Z" />,
    doctor: <path d="M8 8.3a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Zm-5 6.2c.5-2.8 2.3-4.3 5-4.3s4.5 1.5 5 4.3M8 11.4v2.4m-1.2-1.2h2.4" />,
    hospital: <path d="M3 14V2.5h7V6h3v8M5 5h3M5 8h3M5 11h3m2-2h1.5m-1.5 2h1.5" />,
    calendar: <path d="M4.5 2v2m7-2v2M2.5 5h11m-10 8.5h9A1 1 0 0 0 13.5 12V4A1 1 0 0 0 12.5 3h-9a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1.5Z" />,
    user: <path d="M8 8.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6.3c.5-2.7 2.4-4.2 5-4.2s4.5 1.5 5 4.2H3Z" />,
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

function RoleLinks({ role, onNavigate }) {
  const getClickHandler = (path) => (event) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(path);
  };

  if (role === "doctor") {
    return (
      <>
        <Link to="/doctor-dashboard" onClick={getClickHandler("/doctor-dashboard")}>Home</Link>
        <Link to="/doctor-dashboard" onClick={getClickHandler("/doctor-dashboard")}>My Appointments</Link>
        <Link to="/doctor-dashboard" onClick={getClickHandler("/doctor-dashboard")}>Clinic Details</Link>
        <Link to="/doctor-dashboard" onClick={getClickHandler("/doctor-dashboard")}>Availability</Link>
      </>
    );
  }

  if (role === "super_admin") {
    return (
      <>
        <Link to="/admin-dashboard" onClick={getClickHandler("/admin-dashboard")}>Home</Link>
        <Link to="/admin-dashboard" onClick={getClickHandler("/admin-dashboard")}>Doctors</Link>
        <Link to="/admin-dashboard" onClick={getClickHandler("/admin-dashboard")}>Appointments</Link>
      </>
    );
  }

  if (role === "laboratory") {
    return (
      <>
        <Link to="/laboratory-dashboard" onClick={getClickHandler("/laboratory-dashboard")}>Home</Link>
        <Link to="/laboratory-dashboard" onClick={getClickHandler("/laboratory-dashboard")}>Test Bookings</Link>
        <Link to="/laboratory-dashboard" onClick={getClickHandler("/laboratory-dashboard")}>Reports</Link>
      </>
    );
  }

  if (role === "staff") {
    return (
      <>
        <Link to="/staff-dashboard" onClick={getClickHandler("/staff-dashboard")}>Home</Link>
        <Link to="/staff-dashboard" onClick={getClickHandler("/staff-dashboard")}>Appointments</Link>
        <Link to="/staff-dashboard" onClick={getClickHandler("/staff-dashboard")}>Patients</Link>
      </>
    );
  }

  return (
    <>
      <Link to="/" onClick={getClickHandler("/")}>Home</Link>
      <Link to="/doctors" onClick={getClickHandler("/doctors")}>Doctors</Link>
      <Link to="/#specializations" onClick={getClickHandler("/#specializations")}>Specializations</Link>
      <Link to="/#hospitals" onClick={getClickHandler("/#hospitals")}>Hospitals</Link>
      <Link to="/#lab-tests" onClick={getClickHandler("/#lab-tests")}>Lab Tests</Link>
      <Link to="/#health-packages" onClick={getClickHandler("/#health-packages")}>Health Packages</Link>
    </>
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
  const dashboardPath = user ? getDashboardPath(user.role) : "/login";

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setShowMobileAuthMenu(false);
  };

  useEffect(() => {
    if (typeof document === "undefined" || !showMobileMenu) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMobileMenu]);

  const closeAuthMenu = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setShowAuthMenu(false);
    }
  };

  const handleMobileNav = (path) => {
    closeMobileMenu();
    navigate(path);
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      closeMobileMenu();
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    closeMobileMenu();
    navigate("/");
  };

  const isHashActive = (hash) => location.pathname === "/" && location.hash === hash;

  return (
    <header className="site-header">
      <nav className="main-nav shell" aria-label="Primary navigation">
        <Link to="/" aria-label="Medixo homepage">
          <Logo />
        </Link>

        <div className="nav-links">
          <RoleLinks role={role} />
        </div>

        <div className="nav-actions">
          <button className="icon-button" type="button" aria-label="Search doctors" onClick={() => navigate("/doctors")}>
            <Icon name="search" />
          </button>
          {user ? (
            <>
              <Link to={dashboardPath} className="ghost-button">Dashboard</Link>
              <Link to="/doctors" className="primary-button">Book Appointment</Link>
              <button type="button" className="ghost-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <div className="auth-dropdown" tabIndex={0} onBlur={closeAuthMenu}>
                <button
                  type="button"
                  className="ghost-button auth-dropdown-toggle"
                  onClick={() => setShowAuthMenu((active) => !active)}
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
              <Link to="/doctors" className="primary-button">Book Appointment</Link>
            </>
          )}
        </div>

        <button
          className="mobile-menu"
          type="button"
          aria-label="Open menu"
          aria-expanded={showMobileMenu}
          onClick={() => setShowMobileMenu((active) => !active)}
        >
          <Icon name="menu" />
        </button>

        {showMobileMenu && createPortal(
          <div
            className="mobile-menu-panel open"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
            onClick={handleOverlayClick}
          >
            <div className="mobile-menu-inner">
              <div className="mobile-menu-header">
                <Logo />
                <button type="button" className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
                  <Icon name="close" />
                </button>
              </div>

              <div className="mobile-menu-links">
                <RoleLinks role={role} onNavigate={handleMobileNav} />
              </div>

              <div className="mobile-menu-section">
                <Link to="/doctors" className="mobile-menu-action" onClick={(event) => {
                  event.preventDefault();
                  handleMobileNav("/doctors");
                }}>
                  Book Appointment
                </Link>

                {user ? (
                  <>
                    <Link to={dashboardPath} className="mobile-menu-link" onClick={(event) => {
                      event.preventDefault();
                      handleMobileNav(dashboardPath);
                    }}>
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
                      onClick={() => setShowMobileAuthMenu((active) => !active)}
                      aria-expanded={showMobileAuthMenu}
                    >
                      Login / Sign Up
                    </button>

                    {showMobileAuthMenu && (
                      <div className="mobile-menu-auth-panel">
                        <Link to="/login" className="mobile-menu-link" onClick={(event) => {
                          event.preventDefault();
                          handleMobileNav("/login");
                        }}>
                          Patient Login
                        </Link>
                        <Link to="/doctor-login" className="mobile-menu-link" onClick={(event) => {
                          event.preventDefault();
                          handleMobileNav("/doctor-login");
                        }}>
                          Doctor Login
                        </Link>
                        <Link to="/staff-login" className="mobile-menu-link" onClick={(event) => {
                          event.preventDefault();
                          handleMobileNav("/staff-login");
                        }}>
                          Staff Login
                        </Link>
                        <Link to="/signup" className="mobile-menu-action" onClick={(event) => {
                          event.preventDefault();
                          handleMobileNav("/signup");
                        }}>
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
          <NavLink to="/" end>
            <Icon name="home" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/doctors">
            <Icon name="doctor" />
            <span>Doctors</span>
          </NavLink>
          <Link to="/#hospitals" className={isHashActive("#hospitals") ? "active" : ""}>
            <Icon name="hospital" />
            <span>Hospitals</span>
          </Link>
          <NavLink to={dashboardPath}>
            <Icon name="calendar" />
            <span>Appointments</span>
          </NavLink>
          <NavLink to={dashboardPath}>
            <Icon name="user" />
            <span>Profile</span>
          </NavLink>
        </nav>
      </nav>
    </header>
  );
}
