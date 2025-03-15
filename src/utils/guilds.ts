import fs from "fs";

interface GuildData {
  id: string;
  home: string | null;
}

/**
 * Loads guild data from the persistence file
 * @returns Array of guild data objects
 */
export function loadGuildData(): GuildData[] {
  if (fs.existsSync("./persist/guilds.json")) {
    return JSON.parse(fs.readFileSync("./persist/guilds.json", "utf8"));
  } else {
    return [];
  }
}

/**
 * Gets the data for a specific guild, creating it if it doesn't exist
 * @param guild The guild ID or an object with an id property
 * @returns The guild's data
 */
export function getForGuild(guild: string | { id: string }): GuildData {
  const guildData = loadGuildData();
  const guildId = typeof guild === "string" ? guild : guild.id;

  let serverData = guildData.find((serv) => serv.id === guildId);
  if (serverData) {
    return serverData;
  }

  // Create new server data if it doesn't exist
  serverData = {
    id: guildId,
    home: null,
  };

  guildData.push(serverData);

  // Write the updated guild data to the file
  fs.writeFileSync("./persist/guilds.json", JSON.stringify(guildData), {
    encoding: "utf8",
  });

  return serverData;
}

/**
 * Updates the data for a specific guild
 * @param serverData The guild data to write
 */
export function writeForGuild(serverData: GuildData): void {
  const guildData = loadGuildData();

  // Find and update the matching guild's data
  const updatedGuildData = guildData.map((data) =>
    data.id === serverData.id ? serverData : data,
  );

  // Write the updated guild data to the file
  fs.writeFile(
    "./persist/guilds.json",
    JSON.stringify(updatedGuildData),
    { encoding: "utf8" },
    (err) => {
      if (err) {
        console.error(err);
      }
    },
  );
}
