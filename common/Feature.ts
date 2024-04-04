import { Client } from 'discord.js';

/**
 * 機能の1単位を表すオブジェクト
 */
export abstract class Feature {
	private loading = false;

	async load(client: Client<boolean>) {
		if (!this.loading) {
			await this.onLoad(client);
		}
	}

	/**
	 * 読み込まれた時の処理
	 */
	onLoad?(client: Client<boolean>): PromiseLike<void> | void;

	/**
	 * クライアントにログインしたときの処理
	 */
	onClientReady?(client: Client<true>): PromiseLike<void> | void;

	/**
	 * 終了したときの処理
	 */
	onUnload?(): PromiseLike<void> | void;
}
