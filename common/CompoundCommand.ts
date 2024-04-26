import {
	CacheType,
	ChatInputCommandInteraction,
	Client,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from 'discord.js';
import {
	Option,
	OptionValueMap,
	SimpleCommand,
	SimpleSlashCommandBuilder,
} from './SimpleCommand';
import { Command } from '../util/types';

export class CompoundCommandBuilder {
	readonly #handle: SlashCommandBuilder;

	readonly #subcommands = new Map<
		string,
		SimpleCommand<Option<unknown, boolean>[]>
	>();

	constructor(name: string, description: string) {
		this.#handle = new SlashCommandBuilder()
			.setName(name)
			.setDescription(description);
	}

	subcommand(name: string, description: string): SimpleSubcommandBuilder {
		const handle = new SlashCommandSubcommandBuilder();
		this.#handle.addSubcommand(handle);
		return new SimpleSubcommandBuilder(
			name,
			description,
			handle,
			[],
			(name, subcommand) => this.#subcommands.set(name, subcommand),
		);
	}

	build(): CompoundCommand {
		return new CompoundCommand(this.#subcommands, this.#handle);
	}
}

export class SimpleSubcommandBuilder<
	Options extends Option<unknown, boolean>[] = [],
> extends SimpleSlashCommandBuilder<Options> {
	readonly #onBuild: (name: string, subcommand: SimpleCommand<Options>) => void;

	constructor(
		name: string,
		description: string,
		handle: SlashCommandSubcommandBuilder,
		options: Options,
		onBuild: (name: string, subcommand: SimpleCommand<Options>) => void,
	) {
		super(name, description, handle, options);
		this.#onBuild = onBuild;
	}

	build(
		action: (
			interaction: ChatInputCommandInteraction<CacheType>,
			...options: OptionValueMap<Options>
		) => Promise<void>,
	): SimpleCommand<Options> {
		const subcommand = super.build(action);
		this.#onBuild(this.name, subcommand);
		return subcommand;
	}
}

export class CompoundCommand implements Command {
	readonly #subcommands: Map<string, SimpleCommand<Option<unknown, boolean>[]>>;

	data: SlashCommandBuilder;

	constructor(
		subcommands: Map<string, SimpleCommand<Option<unknown, boolean>[]>>,
		data: SlashCommandBuilder,
	) {
		this.#subcommands = subcommands;
		this.data = data;
	}

	async execute(
		interaction: ChatInputCommandInteraction<CacheType>,
		client: Client<true>,
	): Promise<void> {
		const subcommandName = interaction.options.getSubcommand(true);
		const subcommand = this.#subcommands.get(subcommandName);
		if (subcommand == null) {
			await interaction.reply({
				ephemeral: true,
				content: 'Invalid subcommand: ' + subcommandName,
			});
			return;
		}
		subcommand.execute(interaction);
	}
}
