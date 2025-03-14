import { WBOR_API_URL } from "../constants.mjs";

export const getNowPlaying = () =>
  fetch(`${WBOR_API_URL}/nowplaying`).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  });
