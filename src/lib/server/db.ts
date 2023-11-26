import mongoose from 'mongoose';
import { MONGODB_URI } from '$env/static/private';

const mongoConnection = {
    isConnected: false
};

export const connectDb = async () => {
    if (mongoConnection.isConnected) {
        return;
    }
    if (mongoose.connections.length > 0) {
        mongoConnection.isConnected = Boolean(mongoose.connections[0].readyState);
        if (mongoConnection.isConnected) {
            return;
        }
        await mongoose.disconnect();
    }
    await mongoose.connect(MONGODB_URI);
    mongoConnection.isConnected = true;
};

export interface IUser {
    _id: string;
    handle: string;
    pds: string;
    bskyRefreshToken: string;
    lastfm: ILastfmSession | null;
    spotify: ISpotifySession | null;
    createdAt: string;
    updatedAt: string;
}

export interface ILastfmSession {
    name: string;
    key: string;
    subscriber: string;
}

export interface ISpotifySession {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token: string;
}

const lastfmSchema = new mongoose.Schema<ILastfmSession>({
    name: String,
    key: String,
    subscriber: Number
});

const spotifySchema = new mongoose.Schema<ISpotifySession>({
    access_token: String,
    token_type: String,
    scope: String,
    expires_in: Number,
    refresh_token: String
});

export const User =
    mongoose.models['User'] ||
    mongoose.model<IUser>(
        'User',
        new mongoose.Schema(
            {
                _id: String,
                handle: String,
                pds: String,
                bskyRefreshToken: String,
                lastfm: lastfmSchema,
                spotify: spotifySchema
            },
            { timestamps: true }
        )
    );
