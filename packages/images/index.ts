import { CommandManager, Config, Feature } from 'core';
import { registerConfiguredFont } from './util/canvasUtils';
import { Client } from 'discord.js';
import path from 'path';

class ImagesFeature extends Feature {
	enabled: boolean = Config.features?.images ?? true;

	name: string = 'images';

	async onLoad(client: Client<boolean>): Promise<void> {
		registerConfiguredFont();
		await CommandManager.default.loadDirectory(
			path.join(__dirname, 'commands'),
		);
	}
}

export const feature = new ImagesFeature();
