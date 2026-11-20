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
const { loadHousehold, persistHousehold, saveKey, recoveryKey } = require("../docs/storage.js");
function mockStorage(initial) {
  const data = new Map(Object.entries(initial));
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
}
test("a broken schedule repairs only the member field and backs up untouched receipts", () => {
  const s = household();
  s.members[0].cadence = "broken";
  s.history = [{ ...row("old-pasta"), total: 412, date: "2026-11-12", payer: "You" }];
  s.store = 10;
  const raw = JSON.stringify(s);
  const store = mockStorage({ "pantry-share-v2": raw });
  const loaded = loadHousehold(store, household, {}, 11);
  assert.equal(loaded.state.members[0].cadence, "Weekly");
  assert.equal(loaded.state.store, 10);
  assert.equal(loaded.state.history[0].total, 412);
  persistHousehold(loaded.state, store);
  assert.equal(store.getItem(recoveryKey), raw);
  assert.equal(JSON.parse(store.getItem(saveKey)).history.length, 1);
});
test("quota and malformed saves cannot be overwritten on the next click", () => {
  const store = mockStorage({ [saveKey]: "broken json" });
  const loaded = loadHousehold(store, household, {}, 11);
  assert.match(loaded.recovery, /protected/);
  assert.throws(() => persistHousehold(loaded.state, store), /protected/);
  assert.equal(store.getItem(saveKey), "broken json");
  const quota = mockStorage({ [saveKey]: JSON.stringify(household()) });
  const before = quota.getItem(saveKey);
  quota.setItem = () => { throw new Error("QuotaExceededError"); };
  loadHousehold(quota, household, {}, 11);
  assert.throws(() => persistHousehold(loaded.state, quota), /protected/);
  assert.equal(quota.getItem(saveKey), before);
});
test("stale tabs do not clobber newer saves", () => {
  const store = mockStorage({});
  const { state } = loadHousehold(store, household, {}, 11);
  store.setItem(saveKey, "a different tab's save");
  assert.throws(() => persistHousehold(state, store), /Another tab/);
  assert.equal(store.getItem(saveKey), "a different tab's save");
});
test("duplicate listing IDs migrate to the retained Food Lion spaghetti", () => {
  const s = household();
  s.items = [row("sku-9e5205509768")];
  restore(s, {}, 15);
  assert.equal(s.items[0].product, "sku-d150f62635f3");
});
