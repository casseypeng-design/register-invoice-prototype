'use strict';
const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
// Fixed demo date keeps scenario links repeatable and terms consistent everywhere.
const SALE_DATE = '2026-10-09';
const CUSTOMER_EMAIL = 'john.smith@example.com';
const scenarios = {
  default: { sale: 100, invoice: 100, cash: 0, onAccount: 100, email: CUSTOMER_EMAIL, send: true },
  'no-email': { sale: 100, invoice: 100, cash: 0, onAccount: 100, email: '', send: false },
  'saved-only': { sale: 100, invoice: 100, cash: 0, onAccount: 100, email: CUSTOMER_EMAIL, send: false },
  partial: { sale: 100, invoice: 100, cash: 40, onAccount: 60, email: CUSTOMER_EMAIL, send: true },
  edited: { sale: 400, invoice: 300, cash: 0, onAccount: 400, email: CUSTOMER_EMAIL, send: true },
};
let scenario;
let state;
let draft;
let receiptTrigger;
const dialog = $('invoice-dialog');
const receiptDialog = $('receipt-dialog');
const dateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function dueDate(settings) {
  if (settings.terms === 'custom') return settings.date;
  const date = new Date(`${SALE_DATE}T12:00:00`);
  date.setDate(date.getDate() + Number(settings.terms));
  return dateString(date);
}
function dateLabel(value) {
  if (!value) return 'Choose a due date';
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function termsLabel(settings) {
  return settings.terms === '0' ? 'Due upon receipt' : `Due ${dateLabel(dueDate(settings))}`;
}
function products(container, letters) {
  container.replaceChildren();
  for (const letter of letters) {
    const row = document.createElement('div');
    row.className = 'product';
    for (const text of ['1', `Product ${letter}`, '$100.00']) {
      const item = document.createElement('span');
      item.textContent = text;
      row.append(item);
    }
    container.append(row);
  }
}
function render() {
  const fixture = scenarios[scenario];
  products($('sale-items'), scenario === 'edited' ? ['A', 'B', 'C', 'D'] : ['A']);
  $('subtotal').textContent = money(fixture.sale);
  $('sale-total').textContent = money(fixture.sale);
  $('item-count').textContent = scenario === 'edited' ? '4 items' : '1 item';
  $('headline').textContent = `${money(fixture.onAccount)} on account`;
  $('balance').textContent = `−${money(fixture.onAccount)}`;
  $('available').textContent = `Available: ${money(1000 - fixture.onAccount)}`;
  $('payments').replaceChildren();
  if (fixture.cash) {
    for (const [label, value] of [['Cash', fixture.cash], ['On account', fixture.onAccount]]) {
      const row = document.createElement('div');
      row.className = 'row';
      const title = document.createElement('span');
      title.textContent = label;
      const amount = document.createElement('span');
      amount.textContent = money(value);
      row.append(title, amount);
      $('payments').append(row);
    }
  }
  $('original-invoice').hidden = scenario !== 'edited';
  $('invoice-summary').textContent = `${scenario === 'edited' ? 'New invoice' : 'Invoice total'} ${money(fixture.invoice)} · ${termsLabel(state)}`;
  $('payment-summary').hidden = !fixture.cash && scenario !== 'edited';
  $('payment-summary').textContent = fixture.cash ? `${money(fixture.cash)} paid by cash · ${money(fixture.invoice - fixture.cash)} due` : 'For the added items. Original invoice INV0001 stays unchanged.';
  $('delivery-summary').textContent = state.send ? `Send to ${state.email} when you complete the sale.` : 'Save to John Smith’s account without sending an email.';
  $('receipt-address').textContent = fixture.email || 'No customer email';
  $('receipt-email').checked = state.receipt;
  $('receipt-email').disabled = !fixture.email || state.completed;
  $('receipt-hint').textContent = fixture.email ? 'Customer receipt · Separate from the invoice' : 'No customer email for receipt delivery. Invoice settings only change the invoice address.';
  $('edit-invoice').hidden = state.completed;
  $('sale-note').disabled = state.completed;
  $('complete-sale').textContent = state.completed ? 'Start new sale' : 'Complete sale';
  $('completion').hidden = !state.completed;
  if (state.completed) {
    const invoiceId = scenario === 'edited' ? 'INV0002' : 'INV0001';
    $('invoice-summary').textContent = `${invoiceId} · Invoice total ${money(fixture.invoice)} · ${termsLabel(state)}`;
    $('delivery-summary').textContent = state.send ? `Invoice sent to ${state.email}.` : 'Invoice saved to John Smith’s account.';
    $('completion-message').textContent = state.send ? `${invoiceId} saved to John Smith’s account. Invoice sent to ${state.email}.` : `${invoiceId} saved to John Smith’s account. No invoice email sent.`;
    $('completion-amounts').textContent = `Invoice total ${money(fixture.invoice)} · Amount due ${money(fixture.invoice - fixture.cash)}${state.receipt ? ` · Receipt sent to ${fixture.email}` : ''}`;
  }
}
function clearError(field, error) {
  $(field).removeAttribute('aria-invalid');
  $(error).hidden = true;
  $(error).textContent = '';
}
function error(field, target, text) {
  $(field).setAttribute('aria-invalid', 'true');
  $(target).textContent = text;
  $(target).hidden = false;
  $(field).focus();
}
function renderPreview() {
  const fixture = scenarios[scenario];
  $('preview-email').textContent = draft.email.trim();
  $('preview-email').hidden = !draft.email.trim();
  $('preview-note-wrap').hidden = !draft.note.trim();
  $('preview-note').textContent = draft.note;
  $('preview-due').textContent = money(fixture.invoice - fixture.cash);
  $('preview-date').textContent = termsLabel(draft);
  $('issue-date').textContent = dateLabel(SALE_DATE);
  products($('preview-items'), scenario === 'edited' ? ['B', 'C', 'D'] : ['A']);
  $('preview-subtotal').textContent = money(fixture.invoice);
  $('preview-total').textContent = money(fixture.invoice);
  $('preview-remaining').textContent = money(fixture.invoice - fixture.cash);
  $('preview-payment-row').hidden = !fixture.cash;
  $('preview-delta').hidden = scenario !== 'edited';
  $('email-field').hidden = !draft.send;
  $('email').disabled = !draft.send;
  $('email').required = draft.send;
  $('saved-hint').hidden = draft.send;
  $('due-date').readOnly = draft.terms !== 'custom';
}
function openInvoice() {
  draft = { ...state };
  $('send-email').checked = draft.send;
  $('email').value = draft.email;
  $('terms').value = draft.terms;
  $('due-date').value = dueDate(draft);
  $('due-date').min = SALE_DATE;
  $('invoice-note').value = draft.note;
  clearError('email', 'email-error');
  clearError('due-date', 'date-error');
  renderPreview();
  dialog.showModal();
  $('send-email').focus();
}
function closeInvoice() {
  dialog.close();
  draft = null;
  $('edit-invoice').focus();
}
function reset(next = scenario) {
  scenario = Object.hasOwn(scenarios, next) ? next : 'default';
  const fixture = scenarios[scenario];
  state = { email: fixture.email, send: fixture.send, terms: '0', date: SALE_DATE, note: '', receipt: !!fixture.email, completed: false };
  $('scenario').value = scenario;
  $('sale-note').value = '';
  if (dialog.open) dialog.close();
  if (receiptDialog.open) receiptDialog.close();
  draft = null;
  render();
}
$('edit-invoice').addEventListener('click', openInvoice);
$('close-modal').addEventListener('click', closeInvoice);
$('discard').addEventListener('click', closeInvoice);
dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeInvoice(); });
// Keep keyboard traversal in the dialog rather than letting it reach browser chrome.
dialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button, input, select, textarea, summary, [tabindex="0"]')]
    .filter(element => !element.disabled && element.getClientRects().length);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
