import {
	Logger,
	Config,
	Schedules,
	Activities,
	CommandManager,
	Feature,
	LANG,
	strFormat,
} from 'core';

//* Discord.js Bot - by ringoXD -
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import 'colors';
import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
const { token, syslogChannel } = Config;
process.env['FFMPEG_PATH'] = path.join(__dirname, 'ffmpeg');

import assert from 'assert';

const creset = '\x1b[0m';
const cgreen = '\x1b[32m';

//!LOGGER
Logger.teeWrite(process.stdout, 'discordbot.log');
Logger.teeWrite(process.stderr, 'discordbot.log');

//!RUN=======================

console.log(LANG.discordbot.main.botStarting);

const options = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
	],
	// ws: { properties: { $browser: "Discord iOS" }}
};

const client = new Client(options);
console.log(LANG.discordbot.main.setupActivityCalling);
Activities.setupActivity(client);

const featuresLoadPromise = fs
	.readdir(path.join(__dirname, 'packages'))
	.then((files) =>
		Promise.all(
			files.map(async (file) => {
				const module = await import(file);
				const feature: Feature = module.feature;
				if (feature == null) {
					console.log(module);
					throw new TypeError(`${file} feature is undefined`);
				}
				return feature;
			}),
		),
	)
	.then((features) => features.filter((feature) => feature.enabled))
	.then((features) =>
		Promise.all(
			features.map(async (feature) => {
				await feature.load(client);
				return feature;
			}),
		),
	);

client.on('ready', async (readyClient) => {
	const features = await featuresLoadPromise;
	await Promise.all(
		features.map((feature) => feature.onClientReady(readyClient)),
	);
	console.log(
		strFormat(LANG.discordbot.ready.loggedIn, {
			cgreen,
			creset,
			tag: readyClient.user.tag,
		}),
	);
	readyClient.user.setPresence({
		activities: [
			{
				name: LANG.discordbot.ready.presenceNameLoading,
				state: LANG.discordbot.ready.presenceStateLoading,
				type: ActivityType.Playing,
			},
		],
		status: 'dnd',
	});
	console.log(LANG.discordbot.ready.commandsRegistering);
	await CommandManager.default.setClient(readyClient);
	console.log(
		cgreen +
			strFormat(LANG.discordbot.main.commandsLoaded, [
				CommandManager.default.size,
			]) +
			creset,
	);
	console.log(
		strFormat(LANG.discordbot.ready.readyAndTime, {
			ready: cgreen + LANG.discordbot.ready.commandsReady + creset,
			time: Math.round(performance.now()) + ' ms',
		}),
	);
	const SyslogChannel = client.channels.cache.get(syslogChannel);
	assert(SyslogChannel?.isTextBased());
	SyslogChannel.send(LANG.discordbot.ready.sysLog);
});

Schedules.onShutdown(async () => {
	const SyslogChannel = client.channels.cache.get(syslogChannel);
	assert(SyslogChannel?.isTextBased());
	await SyslogChannel.send(LANG.discordbot.shutdown.sysLog);
	const features = await featuresLoadPromise;
	await Promise.all(features.map((feature) => feature.unload()));
	await Promise.all([
		client
			.destroy()
			.then(() =>
				console.log(cgreen + LANG.discordbot.shutdown.loggedOut + creset),
			),
	]);
});

client.login(token);

//!EVENTS

process.on('uncaughtException', function (err) {
	console.error(err);
});
