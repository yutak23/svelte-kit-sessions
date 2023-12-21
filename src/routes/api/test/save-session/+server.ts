import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';

// eslint-disable-next-line import/prefer-default-export
export const GET: RequestHandler = async (event: RequestEvent) => {
	const { session } = event.locals;
	if (!session.id) throw new Error('session is undefined');

	await session.setData({
		user_id: crypto.randomUUID(),
		name: btoa(crypto.getRandomValues(new Uint8Array(4)).toString())
	});
	await session.save();

	return json({ session_data: session.data });
};
