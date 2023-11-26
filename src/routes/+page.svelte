<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData, PageServerData } from './$types';

    export let form: ActionData;

    export let data: PageServerData;
    $: show = data.isUserLoggedIn;
    $: user = data.user;
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
                        <button type="submit" class="btn btn-sm btn-primary join-item">preview last.fm</button>
                        <button class="btn btn-sm btn-primary join-item" formaction="?/lastfmUnlink">x</button>
                    </div>
                {:else}
                    <button class="btn btn-sm btn-primary" formaction="?/lastfmLink"> link last.fm </button>
                {/if}
                {#if user?.spotifyLink}
                    <div class="join">
                        <button type="submit" class="btn btn-sm btn-primary join-item">preview spotify</button>
                        <button class="btn btn-sm btn-primary join-item" formaction="?/spotifyUnlink">x</button>
                    </div>
                {:else}
                    <button type="submit" class="btn btn-sm btn-primary" formaction="?/spotifyLink">link spotify</button
                    >
                {/if}
            </div>
        </form>
        <!-- <input
        class="input input-sm input-bordered input-primary"
        type="text"
        id="lastfmUser"
        name="lastfmUser"
        value="hpmartins"
        placeholder="Last.FM username"
      /> -->
        <select class="select select-sm text-xs select-primary w-full max-w-xs">
            <option disabled selected>What chart?</option>
            <option>Game of Thrones</option>
            <option>Lost</option>
            <option>Breaking Bad</option>
            <option>Walking Dead</option>
        </select>
        <select class="select select-sm text-xs select-primary w-full max-w-xs">
            <option disabled selected>Choose time</option>
            <option>Every 6 hours</option>
            <option>Every day</option>
            <option>Breaking Bad</option>
            <option>Walking Dead</option>
        </select>
        <div>
            <button type="submit" class="btn btn-sm btn-primary">preview</button>
            <button type="submit" class="btn btn-sm btn-primary">search</button>
        </div>
    </div>
{:else}
    <form method="POST" action="?/login" class="mt-6 flex items-center max-w-2xl mx-auto flex-col gap-2" use:enhance>
        <input
            type="text"
            name="identifier"
            id="identifier"
            class="input input-sm input-bordered border-primary hover:border-secondary w-full max-w-md"
            placeholder="your bluesky identifier"
            value="did:plc:fatjkn3ztc7tyhgar3rfjahb"
        />
        <input
            type="password"
            name="password"
            id="password"
            class="input input-sm input-bordered border-primary hover:border-secondary w-full max-w-md"
            placeholder="app password"
            value="gnut-u375-fheb-nfby"
        />
        <div class="text-left">
            <span class="text-xs text-primary">
                Create an
                <a class="link text-secondary" target="_blank" href="https://bsky.app/settings/app-passwords">
                    app password here
                </a>
                and delete it once you're done
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
