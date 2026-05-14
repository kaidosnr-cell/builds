import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND (LEN: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'MISSING';
    
    let dbStatus = 'NOT TESTED';
    let dbError = null;
    let sampleUser = null;

    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data, error } = await supabase.from('licenses').select('username').limit(1);
        if (error) {
            dbStatus = 'ERROR';
            dbError = error.message;
        } else {
            dbStatus = 'OK';
            sampleUser = data;
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
