const test = require("node:test"),
  assert = require("node:assert/strict");
const { share, periodStart, netDebts } = require("../docs/money.js");
test("odd cents go to the first selected roommates and sum to the receipt", () => {
  const people = ["A", "B", "C"];
  assert.deepEqual(
    [...people, "D"].map((n) => share(101, people, n)),
    [34, 34, 33, 0],
  );
});
test("pay periods include payday and handle month ends, leap years and anchors in the future", () => {
  for (const [anchor, cycle, day, expected] of [
    ["2024-01-31", "Monthly", "2024-02-29", "2024-02-29"],
    ["2025-01-31", "Monthly", "2025-03-01", "2025-02-28"],
    ["2025-01-31", "Monthly", "2025-01-01", "2024-12-31"],
    ["2026-01-08", "Weekly", "2026-01-07", "2026-01-01"],
    ["2026-01-01", "Biweekly", "2026-01-15", "2026-01-15"],
    ["2026-01-01", "Daily", "2026-02-21", "2026-02-21"],
  ])
    assert.equal(periodStart(anchor, cycle, day), expected);
});
test("payer can cover an item they do not share and reverse purchases offset it", () => {
  assert.deepEqual(
    netDebts([
      { payer: "A", people: ["B"], total: 700 },
      { payer: "B", people: ["B", "A"], total: 401 },
    ]),
    [{ from: "B", to: "A", amount: 500 }],
  );
});
