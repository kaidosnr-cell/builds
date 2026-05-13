import { useState } from 'react';
import Head from 'next/head';

export async function getServerSideProps(context) {
    const { secret } = context.params;
    const _p1 = 'PRS-ADMIN-91A2-';
    const _p2 = 'B3C4-D5E6';
    const MASTER_SECRET = process.env.MASTER_SECRET || (_p1 + _p2);

    if (secret !== MASTER_SECRET) {
        return {
            notFound: true, 
        };
    }

    return {
        props: { verifiedSecret: secret }, 
    };
}

export default function AdminPage({ verifiedSecret }) {
    const [secret] = useState(verifiedSecret);
    const [count, setCount] = useState(1);
    const [days, setDays] = useState(30);
    const [generatedKeys, setGeneratedKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [allKeys, setAllKeys] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredKeys = allKeys.filter(k => 
        k.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.username && k.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const fetchAllKeys = async () => {
        try {
            const res = await fetch('/api/admin/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterSecret: secret })
            });

            if (!res.ok) {
                const text = await res.text();
                if (text.startsWith('Internal')) {
                    console.error('SERVER_CRASH: Check Vercel environment variables.');
                }
                return;
            }

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error('Non-JSON response received');
                return;
            }

            const data = await res.json();
            if (data.status === 'success') {
                setAllKeys(data.keys);
            } else {
                console.error('Fetch error:', data.message);
            }
        } catch (e) {
            console.error('Connection error:', e);
        }
    };

    // Initial fetch
    useState(() => {
        fetchAllKeys();
    });

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

            if (!res.ok) {
                const text = await res.text();
                setStatus('SERVER_ERROR: ' + text.slice(0, 50));
                setLoading(false);
                return;
            }

            const data = await res.json();
            if (data.status === 'success') {
                setGeneratedKeys(data.keys);
                setStatus(`Successfully generated ${data.keys.length} keys.`);
                fetchAllKeys(); // Auto-refresh the overlord list
            } else {
                setStatus('Error: ' + (data.message || 'Generation failed'));
            }
        } catch (e) {
            setStatus('Connection failed: ' + e.message);
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <>
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
                            <div className="opacity-50 pointer-events-none">
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">Authenticated Session</label>
                                <input 
                                    type="password"
                                    value={secret}
                                    readOnly
                                    className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none transition-all"
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

                {/* OVERLORD TABLE */}
                <div className="mt-12 bg-[#0E0E12] border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <h2 className="text-lg font-bold text-white flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-pulse"></span>
                            ECOSYSTEM OVERVIEW
                        </h2>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <input 
                                    type="text" 
                                    placeholder="Search key or username..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500 transition-all"
                                />
                                <span className="absolute right-3 top-2.5 opacity-20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </span>
                            </div>
                            <button onClick={fetchAllKeys} className="text-[10px] font-black text-purple-400 hover:text-white transition-colors">REFRESH</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800/50">
                                    <th className="pb-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Key</th>
                                    <th className="pb-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">User</th>
                                    <th className="pb-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Created</th>
                                    <th className="pb-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {filteredKeys.map((k, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="py-4 font-mono text-sm text-purple-400">{k.key}</td>
                                        <td className="py-4 text-xs font-bold text-zinc-300">{k.username || 'UNASSIGNED'}</td>
                                        <td className="py-4 text-xs text-zinc-500">{new Date(k.created_at).toLocaleDateString()}</td>
                                        <td className="py-4">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded ${new Date(k.expires) > new Date() ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {new Date(k.expires) > new Date() ? 'ACTIVE' : 'EXPIRED'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                body { background-color: #0D0D10; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: #1A1A24; border-radius: 10px; }
            `}</style>
        </>
    );
}
