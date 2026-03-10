# プロジェクト雛形フォルダの説明

- docs: 仕様書・マニュアル・設計メモ。時刻付きで保存し、最新版まとめもここに置く。
- src: 実装コードやスクリプトを置く主領域。
- progress: 日付付きテキストで進捗・決定事項・未決事項を記録。横断サマリは base/progress へ。
- logs: 実行ログ、runごとのログファイル、スナップショット/キャプチャ。logポリシーに従う。
- backup: プロジェクト内のバックアップ置き場。上書きせず時刻付きで退避。
- config: 環境設定・APIキー・外部サービス設定などを外出しする場合に使用（例: config/settings.json）。
- specs: 要件・テスト仕様・セレクタ表・テスト観点。初期に specs/README.md を置く。
- README.md: セットアップ、実行方法、ログ/スナップショットの出力先、各フォルダ用途を記載。
- LICENSE: 利用条件を明記（デフォルトは All Rights Reserved で著作権表示を含める）。
- core.txt: 共通coreへのシンボリックリンク（正本は ~/workspace/base/core/core.txt）。
