<script lang="ts">
    import { applyAction, deserialize, enhance } from '$app/forms';
    import type { ActionResult, error } from '@sveltejs/kit';
    import type { ActionData, PageServerData } from './$types';
    import { invalidateAll } from '$app/navigation';
    import { dev } from '$app/environment';
    import { PUBLIC_DEVEL_LOGIN, PUBLIC_DEVEL_PWD } from '$env/static/public';

    export let form: ActionData;

    export let data: PageServerData;
    $: show = data.isUserLoggedIn;
    $: user = data.user;

    async function handleLogin(event: { currentTarget: EventTarget & HTMLFormElement }) {
        const action = event.currentTarget.action;
        const data = new FormData(event.currentTarget);
        let identifier = data.get('identifier');
        let password = data.get('password');

        if (dev) {
            identifier = PUBLIC_DEVEL_LOGIN;
            password = PUBLIC_DEVEL_PWD;
        }

        const auth = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
            method: 'POST',
            body: JSON.stringify({
                identifier: identifier,
                password: password
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => res.json());

        const response = await fetch(action, {
            method: 'POST',
            body: JSON.stringify(auth)
        });

        const result: ActionResult = deserialize(await response.text());

        if (result.type === 'success') {
            // rerun all `load` functions, following the successful update
            await invalidateAll();
        }

        applyAction(result);
    }
</script>

{#if show}
    <div class="py-4">
        <form method="POST" action="?/logout" use:enhance>
            <button class="btn btn-sm btn-primary text-secondary"> logout </button>
        </form>
    </div>
    <div class="flex flex-col items-center gap-2 w-full max-w-4xl">
        <form method="POST">
            <div>
                {#if user?.lastfmLink}
                    <div class="join">
                        <button type="submit" class="btn btn-sm btn-primary join-item" formaction="?/lastfmPreview"
                            >preview last.fm</button
                        >
                        <button class="btn btn-sm btn-primary join-item" formaction="?/lastfmUnlink">x</button>
                    </div>
                {:else}
                    <button class="btn btn-sm btn-primary" formaction="?/lastfmLink"> link last.fm </button>
                {/if}
                {#if user?.spotifyLink}
                    <div class="join">
                        <button type="submit" class="btn btn-sm btn-primary join-item" formaction="?/spotifyPreview"
                            >preview spotify</button
                        >
                        <button class="btn btn-sm btn-primary join-item" formaction="?/spotifyUnlink">x</button>
                    </div>
                {:else}
                    <button type="submit" class="btn btn-sm btn-primary" formaction="?/spotifyLink">link spotify</button
                    >
                {/if}
            </div>
        </form>
        {#if form?.lastfmData}
            {#if form?.lastfmData.topartists}
                <div class="p-2 break-all">
                    [Last.fm] Last week: top 10 artists
                    {#each form.lastfmData.topartists.artist as artist, index}
                        <p>{index + 1}. {artist.name} ({artist.playcount})</p>
                    {/each}
                </div>
            {:else if form?.lastfmData.error}
                error
            {/if}
        {/if}
        {#if form?.spotifyData}
            {#if form?.spotifyData.items}
                <div class="p-2 break-all">
                    [Spotify] Last month: top 10 artists
                    {#each form.spotifyData.items as artist, index}
                        <p>{index + 1}. {artist.name}</p>
                    {/each}
                </div>
            {:else if form?.spotifyData.error}
                error
            {/if}
        {/if}
    </div>
{:else}
    <form
        method="POST"
        action="?/login"
        class="mt-6 flex items-center max-w-2xl mx-auto flex-col gap-2"
        on:submit|preventDefault={handleLogin}
    >
        <input
            type="text"
            name="identifier"
            id="identifier"
            class="input input-sm input-bordered border-primary hover:border-secondary w-full max-w-md"
            placeholder="your bluesky identifier"
        />
        <input
            type="password"
            name="password"
            id="password"
            class="input input-sm input-bordered border-primary hover:border-secondary w-full max-w-md"
            placeholder="app password"
        />
        <div class="text-left">
            <span class="text-xs text-primary">
                Create an
                <a class="link text-secondary" target="_blank" href="https://bsky.app/settings/app-passwords">
                    app password here
                </a>
            </span>
        </div>
        <div class="mt-4 sm:ml-4 flex">
            <button class="btn btn-sm btn-primary text-secondary"> Login </button>
        </div>
        {#if form}
            <div role="alert" class="alert alert-warning">
                <span class="text-sm">Login failed</span>
            </div>
        {/if}
    </form>
{/if}
