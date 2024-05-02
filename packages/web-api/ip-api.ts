import { Result, Split } from 'core';

const axios = require('axios').default;

interface IpApiGeolocationFullData {
	status: string;
	message: string;
	continent: string;
	continentCode: string;
	country: string;
	countryCode: string;
	region: string;
	regionName: string;
	city: string;
	district: string;
	zip: string;
	lat: number;
	lon: number;
	timezone: string;
	offset: number;
	isp: string;
	org: string;
	as: string;
	asname: string;
	reverse: string;
	mobile: boolean;
	proxy: boolean;
	hosting: boolean;
	query: string;
}

interface IpApiGeolocationOption<F extends string> {
	fields?: F;
	lang?: 'en' | 'de' | 'es' | 'pt-BR' | 'fr' | 'ja' | 'zh-CN' | 'ru';
}

type IpApiGeolocationData<T extends string> =
	Partial<IpApiGeolocationFullData> & {
		[K in Split<T, ','> &
			keyof IpApiGeolocationFullData]: IpApiGeolocationFullData[K];
	};

/**
 * @param ip IP アドレス
 * @param params 情報を取得する項目
 * @returns 結果を Result 型でラップしたもの
 */
export async function getIpInfo<F extends string>(
	ip: string,
	params?: IpApiGeolocationOption<F>,
): Promise<Result.Result<IpApiGeolocationData<F>>> {
	try {
		const res = await axios.get(
			`http://ip-api.com/json/${encodeURI(ip)}?${new URLSearchParams(params as Record<string, string>)}`,
		);
		return new Result.Ok(/** @type {IpApiGeolocationData<F>} */ res.data);
	} catch (e) {
		return new Result.Err(e);
	}
}
