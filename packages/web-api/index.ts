import { Feature } from 'core';
import { CommandManager } from '../../internal/commands';
import config from '../../internal/config';

class WebApiFeature extends Feature {
	name = 'web-api';

	enabled = config.features?.['web-api'] ?? true;

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
