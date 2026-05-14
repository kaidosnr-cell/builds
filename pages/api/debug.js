import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND (LEN: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'MISSING';
    
    let dbStatus = 'NOT TESTED';
    let dbError = null;
    let sampleUser = null;

    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // List all tables in the public schema
        const { data: tables, error: tableErr } = await supabase
            .from('pg_catalog.pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');

        if (tableErr) {
            // Fallback for restricted access
            const { data: sample, error: sampleErr } = await supabase.from('licenses').select('*').limit(1);
            dbStatus = sampleErr ? 'ERROR: ' + sampleErr.message : 'OK';
            sampleUser = sample;
        } else {
            dbStatus = 'OK';
            sampleUser = { tables: tables.map(t => t.tablename) };
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
