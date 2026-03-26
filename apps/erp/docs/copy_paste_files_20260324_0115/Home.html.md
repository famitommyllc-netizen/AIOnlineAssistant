# Home.html

```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <script>
    (function() {
      var touchCapable = ('ontouchstart' in window) || ((navigator && navigator.maxTouchPoints) ? navigator.maxTouchPoints > 0 : false);
      var coarse = false;
      try {
        coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      } catch (err) {
        coarse = false;
      }
      var minSide = Math.min(Number(screen && screen.width) || 0, Number(screen && screen.height) || 0);
      var isPhoneLike = (touchCapable || coarse) && minSide > 0 && minSide <= 500;
      if (isPhoneLike && document && document.documentElement) {
        document.documentElement.classList.add('home-force-mobile');
      }
    })();
  </script>
  <style>
    <?!= HtmlService.createHtmlOutputFromFile('style.css').getContent(); ?>

    .home-shell {
      width: 100%;
      max-width: 980px;
      margin: 0 auto;
      padding: 0.24em 0.22em 0.95em;
      overflow: visible;
    }

    .home-lead {
      color: #334e68;
      font-size: 0.94em;
      margin: 0.08em 0 0.22em;
    }

    .home-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.48em;
      margin-top: 0.62em;
    }

    .home-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.26em;
      min-height: 118px;
      padding: 0.7em 0.54em;
      border-radius: 12px;
      border: 1.4px solid #d6e8dd;
      background: #ffffff;
      color: #133128;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(16, 24, 40, 0.08);
      transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
    }

    .home-card:hover,
    .home-card:focus-visible {
      transform: translateY(-2px);
      border-color: #9ce7c0;
      box-shadow: 0 7px 18px rgba(16, 24, 40, 0.13);
      outline: none;
    }

    .home-card-icon {
      width: 2.3em;
      height: 2.3em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: #ecfdf5;
      color: #065f46;
      line-height: 1;
    }

    .home-card-icon-glyph {
      font-size: 1.36em;
      line-height: 1;
    }

    .home-card-title {
      font-size: 0.95em;
      font-weight: 800;
      letter-spacing: 0.01em;
      line-height: 1.23;
    }

    .home-card-sub {
      color: #5b7085;
      font-size: 0.79em;
      line-height: 1.24;
    }

    .home-card.is-disabled {
      pointer-events: none;
      opacity: 0.58;
      background: #f8faf9;
    }

    .home-badge {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      border-radius: 999px;
      padding: 0.18em 0.52em;
      background: #ecfdf5;
      color: #066347;
      font-size: 0.71em;
      font-weight: 700;
    }

    @media (min-width: 620px) and (hover: hover) and (pointer: fine) {
      .home-shell {
        padding: 0.45em 0.2em 1.2em;
      }

      .home-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.72em;
      }

      .home-card {
        min-height: 122px;
        padding: 0.75em 0.62em;
      }

      .home-card-title {
        font-size: 0.94em;
      }

      .home-card-sub {
        font-size: 0.78em;
      }
    }

    @media (min-width: 920px) and (hover: hover) and (pointer: fine) {
      .home-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.9em;
      }

      .home-card {
        min-height: 128px;
        padding: 0.86em 0.72em;
      }

      .home-card-title {
        font-size: 0.98em;
      }

      .home-card-sub {
        font-size: 0.82em;
      }

      .home-card-icon {
        width: 2.4em;
        height: 2.4em;
      }
    }

    /* iPhone/Safari fallback: enforce mobile card layout even if viewport width is misreported. */
    @media (hover: none) and (pointer: coarse), (any-pointer: coarse) {
      .home-shell {
        max-width: 100%;
        margin: 8px 6px;
        padding: 10px 8px 12px;
      }

      .home-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 0.56em;
      }

      .home-card {
        min-height: 124px;
        padding: 0.76em 0.58em;
      }

      .home-card-title {
        font-size: 0.98em;
      }

      .home-card-sub {
        font-size: 0.82em;
      }
    }

    html.home-force-mobile .home-shell {
      max-width: 100%;
      margin: 8px 6px;
      padding: 10px 8px 12px;
    }

    html.home-force-mobile .home-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 0.56em;
    }

    html.home-force-mobile .home-card {
      min-height: 124px;
      padding: 0.76em 0.58em;
    }

    html.home-force-mobile .home-card-title {
      font-size: 0.98em;
    }

    html.home-force-mobile .home-card-sub {
      font-size: 0.82em;
    }

    @media (hover: none) and (pointer: coarse) and (max-width: 430px),
           (any-pointer: coarse) and (max-width: 430px),
           (max-width: 430px) {
      .home-grid {
        grid-template-columns: 1fr !important;
      }
    }

    @media (max-width: 430px) {
      html.home-force-mobile .home-grid {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
</head>
<body>
  <? var entryUrl = getWebAppPageUrl('entry', {}) || '?page=entry'; ?>
  <? var salesUrl = getWebAppPageUrl('sales', {}) || '?page=sales'; ?>
  <? var productUrl = getWebAppPageUrl('product', {}) || '?page=product'; ?>
  <? var expenseUrl = getWebAppPageUrl('expense', {}) || '?page=expense'; ?>
  <? var reportUrl = getWebAppPageUrl('report', {}) || '?page=report'; ?>
  <? var settingsUrl = getWebAppPageUrl('settings', {}) || '?page=settings'; ?>

  <div class="section home-shell">
    <h2 class="section-title">ERP ホーム</h2>
    <div class="home-lead">使いたい機能を選択してください。</div>

    <div class="home-grid" role="navigation" aria-label="ERPメニュー">
      <a class="home-card" href="<?= entryUrl ?>" aria-label="仕入入力へ移動">
        <div class="home-card-icon" aria-hidden="true"><span class="home-card-icon-glyph">📦</span></div>
        <div class="home-card-title">仕入入力</div>
        <div class="home-card-sub">仕入データ登録</div>
      </a>

      <a class="home-card" href="<?= salesUrl ?>" aria-label="売上へ移動">
        <div class="home-card-icon" aria-hidden="true"><span class="home-card-icon-glyph">📈</span></div>
        <div class="home-card-title">売上</div>
        <div class="home-card-sub">売上データ登録</div>
      </a>

      <a class="home-card" href="<?= productUrl ?>" aria-label="商品登録へ移動">
        <div class="home-card-icon" aria-hidden="true"><span class="home-card-icon-glyph">🏷️</span></div>
        <div class="home-card-title">商品登録</div>
        <div class="home-card-sub">商品マスタ追加</div>
      </a>

      <a class="home-card" href="<?= expenseUrl ?>" aria-label="経費へ移動">
        <div class="home-card-icon" aria-hidden="true"><span class="home-card-icon-glyph">🧾</span></div>
        <div class="home-card-title">経費</div>
        <div class="home-card-sub">経費データ登録</div>
      </a>

      <a class="home-card" href="<?= reportUrl ?>" aria-label="レポートへ移動">
        <div class="home-card-icon" aria-hidden="true"><span class="home-card-icon-glyph">📊</span></div>
        <div class="home-card-title">レポート</div>
        <div class="home-card-sub">日次/月次レポート</div>
      </a>

      <a class="home-card" href="<?= settingsUrl ?>" aria-label="設定へ移動">
        <div class="home-card-icon" aria-hidden="true"><span class="home-card-icon-glyph">⚙️</span></div>
        <div class="home-card-title">設定</div>
        <div class="home-card-sub">アプリ設定</div>
      </a>

      <a class="home-card is-disabled" href="#" aria-disabled="true" aria-label="ダッシュボード（準備中）">
        <div class="home-card-icon" aria-hidden="true"><span class="home-card-icon-glyph">🧩</span></div>
        <div class="home-card-title">ダッシュボード</div>
        <div class="home-card-sub">実装準備中</div>
        <span class="home-badge">準備中</span>
      </a>
    </div>
  </div>
</body>
</html>

```
