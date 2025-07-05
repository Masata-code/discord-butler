# Discord Butler セットアップガイド

このドキュメントでは、Discord Butlerの実装手順と動作の詳細について説明します。

## 📋 実装手順（ステップバイステップ）

### 1️⃣ 開発環境のセットアップ（15分）

```bash
# リポジトリをクローン
git clone https://github.com/Masata-code/discord-butler.git
cd discord-butler

# 依存関係をインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env
```

### 2️⃣ Discord Bot の作成（20分）

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリックして名前を「Discord Butler」に
3. 左メニューの「Bot」→「Add Bot」
4. **トークンをコピー**して `.env` の `DISCORD_BOT_TOKEN` に貼り付け
5. 「OAuth2」→「URL Generator」で：
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Use Slash Commands`
6. 生成されたURLでBotをテストサーバーに招待

### 3️⃣ PostgreSQLデータベースのセットアップ（10分）

```bash
# PostgreSQLがインストールされていない場合
brew install postgresql@15  # Mac
# または
sudo apt install postgresql-15  # Ubuntu

# データベースを作成
createdb discord_butler

# スキーマを適用
psql discord_butler < database/schema.sql

# 接続確認
psql discord_butler -c "SELECT version();"
```

`.env` ファイルの `DATABASE_URL` を更新：
```
DATABASE_URL=postgresql://あなたのユーザー名:パスワード@localhost:5432/discord_butler
```

### 4️⃣ n8n のセットアップ（30分）

```bash
# n8nをグローバルにインストール
npm install -g n8n

# n8nを起動
n8n start
```

1. ブラウザで http://localhost:5678 にアクセス
2. 初回はアカウント作成
3. 左メニューの「Workflows」→「Import from File」
4. `workflows/main-workflow.json` をインポート
5. ワークフロー内の認証情報を設定：
   - PostgreSQL接続
   - OpenAI API
   - Claude API（オプション）

### 5️⃣ API キーの取得と設定（20分）

**OpenAI API キー**:
1. https://platform.openai.com/api-keys にアクセス
2. 「Create new secret key」
3. `.env` の `OPENAI_API_KEY` に設定

**Claude API キー**（オプション）:
1. https://console.anthropic.com/ にアクセス
2. API キーを作成
3. `.env` の `CLAUDE_API_KEY` に設定

**Gemini API キー**（オプション）:
1. https://makersuite.google.com/app/apikey にアクセス
2. API キーを作成
3. `.env` の `GEMINI_API_KEY` に設定

### 6️⃣ 初期データの投入（5分）

```bash
# AIツールのサンプルデータを投入
psql discord_butler < scripts/seed-tools.sql
```

### 7️⃣ アプリケーションの起動（5分）

```bash
# 開発モードで起動
npm run dev

# 正常に起動すると以下のログが表示されます：
# ✅ Discord Bot logged in as Discord Butler#1234
# 🌐 HTTP server listening on port 3000
# ✅ Discord Butler started successfully!
```

## 🔄 システムの動作フロー

### ユーザーがコマンドを実行した時の流れ

1. **ユーザーがDiscordで `/ai` コマンドを実行**
   ```
   /ai やりたいこと: ブログ記事を書きたい
   ```

2. **Discord Bot が受信**
   - コマンドを解析
   - n8n Webhookに転送

3. **n8n ワークフローが処理開始**
   - ユーザープロファイルをDBから取得（新規なら作成）
   - セッションを作成

4. **AIがタスクを分析**（OpenAI GPT-4）
   ```json
   {
     "task_type": "コンテンツ作成",
     "complexity": 3,
     "domain": "content_creation",
     "skill_level": "beginner"
   }
   ```

5. **データベースからツールを検索**
   - カテゴリ、スキルレベル、言語でフィルタリング
   - 人気度と性能でソート

6. **スコアリングアルゴリズムで最適な3つを選定**
   - タスク適合性（30%）
   - スキルレベル一致度（20%）
   - コスト効率（25%）
   - パフォーマンス（15%）
   - その他（10%）

7. **使用ガイドを生成**（Claude API）
   ```markdown
   ## おすすめAIツール

   ### 1. Claude
   **特徴**: 自然な文章生成が得意
   **料金**: 無料プランあり（月5回まで）
   
   #### 使い方
   1. claude.aiにアクセス
   2. Googleアカウントでログイン
   3. 新しいチャットを開始
   
   #### サンプルプロンプト
   ```
   ブログ記事を書いてください。
   テーマ：[あなたのテーマ]
   文字数：2000文字程度
   トーン：親しみやすく
   ```
   ```

8. **Discordに結果を返信**
   - 推薦結果をEmbedで表示
   - 詳細ガイドを送信
   - フィードバックボタンを追加

## 🎯 各コマンドの動作

### `/ai やりたいこと`
AIツールの推薦を受け取る（メイン機能）

### `/help`
使い方ガイドを表示

### `/feedback ツール名 評価 コメント`
使用したツールの評価を送信（推薦精度向上に活用）

### `/history`
過去の推薦履歴を表示

### `/profile view/update`
スキルレベルの確認・更新

### `/stats`
システム統計を表示（管理者のみ）

## 🔧 トラブルシューティング

### Discord Botが反応しない場合
- Botがオンラインか確認
- スラッシュコマンドが登録されているか確認
- 権限が正しく設定されているか確認

### n8nエラーの場合
- Webhook URLが正しいか確認
- データベース接続を確認
- API キーが有効か確認

### データベースエラーの場合
- PostgreSQLが起動しているか確認
- 接続情報が正しいか確認
- スキーマが適用されているか確認

## 📈 次の開発ステップ

1. **フィードバック機能の実装**
2. **ユーザー履歴の可視化**
3. **管理ダッシュボードの構築**
4. **AIツールデータベースの拡充**
5. **パフォーマンス最適化**

## 🔍 詳細な技術仕様

### データフロー図
```
Discord Client
    ↓
Discord Bot (Discord.js)
    ↓
n8n Webhook
    ↓
n8n Workflow
    ├→ PostgreSQL (ユーザー情報)
    ├→ OpenAI API (タスク分析)
    ├→ Tool Database (検索)
    ├→ Scoring Algorithm
    └→ Claude API (ガイド生成)
    ↓
Discord Response
```

### 環境変数一覧

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|------------|
| DISCORD_BOT_TOKEN | Discord Botのトークン | ✓ | - |
| DISCORD_CLIENT_ID | Discord アプリケーションID | ✓ | - |
| DATABASE_URL | PostgreSQL接続URL | ✓ | - |
| OPENAI_API_KEY | OpenAI APIキー | ✓ | - |
| CLAUDE_API_KEY | Claude APIキー | - | - |
| GEMINI_API_KEY | Gemini APIキー | - | - |
| N8N_WEBHOOK_URL | n8n WebhookのURL | - | http://localhost:5678/webhook/discord-butler |
| NODE_ENV | 実行環境 | - | development |
| PORT | HTTPサーバーポート | - | 3000 |
| LOG_LEVEL | ログレベル | - | info |

### パフォーマンス目標

- **応答時間**: 95%のリクエストが3秒以内
- **同時接続**: 1,000ユーザー
- **可用性**: 99.9%（月間43.2分のダウンタイム許容）

---

最終更新日: 2025-07-05