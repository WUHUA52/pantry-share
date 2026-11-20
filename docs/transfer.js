// Shared snapshots are handoffs. Explicit field lists keep device-private data off the wire.
const transferType = "pantry-share-household";
function renamePerson(oldName, newName, household) {
  const replace = n => n === oldName ? newName : n;
  for (const m of household.members) m.name = replace(m.name);
  for (const row of [...household.items, ...household.history]) {
    row.people = row.people.map(replace);
    if (row.payer) row.payer = replace(row.payer);
  }
  for (const s of household.settlements || []) {
    s.from = replace(s.from);
    s.to = replace(s.to);
  }
  household.archived = (household.archived || []).map(replace);
  for (const p of household.pantry || []) p.owner = replace(p.owner);
  household.shopper = replace(household.shopper);
}
function publicLine(row, purchased) {
  const { id, product, store, qty, people, weights, snapshot } = row;
  const { name, cat, unit, size, price } = snapshot;
  const line = { id, product, store, qty: qty || 1, people: [...people], scope: "Shared", snapshot: { name, cat, unit, size, price } };
  if (weights) line.weights = [...weights];
  if (purchased) Object.assign(line, { total: row.total, date: row.date, payer: row.payer, receiptId: row.receiptId ?? row.id });
  return line;
}
function sharedSnapshot(household) {
  const sharedRows = household.history.filter(r => r.scope === "Shared");
  const groupIds = new Set(sharedRows.map(r => r.receiptId).filter(Number.isSafeInteger));
  const history = [];
  let nextId = 1;
  for (const row of sharedRows) {
    const copy = publicLine(row, true);
    // Old purchases have no group. Avoid merging a legacy ID with an explicit group.
    if (row.receiptId == null) {
      while (groupIds.has(nextId)) nextId++;
      copy.receiptId = nextId++;
    }
    history.push(copy);
  }
  return {
    type: transferType, version: 1, exportedAt: new Date().toISOString(),
    householdName: household.householdName, target: household.target,
    members: household.members.map(m => m.name), archived: [...(household.archived || [])],
    shopper: household.shopper,
    items: household.items.filter(r => r.scope === "Shared").map(r => publicLine(r, false)),
    history,
    settlements: (household.settlements || []).map(({ id, from, to, amount, date, note }) => ({ id, from, to, amount, date, note })),
    pantry: (household.pantry || []).filter(p => p.owner === "Household").map(
      ({ id, name, owner, qty, place, expires }) => ({ id, name, owner, qty, place, expires })
    ),
  };
}
function validateShared(file, storeCount) {
  const text = (v, max = 200) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  const list = a => Array.isArray(a) && a.length <= 100000;
  const day = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) && new Date(v).toISOString().startsWith(v);
  const cents = n => Number.isSafeInteger(n) && n >= 0;
  const positive = n => Number.isSafeInteger(n) && n > 0;
  const invalid = () => { throw new Error("This is not a valid Pantry Share household file. Your current household is unchanged."); };
  if (!file || file.type !== transferType || file.version !== 1 || !text(file.householdName) ||
      !(file.target === null || cents(file.target)) ||
      ![file.members, file.archived, file.items, file.history, file.settlements, file.pantry].every(list) ||
      !file.members.length) invalid();
  const names = [...file.members, ...file.archived];
  if (names.some(n => !text(n, 80) || ["you", "household"].includes(n.trim().toLowerCase())) ||
      new Set(names.map(n => n.trim().toLowerCase())).size !== names.length ||
      !file.members.includes(file.shopper)) invalid();
  const known = new Set(names);
  for (const [rows, bought] of [[file.items, false], [file.history, true]]) {
    if (new Set(rows.map(r => r?.id)).size !== rows.length) invalid();
    for (const r of rows) {
      const s = r?.snapshot;
      if (!r || !positive(r.id) || r.scope !== "Shared" || !text(r.product) ||
          !cents(r.store) || r.store >= storeCount || !positive(r.qty) ||
          !s || !text(s.name) || !text(s.cat) || !text(s.unit) ||
          !Number.isFinite(s.size) || s.size <= 0 || !cents(s.price) ||
          !list(r.people) || !r.people.length || new Set(r.people).size !== r.people.length ||
          !r.people.every(n => known.has(n)) ||
          (r.weights != null && (!Array.isArray(r.weights) || r.weights.length !== r.people.length ||
            !r.weights.every(w => positive(w) && w <= 1000))) ||
          (bought && (!day(r.date) || !cents(r.total) || !known.has(r.payer) || !positive(r.receiptId ?? r.id)))) invalid();
    }
  }
  if (file.settlements.some(s => !s || !positive(s.id) || !known.has(s.from) || !known.has(s.to) ||
      s.from === s.to || !positive(s.amount) || !day(s.date) || typeof s.note !== "string" || s.note.length > 1000)) invalid();
  if (file.pantry.some(p => !p || !positive(p.id) || p.owner !== "Household" || !text(p.name) || !text(p.place) ||
      !positive(p.qty) || !(p.expires === "" || day(p.expires)))) invalid();
  return file;
}
function importSharedSnapshot(current, file, self, catalog, storeCount, restoreFn = restore) {
  validateShared(file, storeCount);
  if (!file.members.includes(self)) throw new Error("Choose which roommate is using this device.");
  const result = structuredClone(current);
  // Device-private receipts, rows and settings follow the person using this device.
  const oldSelf = result.members[0].name;
  const privateMember = { ...result.members[0], name: self };
  result.items = result.items.filter(r => r.scope === "Personal");
  result.history = result.history.filter(r => r.scope === "Personal");
  result.pantry = (result.pantry || []).filter(p => p.owner !== "Household");
  renamePerson(oldSelf, self, result);
  result.members = [privateMember, ...file.members.filter(name => name !== self).map(name => {
    const prior = current.members.find((m, index) => index !== 0 && m.name === name);
    return prior ? { ...prior } : { name, anchor: new Date().toISOString().slice(0, 10), contribution: 0, cadence: "Weekly" };
  })];
  result.householdName = file.householdName;
  result.target = file.target;
  result.archived = [...file.archived];
  result.shopper = file.shopper;
  result.items.push(...file.items.map(r => publicLine(r, false)));
  // A private purchase and an imported shared purchase may have the same locally generated group ID.
  const taken = new Set(result.history.map(r => r.receiptId ?? r.id));
  const groupIds = new Map();
  let nextGroup = Date.now();
  const incoming = new Set(file.history.map(r => r.receiptId ?? r.id));
  for (const key of incoming) {
    let id = key;
    if (taken.has(id)) {
      while (taken.has(nextGroup) || incoming.has(nextGroup)) nextGroup++;
      id = nextGroup++;
    }
    groupIds.set(key, id);
    taken.add(id);
  }
  result.history.push(...file.history.map(r => ({ ...publicLine(r, true), receiptId: groupIds.get(r.receiptId ?? r.id) })));
  result.settlements = file.settlements.map(({ id, from, to, amount, date, note }) => ({ id, from, to, amount, date, note }));
  result.pantry.push(...file.pantry.map(({ id, name, owner, qty, place, expires }) => ({ id, name, owner, qty, place, expires })));
  return restoreFn(result, catalog, storeCount);
}
function downloadJson(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function exportSharedFile() {
  const own = state.members[0].name;
  dlg("Export shared household", `<p>Send the downloaded file to your roommates. It includes shared lists, purchases, paybacks and household pantry stock.</p>
<label>Your name in the household file<input name="self" required maxlength="40" value="${esc(own.toLowerCase() === "you" ? "" : own)}"></label>`,
    f => {
      const name = f.get("self").trim();
      if (!name || ["you","household"].includes(name.toLowerCase()) ||
          [...members().slice(1), ...state.archived].some(n => n.toLowerCase() === name.toLowerCase())) {
        return formError("Use a distinct name so roommates can recognize you.");
      }
      const copy = structuredClone(state);
      renamePerson(own, name, copy);
      try {
        const shared = validateShared(sharedSnapshot(copy), stores.length);
        downloadJson("pantry-share-household.json", JSON.stringify(shared, null, 2));
      } catch (err) { return formError(err.message); }
      renamePerson(own, name, state);
    }, "Download shared file");
}
async function readSharedFile(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = "";
  let incoming;
  try {
    if (file.size > 12 * 1024 * 1024) throw new Error("Choose a household file under 12 MB.");
    incoming = validateShared(JSON.parse(await file.text()), stores.length);
  } catch (err) {
    recovery = err instanceof SyntaxError ? "This file does not contain readable JSON." : err.message;
    render();
    return;
  }
  const oldItems = state.items.filter(r => r.scope === "Shared").length;
  const oldHistory = state.history.filter(r => r.scope === "Shared").length;
  const chooser = incoming.members.map((n,i) => `<option value="${i}">${esc(n)}</option>`).join("");
  dlg("Import shared household",
    `<p>Replace shared records on this device with the snapshot from <b>${esc(incoming.householdName)}</b>?
    It has ${incoming.items.length} list items and ${incoming.history.length} purchase lines. This device has ${oldItems} and ${oldHistory}.
    Your personal records and paycheck stay here. A private backup is saved before replacement.</p>
    <label>Which roommate are you?<select name="self" required><option value="">Choose your name</option>${chooser}</select></label>`,
    f => {
      try {
        const next = importSharedSnapshot(state, incoming, incoming.members[Number(f.get("self"))], products, stores.length);
        localStorage.setItem(importBackupKey, JSON.stringify(state));
        replaceProtectedHousehold(next);
        state = next;
        checked.clear();
        recovery = "Household imported. Export the next snapshot to pass your changes back.";
      } catch (err) { return formError("Import stopped. " + err.message); }
    }, "Replace shared records");
}
function sharingPanel() {
  let backup = "";
  try {
    if (localStorage.getItem(recoveryKey) !== null || writesBlocked) backup += '<button onclick="downloadLocalBackup(false)">Download original save</button>';
    if (localStorage.getItem(importBackupKey) !== null) backup += '<button onclick="downloadLocalBackup(true)">Download pre-import backup</button> <button onclick="undoHouseholdImport()">Restore pre-import backup</button>';
  } catch { /* Storage-disabled browsing still supports exporting in-memory data. */ }
  return `<section class="panel"><h2>Share your household</h2>
  <p>Pass a file between devices. Take turns making changes and send the newest copy to the next roommate. Each import replaces shared records.</p>
  <div class="stack"><button onclick="exportSharedFile()">Export shared file</button>
  <button onclick="document.getElementById('shared-file').click()">Import shared file</button>
  <input hidden id="shared-file" type="file" accept=".json,application/json" onchange="readSharedFile(this)"></div>
  ${backup ? '<details><summary>Private backup downloads</summary><p>These files include your personal data. Keep them on your own device.</p>'+backup+'</details>' : ""}</section>`;
}
function downloadLocalBackup(preImport) {
  try {
    const raw = preImport ? localStorage.getItem(importBackupKey) : (localStorage.getItem(recoveryKey) ??
      localStorage.getItem(saveKey) ?? localStorage.getItem("pantry-share-v2") ?? localStorage.getItem("pantry-share-v1"));
    if (raw !== null) downloadJson("pantry-share-private-backup.json", raw);
  } catch { recovery = "Browser storage could not be read."; render(); }
}
function undoHouseholdImport() {
  dlg("Restore your pre-import household?", "<p>This restores personal and shared records from immediately before your last import. Changes since that import will be replaced.</p>", () => {
    try {
      const next = restore(JSON.parse(localStorage.getItem(importBackupKey)), products, stores.length);
      localStorage.setItem(recoveryKey, JSON.stringify(state));
      replaceProtectedHousehold(next);
      state = next;
      checked.clear();
      recovery = "Your pre-import household is restored.";
    } catch (err) { return formError(err.message); }
  }, "Restore backup");
}
if (typeof module !== "undefined") module.exports = { renamePerson, sharedSnapshot, validateShared, importSharedSnapshot };
