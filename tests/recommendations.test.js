const test = require("node:test");
const assert = require("node:assert/strict");
const { compareOptions, matchesDiet } = require("../docs/recommendations.js");
const item = { id: "selected", cat: "Pasta", unit: "oz", size: 16, price: 200, store: 1 };
const pack = { ...item, id: "larger", size: 32, price: 300, diet: ["Vegan", "Gluten-free"] };
const small = { ...item, id: "smaller", size: 8, price: 150, diet: ["Vegan"] };
const featured = { ...item, id: "bronze", price: 310, feature: "Bronze-cut pasta", store: 2 };
test("filter requires every selected label and excludes unknown claims", () => {
  assert.ok(matchesDiet(pack, ["Vegan", "Gluten-free"]));
  assert.equal(matchesDiet(small, ["Vegan", "Gluten-free"]), false);
  assert.equal(matchesDiet(item, ["Gluten-free"]), false);
  assert.ok(matchesDiet(item, []));
});
test("package and unit savings compare similar items at the chosen store", () => {
  const rows = [item, pack, small, featured, { ...pack, id: "rice", cat: "Rice" },
    { ...pack, id: "other-unit", unit: "box" }];
  assert.deepEqual(compareOptions(item, rows, []).cheaper, [pack, small]);
  assert.deepEqual(compareOptions(item, rows, ["Gluten-free"]).cheaper, [pack]);
  assert.deepEqual(compareOptions(item, rows, []).featured, []);
  assert.deepEqual(compareOptions(item, rows, [], true).featured, [featured]);
  assert.deepEqual(compareOptions(item, rows, ["Vegan"], true).featured, []);
});
