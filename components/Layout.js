import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Layout = ({ children }) => {
  const router = useRouter();

  const navItems = [
    { 
      name: 'DASHBOARD', 
      path: '/', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      )
    },
    { 
      name: 'CLOUD CONFIGS', 
      path: '/cloud', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a3.5 3.5 0 0 0 0-7h-1.5a7 7 0 1 0-11.76 5.16"/></svg>
      )
    },
    { 
      name: 'MOBILE CONNECT', 
      path: '/mobile', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
      )
    },
    { 
      name: 'KEY MANAGEMENT', 
      path: '/dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M7 21v-2a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2"/><path d="M15 8h.01"/><path d="M10 8h.01"/></svg>
      )
    },
  ];

  const [user, setUser] = React.useState('OWNER_MODE');

  React.useEffect(() => {
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_state', key: 'PRS-9921-X882-K001' })
    })
    .then(res => res.json())
    .then(data => setUser(data.username || 'OWNER_MODE'));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D10', color: 'white' }}>
      {/* SIDEBAR (Hardened Prestige Style) */}
      <aside style={{
        width: '280px',
        background: '#0E0E12',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        zIndex: 100
      }}>
        {/* LOGO AREA */}
        <div style={{ padding: '60px 30px 40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="Logo" />
          <span className="mono" style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '3px', color: 'white' }}>PRESTIGE</span>
        </div>

        {/* NAVIGATION */}
        <nav style={{ flex: 1, padding: '20px' }}>
          <div style={{ color: '#333338', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginBottom: '30px', paddingLeft: '15px' }}>MANAGEMENT</div>
          {navItems.map((item) => {
            const isActive = router.pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '18px 20px',
                borderRadius: '0 12px 12px 0',
                marginBottom: '10px',
                transition: 'var(--transition-fast)',
                textDecoration: 'none',
                height: '60px' // Standardized size
              }}>
                <div style={{ 
                  color: isActive ? 'var(--accent)' : '#505058', 
                  filter: isActive ? 'drop-shadow(0 0 8px var(--accent))' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  transition: '0.3s'
                }}>
                  {item.icon}
                </div>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: '800', 
                  color: isActive ? 'white' : '#505058',
                  letterSpacing: '1px'
                }}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE */}
        <div style={{ padding: '40px 30px', background: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid #121218' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo.png" style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt="Profile Logo" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap', color: 'white' }}>{user.toUpperCase()}</div>
              <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px' }}>ADMINISTRATOR</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft: '280px', flex: 1, padding: '60px' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
