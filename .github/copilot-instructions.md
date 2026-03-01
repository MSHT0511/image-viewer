# GitHub Copilot Instructions

このファイルはGitHub Copilotがコード生成時に参照するプロジェクト固有のルールを定義します。

## プロジェクト概要

Windows/macOS対応の画像ビューワーアプリケーション（Electron製）

## 技術スタック

- **Electron**: デスクトップアプリケーションフレームワーク
- **React 19**: UIフレームワーク（関数コンポーネントのみ使用）
- **TypeScript**: プログラミング言語（strict mode有効）
- **Vite**: ビルドツール・開発サーバー
- **Playwright**: E2Eテストフレームワーク

## プロジェクト構造

```
src/
├── main/           # Electronメインプロセス（Node.js環境）
├── preload/        # Preloadスクリプト（ブリッジ層、IPC通信）
└── renderer/       # Reactアプリケーション（レンダラープロセス、ブラウザ環境）
    ├── components/ # Reactコンポーネント
    ├── hooks/      # カスタムフック
    ├── styles/     # CSSスタイル
    └── utils/      # ユーティリティ関数
```

## コーディング規約

### TypeScript

- `strict: true` を維持する
- `any`型の使用は避ける
- 明示的な型注釈を優先する

### React

- 関数コンポーネントのみ使用（クラスコンポーネント禁止）
- カスタムフックは `use` プレフィックスで命名
- 状態管理は `useState`, `useEffect` などのフックを使用

### Electron構成

- **contextIsolation: true** を維持（セキュリティ）
- **nodeIntegration: false** を維持
- レンダラー→メインプロセスの通信は必ず `preload` 経由のIPCを使用
- メインプロセスで直接ファイルシステムアクセス、レンダラーではIPCで要求

### ファイル命名

- コンポーネント: PascalCase（例: `ImageViewer.tsx`）
- フック: camelCaseで `use` プレフィックス（例: `useZoom.ts`）
- ユーティリティ: camelCase（例: `tiffConverter.ts`）

## セキュリティ

- レンダラープロセスで `require()` や `fs` などのNode.js APIを直接使用しない
- IPCハンドラーでは入力値のバリデーションを実施
- 外部からの入力（ファイルパス等）はサニタイズ

## テスト

### テストフレームワーク

- **ユニットテスト**: Vitest v3.2+
  - テストライブラリ: @testing-library/react
  - DOM環境: happy-dom
  - カバレッジツール: @vitest/coverage-v8
- **E2Eテスト**: Playwright v1.58+
  - Electronアプリのテスト対応

### テスト構成

```
tests/
├── unit/                    # ユニットテスト（Vitest）
│   ├── components/          # コンポーネントテスト
│   ├── hooks/               # カスタムフックテスト
│   ├── utils/               # ユーティリティ関数テスト
│   └── main/                # メインプロセステスト
├── e2e/                     # E2Eテスト（Playwright）
│   └── *.spec.ts           # テストファイル
└── setup.ts                 # テストセットアップ
```

### テスト実行コマンド

- `npm run test:unit` - ユニットテストのみ実行
- `npm run test:coverage` - カバレッジレポート付きで実行
- `npm run test:e2e` - E2Eテストのみ実行
- `npm run test:all` - 全テスト実行

### テストカバレッジ目標

- **全体カバレッジ**: 70%以上（現在: 84%+）
- **コンポーネント**: 100%
- **フック**: 100%
- **ユーティリティ**: 100%

### テスト命名規則

- ユニットテスト: `*.test.ts` または `*.test.tsx`
- E2Eテスト: `*.spec.ts`
- セットアップファイル: `setup.ts`

### テスト作成ガイドライン

1. **ユニットテスト**:
   - 各コンポーネント/フック/関数ごとに専用のテストファイルを作成
   - 正常系、異常系、境界値を網羅
   - モックはElectron APIのみ（`window.electronAPI`）
   - テストは独立して実行可能であること

2. **E2Eテスト**:
   - ユーザーシナリオベースでテストを作成
   - 実際のElectronアプリをビルドして実行
   - スクリーンショット撮影で視覚的な検証
   - クリーンアップを適切に実施

### CI/CD

- GitHub Actionsでテスト自動実行
- プルリクエスト / プッシュ時にテスト実行
- カバレッジレポートをCodecovにアップロード
- 複数OS（Ubuntu、Windows、macOS）でテスト実行

## 今後の拡張予定

- このファイルは改修時に必要に応じて拡張する
