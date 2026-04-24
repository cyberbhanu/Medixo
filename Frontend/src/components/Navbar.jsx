import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { clearStoredAuth, getDashboardPath, getStoredUser } from "../utils/auth";

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
    cart: (
      <path d="M2 3h2l1.2 8h7.6l1-5.5H5.1M6.6 14.5h.1m5 0h.1" />
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
      <svg viewBox="0 0 42 34" aria-hidden="true" className="brand-mark">
        <path d="M5 29V6l10 8 10-8v23h-7V18l-3 2.4L12 18v11H5Z" fill="#0f7bf5" />
        <path d="M25 6v23h7V6h-7Z" fill="#01b9f2" />
        <path d="M9.5 20h4v-4h4v4h4v4h-4v4h-4v-4h-4v-4Z" fill="#ff4456" />
      </svg>
      <span>Medi<span>xo</span></span>
    </span>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    navigate("/");
  };

  return (
    <header className="site-header">
      <nav className="main-nav shell" aria-label="Primary navigation">
        <Link to="/" aria-label="Medixo home">
          <Logo />
        </Link>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/#doctors">Doctors</a>
          <a href="/#specializations">Specializations</a>
          <a href="/#hospitals">Hospitals</a>
          <a href="/#lab-tests">Lab Tests</a>
          <a href="/#health-packages">Health Packages</a>
          <a href="/#pages">Pages</a>
        </div>

        <div className="nav-actions">
          <button className="icon-button" aria-label="Search">
            <Icon name="search" />
          </button>
          <button className="icon-button cart-button" aria-label="Cart">
            <Icon name="cart" />
            <span>2</span>
          </button>
          {user ? (
            <>
              <Link to={getDashboardPath(user.role)} className="ghost-button">Dashboard</Link>
              <button type="button" className="primary-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="ghost-button">Login</Link>
              <Link to="/signup" className="primary-button">Sign Up</Link>
            </>
          )}
        </div>

        <button className="mobile-menu" aria-label="Open menu">
          <Icon name="menu" />
        </button>
      </nav>
    </header>
  );
}
