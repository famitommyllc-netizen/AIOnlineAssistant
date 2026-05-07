var SETTING_CLAUDE_API_KEY = 'CLAUDE_API_KEY';
var SETTING_CLOUD_VISION_API_KEY = 'CLOUD_VISION_API_KEY';

function getClaudeApiKey_() {
  return getSettingValue_(SETTING_CLAUDE_API_KEY, '');
}

function getCloudVisionApiKey_() {
  return getSettingValue_(SETTING_CLOUD_VISION_API_KEY, '');
}

function testAuth() {
  var token = ScriptApp.getOAuthToken();
  var res = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
  Logger.log(res.getContentText());
}

function resetAuth() {
  ScriptApp.invalidateAuth();
  Logger.log('認証をリセットしました。次回実行時に再認証ダイアログが出ます。');
}

function testCloudVisionOcr(base64Image) {
  return callCloudVisionOcr_(base64Image);
}

function readReceiptOcr(base64Image) {
  var rawText = callCloudVisionOcr_(base64Image);
  var claudeKey = getClaudeApiKey_();
  if (!claudeKey) throw new Error('Claude APIキーが設定されていません。設定画面から登録してください。');
  return callClaudeReceiptParser_(rawText, claudeKey);
}

function callCloudVisionOcr_(base64) {
  var apiKey = getCloudVisionApiKey_();
  if (!apiKey) throw new Error('Cloud Vision APIキーが設定されていません。設定画面から登録してください。');
  var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + apiKey;
  var payload = {
    requests: [{
      image: { content: base64 },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
    }]
  };
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var json = JSON.parse(res.getContentText());
  if (json.error) throw new Error('Cloud Vision API エラー: ' + json.error.message);
  var annotation = json.responses && json.responses[0] && json.responses[0].fullTextAnnotation;
  if (!annotation) throw new Error('テキストを検出できませんでした');
  return annotation.text;
}

function callClaudeReceiptParser_(rawText, apiKey) {
  var prompt = 'レシートのOCRテキストから仕入ERPフォーム用のJSONを抽出してください。\n\n' +
    'OCRテキスト:\n' + rawText + '\n\n' +
    '以下のJSON形式のみで返してください（前後の説明不要）:\n' +
    '{\n' +
    '  "commonInfo": { "date": "YYYYMMDD形式", "supplier": "店名", "payment": "支払方法" },\n' +
    '  "entries": [ { "name": "商品名", "price": 金額数値, "qty": 個数 } ],\n' +
    '  "expenses": [ { "name": "経費名", "amount": 金額数値 } ],\n' +
    '  "point": ポイント数値,\n' +
    '  "taxType": "内税" または "外税"\n' +
    '}\n\n' +
    'ルール:\n' +
    '- 商品名はレシートに記載されている文字列をそのまま使う（要約・省略・翻訳しない）\n' +
    '- taxType: レシートに「消費税」「税」などの税額が商品とは別の行に明示されている場合は「外税」、税込み価格のみ表示の場合は「内税」\n' +
    '- 外税の場合のpriceは税抜き価格（消費税を除いた金額）を使う。内税の場合は税込み価格を使う\n' +
    '- 消費税・税額の行は expenses に含めない（無視する）\n' +
    '- 経費は送料・手数料など商品以外の支払いのみ\n' +
    '- point は「利用ポイント」「ポイント値引き」など使ったポイントの金額のみ。「獲得ポイント」は含めない\n' +
    '- ポイント利用がなければ point は 0\n' +
    '- date は不明なら空文字\n' +
    '- qty が不明なら 1';

  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    payload: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    }),
    muteHttpExceptions: true
  });
  var json = JSON.parse(res.getContentText());
  if (json.error) throw new Error('Claude API エラー: ' + json.error.message);
  var text = json.content && json.content[0] && json.content[0].text;
  if (!text) throw new Error('Claude APIからの応答が空です');
  var match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSONの抽出に失敗しました: ' + text);
  return JSON.parse(match[0]);
}
