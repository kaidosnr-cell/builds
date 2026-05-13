const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('init-server')
        .setDescription('Automatically creates the AdvancedUI category and channels')
        .setDMPermission(false),
    
    new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Spawns the ticket setup message with dropdown')
        .setDMPermission(false),
    
    new SlashCommandBuilder()
        .setName('plans')
        .setDescription('Shows the product plans')
        .setDMPermission(false),

    new SlashCommandBuilder()
        .setName('update')
        .setDescription('Broadcasts a cheat update')
        .setDMPermission(false)
        .addStringOption(option => 
            option.setName('version')
                .setDescription('The version number (e.g. 3.1)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('changes')
                .setDescription('The update logs / changes')
                .setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
