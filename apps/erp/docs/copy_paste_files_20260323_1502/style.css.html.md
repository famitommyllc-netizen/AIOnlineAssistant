# style.css.html

```html
body {
  font-size: 18px;
  line-height: 1.45;
  background: #f4f6f8;
  color: #1f2933;
  margin: 0;
  padding: 0 0 2.2em 0;
}

.section {
  background: #ffffff;
  margin: 1.1em auto;
  padding: 1.1em 1.2em;
  max-width: 1100px;
  border-radius: 12px;
  border: 1px solid #d5dbe3;
}

.section-title {
  font-size: 1.45em;
  font-weight: 700;
  margin: 0 0 0.8em 0;
  color: #0f4c81;
}

.mid-title {
  font-size: 1.15em;
  font-weight: 700;
  margin: 0 0 0.7em 0;
  color: #0f4c81;
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
  font-size: 1.05em;
  padding: 0.54em 0.6em;
  border: 1.6px solid #afbdd0;
  border-radius: 8px;
  background: #fff;
  color: #1f2933;
}

input:focus,
select:focus {
  outline: 3px solid #cbe4ff;
  border-color: #2a6fae;
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

.btn-main,
button {
  background: #0f6ab4;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.62em 1.1em;
  font-size: 1em;
  font-weight: 700;
  cursor: pointer;
}

.btn-sub {
  background: #64748b;
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
  background: #0c5692;
}

.btn-sub:hover {
  background: #4f5f77;
}

button:disabled {
  background: #9fb5c8;
  cursor: default;
}

.btn-link {
  display: inline-block;
  text-decoration: none;
  background: #0f6ab4;
  color: #fff;
  border-radius: 8px;
  padding: 0.62em 1.1em;
  font-size: 1em;
  font-weight: 700;
}

.btn-icon {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  border: none;
  font-size: 1.15em;
  font-weight: 700;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-icon-plus {
  background: #0f6ab4;
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
  border: 1px solid #afbdd0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.7em;
}

.mode-btn {
  border: none;
  background: #eef3f8;
  color: #334e68;
  padding: 0.55em 1.05em;
  font-size: 0.95em;
  font-weight: 700;
  cursor: pointer;
}

.mode-btn.active {
  background: #0f6ab4;
  color: #fff;
}

.note-text {
  color: #52606d;
  font-size: 0.92em;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.55em;
  font-size: 0.88em;
  min-width: 760px;
}

th,
td {
  border: 1px solid #d5dce5;
  padding: 0.43em 0.48em;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #eaf1f7;
  color: #243b53;
  font-weight: 700;
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

.entry-line-card {
  border: 1px solid #d5dce5;
  border-radius: 8px;
  background: #fbfcfd;
  padding: 0.8em;
  margin-top: 0.8em;
  overflow-x: auto;
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
  padding: 0.7em;
  border: 1px solid #d5dce5;
  border-radius: 8px;
  background: #fbfcfd;
}

.confirm-title {
  font-weight: 700;
  color: #0f4c81;
  margin-bottom: 0.55em;
}

.confirm-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5em 0.7em;
}

.kv-label {
  font-size: 0.84em;
  color: #5b7085;
}

.kv-value {
  font-size: 1.02em;
  font-weight: 700;
  color: #243b53;
}

.confirm-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55em;
}

.sum-item {
  border: 1px solid #d5dce5;
  border-radius: 8px;
  padding: 0.55em 0.6em;
  background: #fff;
}

.sum-item.highlight {
  border-color: #0f6ab4;
  background: #eef6ff;
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
}

.entry-inline-table {
  width: 100%;
  min-width: 1240px;
  border-collapse: collapse;
  margin-top: 0.35em;
  font-size: 0.9em;
}

.entry-inline-table th,
.entry-inline-table td {
  border: 1px solid #d5dce5;
  padding: 0.38em 0.4em;
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
  font-size: 1em;
  padding: 0.42em 0.48em;
  border: 1.4px solid #afbdd0;
  border-radius: 7px;
  background: #fff;
  color: #1f2933;
}

.inline-value {
  min-height: 2.2em;
  box-sizing: border-box;
  padding: 0.42em 0.48em;
  border: 1.4px solid #d0d7e2;
  border-radius: 7px;
  background: #f7f9fc;
  color: #243b53;
  font-weight: 700;
}

.inline-actions {
  display: flex;
  gap: 0.35em;
  align-items: center;
}

.inline-actions .btn-main,
.inline-actions .btn-sub,
.inline-actions button {
  width: auto;
  min-width: 74px;
  padding: 0.48em 0.72em;
  font-size: 0.92em;
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

@media (max-width: 900px) {
  .section {
    margin: 0.7em 0.4em;
    padding: 0.9em 0.7em;
  }

  .input-row {
    grid-template-columns: 185px minmax(0, 1fr);
  }

  .summary-grid {
    grid-template-columns: 170px minmax(0, 1fr);
  }

  .confirm-kv-grid {
    grid-template-columns: 1fr;
  }

  .confirm-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-row {
    grid-template-columns: 150px minmax(0, 1fr);
  }

  .entry-inline-table {
    min-width: 1120px;
  }

  .expense-inline-row,
  .point-inline-row,
  .common-inline-row,
  .candidate-inline-row {
    min-width: 860px;
  }

  .point-inline-row {
    min-width: 360px;
  }
}

@media (max-width: 560px) {
  body {
    font-size: 17px;
  }

  .section-title {
    font-size: 1.28em;
  }

  .input-row {
    grid-template-columns: 145px minmax(0, 1fr);
    gap: 0.5em;
  }

  .summary-grid {
    grid-template-columns: 130px minmax(0, 1fr);
  }

  .mode-switch-wrap {
    display: flex;
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    text-align: center;
  }

  .confirm-summary-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 130px minmax(0, 1fr);
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
    min-width: 780px;
  }

  .point-inline-row {
    min-width: 320px;
  }
}
```
