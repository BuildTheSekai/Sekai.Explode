import { Feature } from 'core';

class PermsFeature extends Feature {
	enabled: boolean = true;

	name: string = 'perms';
}

export const feature = new PermsFeature();
