import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// カスタムフォーマット
const customFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // メタデータがある場合は追加
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  
  // スタックトレースがある場合は追加
  if (stack) {
    log += `\n${stack}`;
  }
  
  return log;
});

// ロガーの作成
const logger = winston.createLogger({
  level: config.app.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    // コンソール出力
    new winston.transports.Console({
      format: combine(
        colorize(),
        customFormat
      ),
    }),
    // ファイル出力（エラーのみ）
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // ファイル出力（全て）
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// 本番環境では外部サービスに送信
if (config.app.env === 'production') {
  // Datadog統合
  if (config.monitoring.datadogApiKey) {
    // TODO: Datadog transport追加
  }
  
  // Sentry統合
  if (config.monitoring.sentryDsn) {
    // TODO: Sentry transport追加
  }
}

// ログレベルの動的変更
export const setLogLevel = (level) => {
  logger.level = level;
};

// 構造化ログのヘルパー関数
export const logEvent = (eventName, data = {}) => {
  logger.info('Event', {
    event: eventName,
    ...data,
  });
};

export const logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      stack: error.stack,
      code: error.code,
    },
    ...context,
  });
};

export const logPerformance = (operation, duration, metadata = {}) => {
  logger.info('Performance', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

export default logger;