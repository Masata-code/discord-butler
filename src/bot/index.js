import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import { registerCommands } from './commands/index.js';

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Botが準備完了時
    this.client.once('ready', () => {
      logger.info(`✅ Discord Bot logged in as ${this.client.user.tag}`);
      this.setPresence();
      this.registerSlashCommands();
    });

    // インタラクション（スラッシュコマンド）処理
    this.client.on('interactionCreate', async (interaction) => {
      try {
        await handleInteraction(interaction);
      } catch (error) {
        logger.error('Error handling interaction:', error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '❌ エラーが発生しました。もう一度お試しください。',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '❌ エラーが発生しました。もう一度お試しください。',
            ephemeral: true,
          });
        }
      }
    });

    // エラーハンドリング
    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('warn', (info) => {
      logger.warn('Discord client warning:', info);
    });

    // 切断時の再接続
    this.client.on('disconnect', () => {
      logger.warn('Discord bot disconnected. Attempting to reconnect...');
    });

    this.client.on('reconnecting', () => {
      logger.info('Discord bot reconnecting...');
    });
  }

  setPresence() {
    this.client.user.setPresence({
      activities: [{
        name: 'AIツールの相談',
        type: 2, // LISTENING
      }],
      status: 'online',
    });
  }

  async registerSlashCommands() {
    try {
      const commands = await registerCommands();
      const rest = new REST({ version: '10' }).setToken(config.discord.token);

      logger.info('Started refreshing application (/) commands.');

      // グローバルコマンドの登録
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands },
      );

      logger.info('Successfully reloaded application (/) commands.');
    } catch (error) {
      logger.error('Error registering slash commands:', error);
    }
  }

  async start() {
    try {
      await this.client.login(config.discord.token);
    } catch (error) {
      logger.error('Failed to start Discord bot:', error);
      throw error;
    }
  }

  async stop() {
    try {
      await this.client.destroy();
      logger.info('Discord bot stopped successfully');
    } catch (error) {
      logger.error('Error stopping Discord bot:', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }
}

// シングルトンインスタンス
let botInstance = null;

export const getBot = () => {
  if (!botInstance) {
    botInstance = new DiscordBot();
  }
  return botInstance;
};

export default DiscordBot;