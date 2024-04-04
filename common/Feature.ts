import { Client } from 'discord.js';

/**
 * 機能の1単位を表すオブジェクト
 */
export abstract class Feature {
	private loading = false;

	private unloading = false;

	async load(client: Client<boolean>) {
		if (!this.loading) {
			this.loading = true;
			const dependencies = this.dependencies;
			// この機能をロードする前に依存先の機能をロードする
			if (dependencies != null) {
				await Promise.all(
					dependencies.map((dependency) => {
						dependency.usedBy.push(this);
						return dependency.load(client);
					}),
				);
			}
			console.log(`Loading ${this.name} feature`);
			await this.onLoad(client);
		}
	}

	async unload() {
		if (!this.unloading) {
			this.unloading = true;
			// 依存元の機能をアンロードした後にこの機能をアンロードする
			await Promise.all(this.usedBy.map((dependency) => dependency.unload()));
			console.log(`Unloading ${this.name} feature`);
			await this.onUnload();
		}
	}

	name: string;

	/**
	 * この機能の依存先の機能
	 */
	dependencies?: Feature[];

	private usedBy: Feature[] = [];

	/**
	 * 読み込まれた時の処理
	 */
	onLoad(client: Client<boolean>): PromiseLike<void> | void {
		// デフォルトでは何もしない
	}

	/**
	 * クライアントにログインしたときの処理
	 */
	onClientReady(client: Client<true>): PromiseLike<void> | void {
		// デフォルトでは何もしない
	}

	/**
	 * 終了したときの処理
	 */
	onUnload(): PromiseLike<void> | void {
		// デフォルトでは何もしない
	}
}
