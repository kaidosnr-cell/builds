const crypto = require('crypto');

// Encryption Settings
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync('advancedui-secret-key-2026', 'salt', 32);
const IV_LENGTH = 16;

class SecurityManager {
    static hashKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    static encrypt(text) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    static decrypt(text) {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    static validateSession(session, requestData) {
        // Continuous Check Logic
        // Check IP match
        if (session.ip !== requestData.ip) return { valid: false, reason: 'IP_MISMATCH' };
        
        // Check HWID match
        if (session.hwid !== requestData.hwid) return { valid: false, reason: 'HWID_MISMATCH' };
        
        // Check Heartbeat (simulated)
        const now = Date.now();
        if (now - session.lastHeartbeat > 60000) return { valid: false, reason: 'SESSION_EXPIRED' };

        return { valid: true };
    }
}

module.exports = SecurityManager;
