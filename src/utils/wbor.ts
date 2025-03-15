import { WBOR_API_URL } from "../constants";

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

/**
 * Fetches the currently playing song and recent history from WBOR
 * @returns Promise that resolves to the now playing data
 */
export const getNowPlaying = async (): Promise<NowPlayingData> => {
  const response = await fetch(`${WBOR_API_URL}/nowplaying`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json() as Promise<NowPlayingData>;
};
