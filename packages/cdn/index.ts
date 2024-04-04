import { Feature } from '../../common/Feature';
import { CommandManager } from '../../internal/commands';
import upload from './upload';

class CdnFeature extends Feature {
	name = 'cdn';

	onLoad() {
		CommandManager.default.addCommands(upload);
	}
}

export const feature = new CdnFeature();
