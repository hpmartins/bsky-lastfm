export type ILastfmArtistData = {
    service: 'lastfm';
    type: 'artists';
    time_range: string;
    list: {
        streamable: string;
        image: {
            size: string;
            '#text': string;
        }[];
        spotifyImage?: string;
        mbid: string;
        url: string;
        playcount: string;
        '@attr': {
            rank: string;
        };
        name: string;
    }[];
};

export type ILastfmAlbumData = {
    service: 'lastfm';
    type: 'albums';
    time_range: string;
    list: {
        artist: {
            url: string;
            name: string;
            mbid: string;
        };
        image: {
            size: string;
            '#text': string;
        }[];
        spotifyImage?: string;
        mbid: string;
        url: string;
        playcount: string;
        '@attr': {
            rank: string;
        };
        name: string;
    }[];
};

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
}

export type ISpotifyArtistData = {
    service: 'spotify';
    type: 'artists';
    time_range: string;
    list: SpotifyArtistType[];
};

export interface IQuery {
    error?: string;
    data?: ILastfmArtistData | ILastfmAlbumData | ISpotifyArtistData;
}

export type CirclesOptionsType = {
    orbits: number;
    add_watermark: boolean;
    add_date: boolean;
    bg_color: string;
    add_border: boolean;
    border_color: string;
};
