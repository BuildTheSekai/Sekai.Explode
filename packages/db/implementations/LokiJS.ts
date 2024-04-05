import {
	Collection as ICollection,
	Connection,
	Cursor,
	Document,
	Query,
} from '../types';

function promise<T>(func: () => T): Promise<T> {
	try {
		return Promise.resolve(func());
	} catch (e) {
		return Promise.reject(e);
	}
}

export class LokiJSWrapper implements Connection {
	private readonly handle: Loki;

	constructor(handle: Loki) {
		this.handle = handle;
	}

	collection<T extends Document>(name: string): ICollection<T> {
		const handle = this.handle;
		const collection = handle.getCollection(name);
		if (collection != null) {
			return new CollectionWrapper(collection);
		}
		return new CollectionWrapper(handle.addCollection(name));
	}

	close(): Promise<void> {
		return new Promise((resolve, reject) =>
			this.handle.close((err) => {
				if (err == null) {
					resolve();
				} else {
					reject(err);
				}
			}),
		);
	}
}

class CollectionWrapper<T extends Document> implements ICollection<T> {
	private readonly handle: Collection<T>;

	constructor(handle: Collection<T>) {
		this.handle = handle;
	}

	findOne(query: Query<T>): Promise<T> {
		return promise(() => this.handle.findOne(query));
	}

	find(query: Query<T>): Cursor<T> {
		return new CursorWrapper(this.handle.find(query));
	}

	insertOne(document: T): Promise<void> {
		return promise(() => void this.handle.insert(document));
	}

	insertMany(documents: T[]): Promise<void> {
		return promise(() => void this.handle.insert(documents));
	}

	updateOne(query: Query<T>, document: T): Promise<void> {
		const handle = this.handle;
		return promise(() => {
			const existing = handle.chain().find(query, true);
			if (existing.count() != 0) {
				existing.update((obj) => Object.assign(obj, document));
			} else {
				handle.insert(document);
			}
		});
	}

	deleteOne(query: Query<T>): Promise<void> {
		return promise(() => void this.handle.chain().find(query, true).remove());
	}

	deleteMany(query: Query<T>): Promise<void> {
		return promise(() => void this.handle.findAndRemove(query));
	}
}

class CursorWrapper<T extends Document> implements Cursor<T> {
	private readonly handle: T[];

	constructor(handle: T[]) {
		this.handle = handle;
	}

	async *[Symbol.asyncIterator](): AsyncIterator<T, any, undefined> {
		for (const value of this.handle) {
			yield Promise.resolve(value);
		}
	}

	toArray(): Promise<T[]> {
		return Promise.resolve(this.handle);
	}
}
