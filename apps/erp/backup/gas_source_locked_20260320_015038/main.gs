function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('カスタムメニュー')
    .addItem('仕入登録', 'showEntryForm')
    .addItem('商品登録', 'showProductRegister')
    .addItem('売上登録', 'showSalesForm')
    .addItem('経費登録', 'showExpenseForm')
    .addItem('ダッシュボード', 'showDashboard')
    .addToUi();
}

// 仕入登録UI
function showEntryForm() {
  var html = HtmlService.createHtmlOutputFromFile('EntryForm')
    .setWidth(650)
    .setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, '仕入登録');
}

// 商品登録UI
function showProductRegister() {
  var html = HtmlService.createHtmlOutputFromFile('ProductRegister')
    .setWidth(500)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, '商品登録');
}

// 売上登録UI
function showSalesForm() {
  var html = HtmlService.createHtmlOutputFromFile('SalesForm')
    .setWidth(650)
    .setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, '売上登録');
}

// 経費登録UI
function showExpenseForm() {
  var html = HtmlService.createHtmlOutputFromFile('ExpenseForm')
    .setWidth(500)
    .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, '経費登録');
}

// ダッシュボードUI
function showDashboard() {
  var html = HtmlService.createHtmlOutputFromFile('Dashboard')
    .setWidth(900)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'ダッシュボード');
}
