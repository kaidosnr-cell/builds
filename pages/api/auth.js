import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PRIVATE_KEY = process.env.AUTH_PRIVATE_KEY || 'PRESTIGE-SECRET-KEY-2026'; 
const INTEGRITY_SALT = 'PRESTIGE-INTEGRITY-2026';

// Use SERVICE_ROLE_KEY to bypass RLS for all auth actions
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

        const { action, key: rawKey, username, hwid: rawHwid, salt, payload } = req.body;
        const hwid = rawHwid ? crypto.createHash('sha256').update(rawHwid).digest('hex') : null;
        
        // Normalize key: Trim and ensure PRS- prefix without doubling up
        let key = rawKey ? rawKey.trim().toUpperCase() : null;
        if (key) {
            // Remove any existing PRS- or KEYAUTH- prefix first
            key = key.replace(/^(PRS-|KEYAUTH-)/, '');
            // Then ensure it has the PRS- prefix
            key = 'PRS-' + key;
        }

        switch (action) {
            case 'register':
                if (!key || !username) return res.status(400).json({ status: 'error', message: 'KEY_AND_USER_REQUIRED' });
                // Case-insensitive license lookup
                const { data: license, error: fetchError } = await supabaseAdmin.from('licenses').select('*').ilike('key', key).single();
                if (fetchError || !license) return res.status(401).json({ status: 'error', message: 'INVALID_LICENSE_KEY' });
                if (license.hwid) return res.status(403).json({ status: 'error', message: 'KEY_ALREADY_REDEEMED' });

                const { error: updateError } = await supabaseAdmin.from('licenses').update({ username: username, hwid: hwid }).ilike('key', key);
                if (updateError) return res.status(500).json({ status: 'error', message: 'REGISTRATION_FAILED' });
                return res.status(200).json({ status: 'success', message: 'ACCOUNT_CREATED' });

            case 'login_loader':
                if (!username) return res.status(400).json({ status: 'error', message: 'USERNAME_REQUIRED' });
                const { data: user, error: userError } = await supabaseAdmin.from('licenses').select('*').eq('username', username).single();
                if (userError || !user) return res.status(401).json({ status: 'error', message: 'USER_NOT_FOUND' });
                if (user.hwid !== hwid) return res.status(403).json({ status: 'error', message: 'HWID_MISMATCH' });

                const token = jwt.sign({ key: user.key, hwid: hwid }, PRIVATE_KEY);
                return res.status(200).json({ status: 'success', token, expiry: user.expires, key: user.key });

            case 'heartbeat':
                if (!key || !hwid) return res.status(400).json({ status: 'error', message: 'INVALID_SESSION' });
                const { data: hbUser } = await supabaseAdmin.from('licenses').select('hwid').ilike('key', key).single();
                if (!hbUser || hbUser.hwid !== hwid) return res.status(401).json({ status: 'error', message: 'SESSION_EXPIRED' });
                return res.status(200).json({ status: 'success' });

            case 'login_web':
                if (!key) return res.status(400).json({ status: 'error', message: 'KEY_REQUIRED' });
                const { data: webUser, error: webError } = await supabaseAdmin.from('licenses').select('*').ilike('key', key).single();
                if (webError || !webUser) return res.status(401).json({ status: 'error', message: 'INVALID_KEY' });
                return res.status(200).json({ status: 'success', username: webUser.username || 'Prestige User' });

            case 'get_state':
                if (!key) return res.status(400).json({ status: 'error', message: 'KEY_REQUIRED' });
                const { data: stateUser, error: stateError } = await supabaseAdmin.from('licenses').select('*').ilike('key', key).single();
                if (stateError || !stateUser) return res.status(401).json({ status: 'error', message: 'INVALID_SESSION' });

                // Fetch configs
                const { data: configs } = await supabaseAdmin.from('configs').select('*').eq('license_key', stateUser.key);
                
                // Fetch recent activity
                const { data: logs } = await supabaseAdmin.from('activity_logs').select('*').eq('license_key', stateUser.key).order('created_at', { ascending: false }).limit(5);

                return res.status(200).json({
                    status: 'success',
                    username: stateUser.username,
                    expires: stateUser.expires,
                    configs: configs || [],
                    recentActivity: (logs || []).map(l => ({
                        action: l.action,
                        details: l.details,
                        time: new Date(l.created_at).toLocaleString()
                    }))
                });

            default:
                return res.status(400).json({ message: 'Unknown Action' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'INTERNAL_AUTH_ERROR' });
    }
}
