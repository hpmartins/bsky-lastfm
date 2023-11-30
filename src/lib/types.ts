export type SpotifyArtistType = {
    external_urls: object;
    followers: object;
    genres: string[];
    href: string;
    id: string;
    images: {
        height: number;
        width: number;
        url: string;
    }[];
    name: string;
    popularity: number;
    type: string;
    uri: string;
};

export type LastfmArtistType = {
    streamable: string;
    image: {
        size: string;
        '#text': string;
    }[];
    mbid: string;
    url: string;
    playcount: string;
    '@attr': {
        rank: string;
    };
    name: string;
};

export type ILastfmArtists = {
    type: 'lastfm';
    list: LastfmArtistType[];
}

export type ISpotifyArtists = {
    type: 'spotify';
    list: SpotifyArtistType[];
}

export interface IQuery {
    error?: string;
    data?: ILastfmArtists | ISpotifyArtists;
}

export type CirclesOptionsType = {
    orbits: number;
    add_watermark: boolean;
    add_date: boolean;
    bg_color: string;
    add_border: boolean;
    border_color: string;
};
