import { Feature } from '../../common/Feature';
import { CommandManager } from '../../internal/commands';
import config from '../../internal/config';
import { feature as db } from 'db';

class AdminFeature extends Feature {
	name = 'admin';

	enabled = config.features?.admin ?? true;

	dependencies = [db];

	onLoad() {
		CommandManager.default.addCommands([
			require('./commands/globalban'),
			require('./commands/updater'),
		]);
	}
}

export const feature = new AdminFeature();
