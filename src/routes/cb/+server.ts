import { User, type IUser } from '$lib/server/db';
import type { RequestHandler } from './$types';
import {
    LASTFM_API_KEY,
    LASTFM_SECRET,
    RANDOM_STRING,
    SPOTIFY_API_KEY,
    SPOTIFY_CALLBACK_URL,
    SPOTIFY_SECRET
} from '$env/static/private';
import crypto from 'crypto';
import { redirect } from '@sveltejs/kit';

const md5 = (data: string) => crypto.createHash('md5').update(data).digest('hex');

const LASTFM_ENDPOINT = `http://ws.audioscrobbler.com/2.0/`;

const SPOTIFY_HEADERS = {
    'content-type': 'application/x-www-form-urlencoded',
    Authorization: 'Basic ' + btoa(`${SPOTIFY_API_KEY}:${SPOTIFY_SECRET}`)
};
const SPOTIFY_TOKEN_URL = `https://accounts.spotify.com/api/token`;

export const GET: RequestHandler = async ({ locals, url }) => {
    const user = locals.user;
    const isAuthenticated = locals.isUserLoggedIn;

    if (user && isAuthenticated) {
        const userData = await User.findById<IUser>(user.did);

        if (userData && url.search.length > 0) {
            const token = url.searchParams.get('token') ?? undefined;
            if (token && !userData.lastfm) {
                console.log('got token:', token);

                const p = new URLSearchParams({
                    api_key: LASTFM_API_KEY,
                    method: 'auth.getSession',
                    token: token,
                    api_sig: md5(`api_key${LASTFM_API_KEY}methodauth.getSessiontoken${token}${LASTFM_SECRET}`),
                    format: 'json'
                });

                const lastfm: {
                    session: { name: string; key: string; subscriber: number };
                    message?: string;
                    error?: number;
                } = await fetch(`${LASTFM_ENDPOINT}?${p}`).then((res) => res.json());

                console.log(lastfm);

                if (!lastfm.error) {
                    await User.findByIdAndUpdate(user.did, { lastfm: lastfm.session });
                }
            }

            const code = url.searchParams.get('code') ?? undefined;
            const state = url.searchParams.get('state') ?? undefined;
            if (code && state && state === RANDOM_STRING && !userData.spotify) {
                console.log('got code:', code);
                const spotify = await fetch(SPOTIFY_TOKEN_URL, {
                    method: 'POST',
                    headers: SPOTIFY_HEADERS,
                    body: new URLSearchParams({
                        code: code,
                        redirect_uri: SPOTIFY_CALLBACK_URL,
                        grant_type: 'authorization_code'
                    })
                }).then((res) => res.json());

                if (!spotify.error) {
                    await User.findByIdAndUpdate(user.did, { spotify: spotify });
                }
            }
        }
    }

    throw redirect(302, '/');
};
