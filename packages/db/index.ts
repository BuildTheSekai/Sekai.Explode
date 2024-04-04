import { Client } from 'discord.js';
import { Feature } from '../../common/Feature';
import { LANG } from '../../util/languages';
import mongoose from 'mongoose';
import config from '../../internal/config';

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

class DbFeature extends Feature {
	name = 'db';

	connection = connection;

	async onLoad(client: Client<boolean>) {
		console.log(LANG.internal.mongodb.called);
		try {
			await mongoose.connect(
				`mongodb://${config.mongoDBuser}:${config.mongoDBpass}@${config.mongoDBhost}:${config.mongoDBport}/${config.mongoDBdatabase}?authSource=admin`,
			);
		} catch (e) {
			console.log(e);
		}
	}

	async onUnload() {
		this.connection.close();
	}
}

export const feature = new DbFeature();
