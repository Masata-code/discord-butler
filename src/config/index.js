import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数の読み込み
dotenv.config({ path: join(__dirname, '../../.env') });

// 設定の検証
const requiredEnvVars = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'DATABASE_URL',
  'OPENAI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export const config = {
  // Discord設定
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'MessageContent'],
  },

  // n8n設定
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/discord-butler',
    apiKey: process.env.N8N_API_KEY,
  },

  // AI API設定
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 1000,
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      model: 'claude-3-opus-20240229',
      temperature: 0.3,
      maxTokens: 2000,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-pro',
      temperature: 0.5,
      maxTokens: 1500,
    },
  },

  // データベース設定
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  },

  // Redis設定
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: 3600, // 1時間
  },

  // アプリケーション設定
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // セキュリティ設定
  security: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'development-key-32-characters-long',
    rateLimitWindowMs: 5 * 60 * 1000, // 5分
    rateLimitMaxRequests: 100,
  },

  // セッション設定
  session: {
    timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'),
    maxContextMessages: parseInt(process.env.MAX_CONTEXT_MESSAGES || '10'),
  },

  // モニタリング設定
  monitoring: {
    datadogApiKey: process.env.DATADOG_API_KEY,
    sentryDsn: process.env.SENTRY_DSN,
  },
};

export default config;