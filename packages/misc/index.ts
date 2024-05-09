import { ClientMessageHandler } from './util/messages';

import path from 'path';

import { Feature, CommandManager, Config } from 'core';
import { Client } from 'discord.js';
import { feature as perm } from 'perms';

class MiscFeature extends Feature {
	name = 'misc';

	enabled = Config.features?.misc ?? true;

	dependencies = [perm];

	messageHandler?: ClientMessageHandler;

	async onLoad(client: Client) {
		client.on('messageCreate', (message) =>
			this.messageHandler?.handleMessage(message),
		);
		await CommandManager.default.loadDirectory(
			path.join(__dirname, 'commands'),
		);
	}

	onClientReady(client: Client<true>) {
		this.messageHandler = new ClientMessageHandler(client);
	}
}

export const feature = new MiscFeature();
