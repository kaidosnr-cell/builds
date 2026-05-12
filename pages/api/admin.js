import { supabase } from '../../lib/supabase';
import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { masterSecret, count, durationDays } = req.body;

    // [SECURITY] Protect the admin route with your Master Secret
    if (masterSecret !== process.env.MASTER_SECRET) {
        return res.status(403).json({ message: 'UNAUTHORIZED_ACCESS' });
    }

    const keys = [];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (durationDays || 30));

    for (let i = 0; i < (count || 1); i++) {
        // Generate high-entropy random key: PRS-XXXX-XXXX-XXXX
        const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
        const formattedKey = `PRS-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}-${randomHex.slice(8, 12)}`;
        
        keys.push({
            key: formattedKey,
            expires: expiryDate.toISOString(),
            username: 'Prestige User'
        });
    }

    const { data, error } = await supabase
        .from('licenses')
        .insert(keys)
        .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ status: 'success', keys: data });
}
