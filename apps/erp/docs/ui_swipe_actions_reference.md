# UI用語メモ: Swipe Actions

最終更新: 2026-03-30

## 今回の専門用語
- スワイプアクション（Swipe Actions）: 行を左右にスワイプして操作ボタンを表示するUIパターン。
- スワイプして削除（Swipe to Delete）: スワイプアクションのうち、削除操作に特化した呼び方。
- トレーリングアクション（Trailing Action）: 行の右側に表示される操作ボタン（削除など）。

## 汎用コード（Vanilla JS）
```html
<div class="swipe-item" data-swipe-item>
  <button class="swipe-delete" type="button" aria-label="削除">&#128465;</button>
  <div class="swipe-content">リスト項目</div>
</div>
```

```css
.swipe-item {
  --swipe-delete-width: 64px;
  position: relative;
  overflow: hidden;
}

.swipe-delete {
  position: absolute;
  right: calc(-1 * var(--swipe-delete-width));
  top: 0;
  width: var(--swipe-delete-width);
  height: 100%;
  border: 0;
  background: #ef4444;
  color: #fff;
  transition: right 0.18s ease, opacity 0.18s ease;
  opacity: 0;
  pointer-events: none;
}

.swipe-content {
  background: #fff;
  transition: transform 0.18s ease;
  touch-action: pan-y;
}

.swipe-item.is-open .swipe-content {
  transform: translateX(calc(-1 * var(--swipe-delete-width)));
}

.swipe-item.is-open .swipe-delete {
  right: 0;
  opacity: 1;
  pointer-events: auto;
}
```

```js
(function () {
  let state = { row: null, startX: 0, startY: 0, dx: 0, moved: false, id: null };

  function findTouch(list, id) {
    if (!list) return null;
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === id) return list[i];
    }
    return null;
  }

  function closeAll(except) {
    document.querySelectorAll('[data-swipe-item].is-open').forEach(function (el) {
      if (except && el === except) return;
      el.classList.remove('is-open');
    });
  }

  document.addEventListener('touchstart', function (e) {
    const row = e.target.closest('[data-swipe-item]');
    if (!row || e.target.closest('.swipe-delete')) {
      state = { row: null, startX: 0, startY: 0, dx: 0, moved: false, id: null };
      return;
    }
    const t = e.changedTouches[0];
    state = { row: row, startX: t.clientX, startY: t.clientY, dx: 0, moved: false, id: t.identifier };
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (!state.row) return;
    const t = findTouch(e.changedTouches, state.id) || findTouch(e.touches, state.id);
    if (!t) return;

    const dx = t.clientX - state.startX;
    const dy = t.clientY - state.startY;

    if (!state.moved) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        state = { row: null, startX: 0, startY: 0, dx: 0, moved: false, id: null };
        return;
      }
      state.moved = true;
    }

    state.dx = dx;
    if (e.cancelable) e.preventDefault();

    if (dx <= -18) {
      closeAll(state.row);
      state.row.classList.add('is-open');
    } else if (dx >= 18) {
      state.row.classList.remove('is-open');
    }
  }, { passive: false });

  document.addEventListener('touchend', function (e) {
    if (!state.row) return;
    const t = findTouch(e.changedTouches, state.id);
    if (!t) return;

    if (state.moved) {
      if (state.dx <= -28) {
        closeAll(state.row);
        state.row.classList.add('is-open');
      } else if (state.dx >= 20) {
        state.row.classList.remove('is-open');
      }
    }

    state = { row: null, startX: 0, startY: 0, dx: 0, moved: false, id: null };
  }, true);

  document.addEventListener('click', function (e) {
    if (e.target.closest('.swipe-delete')) return;
    const openRow = e.target.closest('[data-swipe-item].is-open');
    if (openRow) {
      openRow.classList.remove('is-open');
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      return;
    }
    closeAll(null);
  }, true);
})();
```

## このプロジェクトでの実装メモ
- B画面（`EntryFormB.html`）の経費行削除をスワイプアクション化済み。
- 左スワイプで削除ボタンを表示し、開いた行をタップすると閉じる挙動にしている。
