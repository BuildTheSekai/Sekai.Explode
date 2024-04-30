import { Feature, CommandManager, Config } from 'core';
import templinkCommand from './command';
import { enableTempLinks, disableTempLinks } from './templinks';

class TempLinkFeature extends Feature {
	name = 'templink';

	enabled = Config.features?.templink ?? true;

	onLoad() {
		enableTempLinks();
		CommandManager.default.addCommands(templinkCommand);
	}

	onUnload() {
		disableTempLinks();
	}
}

export const feature = new TempLinkFeature();
