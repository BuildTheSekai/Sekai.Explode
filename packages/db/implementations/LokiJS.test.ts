import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
const Loki: typeof LokiConstructor = require('lokijs'); // FIXME: import 形式にすると undefined
import { LokiJSWrapper } from './LokiJS';

interface Schema1 {
	str: string;
}

interface Schema2 {
	num: number;
	bool: boolean;
}

async function setupConnection() {
	const dirname = await fs.mkdtemp(path.join(os.tmpdir(), 'Sekai.Explode-'));
	return new LokiJSWrapper(new Loki(path.join(dirname, 'database.json')));
}

describe('LokiJS database implementation', () => {
	test('空のコレクション', async () => {
		const connection = await setupConnection();
		try {
			const collection = connection.collection('empty');
			expect(await collection.findOne({})).toStrictEqual(null);
			expect(await collection.find({}).toArray()).toStrictEqual([]);
		} finally {
			await connection.close();
		}
	});

	test('コレクションの再取得', async () => {
		const connection = await setupConnection();
		try {
			const collection1 = connection.collection<Schema1>('existing');
			await collection1.insertOne({ str: 'abc' });
			const collection2 = connection.collection<Schema1>('existing');
			expect(await collection1.find({}).toArray()).toStrictEqual(
				await collection2.find({}).toArray(),
			);
		} finally {
			await connection.close();
		}
	});

	test('コレクションの操作', async () => {
		const connection = await setupConnection();
		try {
			const collection1 = connection.collection<Schema1>('collection1');
			await collection1.insertOne({ str: 'abc' });
			const singleCursor = collection1.find({});
			for await (const document of singleCursor) {
				expect(document.str).toBe('abc');
			}

			const collection2 = connection.collection<Schema2>('collection2');
			await collection2.insertMany([
				{ num: 123, bool: true },
				{ num: 456, bool: false },
			]);
			expect(await collection2.find({}).toArray()).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ num: 123, bool: true }),
					expect.objectContaining({ num: 456, bool: false }),
				]),
			);
			await collection2.updateOne({ num: 123 }, { num: 789, bool: true });
			await collection2.updateOne({ num: 0 }, { num: -1, bool: true });
			expect((await collection2.findOne({ bool: true }))?.num).toBe(789);
			expect((await collection2.find({}).toArray()).length).toBe(3);
			await collection2.deleteOne({ bool: false });
			expect((await collection2.find({}).toArray()).length).toBe(2);
			await collection2.deleteMany({ bool: true });
			expect((await collection2.find({}).toArray()).length).toBe(0);
		} finally {
			await connection.close();
		}
	});
});
