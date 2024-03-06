// @ts-check

const { LANG, strFormat } = require('../util/languages');
const {
	CheckHostRequest,
	CheckPingOk,
	isValidHostname,
	CheckTcpOk,
	CheckTcpError,
	CheckHttpOk,
	CheckHttpComplete,
	CheckDnsOk,
} = require('../util/check-host');
const { formatTable } = require('../util/strings');
const { SimpleSlashCommandBuilder } = require('../common/SimpleCommand');

const MAX_NODES = 40;

/**
 * @template {import('../util/check-host').CheckHostResult} T
 * @param {CheckHostRequest<T>} request
 * @param {(result: T) => unknown[]} rowFormat
 * @param {import('../util/strings').FormatTableOption} options
 */
async function getFormattedResult(request, rowFormat, options) {
	const resultMap = await request.checkResult(1.0, 7);
	const table = [...resultMap.entries()].map(([node, result]) => {
		const nodeName = node.name.replace('.node.check-host.net', '');
		const prefix = `[${nodeName}]`;
		console.log(strFormat(LANG.common.message.dataFor, [nodeName]), result);
		const row = rowFormat(result);
		if (row.length == 0) {
			return [prefix];
		}
		return [prefix + ' ' + row[0], ...row.slice(1)];
	});
	return formatTable(table, {
		align: ['left', ...(options.align ?? [])],
		...(options ?? {}),
	});
}

/**
 * @param {string} hostname
 */
async function checkPing(hostname) {
	const request = await CheckHostRequest.get('ping', hostname, MAX_NODES);
	return async () =>
		await getFormattedResult(
			request,
			(result) => {
				if (!(result instanceof CheckPingOk)) {
					return [result.state];
				}
				const values = result.values;
				const average =
					values.reduce((a, { ping: b }) => a + b, 0) / values.length;
				return [
					values[3].reply + ',',
					values[3].ping,
					'/',
					values[2].reply + ',',
					values[2].ping,
					'| Ping:',
					`${Math.floor(average * 1000)} ms`,
				];
			},
			{
				align: ['left', 'left', 'left', 'left', 'left', 'left', 'right'],
			},
		);
}

/**
 * @param {string} hostname
 */
async function checkHttp(hostname) {
	const request = await CheckHostRequest.get('http', hostname, MAX_NODES);
	return async () =>
		await getFormattedResult(
			request,
			(result) => {
				/** @type {unknown[]} */
				const row = [result.state + ','];
				if (result instanceof CheckHttpComplete) {
					const { time, statusMessage } = result;
					row.push(time + ',');
					if (result instanceof CheckHttpOk) {
						const { statusCode, host } = result;
						row.push(statusMessage + ',', statusCode + ',', host);
					} else {
						row.push(statusMessage);
					}
				}
				return row;
			},
			{
				align: ['left', 'right', 'left', 'right', 'left'],
			},
		);
}

/**
 * @param {string} hostname
 */
async function checkDns(hostname) {
	const request = await CheckHostRequest.get('dns', hostname, MAX_NODES);
	return async () =>
		await getFormattedResult(
			request,
			(result) => {
				if (!(result instanceof CheckDnsOk)) {
					return [result.state];
				}
				return [
					'TTL:',
					result.ttl,
					...[...result.a, ...result.aaaa].map((e, i, { length }) =>
						i == length - 1 ? e : e + ', ',
					),
				];
			},
			{
				align: ['left', 'right', 'left'],
			},
		);
}

/**
 * @param {string} hostname
 */
async function checkTcp(hostname) {
	const request = await CheckHostRequest.get('tcp', hostname, MAX_NODES);
	return async () =>
		await getFormattedResult(
			request,
			(result) => {
				if (result instanceof CheckTcpOk) {
					return [
						'OK,',
						result.time,
						'| Ping: ',
						`${Math.floor(result.time * 1000)} ms`,
					];
				}
				if (result instanceof CheckTcpError) {
					return ['ERROR', result.description];
				}
				return [result.state];
			},
			{
				align: ['left', 'left', 'left', 'right'],
			},
		);
}

/**
 * @param {'ping' | 'http' | 'tcp' | 'dns'} type
 * @param {string} hostname
 */
function check(type, hostname) {
	switch (type) {
		case 'ping':
			return checkPing(hostname);
		case 'http':
			return checkHttp(hostname);
		case 'tcp':
			return checkTcp(hostname);
		case 'dns':
			return checkDns(hostname);
	}
}

module.exports = SimpleSlashCommandBuilder.create(
	LANG.commands.check.name,
	LANG.commands.check.description,
)
	.addStringOption({
		name: LANG.commands.check.options.type.name,
		description: LANG.commands.check.options.type.description,
		required: true,
		choices: [
			{
				name: LANG.commands.check.options.type.choices.ping,
				value: 'ping',
			},
			{
				name: LANG.commands.check.options.type.choices.http,
				value: 'http',
			},
			{
				name: LANG.commands.check.options.type.choices.tcp,
				value: 'tcp',
			},
			{
				name: LANG.commands.check.options.type.choices.dns,
				value: 'dns',
			},
		],
	})
	.addStringOption({
		name: LANG.commands.check.options.hostname.name,
		description: LANG.commands.check.options.hostname.description,
		required: true,
	})
	.build(async (interaction, type, hostname) => {
		if (!isValidHostname(hostname)) {
			// IPアドレスが間違っています。(IPv4、またはドメインのみ対応しています。
			await interaction.reply(LANG.commands.check.invalidHostnameError);
			return;
		}
		const getResult = await check(type, hostname);
		const msg = await interaction.reply(LANG.common.message.checking);
		const str = await getResult();
		msg.edit({
			content: LANG.common.message.result,
			files: [
				{
					attachment: Buffer.from(str),
					name: 'result.txt',
				},
			],
		});
	});
