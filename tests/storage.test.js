const test = require("node:test"),
  assert = require("node:assert/strict");
const { restore, originalIds } = require("../docs/storage.js");
const household = () => ({
  store: 0,
  target: 9000,
  pay: 10000,
  percent: 10,
  location: "19107",
  members: [
    {
      name: "You",
      anchor: "2026-01-01",
      cadence: "Weekly",
      contribution: 9000,
    },
  ],
  items: [],
  history: [],
});
const row = (product) => ({
  product,
  id: 12,
  people: ["You"],
  scope: "Shared",
  store: 0,
});
test("old catalog indexes survive a reorder and snapshots survive a removal", () => {
  const s = household(),
    id = originalIds[1],
    p = { name: "Spaghetti", price: 192, size: 16, unit: "oz", cat: "Pasta" };
  s.items = [row(22), row(0)];
  restore(s, { [id]: p });
  assert.equal(s.items[0].product, id);
  assert.equal(s.items[1].snapshot.price, 349);
  restore(s, {});
  assert.equal(s.items[0].snapshot.name, "Spaghetti");
});
test("retired receipt without a known index keeps its paid amount", () => {
  const s = household();
  s.history = [{ ...row(9999), total: 501, date: "2026-01-01", payer: "You" }];
  restore(s, {});
  assert.equal(s.history[0].total, 501);
  assert.equal(s.history[0].snapshot.name, "Unavailable item");
});
test("invalid saved household is rejected for recovery", () => {
  const s = household();
  s.members[0].anchor = "bad";
  assert.throws(() => restore(s, {}));
});
