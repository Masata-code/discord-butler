# Discord Butler 🤖

AI初心者向けのDiscord AIツール推薦システム。ユーザーがDiscord DMで作業内容を相談すると、最適なAIツールと具体的な使用方法を提案します。

## 🚀 特徴

- **🎯 パーソナライズされた推薦**: ユーザーのスキルレベルと目的に応じた最適なツール提案
- **📚 具体的な使用ガイド**: 抽象的な情報ではなく、即座に実行可能な手順を提供
- **🔄 継続的な学習**: フィードバックループによる推薦精度の向上
- **🛡️ セキュアな設計**: Discord OAuth2認証とデータ暗号化
- **📊 スケーラブル**: AWS Fargate + Lambdaによるサーバーレスアーキテクチャ

## 🏗️ アーキテクチャ

```
Discord → n8n Webhook → AI解析 → ツール検索 → ガイド生成 → Discord返信
```

### 技術スタック

- **ランタイム**: n8n v1.68+ (Node.js 20.19-24.x)
- **メッセージング**: Discord.js v14.16+
- **AI サービス**: OpenAI o3, Claude 4 Opus, Gemini 2.5 Pro
- **データベース**: PostgreSQL 15+, Redis 7.2+
- **インフラ**: AWS Fargate, Lambda, RDS, ElastiCache

## 📋 前提条件

- Node.js 20.19以上、24.x未満
- PostgreSQL 15以上
- Redis 7.2以上
- n8n v1.68以上
- Discord開発者アカウント
- 各種AI APIキー（OpenAI、Claude、Gemini）

## 🛠️ セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/Masata-code/discord-butler.git
cd discord-butler
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

### 4. データベースのセットアップ

```bash
# PostgreSQLデータベースを作成
createdb discord_butler

# マイグレーションの実行
npm run db:migrate

# 初期データの投入
npm run db:seed
```

### 5. Discord Botの設定

1. [Discord Developer Portal](https://discord.com/developers/applications)で新しいアプリケーションを作成
2. Bot設定でトークンを取得
3. OAuth2 URLジェネレーターで必要な権限を設定:
   - `bot` スコープ
   - `Send Messages`、`Read Message History`、`Use Slash Commands` 権限
4. 生成されたURLでBotをサーバーに招待

### 6. n8nワークフローのインポート

```bash
# n8nインスタンスにワークフローをインポート
node scripts/import-workflows.js
```

## 🚀 起動方法

### 開発環境

```bash
npm run dev
```

### 本番環境

```bash
npm start
```

### Dockerを使用

```bash
docker-compose up -d
```

## 📊 n8nワークフロー

プロジェクトには以下のn8nワークフローが含まれています：

1. **メインワークフロー** (`workflows/main-workflow.json`)
   - Discord DMの処理
   - AIツール推薦の生成
   - 応答の送信

2. **エラーハンドリング** (`workflows/error-handler.json`)
   - エラーの分類と対処
   - 自動リトライロジック

3. **フィードバック処理** (`workflows/feedback-workflow.json`)
   - ユーザーフィードバックの収集
   - 推薦精度の改善

4. **定期メンテナンス** (`workflows/maintenance-workflow.json`)
   - ツールデータベースの更新
   - パフォーマンス最適化

## 🧪 テスト

```bash
# すべてのテストを実行
npm test

# カバレッジレポート付き
npm test -- --coverage

# ウォッチモード
npm run test:watch
```

## 📚 API ドキュメント

詳細なAPI仕様は[docs/api.md](docs/api.md)を参照してください。

## 🔒 セキュリティ

- Discord トークンは環境変数で管理
- すべてのユーザーデータは暗号化して保存
- API レート制限の実装
- 定期的なセキュリティ監査

セキュリティの問題を発見した場合は、[security@discord-butler.com](mailto:security@discord-butler.com)までご連絡ください。

## 🤝 コントリビューション

コントリビューションは歓迎します！詳細は[CONTRIBUTING.md](CONTRIBUTING.md)をご覧ください。

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- [n8n](https://n8n.io/) - ワークフロー自動化プラットフォーム
- [Discord.js](https://discord.js.org/) - Discord API ラッパー
- [OpenAI](https://openai.com/), [Anthropic](https://www.anthropic.com/), [Google](https://ai.google/) - AI API プロバイダー

## 📞 サポート

- 📧 Email: support@discord-butler.com
- 💬 Discord: [Discord Butler Community](https://discord.gg/discord-butler)
- 📚 Documentation: [https://docs.discord-butler.com](https://docs.discord-butler.com)

---

Made with ❤️ by Discord Butler Team