import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND (LEN: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'MISSING';
    
    let dbStatus = 'NOT TESTED';
    let dbError = null;
    let sampleUser = null;

    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // Check for Kaidosnr specifically
        const { data: specific, error: specErr } = await supabase
            .from('licenses')
            .select('*')
            .ilike('username', 'Kaidosnr')
            .maybeSingle();

        if (specErr) {
            dbStatus = 'ERROR';
            dbError = specErr.message;
        } else {
            dbStatus = 'OK';
            sampleUser = specific;
        }
    } catch (e) {
        dbStatus = 'CRASH';
        dbError = e.message;
    }

    return res.status(200).json({
        url: url,
        key_status: key,
        db_status: dbStatus,
        db_error: dbError,
        sample: sampleUser,
        timestamp: new Date().toISOString()
    });
}
