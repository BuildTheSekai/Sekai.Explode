const { Feature } = require('../../common/Feature');
const { CommandManager } = require('../../internal/commands');

class AdminFeature extends Feature {
	onLoad() {
		CommandManager.default.addCommands([
			require('./commands/globalban'),
			require('./commands/updater'),
		]);
	}
}

module.exports = { feature: new AdminFeature() };
