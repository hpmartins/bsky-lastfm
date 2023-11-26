// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            isUserLoggedIn: boolean;
            user:
                | {
                      did: string;
                      handle: string;
                      pds: string;
                      accessJwt: string;
                      refreshJwt: string;
                      lastfmLink?: boolean;
                      spotifyLink?: boolean;
                  }
                | undefined;
        }
        // interface PageData {}
        // interface Platform {}
    }
}

export {};
