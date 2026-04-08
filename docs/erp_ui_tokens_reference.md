# ERP UI Tokens Reference
- Updated: 2026-03-30 01:51:36 JST
- Purpose: 仕入入力系の共通UIを、画面追加時に同じ基準で再利用する
- Source of truth: `apps/erp/src/gas/style.css.html` の `:root` 変数

## 1. 共通トークン（固定参照）
### 1.1 App Shell / Header / Footer
- `--app-shell-max-width`: `1100px`
- `--app-header-height`: `60px`
- `--app-header-padding-x`: `14px`
- `--app-header-title-font`: `22px`
- `--app-header-state-font`: `13px`
- `--app-footer-height`: `72px`
- `--app-footer-icon-size`: `24px`
- `--app-footer-label-font`: `12px`
- `--app-nav-gap`: `5px`

### 1.2 List / Table typography
- `--list-header-font-size`: `18px`
- `--list-cell-font-size`: `18px`
- `--list-label-font-size`: `18px`
- `--list-helper-font-size`: `18px`
- `--list-row-height`: `60px`
- `--list-padding-y`: `12px`
- `--list-padding-x`: `10px`

### 1.3 Entry stage panel
- `--entry-width`: `92vw`
- `--entry-max-width`: `720px`
- `--entry-padding`: `24px`
- `--entry-radius`: `24px`
- `--entry-gap`: `16px`
- `--entry-title-font`: `24px`
- `--entry-label-font`: `20px`
- `--entry-input-font`: `22px`
- `--entry-button-font`: `21px`
- `--entry-input-height`: `84px`
- `--entry-button-height`: `72px`
- `--entry-textarea-height`: `96px`

## 2. 運用ルール（統一のための必須条件）
- ヘッダー/フッターの文字サイズは、直接数値指定せず必ず上記トークンを使う。
- A/B別CSSでは、原則として `--app-*` を上書きしない。必要な場合は本ドキュメント更新を必須とする。
- 画面ごとの見た目差分は `--list-*` やページ専用クラス側で吸収する。
- 共通トークン変更時は次の3点を同時更新する:
  - `style.css.html`
  - 本ドキュメント
  - `docs/ui_ux_standards.md`（参照先と方針）

## 3. 実装テンプレート
```css
.entry-fixed-header-title {
  font-size: var(--app-header-title-font);
}

.entry-fixed-header-state {
  font-size: var(--app-header-state-font);
}

.entry-bottom-nav-icon {
  font-size: var(--app-footer-icon-size);
}

.entry-bottom-nav-label {
  font-size: var(--app-footer-label-font);
}
```

## 4. 画面追加時チェック
- ヘッダー高さとスクロール領域の `top` が `--app-header-height` と一致している
- フッター高さとスクロール領域の `bottom` が `--app-footer-height` と一致している
- ナビアイコン/ラベルが `--app-footer-icon-size` / `--app-footer-label-font` 参照になっている
- Bレイアウト追加時に `--app-*` を崩していない

