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
    SPOTIFY_CALLBACK_URL,
    SPOTIFY_SECRET
} from '$env/static/private';

const LASTFM_ENDPOINT = 'http://ws.audioscrobbler.com/2.0';
const SPOTIFY_ENDPOINT = 'https://api.spotify.com/v1';

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

const spotifyRefreshToken = async (user: IUser) => {
    const url = `https://accounts.spotify.com/api/token`;

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + btoa(`${SPOTIFY_API_KEY}:${SPOTIFY_SECRET}`)
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: String(user.spotify?.refresh_token),
            client_id: SPOTIFY_API_KEY
        })
    };

    const body = await fetch(url, payload);
    const response = await body.json();

    if (response.error) return null;

    const newUser: IUser | null = await User.findByIdAndUpdate(
        user._id,
        {
            'spotify.access_token': response.access_token
        },
        { new: true }
    );
    return newUser;
};

type ISpotifyArtist = {
    external_urls: object,
    followers: object,
    genres: string[],
    href: string,
    id: string,
    images: string[],
    name: string,
    popularity: number,
    type: string,
    uri: string,
}

type ILastfmArtist = {
    streamable: string;
    image: object[];
    mbid: string;
    url: string;
    playcount: string;
    '@attr': {
        rank: string;
    };
    name: string;
}

interface ISpotifyTopArtists {
    error?: string,
    items?: ISpotifyArtist[],
}

interface ILastfmTopArtists {
    error?: string;
    topartists?: {
        artist: ILastfmArtist[];
        '@attr': {
            [key: string]: string;
        };
    };
}

export const actions = {
    spotifyPreview: async ({ locals }) => {
        if (locals.user && locals.isUserLoggedIn) {
            let user: IUser | null = await User.findById(locals.user.did);
            if (user && user.spotify) {
                user = await spotifyRefreshToken(user);
                if (user && user.spotify) {
                    const params = new URLSearchParams({
                        time_range: 'short_term',
                        limit: String(10)
                    });

                    const data = await fetch(`${SPOTIFY_ENDPOINT}/me/top/artists?${params}`, {
                        headers: {
                            Authorization: `${user.spotify.token_type} ${user.spotify.access_token}`
                        }
                    }).then((res) => res.json()).then(x => x as ISpotifyTopArtists);
                    console.log('spotify', data);
                    return {
                        spotifyData: data
                    };
                }
            }
        }
    },
    lastfmPreview: async ({ locals }) => {
        if (locals.user && locals.isUserLoggedIn) {
            const user: IUser | null = await User.findById(locals.user.did);

            if (user && user.lastfm) {
                const params = new URLSearchParams({
                    method: 'user.getTopArtists',
                    user: user.lastfm.name,
                    period: '7day',
                    limit: String(10),
                    api_key: LASTFM_API_KEY,
                    format: 'json'
                });

                const data = await fetch(`${LASTFM_ENDPOINT}/?${params}`).then((res) => res.json()).then(x => x as ILastfmTopArtists);
                console.log('lastfm', data.topartists?.artist);
                return {
                    lastfmData: data
                };
            }
        }
    },
    login: async ({ request, locals, cookies }) => {
        const data = await request.json();

        const { did, handle, accessJwt, refreshJwt, didDoc } = data;

        if (isValidDidDoc(didDoc)) {
            const pds = getPdsEndpoint(didDoc) ?? 'https://bsky.social/';
            const user = await User.findByIdAndUpdate(
                did,
                { handle: handle, pds: pds, bskyRefreshToken: refreshJwt },
                { upsert: true, new: true }
            );

            const auth = {
                did: did,
                handle: handle,
                pds: pds,
                accessJwt: accessJwt,
                refreshJwt: refreshJwt,
                lastfmLink: user?.lastfm ? true : false,
                spotifyLink: user?.spotify ? true : false
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
        throw redirect(302, '/');
    },
    lastfmLink: async ({ locals }) => {
        if (locals.user && !locals.user.lastfmLink) {
            console.log('have to link lastfm');
            const params = new URLSearchParams({
                api_key: LASTFM_API_KEY,
                cb: LASTFM_CALLBACK_URL
            });
            throw redirect(302, `https://last.fm/api/auth?${params}`);
        }
        throw redirect(302, '/');
    },
    lastfmUnlink: async ({ locals }) => {
        if (locals.user) {
            locals.user.lastfmLink = false;
            await User.findByIdAndUpdate(locals.user.did, { lastfm: null });
        }
        throw redirect(302, '/');
    },
    spotifyLink: async ({ locals }) => {
        if (locals.user && !locals.user.spotifyLink) {
            console.log('have to link spotify');
            const params = new URLSearchParams({
                response_type: 'code',
                client_id: SPOTIFY_API_KEY,
                scope: 'user-top-read',
                redirect_uri: SPOTIFY_CALLBACK_URL,
                state: RANDOM_STRING
            });
            throw redirect(302, `https://accounts.spotify.com/authorize?${params}`);
        }
        throw redirect(302, '/');
    },
    spotifyUnlink: async ({ locals }) => {
        if (locals.user) {
            locals.user.spotifyLink = false;
            await User.findByIdAndUpdate(locals.user.did, { spotify: null });
        }
        throw redirect(302, '/');
    }
} satisfies Actions;
