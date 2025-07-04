import { SlashCommandBuilder } from 'discord.js';

// コマンドの定義
const commands = [
  // メインコマンド：AIツールを推薦
  new SlashCommandBuilder()
    .setName('ai')
    .setNameLocalizations({
      ja: 'ai',
    })
    .setDescription('AIツールのおすすめを教えてもらう')
    .setDescriptionLocalizations({
      ja: 'AIツールのおすすめを教えてもらう',
    })
    .addStringOption(option =>
      option
        .setName('task')
        .setNameLocalizations({
          ja: 'やりたいこと',
        })
        .setDescription('どんな作業をしたいか教えてください')
        .setDescriptionLocalizations({
          ja: 'どんな作業をしたいか教えてください',
        })
        .setRequired(true)
        .setMaxLength(500)
    ),

  // ヘルプコマンド
  new SlashCommandBuilder()
    .setName('help')
    .setNameLocalizations({
      ja: 'ヘルプ',
    })
    .setDescription('Discord Butlerの使い方を表示')
    .setDescriptionLocalizations({
      ja: 'Discord Butlerの使い方を表示',
    }),

  // フィードバックコマンド
  new SlashCommandBuilder()
    .setName('feedback')
    .setNameLocalizations({
      ja: 'フィードバック',
    })
    .setDescription('推薦されたツールについてフィードバックを送る')
    .setDescriptionLocalizations({
      ja: '推薦されたツールについてフィードバックを送る',
    })
    .addStringOption(option =>
      option
        .setName('tool')
        .setNameLocalizations({
          ja: 'ツール名',
        })
        .setDescription('フィードバックしたいツール名')
        .setDescriptionLocalizations({
          ja: 'フィードバックしたいツール名',
        })
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('rating')
        .setNameLocalizations({
          ja: '評価',
        })
        .setDescription('1-5の評価（5が最高）')
        .setDescriptionLocalizations({
          ja: '1-5の評価（5が最高）',
        })
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption(option =>
      option
        .setName('comment')
        .setNameLocalizations({
          ja: 'コメント',
        })
        .setDescription('詳細なフィードバック（任意）')
        .setDescriptionLocalizations({
          ja: '詳細なフィードバック（任意）',
        })
        .setRequired(false)
        .setMaxLength(1000)
    ),

  // 履歴コマンド
  new SlashCommandBuilder()
    .setName('history')
    .setNameLocalizations({
      ja: '履歴',
    })
    .setDescription('過去の推薦履歴を表示')
    .setDescriptionLocalizations({
      ja: '過去の推薦履歴を表示',
    })
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setNameLocalizations({
          ja: '件数',
        })
        .setDescription('表示する件数（デフォルト: 5）')
        .setDescriptionLocalizations({
          ja: '表示する件数（デフォルト: 5）',
        })
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  // プロファイルコマンド
  new SlashCommandBuilder()
    .setName('profile')
    .setNameLocalizations({
      ja: 'プロファイル',
    })
    .setDescription('あなたのプロファイルを表示・更新')
    .setDescriptionLocalizations({
      ja: 'あなたのプロファイルを表示・更新',
    })
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setNameLocalizations({
          ja: '表示',
        })
        .setDescription('プロファイルを表示')
        .setDescriptionLocalizations({
          ja: 'プロファイルを表示',
        })
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setNameLocalizations({
          ja: '更新',
        })
        .setDescription('スキルレベルを更新')
        .setDescriptionLocalizations({
          ja: 'スキルレベルを更新',
        })
        .addStringOption(option =>
          option
            .setName('skill_level')
            .setNameLocalizations({
              ja: 'スキルレベル',
            })
            .setDescription('あなたのAIツール使用経験')
            .setDescriptionLocalizations({
              ja: 'あなたのAIツール使用経験',
            })
            .setRequired(true)
            .addChoices(
              { name: '初心者', value: 'beginner' },
              { name: '中級者', value: 'intermediate' },
              { name: '上級者', value: 'advanced' },
              { name: 'エキスパート', value: 'expert' }
            )
        )
    ),

  // 統計コマンド（管理者用）
  new SlashCommandBuilder()
    .setName('stats')
    .setNameLocalizations({
      ja: '統計',
    })
    .setDescription('システム統計を表示（管理者のみ）')
    .setDescriptionLocalizations({
      ja: 'システム統計を表示（管理者のみ）',
    })
    .setDefaultMemberPermissions('0'), // 管理者のみ
];

// コマンドをJSONに変換
export const registerCommands = async () => {
  return commands.map(command => command.toJSON());
};

// コマンド名からコマンドを取得
export const getCommand = (commandName) => {
  return commands.find(cmd => cmd.name === commandName);
};

export default commands;