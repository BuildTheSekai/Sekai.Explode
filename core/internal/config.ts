import * as fs from 'fs';
import * as path from 'path';
import z from 'zod';
import { setLanguage } from '../util/languages';

const tempLinkSrvConfigSchema = z.object({
	tempLinkSrvToken: z.string(),
	tempLinkSrvPostURL: z.string(),
});

const internalLinkConfigSchema = z.object({
	linkDomain: z.string(),
	linkPort: z.string(),
});

const mongoDBConfigSchema = z.object({
	database: z.literal('mongo').optional(),
	mongoDBhost: z.string(),
	mongoDBport: z.string(),
	mongoDBuser: z.string(),
	mongoDBpass: z.string(),
	mongoDBdatabase: z.string(),
});

const lokiJSConfigSchema = z.object({
	database: z.literal('loki'),
	lokiJSfile: z.string().optional(),
});

const configSchema = z
	.object({
		token: z.string(),
		features: z
			.object({
				admin: z.boolean().optional(),
				cdn: z.boolean().optional(),
				misc: z.boolean().optional(),
				player: z.boolean().optional(),
				templink: z.boolean().optional(),
				'web-api': z.boolean().optional(),
			})
			.optional(),
		cdnUploadURL: z.string(),
		cdnRootURL: z.string(),
		uploadAllowUsers: z.array(z.string()).optional(),
		cfToken: z.string().optional(),
		cfZone: z.string().optional(),
		cfPurgeUrl: z.string().optional(),
		AdminUserIDs: z.array(z.string()),
		replyCustomizeAllowedUsers: z.array(z.string()).optional(),
		syslogChannel: z.string(),
		notificationChannel: z.string(),
		language: z.string().optional(),
		fontFile: z.string().optional(),
		fontFamily: z.string().optional(),
	})
	.and(mongoDBConfigSchema.or(lokiJSConfigSchema))
	.and(tempLinkSrvConfigSchema.or(internalLinkConfigSchema));

function loadJson(path: string) {
	return JSON.parse(
		fs.readFileSync(path, {
			encoding: 'utf-8',
		}),
	);
}

const config = configSchema.parse(
	loadJson(path.join(__dirname, '..', '..', 'config.json')),
);

setLanguage(
	loadJson(
		path.join(
			__dirname,
			'..',
			'..',
			'language',
			(config.language ?? 'default') + '.json',
		),
	),
);

export default config;
export const { token, syslogChannel } = config;
