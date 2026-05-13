const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    PermissionsBitField, 
    ChannelType,
    ButtonBuilder,
    ButtonStyle 
} = require('discord.js');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- GLOBAL ERROR HANDLING (Anti-Crash) ---
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('AdvancedUI Bot is ready.');
});

// --- COMMAND HANDLING (Simulated for setup) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'init-server') {
        console.log(`Command /init-server triggered. Guild ID: ${interaction.guildId}`);
        const guild = interaction.guild || await client.guilds.fetch(interaction.guildId).catch(e => {
            console.error('Fetch Guild Error:', e);
            return null;
        });

        if (!guild) {
            return await interaction.reply({ content: '❌ This command must be run inside a server.', ephemeral: true });
        }
        if (!interaction.memberPermissions || !interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });

        try {
            // 1. Create Information Category
            const infoCat = await guild.channels.create({
            name: 'Information',
            type: ChannelType.GuildCategory
        });

        await guild.channels.create({ name: '📢・news', type: ChannelType.GuildText, parent: infoCat.id });
        await guild.channels.create({ name: '📢・dump', type: ChannelType.GuildText, parent: infoCat.id });
        await guild.channels.create({ name: '📜・terms', type: ChannelType.GuildText, parent: infoCat.id });
        await guild.channels.create({ name: '📷・media', type: ChannelType.GuildText, parent: infoCat.id });

        // 2. Create Distort Category
        const distortCat = await guild.channels.create({
            name: 'Distort',
            type: ChannelType.GuildCategory
        });

        const plansChan = await guild.channels.create({ name: '💲・plans', type: ChannelType.GuildText, parent: distortCat.id });
        const updatesChan = await guild.channels.create({ name: '🏆・updates', type: ChannelType.GuildText, parent: distortCat.id });
        await guild.channels.create({ name: '🥳・reviews', type: ChannelType.GuildText, parent: distortCat.id });
        await guild.channels.create({ name: '🎥・showcase', type: ChannelType.GuildText, parent: distortCat.id });

        // 3. Create Tickets Category
        const ticketCat = await guild.channels.create({
            name: 'Tickets',
            type: ChannelType.GuildCategory
        });

        const purchaseChan = await guild.channels.create({ name: '💸・purchase', type: ChannelType.GuildText, parent: ticketCat.id });

        // 4. Create Active Tickets Category (Internal)
        const logChan = await guild.channels.create({ 
            name: '📂・bot-logs', 
            type: ChannelType.GuildText, 
            parent: distortCat.id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });

        // 4. Create Active Tickets Category (Internal)
        const activeTicketsCat = await guild.channels.create({
            name: '🎫 ACTIVE TICKETS',
            type: ChannelType.GuildCategory
        });

        // 5. Auto-Setup and Test Texts
        // --- Purchase Ticket ---
        const ticketEmbed = new EmbedBuilder()
            .setTitle('Open A Ticket Below:')
            .setColor(config.accentColor)
            .setImage('https://via.placeholder.com/600x300?text=DISTORT+TICKETS');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Select One')
            .addOptions([
                { label: 'Purchase', description: 'Open a ticket to purchase Distort.', value: 'ticket_purchase', emoji: '💸' },
                { label: 'Support', description: 'Open a ticket to get support.', value: 'ticket_support', emoji: '🛠️' }
            ]);

        await purchaseChan.send({ embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
        await purchaseChan.send('✅ **Ticket System Test:** Purchase system is active.');

        // --- Plans ---
        const plansEmbed = new EmbedBuilder()
            .setTitle('Distort Plans')
            .setColor(config.accentColor)
            .setDescription(
                '**Roblox Plans**\n' +
                '👑 **Public Build** - $20 *usd*\n' +
                '🚀 **Private Build** - $50 *usd*\n' +
                '🔒 **Slotted** - *No info yet*'
            )
            .setImage('https://via.placeholder.com/600x300?text=DISTORT+PLANS');

        await plansChan.send({ embeds: [plansEmbed] });
        await plansChan.send('✅ **Plans System Test:** Product catalog is loaded.');

        // --- Updates ---
        const updateEmbed = new EmbedBuilder()
            .setColor(config.accentColor)
            .addFields(
                { name: 'Version:', value: '```1.0```' },
                { name: 'Update:', value: '```- Initial Release of Distort\n- Integrated Ticket System\n- Server Initialized```' }
            )
            .setFooter({ text: 'Distort has now updated!' });

        await updatesChan.send({ embeds: [updateEmbed] });
        await updatesChan.send('✅ **Updates System Test:** Update logs are active.');

        await interaction.followUp({ content: '✅ Distort structure initialized! Check your channel list.', ephemeral: true });
        } catch (error) {
            console.error('Initialization Error:', error);
            await interaction.followUp({ content: `❌ An error occurred during initialization: ${error.message}`, ephemeral: true });
        }
    }

    if (commandName === 'setup-tickets') {
        const embed = new EmbedBuilder()
            .setTitle('Open A Ticket Below:')
            .setColor(config.accentColor)
            .setImage('https://via.placeholder.com/600x300?text=IMAGE+PLACEHOLDER'); // Placeholder for user's photo

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Select One')
            .addOptions([
                {
                    label: 'Purchase',
                    description: 'Open a ticket to purchase a product.',
                    value: 'ticket_purchase',
                    emoji: '📦'
                },
                {
                    label: 'Support',
                    description: 'Open a ticket to get support.',
                    value: 'ticket_support',
                    emoji: '🛠️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'plans') {
        const embed = new EmbedBuilder()
            .setTitle('Plans')
            .setColor(config.accentColor)
            .setDescription(
                '**Roblox Plans**\n' +
                '👑 **Public Build** - $20 *usd*\n' +
                '🚀 **Private Build** - $50 *usd*\n' +
                '🔒 **Slotted** - *No info yet*\n\n' +
                '*Descriptions will be added soon...*'
            )
            .setImage('https://via.placeholder.com/600x300?text=PLANS+IMAGE+PLACEHOLDER');

        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'update') {
        if (!interaction.memberPermissions || !interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: '❌ Only administrators can post updates.', ephemeral: true });
        }
        const version = interaction.options.getString('version');
        const changes = interaction.options.getString('changes');

        const embed = new EmbedBuilder()
            .setColor(config.accentColor)
            .setThumbnail('https://via.placeholder.com/100?text=LOGO') // Small logo on top right
            .addFields(
                { name: 'Version:', value: `\`\`\`${version}\`\`\`` },
                { name: 'Update:', value: `\`\`\`${changes}\`\`\`` }
            )
            .setFooter({ text: 'AdvancedUI has now updated!\nStay Hidden, Stay Undetected.' })
            .setImage('https://via.placeholder.com/600x300?text=UPDATE+IMAGE+PLACEHOLDER');

        await interaction.reply({ embeds: [embed] });
    }
});

