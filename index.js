require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
    ChannelType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

// File path for storing the messageData
const dataFilePath = path.join(__dirname, "messageData.json");

// Load messageData from file if it exists
function loadData() {
    if (fs.existsSync(dataFilePath)) {
        const rawData = fs.readFileSync(dataFilePath);
        return new Map(JSON.parse(rawData));
    }
    return new Map();
}

// Save messageData to file
function saveData() {
    fs.writeFileSync(dataFilePath, JSON.stringify([...messageData]));
}

// Initialize the messageData map
const messageData = loadData();

// Save the data whenever the process exits
process.on("exit", saveData);
process.on("SIGINT", () => {
    saveData();
    process.exit();
});
process.on("SIGTERM", () => {
    saveData();
    process.exit();
});

const SALES_CHANNEL_ID = "11272953526045380679";
const TRANSCRIPT_CHANNEL_ID = "1272953423846838343"; // Define the sales channel ID here

client.once("ready", () => {
    console.log("Bot is online!");
});

client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isCommand()) {
            if (interaction.commandName === "sell") {
                // ... (Modal creation code remains the same) ...
                await interaction.showModal(modal);
            } else if (interaction.commandName === "close") {
                // ... (Modal creation code remains the same) ...
                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === "sellModal") {
                // ... (Modal submission code remains the same) ...
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply(); // Added await here
                    } catch (error) {
                        console.error("Error deleting modal reply:", error);
                    }
                }, 10000);
            } else if (interaction.customId === "closeModal") {
                // ... (Modal submission code remains the same) ...
            }
        } else if (interaction.isButton()) {
            const { customId, user, message } = interaction;

            if (customId.startsWith("confirmSell-")) {
                // ... (Confirm sell code remains the same) ...
                await interaction.editReply({
                    content: "Currency listing confirmed and posted.",
                    ephemeral: true,
                });
                // Removed `await interaction.deleteReply()` here
            } else if (customId.startsWith("cancelSell-")) {
                await interaction.editReply({ // Changed to editReply
                    content: "Currency listing cancelled.",
                    ephemeral: true,
                });
            } else if (customId.startsWith("buy-")) {
                // ... (Buy code remains the same) ...
                await interaction.editReply({ // Changed to editReply
                    content: "Ticket created successfully.",
                    ephemeral: true,
                });
                await interaction.followUp({
                    content: `Ticket channel created: ${ticketChannel}`,
                    ephemeral: true,
                });
            } else if (customId.startsWith("delist-")) {
                // ... (Delist code remains the same) ...
                await interaction.editReply({ // Changed to editReply
                    content: "Item listing delisted successfully.",
                    ephemeral: true,
                });
            }
        }
    } catch (error) {
        console.error("Error handling interaction:", error);
        await interaction.reply({
            content: "An error occurred while processing your request.",
            ephemeral: true,
        });
    }
});

// Ensure `client.on("messageCreate")` is outside of the `interactionCreate` handler
client.on("messageCreate", async (message) => {
    if (message.content.startsWith("!transcript") && message.channel.type === ChannelType.GuildText) {
        const channel = message.channel;
        const transcriptChannel = await client.channels.fetch(TRANSCRIPT_CHANNEL_ID);

        if (!transcriptChannel || !transcriptChannel.isTextBased()) {
            return message.reply("Transcript channel not found.");
        }

        // Fetch messages from the ticket channel
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages.reverse().map(msg => `${msg.author.tag}: ${msg.content}`).join("\n");

        // Send the transcript to the transcript channel
        await transcriptChannel.send({
            content: `**Transcript of ${channel.name}**\n\n${transcript}`,
        });

        await message.reply("Transcript sent to the specified channel.");
    }
});

// Save data on bot disconnection or reconnection
client.on("shardDisconnect", () => saveData());
client.on("shardReconnecting", () => saveData());

client.login(process.env.BOT_TOKEN);