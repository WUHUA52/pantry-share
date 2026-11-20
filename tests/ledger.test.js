const test = require("node:test");
const assert = require("node:assert/strict");
const { allocateCents, share, netDebts } = require("../docs/money.js");
const { receiptGroups, receiptKey, validPhotoKey } = require("../docs/ledger.js");

test("weighted shares assign whole cents and preserve same-order ties", () => {
  assert.deepEqual(allocateCents(1001, [3, 1, 2]), [500, 167, 334]);
  assert.deepEqual(allocateCents(5, [0, 0]), [3, 2]);
  assert.deepEqual(allocateCents(5, [0, 17]), [0, 5]);
  assert.deepEqual(allocateCents(10, [1, 3, 1]), [2, 6, 2]);
  const total = Number.MAX_SAFE_INTEGER;
  assert.equal(allocateCents(total, [total, 2, total]).reduce((a, n) => a + n), total);
  assert.equal(share(601, ["Sam", "Riley"], "Sam", [2, 1]), 401);
});

test("repayments settle retired members and receipt corrections account for money already returned", () => {
  const history = [{ payer: "You", people: ["You", "Riley"], total: 2400 }];
  const payment = { from: "Riley", to: "You", amount: 1200 };
  assert.deepEqual(netDebts(history, [{ ...payment, amount: 500 }]), [{ from: "Riley", to: "You", amount: 700 }]);
  assert.deepEqual(netDebts(history, [payment]), []);
  assert.deepEqual(netDebts([{ ...history[0], total: 1200 }], [payment]), [{ from: "You", to: "Riley", amount: 600 }]);
  assert.deepEqual(netDebts([], [payment]), [{ from: "You", to: "Riley", amount: 1200 }]);
});

test("historical lines and imported group IDs stay distinct, and invalid group keys are ignored", () => {
  const rows = [{ id: 18 }, { id: 19, receiptId: 18 }, { id: 20, receiptId: 18 }];
  assert.deepEqual(receiptGroups(rows), [[rows[1], rows[2]], [rows[0]]]);
  assert.equal(receiptKey({ id: 40, receiptId: "not a number" }), -40);
  assert.equal(validPhotoKey("javascript:alert(1)"), false);
  assert.equal(validPhotoKey("45816da1-87c8-4116-a5d1-b6646cc43e49"), true);
});
