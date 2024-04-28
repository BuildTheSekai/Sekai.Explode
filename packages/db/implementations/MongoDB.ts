import mongoose from 'mongoose';
import { Collection, Connection, Cursor, Document, Query } from '../types';

type FindCursor<T extends Document> = ReturnType<
	typeof mongoose.Collection.find<T>
>;

export class MongoDBWrapper implements Connection {
	private readonly handle: mongoose.Connection;

	constructor(handle: mongoose.Connection) {
		this.handle = handle;
	}

	collection<T extends Document>(name: string): Collection<T> {
		return new CollectionWrapper(this.handle.collection(name)) as any;
	}

	close(): Promise<void> {
		return this.handle.close();
	}
}

class CollectionWrapper<T extends Document> implements Collection<Document> {
	private readonly handle: mongoose.Collection<T>;

	constructor(handle: mongoose.Collection<T>) {
		this.handle = handle;
	}

	find(query: Query<T>): Cursor<T> {
		return new CursorWrapper(this.handle.find(query)) as Cursor<any>;
	}

	findOne(query: Query<T>): Promise<T | null> {
		return this.handle.findOne(query) as Promise<any>;
	}

	async insertOne(document: T): Promise<void> {
		await this.handle.insertOne(document as any);
	}

	async insertMany(documents: T[]): Promise<void> {
		await this.handle.insertMany(documents as any[]);
	}

	async updateOne(query: Query<T>, document: T): Promise<void> {
		await this.handle.updateOne(
			query,
			{ $set: document as any },
			{ upsert: true },
		);
	}

	async deleteOne(query: Query<T>): Promise<void> {
		await this.handle.deleteOne(query);
	}

	async deleteMany(query: Query<T>): Promise<void> {
		await this.handle.deleteMany(query);
	}
}

class CursorWrapper<T extends Document> implements Cursor<T> {
	private readonly handle: FindCursor<T>;

	constructor(handle: FindCursor<T>) {
		this.handle = handle;
	}

	async *[Symbol.asyncIterator](): AsyncIterator<T, any, undefined> {
		for await (const value of this.handle) {
			yield value;
		}
	}

	toArray(): Promise<T[]> {
		return this.handle.toArray() as Promise<any[]>;
	}
}
