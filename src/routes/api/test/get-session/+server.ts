import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import lodash from 'lodash';

const { isEqual } = lodash;

// eslint-disable-next-line import/prefer-default-export
export const GET: RequestHandler = async (event: RequestEvent) => {
	const { session } = event.locals;
	if (!session.id) throw new Error('session is undefined');

	const cookieValue = event.cookies.get(session.cookieName);
	if (!cookieValue) throw new Error('cookie is undefined');

	const sessionId = cookieValue.slice(0, cookieValue.lastIndexOf('.'));
	if (!sessionId) throw new Error('sessionId is undefined');

	const sessionStoreData = await session.store.get(sessionId);
	if (!sessionStoreData) throw new Error('sessionStoreData is undefined');
	if (!isEqual(sessionStoreData.data, session.data)) throw new Error('session data is not equal');

	return json({ session_data: session.data });
};
