import { ClientMessageHandler } from './util/messages';

import path from 'path';

import { Feature, CommandManager, Config } from 'core';
import { registerConfiguredFont } from './util/canvasUtils';
import { Client } from 'discord.js';

class MiscFeature extends Feature {
	name = 'misc';

	enabled = Config.features?.misc ?? true;

	messageHandler?: ClientMessageHandler;

	async onLoad(client: Client) {
		client.on('messageCreate', (message) =>
			this.messageHandler?.handleMessage(message),
		);
		registerConfiguredFont();
		await CommandManager.default.loadDirectory(
			path.join(__dirname, 'commands'),
		);
	}

	onClientReady(client: Client<true>) {
		this.messageHandler = new ClientMessageHandler(client);
	}
}

export const feature = new MiscFeature();
