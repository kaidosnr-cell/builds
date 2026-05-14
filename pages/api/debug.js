import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND (LEN: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'MISSING';
    
    let dbStatus = 'NOT TESTED';
    let dbError = null;
    let sampleUser = null;

    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        const results = {};
        
        const { data: lic } = await supabase.from('licenses').select('*').limit(1);
        results.licenses = lic || [];
        
        const { data: usr } = await supabase.from('users').select('*').limit(1);
        results.users = usr || [];
        
        const { data: cfg } = await supabase.from('configs').select('*').limit(1);
        results.configs = cfg || [];

        dbStatus = 'OK';
        sampleUser = results;
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
