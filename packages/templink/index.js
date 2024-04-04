const { Feature } = require('../../common/Feature');
const { CommandManager } = require('../../internal/commands');
const templinkCommand = require('./command');
const { enableTempLinks, disableTempLinks } = require('./templinks');

class TempLinkFeature extends Feature {
	name = 'templink';

	onLoad() {
		enableTempLinks();
		CommandManager.default.addCommands(templinkCommand);
	}

	onUnload() {
		disableTempLinks();
	}
}

module.exports = { feature: new TempLinkFeature() };
