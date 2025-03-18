import { ColorResolvable } from "discord.js";

export const WBOR_API_URL =
  process.env.STATION_API_URL || "https://azura.wbor.org/api/station/2";

export const EMBED_COLOR =
  (process.env.EMBED_HEX_COLOR as ColorResolvable) || "#22252f";

export const LOGO_URL =
  process.env.STATION_LOGO_URL ||
  "https://wbor.org/assets/images/apple-touch-icon.png";

export const SSE_TRACK_FEED =
  process.env.STATION_SSE_URL ||
  "https://azura.wbor.org/api/live/nowplaying/sse";

export const SPINITRON_HOME_PAGE_URL =
  process.env.STATION_SPINITRON_URL ||
  "https://playlists.wbor.org/WBOR/?layout=1";

// The station ID for AzuraCast
export const STATION_ID = process.env.STATION_AZURACAST_ID || "station:wbor";

export const STATION_CALL_SIGN = process.env.STATION_CALL_SIGN || "WBOR";

export const STATION_NAME = process.env.STATION_NAME || "WBOR 91.1 FM";
