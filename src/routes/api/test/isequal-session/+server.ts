import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import lodash from 'lodash';

interface RequestBody {
	user_id: string;
	name: string;
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const { isEqual } = lodash;

// eslint-disable-next-line import/prefer-default-export
export const POST: RequestHandler = async (event: RequestEvent) => {
	const { session } = event.locals;
	if (!session.id) throw new Error('session is undefined');

	const { user_id: userId, name } = (await event.request.json()) as RequestBody;

	return json({ is_equal: isEqual(session.data, { user_id: userId, name }) });
};
