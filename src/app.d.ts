// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            user?: {
                did: string;
                handle: string;
                pds: string;
                accessJwt: string;
                refreshJwt: string;
            };
            lastfm?: {
                name: string;
                key: string;
                subscriber: number;
            };
            spotify?: {
                access_token: string;
                refresh_token: string;
            };
        }
        // interface PageData {}
        // interface Platform {}
    }
}

export {};
