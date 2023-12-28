/* eslint-disable @typescript-eslint/no-unused-vars */
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
import type { IQuery, SpotifyArtistType } from '$lib/types';

const LASTFM_ENDPOINT = 'http://ws.audioscrobbler.com/2.0';
const SPOTIFY_ENDPOINT = 'https://api.spotify.com/v1';

export const ssr = true;
export const load: PageServerLoad = async ({ locals }) => {
    const { user, lastfm, spotify } = locals;

    return {
        user: Boolean(user),
        lastfm: Boolean(lastfm),
        spotify: Boolean(spotify)
    };
};

const getSpotifyPublicAccessToken = async () => {
    const url = `https://open.spotify.com/get_access_token?reason=transport&productType=web_player`;

    const payload = {
        method: 'POST'
    };

    const body = await fetch(url);
    const response = await body.json();

    if (response.error) return;
    return response.accessToken as string;
};

const getSpotifyAccessToken = async (refresh_token: string) => {
    const url = `https://accounts.spotify.com/api/token`;

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + btoa(`${SPOTIFY_API_KEY}:${SPOTIFY_SECRET}`)
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: SPOTIFY_API_KEY
        })
    };

    const body = await fetch(url, payload);
    const response = await body.json();

    if (response.error) return;

    // update db if logged in
    return response.access_token as string;
};

const LASTFM_DICT: {[key: string]: string} = {
    'artists': 'getTopArtists',
    'albums': 'getTopAlbums',
}

export const actions = {
    spotifyPreview: async ({ locals, request, params }) => {
        if (locals.spotify) {
            const formData = await request.formData();
            const type = String(formData.get('spotifyType'));
            const time_range = String(formData.get('spotifyTimeRange'));
            const limit = String(formData.get('spotifyLimit'));

            const access_token = await getSpotifyAccessToken(locals.spotify.refresh_token);
            if (access_token) {
                const params = new URLSearchParams({
                    time_range: time_range,
                    limit: limit
                });

                const query = await fetch(`${SPOTIFY_ENDPOINT}/me/top/${type}?${params}`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                })
                    .then((res) => res.json())
                    .then((res) => {
                        if (res.error) return res as IQuery;
                        return {
                            data: {
                                service: 'spotify',
                                type: type,
                                time_range: time_range,
                                list: res.items
                            }
                        } as IQuery;
                    });
                return {
                    query: query
                };
            }
        }
    },
    lastfmPreview: async ({ locals, request }) => {
        if (locals.lastfm) {
            const formData = await request.formData();
            const type = String(formData.get('lastfmType'));
            const time_range = String(formData.get('lastfmTimeRange'));
            const limit = String(formData.get('lastfmLimit'));

            const params = new URLSearchParams({
                method: `user.${LASTFM_DICT[type]}`,
                user: locals.lastfm.name,
                period: time_range,
                limit: limit,
                api_key: LASTFM_API_KEY,
                format: 'json'
            });

            const query = await fetch(`${LASTFM_ENDPOINT}/?${params}`)
                .then((res) => res.json())
                .then((res) => {
                    if (res.error) return res as IQuery;


                    if (type === 'artists') {
                        return {
                            data: {
                                service: 'lastfm',
                                type: 'artists',
                                time_range: time_range,
                                list: res.topartists.artist
                            }
                        } as IQuery;
                    } else if (type === 'albums') {
                        return {
                            data: {
                                service: 'lastfm',
                                type: 'albums',
                                time_range: time_range,
                                list: res.topalbums.album
                            }
                        } as IQuery;
                    }
                });
                

            const spotifyPublicToken = await getSpotifyPublicAccessToken();
            const payload = {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${spotifyPublicToken}`
                }
            };
            if (query && query.data && query.data.service === 'lastfm') {
                for (const [i, item] of query.data.list.entries()) {
                    const spotifySearch = await fetch(
                        `https://api.spotify.com/v1/search?type=artist&q=${item.name}&decorate_restrictions=false&best_match=true&include_external=audio&limit=1`,
                        payload
                    ).then((res) => res.text());

                    if (spotifySearch.length > 0) {
                        const searchData: {
                            best_match: {
                                items: SpotifyArtistType[];
                            };
                        } = JSON.parse(spotifySearch);

                        if (searchData.best_match.items.length === 1) {
                            query.data.list[i].spotifyImage = searchData.best_match.items[0].images[0].url;
                        }
                    }
                }
            }

            return {
                query: query
            };
        }
    },
    login: async ({ request, locals, cookies }) => {
        const data = await request.json();

        const { did, handle, accessJwt, refreshJwt, didDoc } = data;

        if (isValidDidDoc(didDoc)) {
            const pds = getPdsEndpoint(didDoc) ?? 'https://bsky.social/';
            // const user = await User.findByIdAndUpdate(
            //     did,
            //     { handle: handle, pds: pds, bskyRefreshToken: refreshJwt },
            //     { upsert: true, new: true }
            // );

            const auth = {
                did: did,
                handle: handle,
                pds: pds,
                accessJwt: accessJwt,
                refreshJwt: refreshJwt
            };

            const currSession = await sessionManager.getSession(cookies);
            if (currSession && currSession.data) {
                await sessionManager.updateSession(cookies, { ...currSession.data, user: auth });
            } else {
                await sessionManager.createSession(cookies, { user: auth }, auth.did);
            }
        }
        throw redirect(302, '/');
    },
    logout: async ({ cookies }) => {
        const currSession = await sessionManager.getSession(cookies);
        if (currSession && currSession.data) {
            await sessionManager.updateSession(cookies, { ...currSession.data, user: undefined });
        }
        throw redirect(302, '/');
    },
    lastfmLink: async ({ locals }) => {
        if (!locals.lastfm) {
            console.log('have to link lastfm');
            const params = new URLSearchParams({
                api_key: LASTFM_API_KEY,
                cb: LASTFM_CALLBACK_URL
            });
            throw redirect(302, `https://last.fm/api/auth?${params}`);
        }
        throw redirect(302, '/');
    },
    lastfmUnlink: async ({ cookies }) => {
        const currSession = await sessionManager.getSession(cookies);
        if (currSession && currSession.data) {
            await sessionManager.updateSession(cookies, { ...currSession.data, lastfm: undefined });
        }
        // update db if logged in
        throw redirect(302, '/');
    },
    spotifyLink: async ({ locals }) => {
        if (!locals.spotify) {
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
    spotifyUnlink: async ({ cookies }) => {
        const currSession = await sessionManager.getSession(cookies);
        if (currSession && currSession.data) {
            await sessionManager.updateSession(cookies, { ...currSession.data, spotify: undefined });
        }
        // update db if logged in
        throw redirect(302, '/');
    }
} satisfies Actions;
