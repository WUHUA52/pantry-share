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
const saveKey = "pantry-share-v3";
const recoveryKey = "pantry-share-before-repair";
const importBackupKey = "pantry-share-before-import";
let lastStored = null;
let writesBlocked = "";

const isRecord = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const hasText = (v) => typeof v === "string" && Boolean(v.trim());
const validCents = (v) => Number.isSafeInteger(v) && v >= 0;
const validDay = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString().startsWith(v);
const asArray = (v) => Array.isArray(v) ? v : [];
const distinctNames = (v) => [...new Set(asArray(v).filter(hasText))];

function simpleSnapshot(p) {
  if (!isRecord(p) || !hasText(p.name) || !hasText(p.cat) || !hasText(p.unit) ||
      !validCents(p.price) || !Number.isFinite(p.size) || p.size <= 0) return null;
  const { name, cat, unit, size, price } = p;
  return { name, cat, unit, size, price };
}

function restore(state, catalog, storeCount = typeof stores !== "undefined" ? stores.length : Math.max(1, ...Object.values(catalog).map(p => (p.store || 0) + 1))) {
  if (!isRecord(state) || !["members", "items", "history"].some(key => Array.isArray(state[key]))) {
    throw new Error("This file has no recognizable household records.");
  }
  const day = typeof today === "function" ? today() : new Date().toISOString().slice(0, 10);
  const knownStore = (v) => Number.isInteger(v) && v >= 0 && v < storeCount;
  state.store = knownStore(state.store) ? state.store : 0;
  if (!hasText(state.householdName)) state.householdName = "Maple House";
  if (!hasText(state.location)) state.location = "19107";
  if (!validCents(state.target)) state.target = null;
  if (!validCents(state.pay)) state.pay = 0;
  if (!Number.isFinite(state.percent) || state.percent < 0 || state.percent > 100) state.percent = 0;
  const names = new Set();
  state.members = asArray(state.members).filter(m => {
    if (!isRecord(m) || !hasText(m.name) || names.has(m.name.toLowerCase())) return false;
    names.add(m.name.toLowerCase());
    if (!validDay(m.anchor)) m.anchor = day;
    if (!["Weekly", "Daily", "Biweekly", "Monthly"].includes(m.cadence)) m.cadence = "Weekly";
    if (!validCents(m.contribution)) m.contribution = 0;
    return true;
  });
  if (!state.members.length) state.members.push({ name: "You", anchor: day, contribution: 0, cadence: "Weekly" });
  const owner = state.members[0].name;
  const activeNames = state.members.map(m => m.name);
  const archived = new Set(distinctNames(state.archived));
  const remember = (name) => { if (!activeNames.includes(name)) archived.add(name); };

  // IDs are numeric in event handlers. Resolve historical duplicates and collisions after imports.
  const ids = new Set();
  let nextId = Date.now();
  function repairId(row) {
    if (!validCents(row.id) || row.id === 0 || ids.has(row.id)) {
      while (ids.has(nextId)) nextId++;
      row.id = nextId++;
    }
    ids.add(row.id);
  }
  for (const key of ["items", "history"]) {
    const purchased = key === "history";
    state[key] = asArray(state[key]).filter(isRecord);
    for (const row of state[key]) {
      repairId(row);
      if (!knownStore(row.store)) row.store = knownStore(catalog[row.product]?.store) ? catalog[row.product].store : state.store;
      if (!["Shared", "Personal"].includes(row.scope)) row.scope = "Personal";
      const oldPeople = asArray(row.people);
      row.people = distinctNames(row.people);
      if (!row.people.length) row.people = [owner];
      if (row.weights && (!Array.isArray(row.weights) || oldPeople.length !== row.people.length ||
          row.weights.length !== row.people.length || !row.weights.every(w => Number.isSafeInteger(w) && w > 0))) delete row.weights;
      if (!Number.isSafeInteger(row.qty) || row.qty < 1) row.qty = 1;
      if (purchased) {
        if (!validCents(row.receiptId) || row.receiptId === 0) delete row.receiptId;
        if (row.photoKey && (typeof row.photoKey !== "string" || !/^[a-z0-9-]{36}$/i.test(row.photoKey))) delete row.photoKey;
        if (!validDay(row.date)) row.date = day;
        if (!hasText(row.payer)) row.payer = "Unknown payer";
        if (!validCents(row.total)) row.total = 0;
        [...row.people, row.payer].forEach(remember);
      }
      if (typeof row.product === "number") {
        const n = row.product;
        if (Number.isInteger(n) && n >= 0 && n < 21) {
          row.snapshot = oldSnapshot(n, row.store);
          row.product = "legacy-" + n;
        } else row.product = originalIds[n - 21] || "unavailable";
      }
      if (row.product === "sku-9e5205509768") row.product = "sku-d150f62635f3";
      if (!hasText(row.product) || Object.hasOwn(Object.prototype, row.product)) row.product = "unavailable";
      row.snapshot = (purchased && simpleSnapshot(row.snapshot)) || simpleSnapshot(catalog[row.product]) ||
        simpleSnapshot(row.snapshot) || { name: "Unavailable item", cat: "Unlisted", unit: "item", size: 1, price: purchased ? row.total : 0 };
    }
  }
  state.settlements = asArray(state.settlements).filter(s => isRecord(s) && hasText(s.from) &&
    hasText(s.to) && s.from !== s.to && validCents(s.amount) && s.amount > 0);
  for (const s of state.settlements) {
    repairId(s);
    if (!validDay(s.date)) s.date = day;
    if (typeof s.note !== "string") s.note = "";
    remember(s.from);
    remember(s.to);
  }
  state.archived = [...archived].filter(name => !activeNames.includes(name));
  state.pantry = asArray(state.pantry).filter(p => isRecord(p) && hasText(p.name));
  for (const p of state.pantry) {
    repairId(p);
    if (!hasText(p.owner)) p.owner = owner;
    if (!hasText(p.place)) p.place = "Pantry";
    if (!Number.isSafeInteger(p.qty) || p.qty < 1) p.qty = 1;
    if (!validDay(p.expires)) p.expires = "";
  }
  if (!activeNames.includes(state.shopper)) state.shopper = owner;
  state.version = 3;
  return state;
}

