import { handleAiCommand } from './commands/ai.js';
import { handleHelpCommand } from './commands/help.js';
import { handleFeedbackCommand } from './commands/feedback.js';
import { handleHistoryCommand } from './commands/history.js';
import { handleProfileCommand } from './commands/profile.js';
import { handleStatsCommand } from './commands/stats.js';
import logger from '../../utils/logger.js';

export const handleInteraction = async (interaction) => {
  // スラッシュコマンドの処理
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    logger.info(`Received command: ${commandName} from user: ${interaction.user.tag}`);

    try {
      switch (commandName) {
        case 'ai':
          await handleAiCommand(interaction);
          break;

        case 'help':
          await handleHelpCommand(interaction);
          break;

        case 'feedback':
          await handleFeedbackCommand(interaction);
          break;

        case 'history':
          await handleHistoryCommand(interaction);
          break;

        case 'profile':
          await handleProfileCommand(interaction);
          break;

        case 'stats':
          await handleStatsCommand(interaction);
          break;

        default:
          await interaction.reply({
            content: '❓ 不明なコマンドです。`/help`で使い方を確認してください。',
            ephemeral: true,
          });
      }
    } catch (error) {
      logger.error(`Error handling command ${commandName}:`, error);
      
      const errorMessage = '❌ コマンドの実行中にエラーが発生しました。しばらく待ってからもう一度お試しください。';
      
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  }

  // ボタンインタラクションの処理
  if (interaction.isButton()) {
    const { customId } = interaction;
    logger.info(`Received button interaction: ${customId}`);

    // ボタンのカスタムIDに基づいて処理を分岐
    if (customId.startsWith('select_tool_')) {
      // ツール選択ボタンの処理
      await handleToolSelection(interaction);
    } else if (customId.startsWith('feedback_')) {
      // フィードバックボタンの処理
      await handleFeedbackButton(interaction);
    }
  }

  // セレクトメニューインタラクションの処理
  if (interaction.isStringSelectMenu()) {
    const { customId } = interaction;
    logger.info(`Received select menu interaction: ${customId}`);

    if (customId === 'tool_selection') {
      await handleToolSelectionMenu(interaction);
    }
  }
};

// ツール選択ボタンの処理
const handleToolSelection = async (interaction) => {
  const toolId = interaction.customId.replace('select_tool_', '');
  
  await interaction.reply({
    content: `✅ ツールを選択しました。詳細な使い方ガイドを生成中です...`,
    ephemeral: true,
  });

  // TODO: 選択されたツールの詳細ガイドを生成
};

// フィードバックボタンの処理
const handleFeedbackButton = async (interaction) => {
  const [, action, toolId] = interaction.customId.split('_');
  
  if (action === 'helpful') {
    await interaction.reply({
      content: '👍 フィードバックありがとうございます！',
      ephemeral: true,
    });
    // TODO: ポジティブフィードバックを記録
  } else if (action === 'nothelpful') {
    await interaction.reply({
      content: '📝 改善のため、詳細なフィードバックをお聞かせください。`/feedback`コマンドをご利用ください。',
      ephemeral: true,
    });
  }
};

// ツール選択メニューの処理
const handleToolSelectionMenu = async (interaction) => {
  const selectedTools = interaction.values;
  
  await interaction.reply({
    content: `✅ ${selectedTools.length}個のツールを選択しました。比較情報を生成中です...`,
    ephemeral: true,
  });

  // TODO: 選択されたツールの比較情報を生成
};