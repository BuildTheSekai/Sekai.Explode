import { Feature } from 'core';
import { CommandManager } from '../../internal/commands';
import config from '../../internal/config';
import upload from './upload';

class CdnFeature extends Feature {
	name = 'cdn';

	enabled = config.features?.cdn ?? true;

	onLoad() {
		CommandManager.default.addCommands(upload);
	}
}

export const feature = new CdnFeature();
