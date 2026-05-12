import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Head>
        <title>Prestige | Login</title>
      </Head>

      {/* Background Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        opacity: 0.3
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        opacity: 0.2
      }} />

      <div className="glass-card animate-fade" style={{ 
        width: '450px', 
        padding: '60px 40px', 
        textAlign: 'center',
        zIndex: 10
      }}>
        <img src="/logo.png" style={{ width: '64px', marginBottom: '30px' }} alt="Logo" />
        <h2 className="mono" style={{ fontSize: '28px', marginBottom: '10px', letterSpacing: '3px' }}>PRESTIGE</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '40px' }}>Enter your license key to continue.</p>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="password" 
              placeholder="PRS-XXXX-XXXX-XXXX" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="mono"
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '16px 20px',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                transition: '0.3s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <button 
            type="submit" 
            className="pill-button" 
            style={{ width: '100%', padding: '16px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'VERIFYING...' : 'AUTHENTICATE'}
          </button>
        </form>

        <div style={{ marginTop: '30px', fontSize: '12px', color: 'var(--text-dim)' }}>
          Don't have a key? <a href="#" style={{ color: 'var(--accent)', fontWeight: '600' }}>Purchase Access</a>
        </div>
      </div>
    </div>
  );
}

// Disable global layout for login page
Login.getLayout = function getLayout(page) {
  return page;
}
