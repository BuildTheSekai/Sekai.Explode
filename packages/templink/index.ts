import { Feature } from 'core';
import { CommandManager } from '../../internal/commands';
import templinkCommand from './command';
import { enableTempLinks, disableTempLinks } from './templinks';
import config from '../../internal/config';

class TempLinkFeature extends Feature {
	name = 'templink';

	enabled = config.features?.templink ?? true;

	onLoad() {
		enableTempLinks();
		CommandManager.default.addCommands(templinkCommand);
	}

	onUnload() {
		disableTempLinks();
	}
}

export const feature = new TempLinkFeature();
