import { supabase } from '../../lib/supabase';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PRIVATE_KEY = process.env.AUTH_PRIVATE_KEY || 'PRESTIGE-SECRET-KEY-2026'; 

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { action, key, username, hwid: rawHwid, payload } = req.body;
    const hwid = rawHwid ? crypto.createHash('sha256').update(rawHwid).digest('hex') : null;

    switch (action) {
        case 'register':
            if (!key || !username) return res.status(400).json({ status: 'error', message: 'KEY_AND_USER_REQUIRED' });
            
            // Find key and check if it's already used
            const { data: license, error: fetchError } = await supabase.from('licenses').select('*').eq('key', key).single();
            if (fetchError || !license) return res.status(401).json({ status: 'error', message: 'INVALID_LICENSE_KEY' });
            if (license.hwid) return res.status(403).json({ status: 'error', message: 'KEY_ALREADY_REDEEMED' });

            // Bind username and HWID to this key
            const { error: updateError } = await supabase
                .from('licenses')
                .update({ username: username, hwid: hwid })
                .eq('key', key);
            
            if (updateError) return res.status(500).json({ status: 'error', message: 'REGISTRATION_FAILED' });

            return res.status(200).json({ status: 'success', message: 'ACCOUNT_CREATED' });

        case 'login_loader':
            if (!username) return res.status(400).json({ status: 'error', message: 'USERNAME_REQUIRED' });
            
            // Find license by username
            const { data: user, error: userError } = await supabase.from('licenses').select('*').eq('username', username).single();
            if (userError || !user) return res.status(401).json({ status: 'error', message: 'USER_NOT_FOUND' });

            // Verify HWID
            if (user.hwid !== hwid) return res.status(403).json({ status: 'error', message: 'HWID_MISMATCH' });

            const token = jwt.sign({ key: user.key, hwid: hwid, iat: Math.floor(Date.now() / 1000) }, PRIVATE_KEY);
            return res.status(200).json({ status: 'success', token, expiry: user.expires, key: user.key });

        case 'login_web':
            if (!key) return res.status(400).json({ status: 'error', message: 'KEY_REQUIRED' });
            
            const { data: webUser, error: webError } = await supabase.from('licenses').select('*').eq('key', key).single();
            if (webError || !webUser) return res.status(401).json({ status: 'error', message: 'INVALID_KEY' });

            return res.status(200).json({ status: 'success', username: webUser.username || 'Prestige User' });

        case 'get_state':
            // Logic for dashboard data...
            const { data: lData } = await supabase.from('licenses').select('*').eq('key', key).single();
            const { data: configs } = await supabase.from('configs').select('*').eq('license_key', key);
            return res.status(200).json({ ...lData, configs: configs || [] });

        default:
            return res.status(400).json({ message: 'Unknown Action' });
    }
}
