import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';

// eslint-disable-next-line import/prefer-default-export
export const GET: RequestHandler = async (event: RequestEvent) => {
	const { session } = event.locals;
	if (!session.id) throw new Error('session is undefined');

	const newSession = await session.regenerate();
	await newSession.setData({
		re_user_id: crypto.randomUUID(),
		re_name: btoa(crypto.getRandomValues(new Uint8Array(4)).toString())
	});
	await newSession.save();

	return json({ session_data: newSession.data });
};
