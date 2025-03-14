import fs from "fs";
import path from "path";
import { SlashCommandBuilder, REST, Routes } from "discord.js";

export class CommandRegistry {
  constructor(client) {
    this.client = client;
    this.commands = [];

    this.loadCommands();
  }

  registerCommand(command) {
    this.commands.push({
      ...command,
      aliases: command.aliases || [],
    });
  }

  findByName(name) {
    return this.commands.find(
      (command) => command.name === name || command.aliases.includes(name),
    );
  }

  async loadCommands() {
    const commandFiles = fs
      .readdirSync("./src/commands")
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const pat = path.resolve("./src/commands", file);
      const command = await import(pat);
      this.registerCommand(command.default);
    }
    console.log("loaded", commandFiles.length, "commands");
  }

  async registerApplicationCommands(applicationId, token) {
    if (!applicationId || !token) {
      console.error(
        "Application ID and token are required to register slash commands",
      );
      return;
    }

    const slashCommands = [];

    // Convert each command to a slash command
    for (const command of this.commands) {
      // Skip commands marked as 'noSlash' or disabled
      if (command.noSlash || command.enabled === false) continue;

      try {
        const slashCommand = new SlashCommandBuilder()
          .setName(command.name.toLowerCase())
          .setDescription(command.description || `The ${command.name} command`);

        slashCommands.push(slashCommand.toJSON());
      } catch (error) {
        console.error(
          `Failed to convert command ${command.name} to slash command:`,
          error,
        );
      }
    }

    // Register slash commands with Discord API
    if (slashCommands.length > 0) {
      try {
        const rest = new REST({ version: "10" }).setToken(token);

        console.log(
          `Started refreshing ${slashCommands.length} application (/) commands.`,
        );

        // Register global commands
        const data = await rest.put(Routes.applicationCommands(applicationId), {
          body: slashCommands,
        });

        console.log(
          `Successfully registered ${data.length} application commands.`,
        );
      } catch (error) {
        console.error("Error registering slash commands:", error);
      }
    } else {
      console.log("No commands were converted to slash commands.");
    }
  }
}

export const commandRegistry = new CommandRegistry();
