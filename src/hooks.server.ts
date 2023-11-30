import type { Handle } from '@sveltejs/kit';
import { sessionManager } from '$lib/server/session';
import { connectDb } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
    await connectDb();

    const userSession = await sessionManager.getSession(event.cookies);

    event.locals = {};

    if (userSession.error) {
        await sessionManager.deleteCookie(event.cookies);
        return resolve(event);
    }
    if (userSession && userSession.data) {
        event.locals = userSession.data;
    }
    return resolve(event);
};
