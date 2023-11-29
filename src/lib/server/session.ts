import { IoRedisSessionStore } from '@ethercorps/sveltekit-redis-session';
import { dev } from '$app/environment';
import Redis from 'ioredis';
import { REDIS_CONNECTION_STRING } from '$env/static/private';

export const sessionManager = new IoRedisSessionStore({
    redisClient: new Redis(REDIS_CONNECTION_STRING), // Required A pre-initiated redis client
    secret: 'your-secret-key', // Required A secret key for encryption and other things,
    cookieName: 'session', // CookieName to be saved in cookies for browser Default session
    sessionPrefix: 'bsky-lastfm:session',
    userSessionsPrefix: 'bsky-lastfm:user',
    signed: true, // Do you want to sign your cookies Default true
    useTTL: false, // Do you wanna use redis's Expire key functionality Default false
    renewSessionBeforeExpire: true, // Do you wanna update session expire time in built function Default false
    renewBeforeSeconds: 30 * 60, // If renewSessionBeforeExpire is true define your renew before time in seconds Default 30 minutes
    serializer: JSON, // You can define your own serializer functions to stringify and parse sessionData for redis Default JSON
    cookiesOptions: {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev, // From SvelteKit "$app/environment"
        maxAge: 60 * 60 * 24 // You have to define time in seconds and it's also used for redis key expiry time
    } // You have more options these are default used in package for more check sveltekit CookieSerializeOptions type.
});
