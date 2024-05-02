import * as fs from 'fs/promises';

type Callback = (err?: Error) => void;

export function teeWrite(
	stream: NodeJS.WriteStream,
	logFilename: string,
): void {
	const rawWrite = stream.write.bind(stream) as typeof stream.write;
	function write(
		this: NodeJS.WriteStream,
		buffer: Uint8Array | string,
		cb?: Callback,
	): boolean;
	function write(
		this: NodeJS.WriteStream,
		str: Uint8Array | string,
		encoding?: BufferEncoding,
		cb?: Callback,
	): boolean;
	function write(
		this: NodeJS.WriteStream,
		data: Uint8Array | string,
		option1?: Callback | BufferEncoding,
		option2?: Callback,
	): boolean {
		const withBufferEncoding = typeof option1 == 'string';
		const cb = withBufferEncoding ? option2 : option1;
		const fileWritePromise = fs.appendFile(logFilename, data ?? '');
		function wrappedCallback(err: Error | undefined) {
			if (err) {
				return cb?.(err);
			} else {
				fileWritePromise.then(
					() => cb?.(),
					(e) => cb?.(err),
				);
			}
		}
		if (withBufferEncoding) {
			return rawWrite(data, option1, wrappedCallback);
		} else {
			return rawWrite(data, wrappedCallback);
		}
	}
	stream.write = write;
}
