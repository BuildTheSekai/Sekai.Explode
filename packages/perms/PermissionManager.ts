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

	async set(
		guild: Guild,
		name: string,
		group: Mentionable,
	): Promise<Permission> {
		const client = this.#client.application.id;
		const connection = db.connection;
		const collection = connection.collection<PermSchema>('perms');
		const guildId = guild.id;
		await collection.updateOne(
			{ client, guild: guildId, name },
			{ client, guild: guildId, name, group: group.id },
		);
		return new Permission(this.#client, guild, name, [group], this);
	}

	async get(guild: Guild, name: string): Promise<Permission | null> {
		const client = this.#client.application.id;
		const connection = db.connection;
		const collection = connection.collection<PermSchema>('perms');
		const result = await collection.findOne({ client, guild: guild.id, name });
		if (result == null) {
			return null;
		}
		const { group } = result;
		const mentionable =
			guild.members.resolve(group) ??
			guild.roles.resolve(group) ??
			this.#client.users.resolve(group);
		const mentions = mentionable != null ? [mentionable] : [];
		return new Permission(this.#client, guild, name, mentions, this);
	}

	async remove(guild: Guild, name: string): Promise<void> {
		const client = this.#client.application.id;
		const connection = db.connection;
		const collection = connection.collection<PermSchema>('perms');
		await collection.deleteOne({ client, guild: guild.id, name });
	}
}

export class Permission {
	readonly client: Client<true>;

	readonly guild: Guild;

	readonly name: string;

	readonly group: readonly Mentionable[];

	readonly manager: PermissionManager;

	constructor(
		client: Client<true>,
		guild: Guild,
		name: string,
		group: Mentionable[],
		manager: PermissionManager,
	) {
		this.client = client;
		this.guild = guild;
		this.name = name;
		this.group = group;
		this.manager = manager;
	}

	hasMember(member: GuildMember): boolean {
		if (member.guild.id != this.guild.id) {
			return false;
		}
		for (const mentionable of this.group) {
			if (
				(mentionable instanceof GuildMember && mentionable.id == member.id) ||
				(mentionable instanceof Role && mentionable.members.has(member.id)) ||
				(mentionable instanceof User && mentionable.id == member.user.id)
			) {
				return true;
			}
		}
		return false;
	}

	async remove(): Promise<void> {
		await this.manager.remove(this.guild, this.name);
	}

	toString() {
		return this.group.join(', ');
	}
}
