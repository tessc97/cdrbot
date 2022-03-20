import { SlashCommandBuilder, ContextMenuCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { clientID, token } from './config.js'

const commands = [
	new SlashCommandBuilder().setName('help').setDescription('Request help with this bot.'),
	new ContextMenuCommandBuilder().setName('Move message').setType(3),
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationCommands(clientID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);