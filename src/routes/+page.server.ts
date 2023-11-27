import { sessionManager } from '$lib/server/session';
import { isValidDidDoc, getPdsEndpoint } from '@atproto/common';
import type { PageServerLoad } from './$types';
import { type IUser, User } from '$lib/server/db';
import { redirect, type Actions } from '@sveltejs/kit';
import {
    LASTFM_API_KEY,
    LASTFM_CALLBACK_URL,
    RANDOM_STRING,
    SPOTIFY_API_KEY,
    SPOTIFY_CALLBACK_URL
} from '$env/static/private';

const lastfmParams = new URLSearchParams({
    api_key: LASTFM_API_KEY,
    cb: LASTFM_CALLBACK_URL
});
const LASTFM_AUTH_URL = `https://last.fm/api/auth?${lastfmParams}`;

const spotifyParams = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_API_KEY,
    scope: 'user-read-playback-position user-top-read user-read-recently-played',
    redirect_uri: SPOTIFY_CALLBACK_URL,
    state: RANDOM_STRING
});
const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?${spotifyParams}`;

export const ssr = true;
export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    const isAuthenticated = locals.isUserLoggedIn;

    if (user && isAuthenticated) {
        const userData = await User.findById<IUser>(user.did);
        if (userData) {
            return {
                user: {
                    ...user,
                    lastfmLink: userData?.lastfm ? true : false,
                    spotifyLink: userData?.spotify ? true : false
                },
                isUserLoggedIn: isAuthenticated
            };
        }
    }

    return {
        user: null,
        isUserLoggedIn: false
    };
};

export const actions = {
    login: async ({ request, locals, cookies }) => {
        const data = await request.json();

        const { did, handle, accessJwt, refreshJwt, didDoc } = data;

        if (isValidDidDoc(didDoc)) {
            const pds = getPdsEndpoint(didDoc) ?? 'https://bsky.social/';
            User.findByIdAndUpdate(
                did,
                { handle: handle, pds: pds, bskyRefreshToken: refreshJwt },
                { upsert: true }
            ).exec();

            const auth = {
                did: did,
                handle: handle,
                pds: pds,
                accessJwt: accessJwt,
                refreshJwt: refreshJwt
            };
            locals.user = auth;
            await sessionManager.createSession(cookies, auth, auth.did);
        }
        throw redirect(302, '/');
    },
    logout: async ({ locals, cookies }) => {
        await sessionManager.deleteSession(cookies);
        locals.isUserLoggedIn = false;
        locals.user = undefined;
    },
    lastfmLink: async ({ locals }) => {
        if (locals.user && !locals.user.lastfmLink) {
            console.log('have to link lastfm');
            throw redirect(302, LASTFM_AUTH_URL);
        }
        throw redirect(302, '/');
    },
    lastfmUnlink: async ({ locals }) => {
        if (locals.user) {
            locals.user.lastfmLink = false;
            await User.findByIdAndUpdate(locals.user.did, { lastfm: null });
            throw redirect(302, '/');
        }
    },
    spotifyLink: async ({ locals }) => {
        if (locals.user && !locals.user.spotifyLink) {
            console.log('have to link spotify');
            throw redirect(302, SPOTIFY_AUTH_URL);
        }
        throw redirect(302, '/');
    },
    spotifyUnlink: async ({ locals }) => {
        if (locals.user) {
            locals.user.spotifyLink = false;
            await User.findByIdAndUpdate(locals.user.did, { spotify: null });
            throw redirect(302, '/');
        }
    }
} satisfies Actions;
