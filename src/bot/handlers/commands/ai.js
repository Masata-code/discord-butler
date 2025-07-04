import axios from 'axios';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../../config/index.js';
import logger from '../../../utils/logger.js';

export const handleAiCommand = async (interaction) => {
  // 即座に応答（3秒以内のタイムアウトを防ぐ）
  await interaction.deferReply();

  try {
    const task = interaction.options.getString('task');
    const userId = interaction.user.id;
    const username = interaction.user.username;

    logger.info(`Processing AI command for user ${username}: ${task}`);

    // n8n Webhookにリクエストを送信
    const response = await axios.post(config.n8n.webhookUrl, {
      type: 2,
      data: {
        user: {
          id: userId,
          username: username,
        },
        options: [{
          name: 'task',
          value: task,
        }],
        channel_id: interaction.channelId,
        id: interaction.id,
        token: interaction.token,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.n8n.apiKey ? `Bearer ${config.n8n.apiKey}` : undefined,
      },
      timeout: 30000, // 30秒のタイムアウト
    });

    // n8nからの応答を処理
    if (response.data && response.data.guide) {
      const guide = response.data.guide;
      const recommendations = response.data.recommendations || [];

      // メインのEmbed
      const mainEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🤖 AIツール推薦結果')
        .setDescription(task)
        .setTimestamp()
        .setFooter({ text: 'Discord Butler', iconURL: interaction.client.user.displayAvatarURL() });

      // 推薦されたツールを追加
      if (recommendations.length > 0) {
        recommendations.forEach((tool, index) => {
          mainEmbed.addFields({
            name: `${index + 1}. ${tool.display_name}`,
            value: `${tool.description}\n💰 ${tool.pricing_model.free_tier ? '無料プランあり' : '有料'}`,
            inline: false,
          });
        });
      }

      // ボタンの作成
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('feedback_helpful_' + interaction.id)
            .setLabel('役に立った')
            .setEmoji('👍')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('feedback_nothelpful_' + interaction.id)
            .setLabel('役に立たなかった')
            .setEmoji('👎')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setLabel('詳細を見る')
            .setEmoji('📖')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord-butler.com/guide/' + interaction.id)
        );

      // 詳細ガイドは別のメッセージで送信（文字数制限対策）
      await interaction.editReply({
        embeds: [mainEmbed],
        components: [row],
      });

      // ガイドが長い場合は分割して送信
      if (guide.length > 2000) {
        const chunks = splitMessage(guide, 2000);
        for (const chunk of chunks) {
          await interaction.followUp({
            content: chunk,
            ephemeral: false,
          });
        }
      } else {
        await interaction.followUp({
          content: guide,
          ephemeral: false,
        });
      }

    } else {
      // n8nからの応答が不正な場合
      throw new Error('Invalid response from n8n webhook');
    }

  } catch (error) {
    logger.error('Error in AI command handler:', error);

    const errorEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('❌ エラーが発生しました')
      .setDescription('AIツールの推薦中にエラーが発生しました。')
      .addFields(
        { name: '対処法', value: '• しばらく待ってから再度お試しください\n• 問題が続く場合は管理者にお問い合わせください' }
      )
      .setTimestamp();

    await interaction.editReply({
      embeds: [errorEmbed],
    });
  }
};

// 長いメッセージを分割する関数
const splitMessage = (text, maxLength = 2000) => {
  const chunks = [];
  let currentChunk = '';

  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};