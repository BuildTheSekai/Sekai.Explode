import { strFormat, LANG } from '../../../util/languages';

export interface ReplySchema {
	client: string;
	guild: string;
	message: string;
	reply: string;
	perfectMatching: boolean;
}

/**
 * 自動応答のパターン。
 */
export class ReplyPattern {
	readonly message: string;

	readonly reply: string;

	readonly perfectMatching: boolean;

	/**
	 * @param messagePattern 反応するメッセージ内容
	 * @param reply 返信内容
	 * @param perfectMatching 完全一致する必要があるか
	 */
	constructor(
		messagePattern: string,
		reply: string,
		perfectMatching: boolean = false,
	) {
		this.message = messagePattern;
		this.reply = reply;
		this.perfectMatching = perfectMatching;
	}

	/**
	 * メッセージ内容がこのパターンに一致するかを調べ、一致する場合は返信内容を返す。
	 * @param message メッセージ内容
	 * @returns メッセージ内容がパターンに一致する場合は返信内容、一致しなければ null
	 */
	apply(message: string) {
		if (this.perfectMatching) {
			if (message == this.message) {
				return this.reply;
			}
		} else {
			if (message.includes(this.message)) {
				return this.reply;
			}
		}
		return null;
	}

	/**
	 * replies コレクションに格納できる形式に変換する。
	 * @param clientUserId クライアントのユーザー ID
	 * @param guildId サーバー ID
	 */
	serialize(clientUserId: string, guildId: string): ReplySchema {
		const message = this.message;
		return {
			client: clientUserId,
			guild: guildId,
			message: message,
			reply: this.reply,
			perfectMatching: this.perfectMatching,
		};
	}

	/**
	 * replies コレクションからのデータを ReplyPattern に変換する。
	 * @param replyDocument replies コレクションのドキュメント
	 */
	static deserialize(replyDocument: ReplySchema) {
		const { message, reply, perfectMatching } = replyDocument;
		return new ReplyPattern(message, reply, perfectMatching);
	}

	toString() {
		return strFormat(LANG.internal.messages.replyPattern, {
			message: '`' + this.message + '`',
			reply: '`' + this.reply + '`',
			perfectMatching: this.perfectMatching
				? LANG.internal.messages.perfectMatching.yes
				: LANG.internal.messages.perfectMatching.no,
		});
	}
}
