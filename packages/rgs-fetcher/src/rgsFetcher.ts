import type { paths } from './schema';
import { fetcher } from 'utils-fetcher';

/**
 * Read the body as JSON, and say WHICH request failed if it is not JSON.
 *
 * `response.json()` throws a bare SyntaxError naming only a character offset.
 * Reported from the field that is unactionable: a review came back with
 * "SyntaxError: Expected ',' or ']' after array element in JSON at position 288"
 * and nothing to say whether it was authenticate, play or end-round, nor what
 * the body actually was - and because the failure happens inside authenticate,
 * the symptom the reviewer sees is a game running on unset betting parameters.
 *
 * Reading the body as text first costs one extra string per request and turns
 * that into a report someone can act on.
 */
const parseJson = async (response: Response, endpoint: string, status: number) => {
	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch (cause) {
		const detail = text.length > 400 ? `${text.slice(0, 400)}… (${text.length} chars)` : text;
		throw new Error(
			`${endpoint} returned HTTP ${status} with a body that is not valid JSON: ` +
				`${(cause as Error).message}. Body: ${detail}`,
		);
	}
};

// The platform passes rgs_url as a bare host ("rgs.example.com"), but Engine's
// guideline 181 allows it to arrive with its scheme too. Prefixing https://
// unconditionally turned "https://rgs.example.com" into "https://https://…",
// and no request ever left. Add the scheme only when it is missing, and drop a
// trailing slash so the path joins cleanly. A bare host — every launch so far —
// produces exactly the URL it always did.
const rgsEndpoint = (rgsUrl: string, url: string) => {
	const base = (/^https?:\/\//i.test(rgsUrl) ? rgsUrl : `https://${rgsUrl}`).replace(/\/+$/, '');
	return `${base}${url}`;
};

export const rgsFetcher = {
	post: async function post<
		T extends keyof paths,
		TResponse = paths[T]['post']['responses'][200]['content']['application/json'],
	>(options: {
		url: T;
		rgsUrl: string;
		variables?: paths[T]['post']['requestBody']['content']['application/json'];
	}): Promise<TResponse> {
		const response = await fetcher({
			method: 'POST',
			variables: options.variables,
			endpoint: rgsEndpoint(options.rgsUrl, options.url),
		});

		if (response.status !== 200) console.error('error', response);
		const data = await parseJson(response, `POST ${options.url}`, response.status);
		return data as TResponse;
	},
	get: async function get<
		T extends keyof paths,
		TResponse = paths[T]['get']['responses'][200]['content']['application/json'],
	>(options: { url: T; rgsUrl: string }): Promise<TResponse> {
		const response = await fetcher({
			method: 'GET',
			endpoint: rgsEndpoint(options.rgsUrl, options.url),
		});

		if (response.status !== 200) console.error('error', response);
		const data = await parseJson(response, `GET ${options.url}`, response.status);
		return data as TResponse;
	},
};
