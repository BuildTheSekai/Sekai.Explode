import fs from 'fs/promises';
import path from 'path';
import { strFormat, LANG } from '../util/languages';
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
} from 'discord.js';
import { Command } from '../util/types';

export class CommandManager {
	static readonly default = new CommandManager();

	#client: Client<true> | null = null;

	#commands: Map<string, Command> = new Map();

	/**
	 * クライアントにコマンドを登録する。
	 * @param client ログイン済みのクライアント
	 */
	async setClient(client: Client<true>) {
		this.#client = client;
		const commands = [];
		for (const command of this.#commands.values()) {
			commands.push(command.data.toJSON());
		}
		await client.application.commands.set(commands);
		client.on('interactionCreate', (interaction) => {
			if (interaction.isChatInputCommand()) {
				this.#handleChatInputCommand(interaction, client);
			} else if (interaction.isAutocomplete()) {
				this.#handleAutocomplete(interaction);
			}
		});
	}

	/**
	 * コマンドを追加する。
	 * @param commands 追加するコマンド
	 */
	addCommands(commands: Command | Command[]) {
		if (Array.isArray(commands)) {
			for (const command of commands) {
				this.#commands.set(command.data.name, command);
			}
		} else {
			this.#commands.set(commands.data.name, commands);
		}
	}

	get size() {
		return this.#commands.size;
	}

	async loadDirectory(name: string): Promise<void> {
		const files = await fs.readdir(name, { withFileTypes: true });
		for (const file of files) {
			const ext = path.extname(file.name);
			if (!file.isFile() || (ext != '.js' && ext != '.ts')) return;
			let cmds = await import(path.join(name, file.name));
			if ('default' in cmds) {
				cmds = cmds.default;
			}
			this.addCommands(cmds);
		}
	}

	#get(name: string): Command {
		const command = this.#commands.get(name);
		if (!command) {
			throw new Error(
				strFormat(LANG.discordbot.interactionCreate.unsupportedCommandError, [
					name,
				]),
			);
		}
		return command;
	}

	/**
	 * チャット入力コマンドの処理を行う。
	 */
	async #handleChatInputCommand(
		interaction: ChatInputCommandInteraction,
		client: Client<true>,
	) {
		const command = this.#get(interaction.commandName);
		try {
			await command.execute(interaction, client);
		} catch (error) {
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: LANG.discordbot.interactionCreate.commandError,
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: LANG.discordbot.interactionCreate.commandError,
					ephemeral: true,
				});
			}
			throw error;
		}
	}

	async #handleAutocomplete(interaction: AutocompleteInteraction) {
		const command = this.#get(interaction.commandName);
		await command.autocomplete?.(interaction);
	}
}
