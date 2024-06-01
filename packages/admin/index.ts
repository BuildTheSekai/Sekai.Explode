import { Feature, CommandManager, Config } from 'core';
import { feature as db } from 'db';
import globalban from './commands/globalban';
import updater from './commands/updater';

class AdminFeature extends Feature {
	name = 'admin';

	enabled = Config.features?.admin ?? true;

	dependencies = [db];

	async onLoad() {
		CommandManager.default.addCommands([globalban, updater]);
	}
}

export const feature = new AdminFeature();
