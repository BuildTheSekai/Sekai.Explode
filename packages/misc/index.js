const fs = require('fs');
const path = require('path');

const { Feature } = require('../../common/Feature');
const { CommandManager } = require('../../internal/commands');
const { registerConfiguredFont } = require('./util/canvasUtils');

class MiscFeature extends Feature {
	onLoad() {
		registerConfiguredFont();
		fs.readdirSync(path.join(__dirname, 'commands'), {
			withFileTypes: true,
		}).forEach((file) => {
			const ext = path.extname(file.name);
			if (!file.isFile() || (ext != '.js' && ext != '.ts')) return;
			let cmds = require(path.join(__dirname, 'commands', file.name));
			if ('default' in cmds) {
				cmds = cmds.default;
			}
			CommandManager.default.addCommands(cmds);
		});
	}
}

module.exports = { feature: new MiscFeature() };
