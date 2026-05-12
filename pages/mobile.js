import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function MobileConnect() {
  const [isPaired, setIsPaired] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [session, setSession] = useState({ isConnected: false, masterSwitch: false, injected: false });
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchState = () => {
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_state', key: 'PRS-9921-X882-K001' })
    })
    .then(res => res.json())
    .then(data => {
        setSession(data.mobileSession);
        setConfigs(data.configs || []);
        if (!selectedConfig && data.configs?.length > 0) {
            setSelectedConfig(data.configs.find(c => c.isDefault) || data.configs[0]);
        }
        setLoading(false);
    });
  };

  useEffect(() => {
    if (isPaired) {
        fetchState();
        const interval = setInterval(fetchState, 3000);
        return () => clearInterval(interval);
    }
  }, [isPaired]);

  const handlePairing = (e) => {
    e.preventDefault();
    // In a real app, this would verify with the server/loader
    if (pairingCode.toUpperCase() === 'MZE-PAIR') {
        setIsPaired(true);
        setError('');
    } else {
        setError('INVALID_PAIRING_CODE');
    }
  };

  const handleToggle = (val) => {
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_mobile', key: 'PRS-9921-X882-K001', payload: { masterSwitch: val } })
    })
    .then(res => res.json())
    .then(data => setSession(data.session));
  };

  const handleDestruct = () => {
    if (confirm('Are you sure? This will clear all traces and disconnect the loader.')) {
        fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'destruct', key: 'PRS-9921-X882-K001' })
        })
        .then(() => {
            setIsPaired(false);
            setPairingCode('');
        });
    }
  };

  return (
    <div className="animate-fade" style={{ background: '#0D0D10', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Mobile Connect | Prestige</title>
      </Head>

      <div style={{ padding: '60px', flex: 1 }}>
        <div style={{ marginBottom: '50px' }}>
          <h2 className="mono" style={{ fontSize: '32px', marginBottom: '10px', fontWeight: '900' }}>MOBILE CONNECT</h2>
          <p style={{ color: '#323245', fontSize: '14px', fontWeight: '600' }}>Enter your unique pairing code from the Prestige loader to begin.</p>
        </div>

        {!isPaired ? (
            <div style={{ maxWidth: '500px', margin: '100px auto', background: '#0E0E12', padding: '50px', borderRadius: '20px', textAlign: 'center' }}>
                <div style={{ 
                    width: '60px', height: '60px', background: 'rgba(167, 8, 255, 0.05)', 
                    borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', margin: '0 auto 30px'
                }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h3 className="mono" style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>LINK DEVICE</h3>
                <p style={{ color: '#323245', fontSize: '13px', marginBottom: '35px' }}>Enter the 7-character code shown in Settings → Mobile.</p>
                
                <form onSubmit={handlePairing}>
                    <input 
                        type="text" 
                        value={pairingCode}
                        onChange={(e) => setPairingCode(e.target.value)}
                        placeholder="MZE-XXXX"
                        className="mono"
                        style={{ 
                            width: '100%', background: '#0A0A0E', border: `1px solid ${error ? '#ff4757' : '#1A1A24'}`,
                            padding: '18px', borderRadius: '10px', color: 'white', fontSize: '16px',
                            textAlign: 'center', letterSpacing: '3px', outline: 'none', marginBottom: '20px'
                        }}
                    />
                    {error && <p style={{ color: '#ff4757', fontSize: '11px', fontWeight: '900', marginBottom: '20px' }}>{error}</p>}
                    <button className="pill-button" style={{ width: '100%', height: '55px' }}>CONNECT DEVICE</button>
                </form>
            </div>
        ) : !session.isConnected ? (
            <div style={{ 
                height: '400px', 
                background: '#0E0E12', 
                borderRadius: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px dashed #1A1A24'
            }}>
                <div style={{ 
                    width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(255, 71, 87, 0.05)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4757', marginBottom: '25px'
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.94 2.06a2 2 0 0 1 2.12 0l8 4.61a2 2 0 0 1 1 1.73v9.2a2 2 0 0 1-1 1.73l-8 4.61a2 2 0 0 1-2.12 0l-8-4.61a2 2 0 0 1-1-1.73v-9.2a2 2 0 0 1 1-1.73l8-4.61z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h4 className="mono" style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>WAITING FOR CONNECTION</h4>
                <p style={{ color: '#323245', fontSize: '13px', marginTop: '10px' }}>Launch Prestige.exe on your PC to enable mobile control.</p>
                <button onClick={() => setIsPaired(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', fontWeight: '900', marginTop: '30px', cursor: 'pointer' }}>CANCEL PAIRING</button>
            </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
                <div style={{ background: '#0E0E12', borderRadius: '20px', padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <div>
                            <h3 className="mono" style={{ fontSize: '20px', fontWeight: '900' }}>MASTER SWITCH</h3>
                            <p style={{ color: '#323245', fontSize: '12px', marginTop: '5px' }}>Instant injection and feature management.</p>
                        </div>
                        <div 
                            onClick={() => handleToggle(!session.masterSwitch)}
                            style={{ 
                                width: '60px', height: '32px', background: session.masterSwitch ? 'var(--accent)' : '#0A0A0E', 
                                borderRadius: '16px', position: 'relative', cursor: 'pointer', transition: '0.3s'
                            }}
                        >
                            <div style={{ 
                                width: '24px', height: '24px', background: 'white', borderRadius: '12px',
                                position: 'absolute', top: '4px', left: session.masterSwitch ? '32px' : '4px', transition: '0.3s'
                            }}/>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ height: '70px', borderBottom: '1px solid #121218', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '16px', color: 'white' }}>Injection Status</span>
                            <span style={{ color: session.injected ? '#00FF7F' : '#ff4757', fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>
                                {session.injected ? 'INJECTED' : 'INACTIVE'}
                            </span>
                        </div>

                        <div style={{ height: '70px', borderBottom: '1px solid #121218', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '16px', color: 'white' }}>Active Configuration</span>
                            <select 
                                value={selectedConfig?.id}
                                onChange={(e) => setSelectedConfig(configs.find(c => c.id == e.target.value))}
                                style={{ 
                                    background: '#0A0A0E', border: '1px solid #1A1A24', color: 'white', 
                                    padding: '8px 15px', borderRadius: '5px', fontSize: '12px', outline: 'none'
                                }}
                            >
                                {configs.map(cfg => (
                                    <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleDestruct}
                        className="pill-button" 
                        style={{ width: '100%', marginTop: '50px', background: '#ff4757', height: '60px', fontSize: '16px' }}
                    >
                        SYSTEM DESTRUCT
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ background: '#0E0E12', borderRadius: '20px', padding: '30px', textAlign: 'center' }}>
                        <p style={{ color: '#323245', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>SESSION SECURITY</p>
                        <div style={{ padding: '20px', background: 'rgba(167, 8, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(167, 8, 255, 0.1)' }}>
                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '700' }}>AES-256 ENCRYPTED</p>
                            <p style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '5px' }}>RSA Handshake Verified</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
