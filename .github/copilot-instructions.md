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

- E2Eテストは `tests/e2e/` 配下に配置
- Playwrightを使用したElectronアプリのテスト
- テストファイルは `*.spec.ts` の命名規則

## 今後の拡張予定

- このファイルは改修時に必要に応じて拡張する
