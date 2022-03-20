import { Client, Intents, MessageActionRow, MessageEmbed, MessageSelectMenu, Permissions } from 'discord.js'

import { token } from './config.js'

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!')
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return
    if (interaction.commandName === 'help') {
        const slsCmdEmbed = new MessageEmbed()
            .setColor('#E1AD01')
            .setTitle('CdrBot Slash Commands')
            .addFields({
                name: "/help",
                value: "Request help with CdrBot."
            })
        const ctxCmdEmbed = new MessageEmbed()
            .setColor('#E1AD01')
            .setTitle('CdrBot Context Menu Commands')
            .addFields({
                name: "Move message",
                value: "Move a message to another Channel."
            })
        const msgCmdEmbed = new MessageEmbed()
            .setColor('#E1AD01')
            .setTitle('CdrBot Message Commands')
            .addFields({
                name: "cdr.moveMsg",
                value: "Reply to a message with this string to move that message to another Channel."
            })

        await interaction.reply({ embeds: [slsCmdEmbed, ctxCmdEmbed, msgCmdEmbed], ephemeral: true })
    }
})

client.on('messageCreate', async message => {
    if (!message.content.startsWith("cdr.moveMsg")) return
    if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) return
    if (message.type !== "REPLY") {
        message.reply({ content: "I'm sorry but you'll have to reply to a message for me to move it!" })
        return
    }
    const chans = await message.guild.channels.fetch()

    if (chans.size <= 0) {
        await message.reply("Sorry I can't see any channels.")
        return
    }

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('moveMessageSelectChannel')
                .setPlaceholder('Select channel')
                .addOptions(chans.filter(channel => channel.type === "GUILD_TEXT").map(channel => (
                    {
                        label: channel.name,
                        value: JSON.stringify({channelID: channel.id, messageID: message.reference.messageId, userID: message.author.id})
                    }
                )))
        )

    await message.reply({ content: "Move message to...", components: [row] })
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isMessageContextMenu()) return

    if (interaction.commandName === 'Move message') {
        if (!interaction.memberPermissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
            interaction.reply({ content: "I'm sorry but it seems you do not have permission to move this message!", ephemeral: true })
            return
        }
        const chans = await interaction.guild.channels.fetch()

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('moveMessageSelectChannel')
                    .setPlaceholder('Select channel')
                    .addOptions(chans.filter(channel => channel.type === "GUILD_TEXT").map(channel => (
                        {
                            label: channel.name,
                            value: JSON.stringify({channelID: channel.id, messageID: interaction.targetId, userID: interaction.member.user.id})
                        }
                    )))
            )

        await interaction.reply({ content: "Move message to...", ephemeral: true, components: [row] })
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return

    if (interaction.customId === 'moveMessageSelectChannel') {
        const { messageID, channelID, userID } = JSON.parse(interaction.values[0])
        const msg = await interaction.channel.messages.fetch(messageID)
        const channel = await interaction.guild.channels.fetch(channelID)
        const selectingID = interaction.member.user.id

        if (userID !== selectingID) {
            interaction.reply({ content: "I'm sorry but it seems you're not the user who originally wanted me to move this message!", ephemeral: true })
            return
        }

        const movedEmbed = new MessageEmbed()
            .setColor('#E1AD01')
            .setAuthor({
                name: msg.author.username,
                iconURL: msg.author.avatarURL()
            })
            .setDescription(msg.content)
            .setFooter({ text: `Message moved from #${interaction.channel.name}` })

        await interaction.deferUpdate()
        await channel.send({ embeds: [movedEmbed] })
		await interaction.editReply({ content: `Moved to ${channel.name}...`, components: [] })
	}
})

// Login to Discord with your client's token
client.login(token)