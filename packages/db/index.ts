import { Feature } from '../../common/Feature';
import { LANG } from '../../util/languages';
import mongoose from 'mongoose';
import Loki from 'lokijs';
import config from '../../internal/config';
import { Connection } from './types';
import { MongoDBWrapper } from './implementations/MongoDB';
import { LokiJSWrapper } from './implementations/LokiJS';

export * from './types';

class DbFeature extends Feature {
	name = 'db';

	connection: Connection;

	connectionPromise: Promise<void>;

	constructor() {
		super();
		console.log('database: ', config.database);
		switch (config.database) {
			default:
			case 'mongo': {
				const connection = mongoose.connection;
				connection.on('connecting', function () {
					console.log(LANG.internal.mongodb.dbConnecting);
				});
				connection.on('connected', function () {
					console.log(LANG.internal.mongodb.dbConnected);
				});
				connection.on('disconnecting', function () {
					console.log(LANG.internal.mongodb.dbDisconnecting);
				});
				connection.on('disconnected', function () {
					console.log(LANG.internal.mongodb.dbDisconnected);
				});
				this.connection = new MongoDBWrapper(connection);
				this.connectionPromise = mongoose
					.connect(
						`mongodb://${config.mongoDBuser}:${config.mongoDBpass}@${config.mongoDBhost}:${config.mongoDBport}/${config.mongoDBdatabase}?authSource=admin`,
					)
					.then(() => undefined);
				return;
			}

			case 'loki': {
				console.log('Loading Loki');
				let resolve!: (value: void | PromiseLike<void>) => void;
				let reject!: (reason?: any) => void;
				this.connectionPromise = new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				});
				const loki = new Loki(config.lokiJSfile ?? 'database.json', {
					autosave: true,
					autosaveInterval: 1000,
					autoload: true,
					autoloadCallback(err) {
						if (err == null) {
							resolve();
						} else {
							reject(err);
						}
					},
				});
				this.connection = new LokiJSWrapper(loki);
				return;
			}
		}
	}

	async onLoad() {
		console.log(LANG.internal.mongodb.called);
		try {
			await this.connectionPromise;
		} catch (e) {
			console.log(e);
		}
	}

	async onUnload() {
		await this.connection.close();
	}
}

export const feature = new DbFeature();