// --- INTERACTION HANDLING (Dropdowns & Modals) ---
client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select') {
            const selection = interaction.values[0];

            if (selection === 'ticket_purchase') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_purchase')
                    .setTitle('Please answer the following:');

                const productInput = new TextInputBuilder()
                    .setCustomId('purchase_product')
                    .setLabel("What product are you purchasing?")
                    .setPlaceholder('Roblox Private Lifetime, FiveM Public Monthly etc')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const methodInput = new TextInputBuilder()
                    .setCustomId('purchase_method')
                    .setLabel("What payment method?")
                    .setPlaceholder('Paypal, Giftcards, Crypto, Cashapp, BSB, Other etc')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(productInput),
                    new ActionRowBuilder().addComponents(methodInput)
                );

                await interaction.showModal(modal);
            } else if (selection === 'ticket_support') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_support')
                    .setTitle('Please answer the following:');

                const issueInput = new TextInputBuilder()
                    .setCustomId('support_issue')
                    .setLabel("Whats the issue?")
                    .setPlaceholder('Tell us what you need help with...')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(issueInput));

                await interaction.showModal(modal);
            }
        }
    }

    if (interaction.isModalSubmit()) {
        const type = interaction.customId === 'modal_purchase' ? 'Purchase' : 'Support';
        const user = interaction.user;

        // Create the ticket channel
        const channel = await interaction.guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            parent: config.ticketCategoryId,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
                {
                    id: config.supportRoleId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
            ],
        });

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${type} Ticket | ${user.username}`)
            .setColor(config.accentColor)
            .setDescription(`Welcome <@${user.id}>,\nSupport will be with you shortly.`)
            .addFields(
                { name: 'User:', value: `<@${user.id}>`, inline: true },
                { name: 'Type:', value: type, inline: true }
            );

        if (interaction.customId === 'modal_purchase') {
            welcomeEmbed.addFields(
                { name: 'Product:', value: interaction.fields.getTextInputValue('purchase_product') },
                { name: 'Method:', value: interaction.fields.getTextInputValue('purchase_method') }
            );
        } else {
            welcomeEmbed.addFields(
                { name: 'Issue:', value: interaction.fields.getTextInputValue('support_issue') }
            );
        }

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️'),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await channel.send({ embeds: [welcomeEmbed], components: [buttons] });
        await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });

        // Log the event
        const logChan = interaction.guild.channels.cache.find(c => c.name === '📂・bot-logs');
        if (logChan) {
            const logEmbed = new EmbedBuilder()
                .setTitle('Ticket Created')
                .setColor('#FFFF00')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})` },
                    { name: 'Type', value: type }
                )
                .setTimestamp();
            await logChan.send({ embeds: [logEmbed] });
        }
    }
});

// --- BUTTON HANDLING (Claim/Close) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'claim_ticket') {
        const embed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(embed)
            .setFooter({ text: `Claimed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
        
        const disabledButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claimed').setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
        );

        await interaction.update({ embeds: [newEmbed], components: [disabledButtons] });
        await interaction.followUp({ content: `<@${interaction.user.id}> has claimed this ticket.`, ephemeral: false });
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply('Closing ticket in 5 seconds...');
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (e) {
                console.error('Failed to delete channel:', e);
            }
        }, 5000);
    }
});

client.login(config.token);
