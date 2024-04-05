import { ClientMessageHandler } from './util/messages';

import fs from 'fs';
import path from 'path';

import { Feature } from '../../common/Feature';
import { CommandManager } from '../../internal/commands';
import { registerConfiguredFont } from './util/canvasUtils';
import { Client } from 'discord.js';

class MiscFeature extends Feature {
	name = 'misc';

	messageHandler?: ClientMessageHandler;

	onLoad(client: Client) {
		client.on('messageCreate', (message) =>
			this.messageHandler?.handleMessage(message),
		);
		registerConfiguredFont();
		fs.readdirSync(path.join(__dirname, 'commands'), {
			withFileTypes: true,
		}).forEach((file) => {
			const ext = path.extname(file.name);
			if (!file.isFile() || (ext != '.js' && ext != '.ts')) return;
			let cmds = require(path.join(__dirname, 'commands', file.name));
			if ('default' in cmds) {
				cmds = cmds.default;
			}
			CommandManager.default.addCommands(cmds);
		});
	}

	onClientReady(client: Client<true>) {
		this.messageHandler = new ClientMessageHandler(client);
	}
}

export const feature = new MiscFeature();
