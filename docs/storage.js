// Frozen product order used by the first published catalog.
const originalIds = [
  "sku-5994bf1ef59d",
  "sku-9fc000da66f0",
  "sku-046e8c2fafda",
  "sku-449cf52921aa",
  "sku-9a7c958e28e2",
  "sku-e8dd9b92c4c8",
  "sku-62e071b0df42",
  "sku-743fd6e36e43",
  "sku-9c976a9e54c7",
  "sku-13fe838a4183",
  "sku-cf78efb0684f",
  "sku-85f6d87be12c",
  "sku-8cff95e2c7e8",
  "sku-a24cead91c56",
  "sku-b956a0dbf7b1",
  "sku-1645490c2d61",
  "sku-7fa1135abdd8",
  "sku-74111b110b33",
  "sku-3852595442ec",
  "sku-7fa14231588a",
  "sku-0828b02ed405",
  "sku-a67ad10c0661",
  "sku-0071c6c2a676",
  "sku-5caa7edf4565",
  "sku-2c6219089f19",
  "sku-d0f3e70ceaba",
  "sku-1cd65e8c5d2b",
  "sku-cf6e69fa8f2c",
  "sku-6eeeed396f66",
  "sku-5d381025bf32",
  "sku-51ef4434da8d",
  "sku-662ea8a2574d",
  "sku-b7c9a2bf4d23",
  "sku-a2f32251b272",
  "sku-ea26dc10ee28",
  "sku-1078c816bc85",
  "sku-9d37d8543f97",
  "sku-e0e59b8c14bc",
  "sku-7e8a5f493aea",
  "sku-ebc8b8dd5b70",
  "sku-243c909d9dbb",
  "sku-d86415731771",
  "sku-ec138d9a636e",
  "sku-3ed3e8d94483",
  "sku-bd8af0ffc96a",
  "sku-d7a552226642",
  "sku-407c17556d4e",
  "sku-62508f32e34f",
  "sku-770a7b2405b0",
  "sku-1ed8ea2a4c2b",
  "sku-8ce076e5f8e5",
  "sku-af405d3c58f0",
  "sku-ccbff17db7d2",
  "sku-5c5241ed2c33",
  "sku-7479b212a291",
  "sku-1f10fc60a8fc",
  "sku-d385adc04f44",
  "sku-1790a61cacdc",
  "sku-63b00548649a",
  "sku-dd0006b49b82",
  "sku-67ec7456f01e",
  "sku-d7b55407f056",
  "sku-344cbe519f9b",
  "sku-ec310d587370",
  "sku-113d2ea327ec",
  "sku-0080d212deb1",
  "sku-bc8f3efd7926",
  "sku-535c4e093ade",
];
// Only used to reconstruct items saved by the earliest prototype.
function oldSnapshot(index, store) {
  const old = [
    ["Milk", "Whole milk", 64, "fl oz", 349, 269],
    ["Eggs", "Large eggs", 12, "egg", 429, 319],
    ["Bread", "Sandwich bread", 20, "oz", 379, 249],
    ["Pasta", "Penne pasta", 16, "oz", 219, 139],
    ["Oats", "Rolled oats", 18, "oz", 399, 289],
    ["Cheese", "Cheddar cheese", 8, "oz", 329, 239],
    ["Paper towels", "Paper towels", 2, "roll", 499, 389],
  ];
  const [cat, name, size, unit, regular, cheap] = old[Math.floor(index / 3)],
    variant = index % 3;
  return {
    cat,
    name:
      ["", "Store brand ", "Family size "][variant] +
      (variant ? name.toLowerCase() : name),
    size: size * (variant === 2 ? 2 : 1),
    unit,
    price: [regular, cheap, Math.round(cheap * 1.8)][variant] + store * 7,
  };
}
function restore(state, products) {
  const text = (x) => typeof x === "string" && x.length > 0;
  const cents = (x) => Number.isSafeInteger(x) && x >= 0;
  const store = (x) => Number.isInteger(x) && x >= 0 && x < 6;
  const date = (x) =>
    text(x) &&
    /^\d{4}-\d{2}-\d{2}$/.test(x) &&
    Number.isFinite(Date.parse(x)) &&
    new Date(x).toISOString().startsWith(x);
  const validSnapshot = (p) =>
    p &&
    text(p.name) &&
    text(p.unit) &&
    text(p.cat) &&
    cents(p.price) &&
    Number.isFinite(p.size) &&
    p.size > 0;
  if (
    !state ||
    !store(state.store) ||
    !text(state.location) ||
    !cents(state.target) ||
    !cents(state.pay) ||
    !Number.isFinite(state.percent) ||
    state.percent < 0 ||
    state.percent > 100 ||
    !Array.isArray(state.members) ||
    !state.members.length ||
    !state.members.every(
      (m) =>
        m &&
        text(m.name) &&
        date(m.anchor) &&
        cents(m.contribution) &&
        ["Weekly", "Daily", "Biweekly", "Monthly"].includes(m.cadence),
    ) ||
    !Array.isArray(state.items) ||
    !Array.isArray(state.history)
  )
    throw Error("Invalid household");
  for (const [rows, purchased] of [
    [state.items, false],
    [state.history, true],
  ]) {
    for (const row of rows) {
      if (
        !row ||
        !store(row.store) ||
        !cents(row.id) ||
        !Array.isArray(row.people) ||
        !row.people.length ||
        !row.people.every(text) ||
        !["Shared", "Personal"].includes(row.scope) ||
        (purchased &&
          (!date(row.date) || !text(row.payer) || !cents(row.total)))
      )
        throw Error("Invalid item");
      if (typeof row.product === "number") {
        const n = row.product;
        if (Number.isInteger(n) && n >= 0 && n < 21) {
          row.snapshot = oldSnapshot(n, row.store);
          row.product = "legacy-" + n;
        } else row.product = originalIds[n - 21] || "unavailable";
      }
      if (!text(row.product) || !Object.hasOwn(products, row.product)) {
        if (!validSnapshot(row.snapshot)) {
          row.snapshot = {
            name: "Unavailable item",
            cat: "Unlisted",
            price: purchased ? row.total : 0,
            size: 1,
            unit: "item",
          };
        }
        row.product =
          typeof row.product === "string" &&
          !Object.hasOwn(Object.prototype, row.product)
            ? row.product
            : "unavailable";
      } else {
        const { name, cat, price, size, unit } = products[row.product];
        row.snapshot = { name, cat, price, size, unit };
      }
    }
  }
  state.version = 2;
  return state;
}
if (typeof module !== "undefined") module.exports = { restore, originalIds };