function loadHousehold(storage, fresh = defaultState, catalog = products, count = stores.length) {
  lastStored = null;
  writesBlocked = "";
  let raw;
  try {
    storage ??= localStorage;
    lastStored = storage.getItem(saveKey);
    raw = lastStored ?? storage.getItem("pantry-share-v2") ?? storage.getItem("pantry-share-v1");
    if (raw === null) return { state: restore(fresh(), catalog, count), recovery: "" };
    const repaired = restore(JSON.parse(raw), catalog, count);
    const serialized = JSON.stringify(repaired);
    if (serialized !== lastStored) {
      try {
        if (storage.getItem(saveKey) !== lastStored) throw new Error("Concurrent edit");
        storage.setItem(recoveryKey, raw);
        storage.setItem(saveKey, serialized);
        lastStored = serialized;
      } catch {
        writesBlocked = "The original save is protected. Free browser storage or reload before saving changes.";
      }
    }
    return { state: repaired, recovery: writesBlocked || (serialized !== raw ?
      "Saved data was updated. The original is available under backup downloads." : "") };
  } catch {
    try { if (typeof raw === "string") storage.setItem(recoveryKey, raw); } catch { /* Original is still in its source key. */ }
    writesBlocked = "The saved household could not be read. Its original is protected. This temporary view cannot overwrite it.";
    return { state: restore(fresh(), catalog, count), recovery: writesBlocked };
  }
}

// Called only after an explicit import or reset confirmation. Never overwrite an unreadable
// source until another browser-storage entry contains the exact original text.
function replaceProtectedHousehold(household, storage = localStorage) {
  if (!writesBlocked) return persistHousehold(household, storage);
  const current = storage.getItem(saveKey);
  if (current !== lastStored) throw new Error("Another tab changed the household. Reload before continuing.");
  const raw = current ?? storage.getItem("pantry-share-v2") ?? storage.getItem("pantry-share-v1");
  if (raw !== null) {
    storage.setItem(recoveryKey, raw);
    if (storage.getItem(recoveryKey) !== raw) throw new Error("Could not protect the original save.");
  }
  const serialized = JSON.stringify(household);
  storage.setItem(saveKey, serialized);
  writesBlocked = "";
  lastStored = serialized;
}

function persistHousehold(household, storage = localStorage) {
  if (writesBlocked) throw new Error(writesBlocked);
  try {
    if (storage.getItem(saveKey) !== lastStored) {
      throw new Error("Another tab changed this household. Reload to use the latest copy before saving.");
    }
    const serialized = JSON.stringify(household);
    storage.setItem(saveKey, serialized);
    lastStored = serialized;
  } catch (error) {
    if (error.message.startsWith("Another tab")) throw error;
    throw new Error("Changes are only in this tab. Browser storage is full or unavailable.");
  }
}
if (typeof module !== "undefined") module.exports = { restore, originalIds, loadHousehold, persistHousehold, saveKey, recoveryKey };
