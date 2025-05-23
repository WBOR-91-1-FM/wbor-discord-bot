import { WBOR_API_URL } from '../constants';

// Define the interfaces for the response data structure
export interface Song {
  title: string;
  artist: string;
  art: string; // URL to album art
}

export interface SongHistory {
  played_at: number; // Unix timestamp
  duration: number; // Duration in seconds
  song: Song;
}

export interface NowPlayingData {
  now_playing: {
    song: Song;
  };
  song_history: SongHistory[];
  mounts?: {
    listeners: {
      current: number;
    };
    url?: string;
  }[];
}
