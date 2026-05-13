import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    status: 'ACTIVE',
    version: '2.4.1',
    user: 'User1',
    expiry: 'Lifetime',
    hwid: 'HWID-9928-8812-7721'
  });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = () => {
        const key = localStorage.getItem('prestige_key');
        if (!key) return;

        fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_state', key })
        })
        .then(res => res.json())
        .then(data => {
            setActivity(data.recentActivity || []);
            setStats({
                status: data.status,
                version: '2.4.1',
                user: data.username,
                expiry: data.expires,
                hwid: data.hwid || 'NOT_LINKED'
            });
            setLoading(false);
        });
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard | Prestige</title>
      </Head>

      <div className="animate-fade" style={{ padding: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '50px' }}>
          {[
            { label: 'STATUS', value: stats.status, color: '#00FF7F' },
            { label: 'VERSION', value: stats.version, color: 'white' },
            { label: 'EXPIRY', value: stats.expiry, color: 'white' },
            { label: 'HARDWARE', value: stats.hwid.split('-')[0] + '...', color: 'white' }
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: '30px', textAlign: 'center', background: '#0E0E12', border: 'none' }}>
              <p style={{ fontSize: '11px', fontWeight: '900', color: '#1A1A24', letterSpacing: '2px', marginBottom: '15px' }}>{stat.label}</p>
              <p style={{ fontSize: '18px', fontWeight: '900', color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '40px', background: '#0E0E12', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #121218', paddingBottom: '20px' }}>
            <h3 className="mono" style={{ fontSize: '18px', fontWeight: '900' }}>RECENT ACTIVITY</h3>
            <span style={{ fontSize: '11px', color: '#1A1A24', fontWeight: '900' }}>REAL-TIME LOGS</span>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {activity.map((item, idx) => (
              <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: idx === activity.length - 1 ? 'none' : '1px solid #121218' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '4px', boxShadow: '0 0 8px var(--accent)' }}></div>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{item.action}</p>
                        <p style={{ fontSize: '11px', color: '#1A1A24', fontWeight: '700' }}>{item.details}</p>
                    </div>
                </div>
                <span className="mono" style={{ fontSize: '12px', color: '#323245' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
