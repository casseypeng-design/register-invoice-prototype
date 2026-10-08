# Invoice at checkout

Interactive design prototype using synthetic data. No backend, real emails,
payments, customer updates, or analytics. Open `index.html` in a browser or serve
this folder with any static HTTP server.

## Scenarios

- `#default`: $100 sale, email selected, Due upon receipt.
- `#no-email`: save to account; select email in the modal to enter an address.
- `#saved-only`: an address exists, but email delivery is deliberately unselected.
- `#partial`: $100 invoice, $40 cash payment, $60 amount due.
- `#edited`: preserve the original $100 invoice; create a $300 invoice for added
  items on a revised $400 sale.

Use **Preview and edit invoice** to change invoice delivery, terms, or notes.
The preview updates while editing. **Save changes** applies the draft settings;
**Discard changes**, the close button, and Escape discard edits. Complete sale
simulates the outcome. Reset scenario returns to its initial state.

Invoice email edits affect this invoice only. Receipt delivery remains separate.
The fixed sample sale date is October 9, 2026. Custom dates cannot precede it.
Cash/card-only sales do not create an invoice in this flow.

This is a standalone interaction model, not a production component or final
backend contract. Failure recovery, negative/zero sale deltas, and payment
allocation across multiple invoices require product and engineering decisions.
Copy uses Writespeed guidelines; human Content Designer review is pending.
