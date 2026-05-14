import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PRIVATE_KEY = process.env.AUTH_PRIVATE_KEY || process.env.JWT_SECRET || 'PRESTIGE-SECRET-KEY-2026';
const SCRAMBLE_KEY = "PRESTIGE-NET-SEC-2026";

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

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

async function sendWebhook(title, description, color = 0x8376FC) {
    const webhookUrl = process.env.SECURITY_WEBHOOK;
    if (!webhookUrl) return;

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: `🛡️ Prestige Security: ${title}`,
                    description: description,
                    color: color,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Mooze V2 Infrastructure' }
                }]
            })
        });
    } catch (e) { console.error('Webhook failed', e); }
}

async function getIPInfo(req) {
    let ip = 'unknown';
    let vpnFlag = '';
    if (req) {
        ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (ip.includes(',')) ip = ip.split(',')[0].trim();
        
        try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,proxy,hosting`);
            if (geoRes.ok) {
                const geo = await geoRes.json();
                if (geo.status === 'success') {
                    vpnFlag = ` [${geo.country}${geo.proxy || geo.hosting ? ' | VPN/HOST' : ''}]`;
                }
            }
        } catch { }
    }
    return { ip, vpnFlag };
}

async function logToDatabase(identifier, action, details, ipInfo = null) {
    try {
        const supabaseAdmin = getSupabase();
        if (!supabaseAdmin) return;

        const { ip, vpnFlag } = ipInfo || { ip: 'unknown', vpnFlag: '' };
        
        // Only set license_key if the identifier looks like a key (starts with PRS-)
        const licenseKey = (identifier && identifier.startsWith('PRS-')) ? identifier : null;

        await supabaseAdmin.from('activity_logs').insert({
            id: crypto.randomUUID(),
            license_key: licenseKey,
            action: action,
            details: `${identifier}: ${details} | IP: ${ip}${vpnFlag}`
        });
    } catch (err) {
        console.error('[Logger Error]', err);
    }
}

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

        const supabaseAdmin = getSupabase();
        if (!supabaseAdmin) {
            return res.status(500).json({ 
                status: 'error', 
                message: 'CONFIG_ERROR', 
                details: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment' 
            });
        }

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
                
                const ipInfo = await getIPInfo(req);
                const { ip, vpnFlag } = ipInfo;

                await logToDatabase(username, 'LOGIN_ATTEMPT', 'Attempting login', ipInfo);

                let user = null;
                let userError = null;

                // 1. Try 'users' table (Website Accounts) - Safe Check
                try {
                    const { data, error } = await supabaseAdmin
                        .from('users')
                        .select('*')
                        .or(`username.ilike.${username},license_key.ilike.${username}`)
                        .single();
                    user = data;
                    userError = error;
                } catch (e) { 
                    userError = e; 
                }

                // 2. Fallback to 'licenses' table (Legacy/Direct Keys)
                if (!user) {
                    // Try by Username first
                    const { data: byName } = await supabaseAdmin
                        .from('licenses')
                        .select('*')
                        .ilike('username', username)
                        .maybeSingle();
                    
                    if (byName) {
                        user = byName;
                    } else {
                        // Try by Key
                        const { data: byKey } = await supabaseAdmin
                            .from('licenses')
                            .select('*')
                            .eq('key', username)
                            .maybeSingle();
                        user = byKey;
                    }

                    if (user) {
                        // Map legacy 'key' to 'license_key' for consistency
                        user.license_key = user.key;
                    }
                }

                if (!user) {
                    await logToDatabase(username, 'LOGIN_FAIL', 'User not found in any table', ipInfo);
                    return res.status(401).json({ status: 'error', message: 'USER_NOT_FOUND' });
                }
                
                const logIdentity = user.license_key || user.key || username;
                
                // Check subscription status
                const isActive = user.is_active !== false && user.status !== 'DISABLED';
                const hasSubscription = user.owns_cheat === 1 || user.license_key || user.key;

                if (!isActive || !hasSubscription) {
                    await logToDatabase(logIdentity, 'LOGIN_FAIL', `Account inactive or no sub. Active: ${isActive}, Sub: ${hasSubscription}`, ipInfo);
                    return res.status(403).json({ status: 'error', message: 'NO_ACTIVE_SUBSCRIPTION' });
                }

                await logToDatabase(logIdentity, 'LOGIN_SUCCESS', 'Successful login via loader', ipInfo);

                // Update HWID and IP if they changed
                if ((!user.hwid && hwid) || (user.ip !== ip)) {
                    const table = user.license_key ? 'users' : 'licenses';
                    const updates = {};
                    if (!user.hwid && hwid) updates.hwid = hwid;
                    
                    if (user.ip && user.ip !== ip && ip !== 'unknown') {
                        updates.ip = ip;
                        await sendWebhook('IP Change Detected', 
                            `**User:** ${user.username}\n` +
                            `**Key:** \`${user.license_key || user.key}\`\n` +
                            `**Old IP:** \`${user.ip}\`\n` +
                            `**New IP:** \`${ip}\`\n` +
                            `**Status:** ${vpnFlag.includes('VPN') ? '⚠️ VPN/Proxy Active' : '✅ Residential'}`, 
                            0xFF4C4C // Red
                        );
                    } else if (!user.ip && ip !== 'unknown') {
                        updates.ip = ip;
                    }

                    if (Object.keys(updates).length > 0) {
                        await supabaseAdmin.from(table).update(updates).eq('id', user.id);
                    }
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
                const sig = crypto.createHmac('sha256', PRIVATE_KEY).update(responseData.token + timestamp).digest('hex');

                return res.status(200).json({
                    d: scramble({ ...responseData, sig, ts: timestamp })
                });

            case 'register':
                if (!username || !key) return res.status(400).json({ status: 'error', message: 'USERNAME_AND_KEY_REQUIRED' });
                
                // 1. Check if key is valid and not already registered
                const { data: existingKey, error: keyErr } = await supabaseAdmin
                    .from('licenses')
                    .select('*')
                    .eq('key', key)
                    .single();

                if (keyErr || !existingKey) {
                    return res.status(404).json({ status: 'error', message: 'INVALID_LICENSE_KEY' });
                }

                if (existingKey.username && existingKey.username !== 'Prestige User' && existingKey.username !== '') {
                    return res.status(400).json({ status: 'error', message: 'KEY_ALREADY_REGISTERED' });
                }

                // 2. Check if username is already taken
                const { data: nameCheck } = await supabaseAdmin
                    .from('licenses')
                    .select('username')
                    .ilike('username', username)
                    .single();

                if (nameCheck) {
                    return res.status(400).json({ status: 'error', message: 'USERNAME_TAKEN' });
                }

                // 3. Register the key
                const { error: regErr } = await supabaseAdmin
                    .from('licenses')
                    .update({ username: username, hwid: hwid })
                    .eq('key', key);

                if (regErr) {
                    return res.status(500).json({ status: 'error', message: 'REGISTRATION_FAILED', details: regErr.message });
                }

                await logToDatabase(key, 'REGISTER', `User ${username} registered key`, await getIPInfo(req));
                return res.status(200).json({ status: 'success', message: 'REGISTERED_SUCCESSFULLY' });

            case 'heartbeat':
                const { is_injected } = body;
                if (username) {
                    const info = await getIPInfo(req);
                    await logToDatabase(username, 'HEARTBEAT', `Status: ${is_injected ? 'INJECTED' : 'IDLE'}`, info);
                }
                return res.status(200).json({ status: 'success' });

            default:
                return res.status(400).json({ status: 'error', message: `UNKNOWN_ACTION_${action}` });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'INTERNAL_AUTH_ERROR' });
    }
}
