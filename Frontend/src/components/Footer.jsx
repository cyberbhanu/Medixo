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
  const footerStyle = {
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '48px 16px',
    marginTop: '64px',
  };

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
    marginBottom: '32px',
  };

  const sectionStyle = {
    marginBottom: '0',
  };

  const headingStyle = {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
  };

  const linkStyle = {
    display: 'block',
    marginBottom: '8px',
    color: 'white',
    textDecoration: 'none',
    cursor: 'pointer',
  };

  const borderTopStyle = {
    borderTop: '1px solid #374151',
    paddingTop: '32px',
  };

  const copyrightStyle = {
    textAlign: 'center',
    color: '#9ca3af',
  };

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <div style={gridStyle}>
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Contact Us</h3>
            <div>
              <div style={{marginBottom: '12px'}}>
                <Icon name="phone" />
                <span>+91 98765 43210</span>
              </div>
              <div>
                <Icon name="mail" />
                <span>support@medixo.com</span>
              </div>
            </div>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Quick Links</h3>
            <div>
              <a href="/" style={linkStyle}>Home</a>
              <a href="#doctors" style={linkStyle}>Doctors</a>
              <a href="#specializations" style={linkStyle}>Specializations</a>
              <a href="#hospitals" style={linkStyle}>Hospitals</a>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={headingStyle}>Company</h3>
            <div>
              <a href="#about" style={linkStyle}>About Us</a>
              <a href="#privacy" style={linkStyle}>Privacy Policy</a>
              <a href="#terms" style={linkStyle}>Terms & Conditions</a>
              <a href="#contact" style={linkStyle}>Contact</a>
            </div>
          </div>
        </div>

        <div style={borderTopStyle}>
          <p style={copyrightStyle}>&copy; 2024 Medixo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
