import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';

export default function AdminPage() {
    const router = useRouter();
    const { secret: urlSecret } = router.query;
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [secret, setSecret] = useState('');
    
    // [SECURITY] Strict URL-based authorization
    useEffect(() => {
        const MASTER_SECRET = 'ADVANCED-UI-PRESTIGE-SECRET-2026';
        if (urlSecret && urlSecret === MASTER_SECRET) {
            setIsAuthorized(true);
            setSecret(urlSecret);
        }
    }, [urlSecret]);

    if (!isAuthorized && urlSecret) {
        return <div className="h-screen flex items-center justify-center text-zinc-700 font-mono">404 | Page Not Found</div>;
    }

    const [count, setCount] = useState(1);
    const [days, setDays] = useState(30);
    const [generatedKeys, setGeneratedKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const generateKeys = async () => {
        setLoading(true);
        setStatus('');
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    masterSecret: secret,
                    count: parseInt(count),
                    durationDays: parseInt(days)
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setGeneratedKeys(data.keys);
                setStatus(`Successfully generated ${data.keys.length} keys.`);
            } else {
                setStatus('Error: ' + (data.message || 'Generation failed'));
            }
        } catch (e) {
            setStatus('Connection failed.');
        }
        setLoading(false);
    };

    return (
        <Layout>
            <Head>
                <title>Prestige Admin | Key Generator</title>
            </Head>

            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="mb-12">
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">ADMIN PANEL</h1>
                    <p className="text-zinc-500 font-medium">Generate high-fidelity license keys for the Prestige ecosystem.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Generator Controls */}
                    <div className="bg-[#0E0E12] border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                            KEY GENERATOR
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">Master Secret</label>
                                <input 
                                    type="password"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder="Enter Admin Secret..."
                                    className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">Amount</label>
                                    <input 
                                        type="number"
                                        value={count}
                                        onChange={(e) => setCount(e.target.value)}
                                        className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">Days</label>
                                    <input 
                                        type="number"
                                        value={days}
                                        onChange={(e) => setDays(e.target.value)}
                                        className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={generateKeys}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                            >
                                {loading ? 'GENERATING...' : 'GENERATE KEYS'}
                            </button>

                            {status && (
                                <p className={`text-center text-xs font-bold ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                                    {status.toUpperCase()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="bg-[#0E0E12] border border-zinc-800/50 rounded-3xl p-8 shadow-2xl flex flex-col">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                            <span className="w-2 h-2 bg-zinc-500 rounded-full mr-3"></span>
                            OUTPUT LOG
                        </h2>

                        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2">
                            {generatedKeys.length > 0 ? (
                                generatedKeys.map((k, idx) => (
                                    <div key={idx} className="bg-[#08080A] border border-zinc-800/50 rounded-lg p-3 flex justify-between items-center group">
                                        <code className="text-purple-400 font-mono text-sm">{k.key}</code>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(k.key)}
                                            className="text-[10px] font-black text-zinc-600 group-hover:text-white transition-colors"
                                        >
                                            COPY
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                                    <p className="text-[10px] font-black tracking-widest uppercase">No keys generated yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                body { background-color: #0D0D10; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: #1A1A24; border-radius: 10px; }
            `}</style>
        </Layout>
    );
}
