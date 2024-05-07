import { CommandManager, Feature } from 'core';
import { Client } from 'discord.js';
import perm from './commands/perm';
import { feature as db } from 'db';
import { PermissionManager } from './PermissionManager';

class PermsFeature extends Feature {
	enabled: boolean = true;

	name: string = 'perms';

	dependencies: Feature[] = [db];

	permissions?: PermissionManager;

	onLoad(client: Client<boolean>): void | PromiseLike<void> {
		CommandManager.default.addCommands([perm]);
	}

	onClientReady(client: Client<true>): void | PromiseLike<void> {
		this.permissions = PermissionManager.forClient(client);
	}
}

export const feature = new PermsFeature();
