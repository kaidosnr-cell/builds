import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PRIVATE_KEY = process.env.AUTH_PRIVATE_KEY || 'PRESTIGE-SECRET-KEY-2026'; 
const INTEGRITY_SALT = 'PRESTIGE-INTEGRITY-2026';

// Use SERVICE_ROLE_KEY to bypass RLS for all auth actions
const _k1 = 'sb_secret_OXUwNEaxFHlKkIWi';
const _k2 = 'QOaZ2A_34L8LUdp';
const supabaseAdmin = createClient(
    'https://rwkqdlycznqvyzeghqzl.supabase.co',
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
        await supabaseAdmin.from('activity_logs').insert({
            license_key: username, // Using username as identifier for logs
            action: action,
            details: details,
            created_at: new Date().toISOString()
        });
    } catch (e) { console.error('Log failed', e); }
}

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

        let body = req.body;
        // 🛡️ SECURITY: Support scrambled payloads from the loader
        if (body.p) {
            body = unscramble(body.p);
            if (!body) return res.status(403).json({ status: 'error', message: 'INTEGRITY_FAIL' });
        }

        const { action, key: rawKey, username, hwid: rawHwid, salt } = body;
        const hwid = rawHwid ? crypto.createHash('sha256').update(rawHwid).digest('hex') : null;
        
        // Normalize key: Trim and ensure PRS- prefix without doubling up
        let key = rawKey ? rawKey.trim().toUpperCase() : null;
        if (key && key !== 'PRESTIGE-DEV-BYPASS') {
            key = key.replace(/^(PRS-|KEYAUTH-)/, '');
            key = 'PRS-' + key;
        }

        switch (action) {
            case 'register':
                return res.status(403).json({ status: 'error', message: 'USE_WEBSITE_TO_REGISTER' });

            case 'login_loader':
                if (!username) return res.status(400).json({ status: 'error', message: 'USERNAME_REQUIRED' });
                
                await logToDatabase(username, 'LOGIN_ATTEMPT', 'Loader login initiated');

                // Case-insensitive lookup supporting both username and license key in the 'users' table
                // Wrapping values in quotes to handle special characters/spaces
                const { data: user, error: userError } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .or(`username.ilike."${username}",license_key.ilike."${username}"`)
                    .single();

                if (userError || !user) {
                    await logToDatabase(username, 'LOGIN_FAIL', 'User not found in database');
                    return res.status(401).json({ status: 'error', message: 'USER_NOT_FOUND' });
                }
                
                await logToDatabase(username, 'LOGIN_SUCCESS', `User found: ${user.username}`);
                
                // Website accounts use password hash, but loader currently trusts the binary for convenience.
                // We verify if they have an active subscription (owns_cheat === 1).
                if (user.owns_cheat === 0) return res.status(403).json({ status: 'error', message: 'NO_ACTIVE_SUBSCRIPTION' });

                // Update HWID if not set
                if (!user.hwid && hwid) {
                    await supabaseAdmin.from('users').update({ hwid }).eq('id', user.id);
                }

                const responseData = {
                    status: 'success',
                    token: jwt.sign({ key: user.license_key, hwid: hwid }, PRIVATE_KEY),
                    username: user.username,
                    role: 'User',
                    expiry: 'Lifetime', 
                    key: user.license_key
                };

                // 🛡️ SECURITY: Sign response
                const timestamp = Date.now().toString();
                const sig = crypto
                    .createHmac('sha256', PRIVATE_KEY)
                    .update(JSON.stringify(responseData) + timestamp)
                    .digest('hex');

                const finalData = {
                    ...responseData,
                    sig: sig,
                    ts: timestamp
                };

                return res.status(200).json({
                    d: scramble(finalData)
                });

            case 'heartbeat':
                if (!username || !hwid) return res.status(400).json({ status: 'error', message: 'INVALID_SESSION' });
                const { data: hbUser } = await supabaseAdmin.from('users').select('hwid').ilike('username', username).single();
                if (!hbUser || hbUser.hwid !== hwid) return res.status(401).json({ status: 'error', message: 'SESSION_EXPIRED' });
                return res.status(200).json({ status: 'success' });

            case 'login_web':
                if (!key) return res.status(400).json({ status: 'error', message: 'KEY_REQUIRED' });
                const { data: webUser, error: webError } = await supabaseAdmin.from('users').select('*').ilike('license_key', key).single();
                if (webError || !webUser) return res.status(401).json({ status: 'error', message: 'INVALID_KEY' });
                return res.status(200).json({ status: 'success', username: webUser.username || 'Prestige User' });

            case 'get_state':
                if (!key) return res.status(400).json({ status: 'error', message: 'KEY_REQUIRED' });
                const { data: stateUser, error: stateError } = await supabaseAdmin.from('users').select('*').ilike('license_key', key).single();
                if (stateError || !stateUser) return res.status(401).json({ status: 'error', message: 'INVALID_SESSION' });

                // Fetch configs
                const { data: configs } = await supabaseAdmin.from('configs').select('*').eq('license_key', stateUser.license_key);
                
                // Fetch recent activity
                const { data: logs } = await supabaseAdmin.from('activity_logs').select('*').eq('license_key', stateUser.license_key).order('created_at', { ascending: false }).limit(5);

                return res.status(200).json({
                    status: 'success',
                    username: stateUser.username,
                    expires: 'Lifetime',
                    configs: configs || [],
                    recentActivity: (logs || []).map(l => ({
                        action: l.action,
                        details: l.details,
                        time: new Date(l.created_at).toLocaleString()
                    }))
                });

            default:
                return res.status(400).json({ status: 'error', message: `UNKNOWN_ACTION_${action}_BODY_${JSON.stringify(body)}` });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'INTERNAL_AUTH_ERROR' });
    }
}
