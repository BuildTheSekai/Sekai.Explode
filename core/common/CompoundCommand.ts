import {
	AutocompleteInteraction,
	CacheType,
	ChatInputCommandInteraction,
	Client,
	CommandInteractionOptionResolver,
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
	readonly #onBuild: (
		name: string,
		subcommand: SimpleCommand<Option<unknown, boolean>[]>,
	) => void;

	constructor(
		name: string,
		description: string,
		handle: SlashCommandSubcommandBuilder,
		options: Options,
		onBuild: (
			name: string,
			subcommand: SimpleCommand<Option<unknown, boolean>[]>,
		) => void,
	) {
		super(name, description, handle, options);
		this.#onBuild = onBuild;
	}

	protected override newInstance<O extends Option<unknown, boolean>[]>(
		name: string,
		description: string,
		handle: SlashCommandSubcommandBuilder,
		options: O,
	): SimpleSlashCommandBuilder<O> {
		return new SimpleSubcommandBuilder(
			name,
			description,
			handle,
			options,
			this.#onBuild,
		);
	}

	override build(
		action: (
			interaction: ChatInputCommandInteraction<CacheType>,
			...options: OptionValueMap<Options>
		) => Promise<void>,
	): SimpleCommand<Options> {
		const subcommand = super.build(action);
		this.#onBuild(this.name, subcommand as any);
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
		const subcommand = this.getSubcommand(interaction);
		subcommand.execute(interaction);
	}

	async autocomplete(
		interaction: AutocompleteInteraction<CacheType>,
	): Promise<void> {
		const subcommand = this.getSubcommand(interaction);
		subcommand.autocomplete(interaction);
	}

	getSubcommand(interaction: {
		options: Pick<CommandInteractionOptionResolver, 'getSubcommand'>;
	}) {
		const subcommandName = interaction.options.getSubcommand(true);
		const subcommand = this.#subcommands.get(subcommandName);
		if (subcommand == null) {
			const subcommands = Array.from(this.#subcommands.keys())
				.map((s) => `'${s}'`)
				.join(', ');
			throw new TypeError(
				`Invalid subcommand: '${subcommandName}', subcommands: ${subcommands}`,
			);
		}
		return subcommand;
	}
}
