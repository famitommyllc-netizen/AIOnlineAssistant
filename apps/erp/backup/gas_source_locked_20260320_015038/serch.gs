// 商品情報検索（商品番号/商品名/検索名/読み仮名で部分一致検索）
function searchProduct(keyword) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('商品情報');
  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var shohinNo   = data[i][0];   // 商品番号 A列
    var jan        = data[i][1];   // JAN        B列
    var name       = data[i][2];   // 商品名     C列
    var category   = data[i][3];   // カテゴリ   D列
    var maker      = data[i][4];   // メーカー   E列
    var brand      = data[i][5];   // ブランド   F列
    var sub        = data[i][6];   // サブ       G列
    var searchName = data[i][10];  // 検索名     K列
    var yomi       = data[i][11];  // 読み仮名   L列

    if (
      (shohinNo   && shohinNo.toString().indexOf(keyword) !== -1) ||
      (jan        && jan.toString().indexOf(keyword) !== -1)      ||
      (name       && name.toString().indexOf(keyword) !== -1)     ||
      (searchName && searchName.toString().indexOf(keyword) !== -1) ||
      (yomi       && yomi.toString().indexOf(keyword) !== -1)
    ) {
      // プルダウンには「商品番号」「商品名」を返す（JAN不要）
      results.push([shohinNo, name]);
    }
  }
  return results;
}


// 商品新規登録（商品番号はJAN下4桁自動生成 or ランダム。全項目設計書準拠）
function registerNewProduct(productInfo) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('商品情報');
  // 商品番号: JAN下4桁 or ランダム4桁
  var shohinNo = (productInfo.jan && productInfo.jan.length >= 4)
    ? productInfo.jan.slice(-4)
    : String(Math.floor(1000 + Math.random() * 9000));

  var row = [
    shohinNo,                       // 商品番号  A
    productInfo.jan,                // JAN       B
    productInfo.name,               // 商品名    C
    productInfo.category,           // カテゴリ  D
    productInfo.maker,              // メーカー  E
    productInfo.brand,              // ブランド  F
    productInfo.sub,                // サブ      G
    productInfo.retailPrice,        // 希望小売価格 H
    productInfo.note,               // 備考      I
    Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd"), // 登録日 J
    productInfo.searchName,         // 検索名    K
    productInfo.yomigana,           // 読み仮名  L
    productInfo.assumedPrice        // 想定売価  M
  ];
  sheet.appendRow(row);
  return {msg: '商品情報を登録しました', name: productInfo.name};
}


// 仕入リストを在庫表に登録（設計書の列構成準拠）
// entryListのitem: [商品番号, 商品名, 提示金額, ポイント/割引, 原価, 個数, 単価]
function registerEntries(entryList, commonInfo) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('在庫表');
  entryList.forEach(function(item) {
    var row = [
      '',                      // 仕入No（自動採番/空欄）A
      commonInfo.date,         // 仕入日             B
      item[0],                 // 商品番号           C
      item[1],                 // 商品名             D
      item[2],                 // 提示金額           E
      item[3],                 // ポイント/割引      F
      item[4],                 // 原価               G
      item[5],                 // 個数               H
      item[6],                 // 単価               I
      commonInfo.supplier,     // 仕入先             J
      commonInfo.payment,      // 支払い方法         K
      '',                      // 売上日（未記入）   L
      '',                      // 売上金額           M
      '',                      // 販売場所           N
      '',                      // 利益               O
      '',                      // 想定売価           P
      ''                       // 想定利益           Q
    ];
    sheet.appendRow(row);
  });
  return '在庫表に' + entryList.length + '件の仕入情報を登録しました。';
}
