import { Link } from "react-router-dom";

function Icon({ name }) {
  const paths = {
    phone: (
      <path d="M7.3 2.8 9 6.6 7.5 8.1c.8 1.6 2 2.8 3.6 3.6l1.5-1.5 3.8 1.7-.7 3.2c-.1.6-.7 1-1.3 1A12.5 12.5 0 0 1 1.9 3.6c0-.6.4-1.1 1-1.3l3.2-.7 1.2 1.2Z" fill="currentColor" />
    ),
    mail: (
      <path d="M2.5 4.5h13v9h-13v-9Zm.5.5 6 4.7L15 5" fill="none" stroke="currentColor" strokeWidth="1" />
    ),
  };

  return (
    <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" style={{display: 'inline', marginRight: '8px'}}>
      {paths[name]}
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div>
            <h3>Contact Us</h3>
            <div className="site-footer-stack">
              <div className="site-footer-contact-row">
                <Icon name="phone" />
                <span>+91 98765 43210</span>
              </div>
              <div className="site-footer-contact-row">
                <Icon name="mail" />
                <span>support@medixo.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3>Quick Links</h3>
            <div className="site-footer-stack">
              <Link to="/">Home</Link>
              <Link to="/#doctors">Doctors</Link>
              <Link to="/#specializations">Specializations</Link>
              <Link to="/#hospitals">Hospitals</Link>
            </div>
          </div>

          <div>
            <h3>Company</h3>
            <div className="site-footer-stack">
              <Link to="/#about">About Us</Link>
              <a href="/#privacy">Privacy Policy</a>
              <a href="/#terms">Terms & Conditions</a>
              <Link to="/#contact">Contact</Link>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>&copy; 2024 Medixo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
