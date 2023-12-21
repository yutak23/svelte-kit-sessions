import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';

// eslint-disable-next-line import/prefer-default-export
export const GET: RequestHandler = async (event: RequestEvent) => {
	const { session } = event.locals;
	if (!session.id) throw new Error('session is undefined');

	if (Object.keys(session.data).length) return json({ exits: true });

	const result = await session.store.get(session.id);

	return json({ exits: !!result });
};
