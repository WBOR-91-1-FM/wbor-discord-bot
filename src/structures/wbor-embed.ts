import { EMBED_COLOR, LOGO_URL } from "../constants.ts";
import { EmbedBuilder } from "discord.js";

export default class WBOREmbed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(EMBED_COLOR);
    this.setTimestamp();
    this.setAuthor({
      name: "WBOR 91.1 FM",
      iconURL: LOGO_URL,
    });
  }
}
