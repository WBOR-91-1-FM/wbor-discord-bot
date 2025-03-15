/*
 * Loads commands dynamically, registers them with the Discord API, etc
 */

import fs from "fs";
import path from "path";
import { SlashCommandBuilder, REST, Routes, Client } from "discord.js";
import { ImportedCommand } from "./command";

export class CommandRegistry {
  public commands: ImportedCommand[];

  constructor() {
    this.commands = [];

    this.loadCommands();
  }

  registerCommand(command: ImportedCommand): void {
    const cleanInfo = {
      ...command.info,
      aliases: command.info.aliases || [],
    };

    this.commands.push({
      ...command,
      info: cleanInfo,
    });
  }

  findByName(name: string): ImportedCommand | undefined {
    return this.commands.find(
      (command) =>
        command.info.name === name ||
        (command.info.aliases?.includes(name) ?? false),
    );
  }

  async loadCommands(): Promise<void> {
    const commandFiles = fs.readdirSync("./src/commands");
    for (const file of commandFiles) {
      const pat = path.resolve("./src/commands", file);
      const command = await import(pat);
      this.registerCommand(command);
    }
    console.log("Loaded", commandFiles.length, "commands");
  }

  async registerApplicationCommands(
    applicationId: string,
    token: string,
  ): Promise<void> {
    if (!applicationId || !token) {
      console.error(
        "Application ID and token are required to register slash commands",
      );
      return;
    }

    const slashCommands: any[] = [];

    // Convert each command to a slash command
    for (const command of this.commands) {
      if (command.info.private) continue;

      try {
        const slashCommand = new SlashCommandBuilder()
          .setName(command.info.name.toLowerCase())
          .setDescription(command.info.description);

        slashCommands.push(slashCommand.toJSON());
      } catch (error) {
        console.error(
          `Failed to convert command ${command.info.name} to slash command:`,
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
          `Successfully registered ${(data as any[]).length} application commands.`,
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
