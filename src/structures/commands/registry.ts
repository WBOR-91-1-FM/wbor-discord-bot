/*
 * Loads commands dynamically, registers them with the Discord API, etc
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  SlashCommandBuilder, REST, Routes,
} from 'discord.js';
import type { ImportedCommand } from './command';
import { logger } from '../../utils/log.js';

const log = logger.on('registry');

export class CommandRegistry {
  public commands: ImportedCommand[];

  constructor() {
    this.commands = [];

    this.loadCommands();
  }

  registerCommand(command: ImportedCommand): void {
    if (!this.#shouldLoadCommand(command)) return;
    this.commands.push(command);
  }

  findByName(name: string): ImportedCommand | undefined {
    return this.commands.find((command) => command.info.name === name);
  }

  async loadCommands(): Promise<void> {
    const commandFiles = fs.readdirSync('./src/commands');
    commandFiles.map(async (file) => {
      const pat = path.resolve('./src/commands', file);
      const command = await import(pat);
      this.registerCommand(command);
    });

    log.debug(`Loaded ${commandFiles.length} commands`);
  }

  async registerApplicationCommands(
    applicationId: string,
    token: string,
    guildId?: string,
  ): Promise<void> {
    if (!applicationId || !token) {
      log.error(
        'Application ID and token are required to register slash commands',
      );
      return;
    }

    const slashCommands: any[] = [];

    // Convert each command to a slash command
    this.commands.forEach((command) => {
      if (command.info.private) return;

      try {
        const slashCommand = new SlashCommandBuilder()
          .setName(command.info.name.toLowerCase())
          .setDescription(command.info.description);

        const cmd = command.info.slashOptions
          ? command.info.slashOptions(slashCommand)
          : slashCommand;
        slashCommands.push(cmd.toJSON());
      } catch (error: any) {
        log.err(
          error,
          `Failed to convert command ${command.info.name} to slash command:`,
        );
      }
    });

    // Register slash commands with Discord API
    if (slashCommands.length > 0) {
      try {
        const rest = new REST({ version: '10' }).setToken(token);

        const data = guildId
          ? await rest.put(
            Routes.applicationGuildCommands(applicationId, guildId),
            {
              body: slashCommands,
            },
          )
          : await rest.put(Routes.applicationCommands(applicationId), {
            body: slashCommands,
          });

        log.debug(
          `Successfully registered ${(data as any[]).length} application commands.`,
        );
      } catch (error: any) {
        log.err(error, 'Error registering slash commands');
      }
    } else {
      log.warn('No commands were converted to slash commands.');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  shouldRunCommand(command: ImportedCommand, ctx: any): boolean {
    if (!command.info.dependsOn) return true;

    if (Array.isArray(command.info.dependsOn)) {
      return command.info.dependsOn
        .filter((condition) => typeof condition === 'function')
        .every((condition) => condition(ctx));
    }

    return true;
  }

  // Checks whether the command should be loaded, depending on the conditions set in the dependsOn.
  // eslint-disable-next-line class-methods-use-this
  #shouldLoadCommand(command: ImportedCommand): boolean {
    if (!command.info.dependsOn) return true;

    if (Array.isArray(command.info.dependsOn)) {
      return command.info.dependsOn
        .filter((condition) => typeof condition === 'boolean')
        .every((condition) => condition);
    }

    return true;
  }
}

export const commandRegistry = new CommandRegistry();
