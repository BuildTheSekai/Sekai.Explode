import { Feature, CommandManager, Config } from 'core';

class WebApiFeature extends Feature {
	name = 'web-api';

	enabled = Config.features?.['web-api'] ?? true;

	onLoad() {
		CommandManager.default.addCommands([
			require('./commands/check'),
			require('./commands/mc_srvlookup'),
			require('./commands/mcstatus'),
			require('./commands/nettool'),
			require('./commands/nyanpass'),
		]);
	}
}

export const feature = new WebApiFeature();
