import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SCRAMBLE_KEY = "PRESTIGE-NET-SEC-2026";

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const supabaseAdmin = getSupabase();
        if (!supabaseAdmin) return res.status(500).json({ status: 'error', message: 'DB_ERROR' });

        const { license, owner, configs } = req.body;
        if (!license) return res.status(400).json({ status: 'error', message: 'LICENSE_REQUIRED' });

        // Update license status to ACTIVE on sync
        await supabaseAdmin
            .from('licenses')
            .update({ 
                status: 'ACTIVE',
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
            })
            .eq('key', license.replace(/^(PRS-|KEYAUTH-)/, 'PRS-'));

        // Log the sync activity
        await supabaseAdmin.from('activity_logs').insert({
            id: crypto.randomUUID(),
            license_key: license,
            action: 'CONFIG_SYNC',
            details: `${owner}: Synchronized ${Object.keys(configs || {}).length} configurations from Loader.`
        });

        return res.status(200).json({ success: true, message: 'SYNCHRONIZED' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'INTERNAL_SYNC_ERROR' });
    }
}
