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
     AttachmentBuilder,
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

const SALES_CHANNEL_ID = "1272953526045380679";
const TRANSCRIPT_CHANNEL_ID = "1272953423846838343";
const command_id = "1266854942791041078";// Define the sales channel ID here

client.once("ready", () => {
    console.log("Bot is online!");
});

client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isCommand()) {
            if (interaction.commandName === "sell") {
                console.log(interaction.user)
                const modal = new ModalBuilder()
                    .setCustomId("sellModal")
                    .setTitle("List an Item for Sale");

                const currencyNameInput = new TextInputBuilder()
                    .setCustomId("currencyName")
                    .setLabel("Currency to Buy")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const amountInput = new TextInputBuilder()
                    .setCustomId("amount")
                    .setLabel("Amount")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const currencyInput = new TextInputBuilder()
                    .setCustomId("currency")
                    .setLabel("Currency to Sell")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const rateInput = new TextInputBuilder()
                    .setCustomId("rate")
                    .setLabel("Rate")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(currencyNameInput),
                    new ActionRowBuilder().addComponents(amountInput),
                    new ActionRowBuilder().addComponents(currencyInput),
                    new ActionRowBuilder().addComponents(rateInput),
                );

                await interaction.showModal(modal);
            } else if (interaction.commandName === "close") {
                const modal = new ModalBuilder()
                    .setCustomId("closeModal")
                    .setTitle("Close a Ticket");

                const ticketIdInput = new TextInputBuilder()
                    .setCustomId("ticketId")
                    .setLabel("Ticket ID")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const amountInput = new TextInputBuilder()
                    .setCustomId("closeAmount")
                    .setLabel("Amount")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const currencyInput = new TextInputBuilder()
                    .setCustomId("closeCurrency")
                    .setLabel("Currency")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(ticketIdInput),
                    new ActionRowBuilder().addComponents(amountInput),
                    new ActionRowBuilder().addComponents(currencyInput),
                );

                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === "sellModal") {
                const currencyName = interaction.fields.getTextInputValue("currencyName");
                const amount = interaction.fields.getTextInputValue("amount");
                const currency = interaction.fields.getTextInputValue("currency");
                const rate = interaction.fields.getTextInputValue("rate");

                const uniqueId = `item-${Date.now()}`;

                const confirmEmbed = new EmbedBuilder()
                    .setTitle("Confirm Item Listing")
                    .setDescription(
                        `Are you sure you want to list the following item?\n\n` +
                        `**Currency to Buy:** ${currencyName}\n` +
                        `**Amount:** ${amount}\n` +
                        `**Currency to Sell:** ${currency}\n` +
                        `**Rate:** ${rate}`,
                    )
                    .setFooter({
                        text: 'Click "Yes" to confirm or "No" to cancel.',
                    });

                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirmSell-${uniqueId}`)
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`cancelSell-${uniqueId}`)
                        .setLabel("No")
                        .setStyle(ButtonStyle.Danger),
                );

                const tempMessage = await interaction.reply({
                    embeds: [confirmEmbed],
                    components: [confirmRow],
                    fetchReply: true,
                    ephemeral: true,
                });
                messageData.set(uniqueId, {
                    currencyName,
                    amount,
                    currency,
                    rate,
                    creatorId: interaction.user.id,
                    tempMessageId: tempMessage.id,
                });

                saveData(); // Save data after setting it

                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch (error) {
                        console.error("Error deleting modal reply:", error);
                    }
                }, 10000);
            } else if (interaction.customId === "closeModal") {
                const ticketId = interaction.fields.getTextInputValue("ticketId");
                const amount = interaction.fields.getTextInputValue("closeAmount");
                const currency = interaction.fields.getTextInputValue("closeCurrency");

                // Fetch the sales channel by ID
                const salesChannel = await interaction.guild.channels.fetch(SALES_CHANNEL_ID)
                    .catch(error => {
                        console.error('Error fetching sales channel:', error);
                        return null;
                    });

                if (salesChannel && salesChannel.isTextBased()) {
                    const embed = new EmbedBuilder()
                        .setTitle("🤝Successfull Trade")
                        .addFields(
                            { name: "Amount", value: amount, inline: true },
                            { name: "Currency", value: currency, inline: true }
                        )
                        .setFooter({
                            text: "Latest Trade.",
                        });

                    await salesChannel.send({ embeds: [embed] });
                    await interaction.reply({
                        content: "Ticket details posted to sales channel.",
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: "Sales channel not found.",
                        ephemeral: true,
                    });
                }
            }
        } else if (interaction.isButton()) {
            const { customId, user, message } = interaction;

            if (customId.startsWith("confirmSell-")) {
                const uniqueId = customId.replace("confirmSell-", "");
                await interaction.deferReply({ ephemeral: true });

                const itemInfo = messageData.get(uniqueId);

                if (!itemInfo) {
                    return interaction.editReply({
                        content: "Could not find the item listing.",
                    });
                }

                    const embed = new EmbedBuilder()
                    .setTitle("💵 Currency Listing")
                    .addFields(
                        { name: "Currency to Buy", value: `\`\`\`Name: ${itemInfo.currencyName}\`\`\``, inline: true },
                        { name: "Amount", value: `\`\`\`Amount: ${itemInfo.amount}\`\`\``, inline: true },
                        { name: "Currency to Sell", value: `\`\`\`Currency: ${itemInfo.currency}\`\`\``, inline: true },
                        { name: "Rate", value: `\`\`\`Rate: ${itemInfo.rate}\`\`\``, inline: true }
                    )


                    .setFooter({
                        text: "Use the buttons below to buy or delist the item.",
                    });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy-${uniqueId}`)
                        .setLabel("Buy")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`delist-${uniqueId}`)
                        .setLabel("Delist")
                        .setStyle(ButtonStyle.Danger),
                );

                const newMessage = await interaction.channel.send({
                    embeds: [embed],
                    components: [row],
                });

                // Update messageData with the new message ID
                messageData.set(uniqueId, {
                    ...itemInfo,
                    messageId: newMessage.id,
                });

                saveData(); // Save data after updating it

                await interaction.editReply({
                    content: "Currency listing confirmed and posted.",
                    ephemeral: true,
                });
                await interaction.deleteReply();
            } else if (customId.startsWith("cancelSell-")) {
                await interaction.reply({
                    content: "Currency listing cancelled.",
                    ephemeral: true,
                });
                await interaction.deleteReply();
            } else if (customId.startsWith("buy-")) {
                const uniqueId = customId.replace("buy-", "");

                const itemInfo = messageData.get(uniqueId);

                if (!itemInfo) {
                    return interaction.reply({
                        content: "Item not found.",
                        ephemeral: true,
                    });
                }

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}-${uniqueId}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: itemInfo.creatorId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });

                const ticketEmbed = new EmbedBuilder()
                    .setTitle("Ticket Created")
                    .setDescription("Please provide details for the transaction.")
                    .addFields(
                        { name: "Currency to Buy\n", value: itemInfo.currencyName, inline: true },
                        { name: "Amount\n", value: itemInfo.amount, inline: true },
                        { name: "Currency to Sell\n", value: itemInfo.currency, inline: true },
                        { name: "Rate", value: itemInfo.rate, inline: true },
                    )
                    .setFooter({
                        text: "Use the /close command to close this ticket.",
                    });

                await ticketChannel.send({
                    content: `<@${itemInfo.creatorId}>`,
                    embeds: [ticketEmbed],
                });

                await interaction.reply({
                    content: "Ticket created successfully.",
                    ephemeral: true,
                });

                await interaction.followUp({
                    content: `Ticket channel created: ${ticketChannel}`,
                    ephemeral: true,
                });
            } else if (customId.startsWith("delist-")) {
            
                const uniqueId = customId.replace("delist-", "");

                const itemInfo = messageData.get(uniqueId);
                

                if (!itemInfo) {
                    return interaction.reply({
                        content: "Item not found.",
                        ephemeral: true,
                    });
                }
                if(itemInfo.creatorId !== interaction.user.id){
                    return;
                }

                // Remove the item listing from the channel
                const listingMessage = await interaction.channel.messages.fetch(itemInfo.messageId).catch(console.error);
                if (listingMessage) {
                    await listingMessage.delete().catch(console.error);
                }

                // Remove the item from the messageData map
                messageData.delete(uniqueId);
                saveData(); // Save data after deleting it

                await interaction.reply({
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
client.on("messageCreate", async (message) => {
    if (message.content === "!transcript") {
        const channel = message.channel;

        if (!channel.name.startsWith("ticket-")) {
            return message.reply("This command can only be used in ticket channels.");
        }

        let messages = [];
        let fetchedMessages;

        try {
            do {
                fetchedMessages = await channel.messages.fetch({
                    limit: 100,
                    before: fetchedMessages ? fetchedMessages.last().id : undefined,
                });
                messages = messages.concat(Array.from(fetchedMessages.values()));
            } while (fetchedMessages.size >= 100);
        } catch (error) {
            console.error("Error fetching messages for transcript:", error);
            return message.reply("An error occurred while fetching the transcript.");
        }

        messages.reverse();

        const transcript = messages.map(msg => `${msg.author.tag}: ${msg.content}`).join("\n");

        // Save the transcript to a file
        const transcriptFilePath = path.join(__dirname, `transcript-${channel.name}.txt`);
        fs.writeFileSync(transcriptFilePath, transcript);

        // Send the transcript to the specified channel
        const transcriptChannel = await message.guild.channels.fetch(TRANSCRIPT_CHANNEL_ID);
        const attachment = new AttachmentBuilder(transcriptFilePath);

        await transcriptChannel.send({
            content: `Transcript of ${channel.name}`,
            files: [attachment],
        });

        await message.reply("Transcript has been sent to the specified channel.");
        

        // Fetch and update the listing with "Sold" status
        const uniqueId = channel.name.split('-').pop(); // Extract uniqueId from channel name
       
        const itemInfo = messageData.get(`item-${uniqueId}`);
        

        if (itemInfo) {
            
            const listingMessage = await message.guild.channels.cache
                .get(command_id)
                .messages.fetch(itemInfo.messageId)
                .catch(console.error);
           

            if (listingMessage) {
                const embed = listingMessage.embeds[0];
                const updatedEmbed = EmbedBuilder.from(embed)
                    .setTitle("💵 Currency Listing - Sold")
                    .setFooter({ text: "This item has been sold." });
               


                const soldButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`sold-${uniqueId}`)
                        .setLabel("Sold")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                );
                


                await listingMessage.edit({
                    embeds: [updatedEmbed],
                    components: [soldButton],
                });
                          }
                        }
                    }
                });


    //    await message.reply("Transcript has been sent to the specified channel.");
  //  }
//});

client.login(process.env.BOT_TOKEN);
