import { Client, Guild, GuildMember, Role, User } from 'discord.js';
import { feature as db } from 'db';

interface PermSchema {
	client: string;
	guild: string;
	name: string;
	group: string;
}

export type Mentionable = GuildMember | Role | User;

export class PermissionManager {
	static readonly #instances = new Map<string, PermissionManager>();

	static forClient(client: Client<true>): PermissionManager {
		const id = client.application.id;
		const existing = PermissionManager.#instances.get(id);
		if (existing != null) {
			return existing;
		}
		const created = new PermissionManager(client);
		PermissionManager.#instances.set(id, created);
		return created;
	}

	readonly #client: Client<true>;

	private constructor(client: Client<true>) {
		this.#client = client;
	}

	async set(guild: Guild, name: string, group: Mentionable): Promise<void> {
		const client = this.#client.application.id;
		const connection = db.connection;
		const collection = connection.collection<PermSchema>('perms');
		const guildId = guild.id;
		await collection.updateOne(
			{ client, guild: guildId, name },
			{ client, guild: guildId, name, group: group.id },
		);
	}

	async get(guild: Guild, name: string): Promise<Mentionable | null> {
		const client = this.#client.application.id;
		const connection = db.connection;
		const collection = connection.collection<PermSchema>('perms');
		const result = await collection.findOne({ client, guild: guild.id, name });
		if (result == null) {
			return null;
		}
		const { group } = result;
		return (
			guild.members.resolve(group) ??
			guild.roles.resolve(group) ??
			this.#client.users.resolve(group)
		);
	}
}
