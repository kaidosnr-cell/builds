import { supabase } from '../../lib/supabase';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// In production, move these to environment variables!
const PRIVATE_KEY = process.env.AUTH_PRIVATE_KEY || 'PRESTIGE-SECRET-KEY-2026'; 

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { action, key, hwid: rawHwid, payload } = req.body;

    // [SECURITY] Hash HWID for privacy (SHA-256)
    const hwid = rawHwid ? crypto.createHash('sha256').update(rawHwid).digest('hex') : null;

    if (!key) return res.status(400).json({ status: 'error', message: 'KEY_REQUIRED' });

    // 1. Fetch License from Supabase
    const { data: user, error: userError } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .single();

    if (userError || !user) {
        return res.status(401).json({ status: 'error', message: 'INVALID_KEY' });
    }

    // 2. HWID Locking Logic
    if (user.hwid && hwid && user.hwid !== hwid) {
        return res.status(403).json({ status: 'error', message: 'HWID_MISMATCH' });
    }

    // If HWID is not set yet, lock it to this first login
    if (!user.hwid && hwid) {
        await supabase.from('licenses').update({ hwid: hwid }).eq('key', key);
    }

    switch (action) {
        case 'verify':
            // CUSTOM HANDSHAKE: Sign a token that the loader must verify
            const sessionToken = jwt.sign({
                key: key,
                hwid: hwid,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour session
            }, PRIVATE_KEY);

            // Log Login
            await supabase.from('activity_logs').insert({
                license_key: key,
                action: 'Login',
                details: `HWID: ${hwid}`
            });

            return res.status(200).json({
                status: 'success',
                token: sessionToken,
                username: user.username,
                expiry: user.expires
            });

        case 'get_state':
            const { data: configs } = await supabase.from('configs').select('*').eq('license_key', key);
            const { data: session } = await supabase.from('mobile_sessions').select('*').eq('license_key', key).single();
            const { data: logs } = await supabase.from('activity_logs').select('*').eq('license_key', key).order('created_at', { ascending: false }).limit(10);

            return res.status(200).json({
                ...user,
                configs: configs || [],
                mobileSession: session || {},
                recentActivity: logs || []
            });

        // ... rest of actions (update_mobile, delete_config, etc.) remain same as before
        case 'update_mobile':
            const { masterSwitch } = payload;
            const { data: newSession } = await supabase
                .from('mobile_sessions')
                .update({ master_switch: masterSwitch, injected: masterSwitch })
                .eq('license_key', key)
                .select()
                .single();
            return res.status(200).json({ status: 'success', session: newSession });

        case 'destruct':
            await supabase.from('mobile_sessions').update({ is_connected: false, injected: false }).eq('license_key', key);
            return res.status(200).json({ status: 'success' });

        default:
            return res.status(400).json({ message: 'Unknown Action' });
    }
}
