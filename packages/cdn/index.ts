import { Feature, CommandManager, Config } from 'core';
import upload from './upload';

class CdnFeature extends Feature {
	name = 'cdn';

	enabled = Config.features?.cdn ?? true;

	onLoad() {
		CommandManager.default.addCommands(upload);
	}
}

export const feature = new CdnFeature();
