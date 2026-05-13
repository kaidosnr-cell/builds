import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

        const { masterSecret } = req.body;

        // [SECURITY] Protect the admin route with your Master Secret
        const MASTER_SECRET = process.env.MASTER_SECRET || 'ADVANCED-UI-PRESTIGE-SECRET-2026';
        if (masterSecret !== MASTER_SECRET) {
            return res.status(403).json({ message: 'UNAUTHORIZED_ACCESS' });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({ message: 'MISSING_SERVICE_ROLE_KEY' });
        }

        // Use SERVICE_ROLE_KEY to see everything
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
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
