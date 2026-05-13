import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function CloudConfigs() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_state', key: localStorage.getItem('prestige_key') })
    })
    .then(res => res.json())
    .then(data => {
        setConfigs(data.configs || []);
        setLoading(false);
    });
  }, []);

  const handleDelete = (id) => {
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_config', key: localStorage.getItem('prestige_key'), payload: { id } })
    })
    .then(res => res.json())
    .then(data => setConfigs(data.configs));
  };

  const handleSetDefault = (id) => {
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_default_config', key: localStorage.getItem('prestige_key'), payload: { id } })
    })
    .then(res => res.json())
    .then(data => setConfigs(data.configs));
  };

  return (
    <div className="animate-fade" style={{ background: '#0D0D10', minHeight: '100vh', padding: '60px' }}>
      <Head>
        <title>Cloud Configs | Prestige</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
        <div>
          <h2 className="mono" style={{ fontSize: '32px', marginBottom: '10px', fontWeight: '900' }}>CLOUD CONFIGS</h2>
          <p style={{ color: '#323245', fontSize: '14px', fontWeight: '600' }}>Configurations are managed via the loader. Changes here reflect instantly.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {configs.map(cfg => (
          <div key={cfg.id} className="glass-card" style={{ 
            padding: '30px 45px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: '#0E0E12',
            border: 'none',
            opacity: loading ? 0.5 : 1,
            transition: '0.3s'
          }}>
            <div style={{ display: 'flex', gap: '50px', alignItems: 'center' }}>
              <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  background: cfg.isDefault ? 'rgba(167, 8, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: cfg.isDefault ? 'var(--accent)' : '#323245',
                  filter: cfg.isDefault ? 'drop-shadow(0 0 10px var(--accent-glow))' : 'none'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{cfg.name}</h4>
                    {cfg.isDefault && <span style={{ background: 'var(--accent)', color: 'white', fontSize: '9px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px' }}>DEFAULT</span>}
                </div>
                <p className="mono" style={{ color: '#1A1A24', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', marginTop: '5px' }}>{cfg.code}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              {!cfg.isDefault && (
                <button 
                  onClick={() => handleSetDefault(cfg.id)}
                  className="pill-button secondary" 
                  style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '800' }}
                >
                  SET AS DEFAULT
                </button>
              )}
              <button 
                onClick={() => handleDelete(cfg.id)}
                className="pill-button" 
                style={{ padding: '12px 24px', fontSize: '12px', background: '#ff4757', fontWeight: '800' }}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}

        {configs.length === 0 && !loading && (
            <div style={{ padding: '100px', textAlign: 'center', color: '#323245' }}>
                <p className="mono" style={{ fontSize: '14px', fontWeight: '800' }}>NO CLOUD CONFIGS FOUND</p>
                <p style={{ fontSize: '12px', marginTop: '10px' }}>Save a configuration in the Prestige loader to see it here.</p>
            </div>
        )}
      </div>
    </div>
  );
}
