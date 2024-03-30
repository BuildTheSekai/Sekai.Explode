import fs from 'fs';
import path from 'path';
import z from 'zod';

const tempLinkSrvConfigSchema = z.object({
	tempLinkSrvToken: z.string(),
	tempLinkSrvPostURL: z.string(),
});

const internalLinkConfigSchema = z.object({
	linkDomain: z.string(),
	linkPort: z.string(),
});

const configSchema = z
	.object({
		token: z.string(),
		cdnUploadURL: z.string(),
		cdnRootURL: z.string(),
		uploadAllowUsers: z.array(z.string()).optional(),
		cfToken: z.string().optional(),
		cfZone: z.string().optional(),
		cfPurgeUrl: z.string().optional(),
		AdminUserIDs: z.array(z.string()),
		replyCustomizeAllowedUsers: z.array(z.string()).optional(),
		mongoDBhost: z.string(),
		mongoDBport: z.string(),
		mongoDBuser: z.string(),
		mongoDBpass: z.string(),
		mongoDBdatabase: z.string(),
		syslogChannel: z.string(),
		notificationChannel: z.string(),
		language: z.string().optional(),
		fontFile: z.string().optional(),
		fontFamily: z.string().optional(),
	})
	.and(tempLinkSrvConfigSchema.or(internalLinkConfigSchema));

const config = configSchema.parse(
	JSON.parse(
		fs.readFileSync(path.join(__dirname, '..', 'config.json'), {
			encoding: 'utf-8',
		}),
	),
);

export default config;
export const { token, syslogChannel } = config;
