require('dotenv').config();
const { REST, Routes } = require('discord.js');  // Ensure `Routes` is used here

// Replace 'YOUR_GUILD_ID' with the actual ID of your guild for testing
const GUILD_ID = '1266854942791041075';

const commands = [
    {
        name: 'sell',
        description: 'List an item for sale',
    },
    {
        name: 'close',
        description: 'Close a ticket',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Register commands for a specific guild
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),  // Make sure `Routes` is used here
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');

        // Optionally, list all registered commands for debugging
        const registeredCommands = await rest.get(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),  // Make sure `Routes` is used here
        );
        console.log('Registered Commands:', registeredCommands);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();