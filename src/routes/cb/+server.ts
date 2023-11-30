/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { sessionManager } from '$lib/server/session';

const md5 = (data: string) => crypto.createHash('md5').update(data).digest('hex');

export const GET: RequestHandler = async ({ locals, cookies, url }) => {
    if (url.search.length > 0) {
        const token = url.searchParams.get('token') ?? undefined;
        if (!locals.lastfm && token) {
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
            } = await fetch(`http://ws.audioscrobbler.com/2.0/?${p}`).then((res) => res.json());

            if (!lastfm.error) {
                const currSession = await sessionManager.getSession(cookies);
                if (currSession.data) {
                    await sessionManager.updateSession(cookies, { ...currSession.data, lastfm: lastfm.session });
                } else {
                    await sessionManager.createSession(cookies, { lastfm: lastfm.session }, crypto.randomUUID());
                }
            }
        }

        const code = url.searchParams.get('code') ?? undefined;
        const state = url.searchParams.get('state') ?? undefined;
        if (!locals.spotify && code && state && state === RANDOM_STRING) {
            console.log('got code:', code);
            const tokenUrl = `https://accounts.spotify.com/api/token`;
            const spotify = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + btoa(`${SPOTIFY_API_KEY}:${SPOTIFY_SECRET}`)
                },
                body: new URLSearchParams({
                    code: code,
                    redirect_uri: SPOTIFY_CALLBACK_URL,
                    grant_type: 'authorization_code'
                })
            }).then((res) => res.json());

            console.log(spotify);

            if (!spotify.error) {
                const currSession = await sessionManager.getSession(cookies);
                if (currSession.data) {
                    await sessionManager.updateSession(cookies, { ...currSession.data, spotify: spotify });
                } else {
                    await sessionManager.createSession(cookies, { spotify: spotify }, crypto.randomUUID());
                }
            }
        }
    }

    throw redirect(302, '/');
};
