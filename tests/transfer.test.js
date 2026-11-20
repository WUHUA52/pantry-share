const test = require("node:test");
const assert = require("node:assert/strict");
const { restore } = require("../docs/storage.js");
const { sharedSnapshot, importSharedSnapshot, validateShared, renamePerson } = require("../docs/transfer.js");
const make = (self, other) => restore({
  members: [{ name: self, contribution: 9234 }, { name: other }],
  householdName: "House", pay: 234567, percent: 14, store: 0, location: "Do not share address", target: 14500,
  items: [], history: [], pantry: [], archived: [], settlements: [], shopper: self,
}, {}, 15);
const item = (name, people, scope = "Shared") => ({
  id: 21, store: 13, product: "custom-19", people, scope, qty: 2,
  snapshot: { name, cat: "Pantry", unit: "jar", size: 1, price: 299 },
});
test("hand off shared rows and weighted debts without private data or arbitrary nested fields", () => {
  const s = make("Alex", "Sam");
  const garlic = item("Garlic", ["Alex", "Sam"]);
  garlic.snapshot.secret = "SURPRISE";
  s.items.push(garlic, item("SURPRISE", ["Alex"], "Personal"));
  s.history.push({ ...garlic, id: 45, receiptId: 66, photoKey: "SURPRISE", weights: [2,1], payer: "Alex", total: 598, date: "2026-11-17" },
    { ...garlic, id: 44, receiptId: 66, scope:"Personal", payer:"Alex", total:300, date:"2026-11-17", snapshot: {...garlic.snapshot, name:"SURPRISE"} });
  s.settlements.push({ id: 900, from: "Sam", to: "Alex", amount: 120, date: "2026-11-18", note: "Cash" });
  s.pantry.push({id:901,owner:"Alex",name:"SURPRISE",place:"Fridge",qty:2,expires:""});
  const shared = sharedSnapshot(s);
  const serialized = JSON.stringify(shared);
  for (const hidden of ["SURPRISE", "234567", "9234", "Do not share", "contribution", "photoKey", "anchor", "cadence"]) {
    assert.ok(!serialized.includes(hidden), hidden);
  }
  const receiver = make("You", "Alex");
  receiver.items = [item("Personal snack", ["You"], "Personal")];
  receiver.history = [{ ...receiver.items[0], id: 6, receiptId: 66, payer: "You", total: 40, date: "2026-11-18" }];
  const next = importSharedSnapshot(receiver, shared, "Sam", {}, 15, restore);
  assert.equal(next.members[0].name, "Sam");
  assert.equal(next.pay, receiver.pay);
  assert.deepEqual(next.items.find(r => r.scope === "Personal").people, ["Sam"]);
  assert.deepEqual(next.items.find(r => r.scope === "Shared").people, ["Alex", "Sam"]);
  assert.deepEqual(next.history.find(r => r.scope === "Shared").weights, [2,1]);
  assert.notEqual(next.history[0].receiptId, next.history[1].receiptId);
  assert.equal(next.settlements[0].from, "Sam");
  assert.equal(next.pantry.length, 0);
  assert.equal(receiver.members[0].name, "You");
});
test("retained household names can replace device alias before export", () => {
  const s = make("You","Sam");
  s.items.push(item("Garlic",["You","Sam"]));
  renamePerson("You","Al",s);
  assert.deepEqual(validateShared(sharedSnapshot(s),15).items[0].people,["Al","Sam"]);
});
test("reject invalid file and unknown member without changing local records", () => {
  const s = make("Alex","Sam");
  const file = sharedSnapshot(s);
  assert.throws(() => importSharedSnapshot(s,file,"Ghost",{},15,restore), /Choose/);
  file.items.push(item("Garlic",["Ghost"]));
  assert.throws(() => validateShared(file,15), /valid/);
  assert.deepEqual(s.items,[]);
});
test("export keeps legacy lines distinct from an explicit group with the same numeric ID", () => {
  const s = make("Alex","Sam");
  const base = { ...item("Milk",["Alex"]), total: 330, date: "2026-11-18", payer: "Alex" };
  s.history = [{ ...base, id: 40 }, { ...base, id: 39, receiptId: 40 }];
  const out = sharedSnapshot(s);
  assert.notEqual(out.history[0].receiptId, out.history[1].receiptId);
});
