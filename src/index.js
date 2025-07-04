import express from 'express';
import { getBot } from './bot/index.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import { initializeDatabase } from './database/index.js';
import { setupMiddleware } from './middleware/index.js';
import { setupRoutes } from './routes/index.js';
import { gracefulShutdown } from './utils/shutdown.js';

// アプリケーションクラス
class DiscordButlerApp {
  constructor() {
    this.app = express();
    this.server = null;
    this.bot = null;
  }

  async initialize() {
    try {
      logger.info('🚀 Starting Discord Butler...');

      // データベース初期化
      logger.info('Initializing database...');
      await initializeDatabase();

      // Express設定
      logger.info('Setting up Express middleware...');
      setupMiddleware(this.app);

      // ルート設定
      logger.info('Setting up routes...');
      setupRoutes(this.app);

      // Discord Bot起動
      logger.info('Starting Discord bot...');
      this.bot = getBot();
      await this.bot.start();

      // HTTPサーバー起動
      this.server = this.app.listen(config.app.port, () => {
        logger.info(`🌐 HTTP server listening on port ${config.app.port}`);
      });

      // プロセスシグナルのハンドリング
      process.on('SIGTERM', () => this.shutdown('SIGTERM'));
      process.on('SIGINT', () => this.shutdown('SIGINT'));

      logger.info('✅ Discord Butler started successfully!');
      this.logSystemInfo();

    } catch (error) {
      logger.error('Failed to start Discord Butler:', error);
      process.exit(1);
    }
  }

  async shutdown(signal) {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    await gracefulShutdown(async () => {
      // HTTPサーバーを停止
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('HTTP server closed');
      }

      // Discord Botを停止
      if (this.bot) {
        await this.bot.stop();
        logger.info('Discord bot stopped');
      }

      // データベース接続を閉じる
      // TODO: データベース接続のクローズ処理

      logger.info('✅ Graceful shutdown completed');
    });

    process.exit(0);
  }

  logSystemInfo() {
    logger.info('System Information:', {
      nodeVersion: process.version,
      platform: process.platform,
      environment: config.app.env,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    });
  }
}

// アプリケーションの起動
const app = new DiscordButlerApp();
app.initialize().catch((error) => {
  logger.error('Unhandled error during initialization:', error);
  process.exit(1);
});

// 未処理のPromiseリジェクションをキャッチ
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 未処理の例外をキャッチ
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;