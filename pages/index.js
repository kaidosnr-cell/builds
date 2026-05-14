import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
  const [user, setUser] = useState('PRESTIGE_USER');
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState({ configs: 0, expires: 'Lifetime' });

  useEffect(() => {
    const key = localStorage.getItem('prestige_key');
    if (!key) return;

    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_state', key: key })
    })
    .then(res => res.json())
    .then(data => {
        setUser(data.username || 'PRESTIGE USER');
        setActivity(data.recentActivity || []);
        setStats({
            configs: data.configs?.length || 0,
            expires: data.expires || 'Lifetime',
            hwid: data.hwid || null
        });
    });
  }, []);

  return (
    <div className="animate-fade">
      <Head>
        <title>Prestige | Dashboard</title>
      </Head>

      <div style={{ marginBottom: '50px' }}>
        <h1 className="mono" style={{ fontSize: '32px', marginBottom: '10px', fontWeight: '900' }}>WELCOME, <span className="prestige-gradient">{user.toUpperCase()}</span></h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '600' }}>Your unified game enhancement hub is ready.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '50px' }}>
        <div className="glass-card" style={{ padding: '40px', border: 'none' }}>
          <div style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 10px var(--accent))', marginBottom: '20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
          </div>
          <h4 style={{ fontSize: '11px', color: '#333338', fontWeight: '900', marginBottom: '8px', letterSpacing: '2px' }}>SUBSCRIPTION</h4>
          <p style={{ fontSize: '20px', fontWeight: '900' }}>{stats.expires}</p>
        </div>
        <div className="glass-card" style={{ padding: '40px', border: 'none' }}>
          <div style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 10px var(--accent))', marginBottom: '20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a3.5 3.5 0 0 0 0-7h-1.5a7 7 0 1 0-11.76 5.16"/></svg>
          </div>
          <h4 style={{ fontSize: '11px', color: '#333338', fontWeight: '900', marginBottom: '8px', letterSpacing: '2px' }}>SAVED CONFIGS</h4>
          <p style={{ fontSize: '20px', fontWeight: '900' }}>{stats.configs} Active</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
          borderRadius: '16px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 10px 30px -10px var(--accent-glow)'
        }}>
          <h4 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '900', marginBottom: '8px', letterSpacing: '2px' }}>HARDWARE LINK</h4>
          <p style={{ fontSize: '18px', fontWeight: '900' }}>{stats.hwid ? 'ALREADY SET' : 'NOT LINKED'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        <div className="glass-card" style={{ padding: '45px', border: 'none' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '35px', fontWeight: '900' }}>Recent Activity</h3>
          <div style={{ display: 'grid', gap: '25px' }}>
            {activity.slice(0, 3).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '5px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{item.action}: {item.details}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>{item.time}</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#2ECC71', fontWeight: '900', letterSpacing: '1px' }}>SUCCESS</span>
              </div>
            ))}
            {activity.length === 0 && <p style={{ color: '#323245', fontSize: '12px' }}>No recent activity found.</p>}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '45px', border: 'none' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '35px', fontWeight: '900' }}>System Status</h3>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.015)', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', marginBottom: '8px', letterSpacing: '1.5px' }}>ROBLOX ENGINE</div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Undetected & Stable</p>
            </div>
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.015)', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', marginBottom: '8px', letterSpacing: '1.5px' }}>FIVEM ENGINE</div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Undetected & Stable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
