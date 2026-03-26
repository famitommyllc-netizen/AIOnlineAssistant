# style.css.html

```html
html,
body {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-size: 20px;
  line-height: 1.5;
  background: #f4f6f8;
  color: #1f2933;
  margin: 0;
  padding: 0 0 2.2em 0;
}

.section {
  background: #ffffff;
  margin: 1.6em auto;
  padding: 1.45em 1.4em;
  max-width: 1100px;
  border-radius: 14px;
  border: 1px solid #cfe4da;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

#entry-page,
#confirm-page,
#result-page {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.section-title {
  font-size: 1.9em;
  font-weight: 800;
  margin: 0 0 0.85em 0;
  color: #065f46;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8em;
  margin-bottom: 0.7em;
}

.section-header-row .section-title {
  margin: 0;
}

.mid-title {
  font-size: 1.42em;
  font-weight: 800;
  margin: 0 0 0.72em 0;
  color: #065f46;
}

#entry-page .section + .section {
  margin-top: 1.7em;
}

.section-card {
  border: 1px solid #cbd8e6;
  background: #fafcff;
}

.input-row {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: center;
  gap: 0.7em;
  margin-bottom: 0.55em;
}

.row-label {
  font-weight: 700;
  color: #243b53;
}

.input-main,
.input-select,
.form-input,
select,
input[type="text"] {
  width: 100%;
  box-sizing: border-box;
  min-height: 56px;
  font-size: 0.95em;
  padding: 0.68em 0.74em;
  border: 1.8px solid #9fd3bf;
  border-radius: 12px;
  background: #fff;
  color: #1f2933;
}

input:focus,
select:focus {
  outline: 3px solid #bbf7d0;
  border-color: #10b981;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6em;
  margin-top: 0.65em;
}

.list-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.35em;
}

.entry-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5em;
  margin-bottom: 0.35em;
}

.entry-card-toolbar {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35em;
}

.btn-main,
button {
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 12px;
  min-height: 58px;
  padding: 0.8em 1.2em;
  font-size: 0.95em;
  font-weight: 700;
  cursor: pointer;
}

.btn-sub {
  background: #6b7280;
  color: #fff;
}

.btn-small {
  font-size: 0.88em;
  padding: 0.44em 0.65em;
  margin-right: 0.3em;
  margin-bottom: 0.2em;
}

.btn-main:hover,
button:hover {
  background: #059669;
}

.btn-sub:hover {
  background: #4b5563;
}

button:disabled {
  background: #9fb5c8;
  cursor: default;
}

.btn-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background: #10b981;
  color: #fff;
  border-radius: 12px;
  min-height: 58px;
  padding: 0.8em 1.2em;
  font-size: 0.95em;
  font-weight: 700;
}

.header-toggle-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5em;
  flex-wrap: nowrap;
}

.header-toggle-btn {
  min-height: 56px;
  min-width: 126px;
  padding: 0.62em 0.8em;
  border-radius: 12px;
  border: 1.8px solid #a7f3d0;
  background: #ecfdf5;
  color: #065f46;
  font-size: 0.9em;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}

.header-toggle-btn:hover {
  background: #d1fae5;
}

.header-toggle-btn.is-open {
  border-color: #10b981;
  background: #10b981;
  color: #fff;
}

.header-toggle-btn.is-on {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

.btn-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  border: none;
  font-size: 1.18em;
  font-weight: 700;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-icon-plus {
  background: #10b981;
  color: #fff;
}

.btn-icon-minus {
  background: #8f9eb1;
  color: #fff;
}

.btn-icon:hover {
  opacity: 0.9;
}

.mode-switch-wrap {
  display: inline-flex;
  border: 1.8px solid #a7f3d0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.7em;
}

.mode-btn {
  border: none;
  background: #ecfdf5;
  color: #065f46;
  min-height: 56px;
  padding: 0.72em 1.12em;
  font-size: 0.95em;
  font-weight: 700;
  cursor: pointer;
}

.mode-btn.active {
  background: #10b981;
  color: #fff;
}

.note-text {
  color: #52606d;
  font-size: 0.92em;
}

.note-subtle {
  font-size: 0.82em;
  color: #6b7785;
}

.table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.55em;
  font-size: 0.92em;
  min-width: 760px;
}

th,
td {
  border: 1px solid #d5dce5;
  padding: 0.62em 0.68em;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #eaf1f7;
  color: #243b53;
  font-weight: 800;
}

.summary-grid {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 0.42em 0.8em;
  font-size: 1em;
}

.summary-grid div:nth-child(odd) {
  font-weight: 700;
  color: #334e68;
}

.summary-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 0.2em;
}

.summary-table th,
.summary-table td {
  border: 1px solid #d5dce5;
  padding: 0.82em 0.9em;
}

.summary-table th + th,
.summary-table td + td {
  border-left: 2px solid #c8d6e6;
}

.summary-table th {
  text-align: center;
  font-size: 0.9em;
  background: #eaf1f7;
  color: #243b53;
  font-weight: 700;
}

.summary-table .summary-value-row td {
  text-align: right;
  font-size: 1em;
  color: #243b53;
  font-weight: 700;
  background: #fff;
  letter-spacing: 0.01em;
}

.summary-table .summary-text-row td {
  text-align: center;
  font-size: 0.98em;
  color: #243b53;
  font-weight: 700;
  background: #fff;
}

.summary-table .summary-input-row td {
  background: #fff;
  vertical-align: middle;
}

.summary-table.summary-form-table .summary-input-row td {
  padding: 0.45em;
}

.summary-table.summary-form-table .summary-input-row .inline-input,
.summary-table.summary-form-table .summary-input-row .inline-number,
.summary-table.summary-form-table .summary-input-row input[type="text"] {
  width: 100%;
}

.summary-table .summary-value-row td.count-cell {
  text-align: center;
}

.summary-table .summary-value-row td.is-emphasis {
  font-weight: 800;
  background: #eef6ff;
  color: #0f4c81;
}

.entry-line-card {
  border: 1px solid #d5dce5;
  border-radius: 12px;
  background: #fbfcfd;
  padding: 0.95em;
  margin-top: 0.8em;
  overflow: hidden;
}

.entry-line-title {
  font-weight: 700;
  color: #0f4c81;
  margin-bottom: 0.45em;
  white-space: nowrap;
}

.value-box {
  width: 100%;
  min-height: 2.3em;
  box-sizing: border-box;
  padding: 0.48em 0.6em;
  border: 1.5px solid #d0d7e2;
  border-radius: 8px;
  background: #f7f9fc;
}

.confirm-block {
  margin-bottom: 1em;
  padding: 0.9em;
  border: 1px solid #d5dce5;
  border-radius: 12px;
  background: #fbfcfd;
}

.confirm-title {
  font-weight: 700;
  color: #0f4c81;
  margin-bottom: 0.55em;
}

.slip-block {
  border-width: 2px;
  border-color: #cfe4da;
}

.slip-block .confirm-title {
  display: inline-block;
  margin-bottom: 0.62em;
  padding: 0.14em 0.52em;
  border-radius: 8px;
  color: #fff;
}

.slip-block-common .confirm-title {
  background: #0f766e;
}

.slip-block-detail .confirm-title {
  background: #0f4c81;
}

.slip-block-expense .confirm-title {
  background: #b45309;
}

.slip-block-summary .confirm-title {
  background: #065f46;
}

.slip-block-common th {
  background: #def7ec;
}

.slip-block-detail th {
  background: #eaf1f7;
}

.slip-block-expense th {
  background: #ffedd5;
}

.slip-block-summary th {
  background: #dcfce7;
}

.sum-label {
  color: #5b7085;
  font-size: 0.84em;
  margin-bottom: 0.2em;
}

.sum-value {
  font-weight: 700;
  color: #243b53;
  font-size: 1.02em;
}

.result-success {
  font-size: 1.02em;
  font-weight: 700;
  color: #0f5132;
}

.form-row {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  align-items: center;
  gap: 0.6em;
  margin-bottom: 0.55em;
}

.form-label {
  font-weight: 700;
  color: #243b53;
}

.form-btns {
  display: flex;
  align-items: center;
  gap: 0.65em;
  margin-top: 0.7em;
}

.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.modal-card {
  background: #fff;
  padding: 1.1em;
  max-width: 760px;
  width: 96%;
  border-radius: 12px;
  border: 1px solid #d5dce5;
  position: relative;
  max-height: 92vh;
  overflow: auto;
}

.modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  cursor: pointer;
  font-size: 1.8em;
  color: #243b53;
}

.inline-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.entry-inline-table {
  width: 100%;
  min-width: 1240px;
  border-collapse: collapse;
  margin-top: 0.35em;
  font-size: 0.94em;
}

.entry-inline-table th,
.entry-inline-table td {
  border: 1px solid #d5dce5;
  padding: 0.54em 0.58em;
  vertical-align: middle;
  white-space: nowrap;
}

.entry-inline-table th {
  background: #eaf1f7;
  color: #243b53;
  font-weight: 700;
}

.entry-inline-table .col-no {
  width: 52px;
  text-align: center;
}

.entry-inline-table .col-item {
  min-width: 290px;
}

.entry-inline-table .col-num {
  width: 104px;
}

.entry-inline-table .col-action {
  width: 170px;
}

.inline-input,
.inline-number {
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  font-size: 0.95em;
  padding: 0.56em 0.62em;
  border: 1.5px solid #9fd3bf;
  border-radius: 10px;
  background: #fff;
  color: #1f2933;
}

.inline-value {
  min-height: 48px;
  box-sizing: border-box;
  padding: 0.56em 0.62em;
  border: 1.4px solid #d0d7e2;
  border-radius: 10px;
  background: #f7f9fc;
  color: #243b53;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.inline-actions {
  display: flex;
  gap: 0.35em;
  align-items: center;
}

.inline-actions .btn-main,
.inline-actions .btn-sub,
.inline-actions button:not(.btn-icon) {
  width: auto;
  min-width: 74px;
  padding: 0.48em 0.72em;
  font-size: 0.92em;
}

.entry-inline-table .append-cell {
  background: #ecfdf5;
  border-top: 1px dashed #a7f3d0;
  text-align: left;
  padding: 0.7em 0.72em;
}

.btn-append-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  border: none;
  background: #10b981;
  color: #fff;
  padding: 0;
  font-size: 1.18em;
  line-height: 1;
  font-weight: 700;
  cursor: pointer;
}

.btn-append-row:hover {
  opacity: 0.9;
}

.point-input-row {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  width: 100%;
  max-width: 460px;
}

.point-input-row .inline-number {
  flex: 1 1 auto;
}

.point-input-unit {
  white-space: nowrap;
  color: #334e68;
  font-size: 0.94em;
  font-weight: 700;
}

.date-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4em;
  position: relative;
}

.date-input-wrap .inline-number {
  flex: 1 1 auto;
  min-width: 0;
}

.btn-date-picker {
  min-width: 68px;
  min-height: 48px;
  padding: 0.44em 0.62em;
  font-size: 0.84em;
  line-height: 1.1;
  white-space: nowrap;
}

.date-picker-hidden {
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  border: 1.5px solid #9fd3bf;
  border-radius: 10px;
  background: #fff;
  color: #1f2933;
  padding: 0 0.5em;
}

.unified-input-table td {
  white-space: nowrap;
}

.unified-entry-card .inline-value {
  min-height: 2.05em;
}

.expense-inline-row,
.point-inline-row,
.common-inline-row,
.candidate-inline-row {
  display: grid;
  align-items: center;
  gap: 0.5em;
  min-width: 940px;
}

.expense-inline-row {
  grid-template-columns: 48px minmax(180px, 1fr) 48px 120px 38px minmax(220px, 1fr) 128px;
}

.point-inline-row {
  grid-template-columns: 64px minmax(220px, 1fr);
  min-width: 420px;
}

.common-inline-row {
  grid-template-columns: 48px 150px 58px minmax(230px, 1fr) 66px minmax(210px, 1fr);
}

.candidate-inline-row {
  grid-template-columns: 58px 140px 58px 150px 58px minmax(220px, 1fr) 112px 112px;
}

.inline-label {
  font-weight: 700;
  color: #243b53;
  white-space: nowrap;
}

.expense-inline-row .btn-main,
.common-inline-row .btn-main,
.common-inline-row .btn-sub,
.candidate-inline-row .btn-main,
.candidate-inline-row .btn-sub,
.expense-inline-row button,
.common-inline-row button,
.candidate-inline-row button {
  width: auto;
  min-width: 90px;
  padding: 0.52em 0.74em;
}

@media screen and (max-width: 768px), screen and (max-device-width: 768px) {
  body {
    font-size: 18px;
    line-height: 1.45;
    padding-bottom: 1.2em;
  }

  .section {
    max-width: 100%;
    margin: 10px 8px;
    padding: 10px 10px;
    border-radius: 12px;
  }

  #entry-page .section + .section {
    margin-top: 12px;
  }

  .section-title {
    font-size: 1.72em;
    margin-bottom: 0.45em;
  }

  .mid-title {
    font-size: 1.36em;
    margin-bottom: 0.4em;
  }

  .section-header-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.45em;
    margin-bottom: 0.5em;
  }

  .header-toggle-bar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.42em;
    width: 100%;
  }

  .header-toggle-btn {
    min-width: 0;
    min-height: 50px;
    font-size: 1em;
    padding: 0.56em 0.5em;
    border-radius: 12px;
    white-space: normal;
    line-height: 1.2;
  }

  .row-label,
  .inline-label,
  .form-label,
  .point-input-unit {
    font-size: 1em;
  }

  .input-main,
  .input-select,
  .form-input,
  select,
  input[type="text"],
  .inline-input,
  .inline-number {
    min-height: 56px;
    font-size: 1em;
    padding: 0.66em 0.74em;
    border-radius: 12px;
  }

  .inline-value {
    min-height: 56px;
    font-size: 1em;
    padding: 0.62em 0.68em;
    border-radius: 12px;
  }

  .btn-main,
  button,
  .btn-sub,
  .btn-link,
  .mode-btn {
    min-height: 56px;
    font-size: 1em;
    padding: 0.72em 0.92em;
    border-radius: 12px;
  }

  .btn-icon,
  .btn-append-row {
    width: 56px;
    height: 56px;
    min-width: 56px;
    min-height: 56px;
    font-size: 1.34em;
  }

  .btn-date-picker {
    min-height: 56px;
    font-size: 0.94em;
    padding: 0.52em 0.68em;
  }

  .date-picker-hidden {
    width: 100%;
    min-height: 56px;
    border-radius: 12px;
  }

  .button-row {
    gap: 0.44em;
    margin-top: 0.45em;
  }

  .entry-line-card,
  .confirm-block {
    padding: 0.64em;
    margin-top: 0.52em;
  }

  .table-wrap,
  .inline-scroll,
  .summary-table-wrap {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  table {
    font-size: 0.96em;
  }

  th,
  td {
    padding: 0.66em 0.62em;
  }

  .summary-table th,
  .summary-table td {
    padding: 0.72em 0.64em;
  }

  .summary-table th {
    font-size: 0.92em;
  }

  .summary-table .summary-value-row td,
  .summary-table .summary-text-row td {
    font-size: 1em;
  }

  .input-row {
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 0.44em;
    margin-bottom: 0.42em;
  }

  .summary-grid {
    grid-template-columns: 124px minmax(0, 1fr);
    gap: 0.3em 0.52em;
  }

  .form-row {
    grid-template-columns: 126px minmax(0, 1fr);
    gap: 0.44em;
    margin-bottom: 0.42em;
  }

  .mode-switch-wrap {
    display: flex;
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    text-align: center;
  }

  .button-row .btn-main,
  .button-row button,
  .button-row .btn-link {
    width: 100%;
    text-align: center;
  }

  .entry-inline-table {
    min-width: 980px;
  }

  .expense-inline-row,
  .point-inline-row,
  .common-inline-row,
  .candidate-inline-row {
    min-width: 760px;
  }

  .point-inline-row {
    min-width: 330px;
  }
}

@media screen and (max-width: 560px), screen and (max-device-width: 560px) {
  .section {
    margin: 8px 6px;
    padding: 8px 8px;
  }

  .section-title {
    font-size: 1.62em;
  }

  .mid-title {
    font-size: 1.28em;
  }

  .header-toggle-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .header-toggle-btn {
    min-height: 46px;
    font-size: 14px;
    padding: 0.46em 0.36em;
    white-space: nowrap;
    line-height: 1.1;
  }

  .entry-inline-table {
    min-width: 920px;
  }

  .expense-inline-row,
  .point-inline-row,
  .common-inline-row,
  .candidate-inline-row {
    min-width: 700px;
  }

  .point-inline-row {
    min-width: 300px;
  }
}

@media print {
  body.print-slip-mode {
    background: #fff;
    padding: 0;
    margin: 0;
  }

  body.print-slip-mode,
  body.print-slip-mode * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body.print-slip-mode #entry-page,
  body.print-slip-mode #confirm-page,
  body.print-slip-mode #post-submit-print-controls,
  body.print-slip-mode #post-submit-print-status {
    display: none !important;
  }

  body.print-slip-mode #result-page {
    display: block !important;
  }

  body.print-slip-mode #result-page .button-row {
    display: none !important;
  }

  body.print-slip-mode #result-page .section {
    margin: 0;
    max-width: none;
    box-shadow: none;
    border: 1px solid #d5dce5;
  }
}

```
