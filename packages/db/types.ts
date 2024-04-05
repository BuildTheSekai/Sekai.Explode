export type Document = {
	[K: string]: any;
};

export type Query<T> = Partial<Document> & { _id?: any };

export interface Connection {
	collection<T extends Document>(name: string): Collection<T>;

	close(): Promise<void>;
}

export interface Collection<T extends Document> {
	findOne(query: Query<T>): Promise<T | null>;

	find(query: Query<T>): Cursor<T>;

	insertOne(document: T): Promise<void>;

	insertMany(documents: T[]): Promise<void>;

	/**
	 * upsert で更新
	 */
	updateOne(query: Query<T>, document: T): Promise<void>;

	deleteOne(query: Query<T>): Promise<void>;

	deleteMany(query: Query<T>): Promise<void>;
}

export interface Cursor<T extends Document> extends AsyncIterable<T> {
	toArray(): Promise<T[]>;
}
