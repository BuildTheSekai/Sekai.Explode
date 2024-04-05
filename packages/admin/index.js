const { Feature } = require('../../common/Feature');
const { CommandManager } = require('../../internal/commands');
const db = require('db');

class AdminFeature extends Feature {
	name = 'admin';

	dependencies = [db.feature];

	onLoad() {
		CommandManager.default.addCommands([
			require('./commands/globalban'),
			require('./commands/updater'),
		]);
	}
}

module.exports = { feature: new AdminFeature() };
