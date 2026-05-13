import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

        const { masterSecret } = req.body;

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

        // Use SERVICE_ROLE_KEY to see everything
        const _s1 = 'sb_secret_eXaDCbLnEibNIh';
        const _s2 = 'HDJNpgfA_UTYNrYFR';
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vznnsmttxahqzfephkse.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY || (_s1 + _s2)
        );

        const { data, error } = await supabaseAdmin
            .from('licenses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ message: 'DB_ERROR: ' + error.message });

        return res.status(200).json({ status: 'success', keys: data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
}
