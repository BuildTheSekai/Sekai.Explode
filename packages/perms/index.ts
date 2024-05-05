import { CommandManager, Feature } from 'core';
import { Client } from 'discord.js';
import perm from './commands/perm';
import { feature as db } from 'db';

class PermsFeature extends Feature {
	enabled: boolean = true;

	name: string = 'perms';

	dependencies: Feature[] = [db];

	onLoad(client: Client<boolean>): void | PromiseLike<void> {
		CommandManager.default.addCommands([perm]);
	}
}

export const feature = new PermsFeature();
