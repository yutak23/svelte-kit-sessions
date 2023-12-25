import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';

interface RequestBody {
	user_id: string;
	name: string;
}

// eslint-disable-next-line import/prefer-default-export
export const POST: RequestHandler = async (event: RequestEvent) => {
	const { session } = event.locals;
	if (!session.id) throw new Error('session is undefined');

	const { user_id: userId, name } = (await event.request.json()) as RequestBody;

	await session.setData({ user_id: userId, name });

	return json({ session_data: session.data });
};
