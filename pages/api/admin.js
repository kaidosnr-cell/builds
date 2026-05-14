import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

        const { masterSecret, count, durationDays } = req.body;

        // [SECURITY] Protect the admin route with your Master Secret
        const _p1 = 'PRS-ADMIN-91A2-';
        const _p2 = 'B3C4-D5E6';
        const MASTER_SECRET = process.env.MASTER_SECRET || (_p1 + _p2);
        
        if (masterSecret !== MASTER_SECRET) {
            return res.status(403).json({ message: 'UNAUTHORIZED_ACCESS' });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({ message: 'MISSING_SERVICE_ROLE_KEY' });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        console.log('[ADMIN API] Initialized.');

        const keys = [];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (durationDays || 30));

        for (let i = 0; i < (count || 1); i++) {
            const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
            const formattedKey = `PRS-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}-${randomHex.slice(8, 12)}`;
            
            keys.push({
                key: formattedKey,
                expires: expiryDate.toISOString(),
                username: 'Prestige User'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('licenses')
            .insert(keys)
            .select();

        if (error) return res.status(500).json({ message: 'DB_ERROR: ' + error.message });

        return res.status(200).json({ status: 'success', keys: data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
}
