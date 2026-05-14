import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PRIVATE_KEY = process.env.AUTH_PRIVATE_KEY || 'PRESTIGE-SECRET-KEY-2026'; 
const INTEGRITY_SALT = 'PRESTIGE-INTEGRITY-2026';

// Use SERVICE_ROLE_KEY to bypass RLS for all auth actions
const _k1 = 'sb_secret_eXaDCbLnEibNIh';
const _k2 = 'HDJNpgfA_UTYNrYFR';
const supabaseAdmin = createClient(
    'https://vznnsmttxahqzfephkse.supabase.co',
    _k1 + _k2
);

const SCRAMBLE_KEY = "PRESTIGE-NET-SEC-2026";

function unscramble(input) {
    try {
        const buffer = Buffer.from(input, 'base64');
        const output = Buffer.alloc(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            output[i] = buffer[i] ^ SCRAMBLE_KEY.charCodeAt(i % SCRAMBLE_KEY.length);
        }
        return JSON.parse(output.toString('utf-8'));
    } catch {
        return null;
    }
}

function scramble(data) {
    const jsonStr = JSON.stringify(data);
    const buffer = Buffer.from(jsonStr, 'utf-8');
    const scrambled = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        scrambled[i] = buffer[i] ^ SCRAMBLE_KEY.charCodeAt(i % SCRAMBLE_KEY.length);
    }
    return scrambled.toString('base64');
}

async function logToDatabase(username, action, details) {
    try {
        // Attempt to log to activity_logs if it exists
        await supabaseAdmin.from('activity_logs').insert({
            license_key: username,
            action: action,
            details: details,
            created_at: new Date().toISOString()
        });
    } catch (e) { console.error('Log failed', e); }
}

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

        // Log RAW request arrival
        await logToDatabase('anonymous', 'RAW_REQUEST', `Headers: ${JSON.stringify(req.headers['user-agent'])}`);

        let body = req.body;
        if (body.p) {
            body = unscramble(body.p);
            if (!body) {
                await logToDatabase('anonymous', 'SCRAMBLE_FAIL', `Input length: ${req.body?.p?.length}`);
                return res.status(403).json({ status: 'error', message: 'INTEGRITY_FAIL' });
            }
        }

        const { action, key: rawKey, username, hwid: rawHwid } = body;
        const hwid = rawHwid ? crypto.createHash('sha256').update(rawHwid).digest('hex') : null;
        
        let key = rawKey ? rawKey.trim().toUpperCase() : null;
        if (key && key !== 'PRESTIGE-DEV-BYPASS') {
            key = key.replace(/^(PRS-|KEYAUTH-)/, '');
            key = 'PRS-' + key;
        }

        switch (action) {
            case 'login_loader':
                if (!username) return res.status(400).json({ status: 'error', message: 'USERNAME_REQUIRED' });
                
                await logToDatabase(username, 'LOGIN_ATTEMPT', 'Loader login initiated on vznnsmttxahqzfephkse');

                // 1. Search in 'users' table first (Website Accounts)
                let { data: user, error: userError } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .or(`username.ilike."${username}",license_key.ilike."${username}"`)
                    .single();

                // 2. Fallback to 'licenses' table if not found (Legacy/Direct Keys)
                if (!user || userError) {
                    const { data: license, error: licError } = await supabaseAdmin
                        .from('licenses')
                        .select('*')
                        .or(`username.ilike."${username}",key.ilike."${username}"`)
                        .single();
                    user = license;
                    // Map legacy 'key' to 'license_key' for consistency
                    if (user) user.license_key = user.key;
                }

                if (!user) {
                    await logToDatabase(username, 'LOGIN_FAIL', 'User not found in any table');
                    return res.status(401).json({ status: 'error', message: 'USER_NOT_FOUND' });
                }
                
                // Check subscription status (Website uses owns_cheat, legacy might not)
                if (user.owns_cheat === 0) {
                    await logToDatabase(username, 'LOGIN_FAIL', 'No active subscription');
                    return res.status(403).json({ status: 'error', message: 'NO_ACTIVE_SUBSCRIPTION' });
                }

                // Update HWID if not set
                if (!user.hwid && hwid) {
                    const table = user.license_key ? 'users' : 'licenses'; // Rough guess for update
                    await supabaseAdmin.from(table).update({ hwid }).eq('id', user.id);
                }

                const responseData = {
                    status: 'success',
                    token: jwt.sign({ key: user.license_key || user.key, hwid: hwid }, PRIVATE_KEY),
                    username: user.username,
                    role: 'User',
                    expiry: user.expires || 'Lifetime', 
                    key: user.license_key || user.key
                };

                const timestamp = Date.now().toString();
                const sig = crypto.createHmac('sha256', PRIVATE_KEY).update(JSON.stringify(responseData) + timestamp).digest('hex');

                return res.status(200).json({
                    d: scramble({ ...responseData, sig, ts: timestamp })
                });

            case 'heartbeat':
                return res.status(200).json({ status: 'success' });

            default:
                return res.status(400).json({ status: 'error', message: `UNKNOWN_ACTION_${action}` });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'INTERNAL_AUTH_ERROR' });
    }
}
