<script lang="ts">
    import type { IQuery } from '$lib/types';

    export let query: IQuery;

    let list: {
        name: string;
        count?: number;
    }[] = [];

    if (query.data?.type === 'lastfm') {
        list = query.data.list.slice(0, 10).map((x) => ({
            name: x.name,
            count: Number(x.playcount)
        }));
    }

    if (query.data?.type === 'spotify') {
        list = query.data.list.slice(0, 10).map((x) => ({
            name: x.name
        }));
    }
</script>

<div class="text-left">
    {#if query.data?.type === 'lastfm'}
        <p class="text-lg text-bold underline">Last.fm</p>
        <p class="italic">Last week: top 10 artists</p>
    {:else if query.data?.type === 'spotify'}
        <p class="text-lg text-bold underline">Spotify</p>
        <p class="italic">Last month: top 10 artists</p>
    {/if}
    {#each list as artist, index}
        <p>{index + 1}. {artist.name}{artist.count ? ` (${artist.count})` : ''}</p>
    {/each}
</div>
