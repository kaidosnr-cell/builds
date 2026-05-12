import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 60px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(13, 13, 16, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--accent)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '900',
          fontSize: '18px',
          color: 'white'
        }}>P</div>
        <span className="mono" style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '2px' }}>PRESTIGE</span>
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
        <Link href="/" style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500', transition: '0.3s' }} 
              onMouseOver={e => e.target.style.color = 'white'} 
              onMouseOut={e => e.target.style.color = 'var(--text-dim)'}>FEATURES</Link>
        <Link href="/cloud" style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500', transition: '0.3s' }}
              onMouseOver={e => e.target.style.color = 'white'} 
              onMouseOut={e => e.target.style.color = 'var(--text-dim)'}>CLOUD CONFIGS</Link>
        <Link href="/mobile" style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500', transition: '0.3s' }}
              onMouseOver={e => e.target.style.color = 'white'} 
              onMouseOut={e => e.target.style.color = 'var(--text-dim)'}>MOBILE</Link>
        <Link href="/dashboard" className="pill-button" style={{ padding: '10px 24px' }}>DASHBOARD</Link>
      </div>
    </nav>
  );
};

export default Navbar;
