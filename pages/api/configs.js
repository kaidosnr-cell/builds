import SecurityManager from '../../server/auth';

// Simulated DB for configurations
const CONFIGS_DB = {
    'PRS-DEMO-KEY-2026': [
        { id: 1, name: 'Legit Main', game: 'Roblox', data: 'encrypted_string_here', updated: '2026-05-12T15:00:00Z' }
    ]
};

export default function handler(req, res) {
    const { key, action, configName, configData } = req.body;

    if (!key || !CONFIGS_DB[key]) {
        if (action === 'get') return res.status(200).json({ configs: [] });
        return res.status(401).json({ message: 'UNAUTHORIZED' });
    }

    switch (action) {
        case 'get':
            return res.status(200).json({ configs: CONFIGS_DB[key] });

        case 'save':
            const newConfig = {
                id: Date.now(),
                name: configName,
                game: 'Universal',
                data: configData, // Should be pre-encrypted by loader
                updated: new Date().toISOString()
            };
            CONFIGS_DB[key].push(newConfig);
            return res.status(200).json({ status: 'success', configId: newConfig.id });

        default:
            return res.status(400).json({ message: 'Invalid Action' });
    }
}
