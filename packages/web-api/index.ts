import { Feature } from '../../common/Feature';
import { CommandManager } from '../../internal/commands';

class WebApiFeature extends Feature {
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
