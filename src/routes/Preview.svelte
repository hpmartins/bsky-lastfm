<script lang="ts">
    import type { IQuery } from '$lib/types';

    export let query: IQuery;

    let list: {
        name: string;
        count?: number;
    }[] = [];

    const TIME_RANGE_DICT: {[key: string]: { [key: string]: string}} = {
        'lastfm': {
            '7day': '7 dias',
            '1month': '1 mês',
            '3month': '3 meses',
            '6month': '6 meses',
            '12month': '12 meses',
            'overall': 'desde sempre',
        },
        'spotify': {
            'short_term': '1 mês',
            'medium_term': '6 meses',
            'long_term': 'desde sempre',
        }
    }

    if (query.data?.service === 'lastfm') {
        list = query.data.list.map((x) => ({
            name: x.name,
            count: Number(x.playcount)
        }));
    }

    if (query.data?.service === 'spotify') {
        list = query.data.list.map((x) => ({
            name: x.name
        }));
    }
</script>

<div class="text-left">
    {#if query.data?.service === 'lastfm'}
        <p class="text-lg text-bold">Last.fm ({TIME_RANGE_DICT[query.data.service][query.data.time_range]}) - Top {query.data.list.length} {query.data.type}</p>
    {:else if query.data?.service === 'spotify'}
        <p class="text-lg text-bold">Spotify ({TIME_RANGE_DICT[query.data.service][query.data.time_range]}) - Top {query.data.list.length} {query.data.type}</p>
    {/if}
    {#each list as artist, index}
        <p>{index + 1}. {artist.name}{artist.count ? ` (${artist.count})` : ''}</p>
    {/each}
</div>