$('send-email').addEventListener('change', () => {
  draft.send = $('send-email').checked;
  clearError('email', 'email-error');
  renderPreview();
  if (draft.send && !draft.email) $('email').focus();
});
$('email').addEventListener('input', () => { draft.email = $('email').value; clearError('email', 'email-error'); renderPreview(); });
$('terms').addEventListener('change', () => {
  draft.terms = $('terms').value;
  if (draft.terms === 'custom') draft.date = $('due-date').value || SALE_DATE;
  $('due-date').value = dueDate(draft);
  clearError('due-date', 'date-error');
  renderPreview();
});
$('due-date').addEventListener('input', () => { draft.date = $('due-date').value; clearError('due-date', 'date-error'); renderPreview(); });
$('invoice-note').addEventListener('input', () => { draft.note = $('invoice-note').value; renderPreview(); });
$('invoice-form').addEventListener('submit', (event) => {
  event.preventDefault();
  draft.email = draft.email.trim();
  $('email').value = draft.email;
  if (draft.send && !draft.email) { error('email', 'email-error', 'Enter an email address'); return; }
  if (draft.send && (!$('email').validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))) { error('email', 'email-error', 'Enter a valid email address'); return; }
  if (draft.terms === 'custom' && (!draft.date || draft.date < SALE_DATE || !$('due-date').validity.valid)) { error('due-date', 'date-error', 'Choose October 9, 2026 or a later date'); return; }
  state = { ...draft };
  render();
  closeInvoice();
  $('announcement').textContent = 'Invoice settings updated. Complete the sale to create the invoice.';
});
$('receipt-email').addEventListener('change', () => { state.receipt = $('receipt-email').checked; });
$('complete-sale').addEventListener('click', () => {
  if (state.completed) { reset(); return; }
  state.completed = true;
  render();
  $('completion').focus();
});
$('scenario').addEventListener('change', () => { window.location.hash = $('scenario').value; });
$('reset').addEventListener('click', () => reset());
window.addEventListener('hashchange', () => reset(window.location.hash.slice(1)));
document.querySelectorAll('[data-receipt]').forEach((button) => button.addEventListener('click', () => {
  receiptTrigger = button;
  const gift = button.dataset.receipt === 'gift';
  const fixture = scenarios[scenario];
  $('receipt-title').textContent = gift ? 'Gift receipt' : 'Customer receipt';
  $('receipt-content').replaceChildren();
  const lines = gift ? ['Products from this sale', 'Amounts do not appear on a gift receipt.'] : [`Sale total ${money(fixture.sale)}`, ...(fixture.cash ? [`Cash ${money(fixture.cash)}`] : []), `On account ${money(fixture.onAccount)}`, `Invoice ${state.completed ? (scenario === 'edited' ? 'INV0002' : 'INV0001') : 'reference available after completion'} · ${termsLabel(state)}`, 'Register amount to pay $0.00'];
  for (const text of lines) { const p = document.createElement('p'); p.textContent = text; $('receipt-content').append(p); }
  receiptDialog.showModal();
}));
function closeReceipt() { receiptDialog.close(); receiptTrigger?.focus(); }
$('close-receipt').addEventListener('click', closeReceipt);
$('done-receipt').addEventListener('click', closeReceipt);
receiptDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeReceipt(); });
reset(window.location.hash.slice(1));
