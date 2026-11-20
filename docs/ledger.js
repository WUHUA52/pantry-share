// Random, numeric IDs survive export and are safe in the existing row controls.
function uniqueRowId() {
  const used = new Set([...state.items, ...state.history, ...(state.settlements || []),
    ...(state.pantry || [])].flatMap((r) => [r.id, r.receiptId]));
  let id;
  do {
    const words = crypto.getRandomValues(new Uint32Array(2));
    id = words[0] * 65536 + (words[1] & 65535);
  } while (!id || used.has(id));
  return id;
}

function paidByField(names, payer) {
  return `<label>Paid by<select name="payer" required>${options(names, names.indexOf(payer))}</select></label>`;
}

function purchaseDateField(date) {
  return `<label>Date<input type="date" name="date" required max="${today()}" value="${esc(date)}"></label>`;
}

function checkout() {
  const items = state.items.filter((item) => checked.has(item.id) && item.scope === scope);
  if (!items.length) return;
  const payers = scope === "Personal" ? [me()] : members();
  const estimates = items.map(est);
  const estimatedTotal = estimates.reduce((a, n) => a + n, 0);
  dlg("Confirm receipt",
    `<label>Enter costs by<select name="costMethod" onchange="switchCheckoutMethod(this.value)">
    <option value="total">One receipt total</option><option value="lines">Individual item totals</option></select></label>
    <fieldset id="checkout-total"><legend>Receipt total</legend>` + dollars("Receipt total including tax", "total", estimatedTotal) +
    `<small>Enter the amount for these ${items.length} selected items. Each gets a share proportional to its estimated cost. If all estimates are zero, the total is divided equally.</small></fieldset>
    <fieldset id="checkout-lines" hidden disabled><legend>Final amounts including tax</legend>
    ${items.map((r, i) => dollars(productFor(r).name + " × " + (r.qty || 1), "line-" + r.id, estimates[i])).join("")}</fieldset>
    <details><summary>Selected items</summary><ul>${items.map((r, i) =>
      `<li>${esc(productFor(r).name)} × ${r.qty || 1} · ${cash(estimates[i])}</li>`).join("")}</ul></details>` +
    paidByField(payers, me()) + purchaseDateField(today()),
    (f) => {
      const payer = payers[Number(f.get("payer"))];
      const lineMode = f.get("costMethod") === "lines";
      const total = cents(f, "total");
      if (!payer || (!lineMode && (!Number.isSafeInteger(total) || total < 0))) {
        return formError("Enter a valid receipt total and payer.");
      }
      const amounts = lineMode ? items.map((r) => cents(f, "line-" + r.id)) : allocateCents(total, estimates);
      if (amounts.some((amount) => !Number.isSafeInteger(amount) || amount < 0)) {
        return formError("Enter a valid total for each selected item.");
      }
      const receiptId = uniqueRowId();
      items.forEach((item, i) => {
        state.history.push({ ...item, receiptId, total: amounts[i], payer, date: f.get("date") });
      });
      const purchased = new Set(items.map((item) => item.id));
      state.items = state.items.filter((item) => !purchased.has(item.id));
      checked.clear();
      page = "Receipts";
    }, "Confirm purchase");
}

function switchCheckoutMethod(method) {
  for (const field of ["total", "lines"]) {
    const group = $("checkout-" + field);
    group.hidden = field !== method;
    group.disabled = field !== method;
  }
}

function balancesCard() {
  const owed = netDebts(state.history, state.settlements);
  return `<section class="panel"><h2>Balances</h2>${owed.map((debt, index) =>
    `<div class="row debt-row"><div class="detail">${esc(debt.from)} owes ${esc(debt.to)} <b>${cash(debt.amount)}</b></div>
    <button onclick="repaymentForm(${index})">Record repayment</button></div>`).join("") ||
    "<p>Everyone is even.</p>"}</section>`;
}

function repaymentForm(index) {
  const debt = netDebts(state.history, state.settlements)[index];
  if (!debt) return;
  dlg("Record repayment",
    `<p>${esc(debt.from)} paid ${esc(debt.to)}. Outstanding balance: <b>${cash(debt.amount)}</b>.</p>` +
    dollars("Amount paid", "amount", debt.amount) + purchaseDateField(today()) +
    '<label>Note (optional)<input name="note" maxlength="120" placeholder="Venmo, cash, etc."></label>',
    (f) => {
      const amount = cents(f, "amount");
      const balance = netDebts(state.history, state.settlements).find((d) => d.from === debt.from && d.to === debt.to);
      if (!amount || amount < 0 || !balance || amount > balance.amount) {
        return formError("Enter a positive amount up to the outstanding balance.");
      }
      (state.settlements ||= []).push({
        id: uniqueRowId(), from: debt.from, to: debt.to, amount,
        date: f.get("date"), note: f.get("note").trim(),
      });
    }, "Save repayment");
}

function removeRepayment(id) {
  const payment = state.settlements.find((s) => s.id === id);
  if (!payment) return;
  dlg("Delete repayment?",
    `<p>Remove the ${cash(payment.amount)} payment from ${esc(payment.from)} to ${esc(payment.to)} and recalculate their balance?</p>`,
    () => { state.settlements = state.settlements.filter((s) => s.id !== id); }, "Delete repayment");
}

// Legacy rows each have their own receipt. Negative keys keep their IDs
// separate from a modern receipt with the same numeric ID after importing.
function receiptKey(row) {
  return Number.isSafeInteger(row.receiptId) && row.receiptId > 0 ? row.receiptId : -row.id;
}

function receiptGroups(history) {
  const groups = new Map();
  for (const row of history) {
    const key = receiptKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].reverse();
}

function receiptLines(receiptId) {
  return state.history.filter((r) => receiptKey(r) === receiptId);
}

function editReceipt(receiptId) {
  const rows = receiptLines(receiptId);
  if (!rows.length) return;
  const payers = [...new Set([...members(), ...rows.map((r) => r.payer)])];
  const currentTotal = sum(rows, (r) => r.total);
  const first = rows[0], samePayer = rows.every((r) => r.payer === first.payer);
  const sameDate = rows.every((r) => r.date === first.date);
  const payerInput = samePayer ? paidByField(payers, first.payer) :
    `<label>Paid by<select name="payer"><option value="">Keep each item's payer</option>${options(payers, -1)}</select></label>`;
  const dateInput = sameDate ? purchaseDateField(first.date) :
    `<label>Change date for all items (optional)<input type="date" max="${today()}" name="date"></label>`;
  dlg("Edit receipt", dollars("Receipt total including tax", "total", currentTotal) +
    payerInput + dateInput + (rows.length > 1 ? "<small>A new total is divided in proportion to the current item amounts.</small>" : ""),
    (f) => {
      const total = cents(f, "total");
      if (!Number.isSafeInteger(total) || total < 0) return formError("Enter a valid total.");
      const amounts = allocateCents(total, rows.map((r) => r.total));
      rows.forEach((r, i) => {
        r.total = amounts[i];
        if (f.get("payer") !== "") r.payer = payers[Number(f.get("payer"))];
        if (f.get("date")) r.date = f.get("date");
      });
    }, "Save receipt");
}

function editReceiptItem(id) {
  const row = state.history.find((h) => h.id === id);
  if (!row) return;
  const names = row.scope === "Personal" ? row.people : [...new Set([...members(), ...row.people])];
  const payers = [...new Set([...members(), row.payer])];
  const inputs = names.map((name, i) => {
    const pos = row.people.indexOf(name);
    const weight = pos < 0 ? 0 : row.weights?.[pos] || 1;
    return `<label>${esc(name)}<input type="number" name="parts-${i}" min="0" max="1000" step="1" required value="${weight}"></label>`;
  }).join("");
  dlg("Edit receipt item",
    `<p>${esc(productFor(row).name)}</p>` + dollars("Final item total including tax", "total", row.total) +
    `<label>Quantity<input name="qty" type="number" min="1" max="999" step="1" required value="${row.qty || 1}"></label>` +
    paidByField(payers, row.payer) + purchaseDateField(row.date) +
    (row.scope === "Shared" ? `<fieldset><legend>Share parts</legend><small>Use 0 to exclude a person, 1 for a regular share, or 2 for a double share.</small>${inputs}</fieldset>` : ""),
    (f) => {
      const total = cents(f, "total");
      const qty = Number(f.get("qty"));
      if (!Number.isSafeInteger(total) || total < 0 || !Number.isInteger(qty) || qty < 1 || qty > 999) {
        return formError("Enter a valid line total and quantity.");
      }
      if (row.scope === "Shared") {
        const parts = names.map((_, i) => Number(f.get("parts-" + i)));
        if (!parts.some(Boolean) || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 1000)) {
          return formError("Give at least one roommate a share.");
        }
        row.people = names.filter((_, i) => parts[i] > 0);
        row.weights = parts.filter((n) => n > 0);
      }
      Object.assign(row, { total, qty, date: f.get("date"), payer: payers[Number(f.get("payer"))] });
    }, "Save item");
}

function deleteReceipt(receiptId, itemId = null) {
  const rows = receiptLines(receiptId).filter((r) => itemId === null || r.id === itemId);
  if (!rows.length) return;
  const label = itemId === null ? "receipt" : "item";
  dlg(`Delete ${label}?`, `<p>Remove ${cash(sum(rows, (r) => r.total))} from purchase history? Spending and balances will be recalculated. Recorded repayments stay in the ledger.</p>`,
    () => {
      state.history = state.history.filter((r) => !rows.includes(r));
      for (const key of new Set(rows.map((r) => r.photoKey).filter(validPhotoKey))) {
        if (!state.history.some((r) => r.photoKey === key)) receiptPhotoStore("delete", key).catch(() => {});
      }
    }, `Delete ${label}`);
}

function rebuyItem(id) {
  const row = state.history.find((r) => r.id === id);
  if (!row) return;
  let people = row.people.filter((name) => members().includes(name));
  let weights = people.map((name) => row.weights?.[row.people.indexOf(name)] || 1);
  if (!people.length || row.scope === "Personal") {
    people = [me()];
    weights = [1];
  }
  state.items.push({
    id: uniqueRowId(), product: row.product, snapshot: { ...row.snapshot },
    scope: row.scope, store: row.store, qty: row.qty || 1, people, weights,
  });
  scope = row.scope;
  navTo("Shopping list");
  save();
}

function purchaseCard(rows) {
  const receiptId = receiptKey(rows[0]);
  const payers = [...new Set(rows.map((r) => r.payer))].join(", ");
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  const range = dates.length === 1 ? dates[0] : dates[0] + " to " + dates.at(-1);
  const storeNames = [...new Set(rows.map((r) => stores[r.store] || "Custom items"))].join(", ");
  const entries = rows.map((r) => {
    const p = productFor(r);
    const parts = itemPortions(r.total, r.people, r.weights);
    const split = r.people.map((name, i) => `${esc(name)} ${cash(parts[i])}`).join(" · ");
    return `<div class="row">${photo(p)}<div class="detail"><b>${esc(p.name)} × ${r.qty || 1}</b>
    <small>${esc(r.scope)} · Paid by ${esc(r.payer)} · ${esc(r.date)}</small><small>${split}</small>
    <div class="stack"><button onclick="rebuyItem(${r.id})">Buy again</button><button onclick="editReceiptItem(${r.id})">Edit item</button>
    ${rows.length > 1 ? `<button onclick="deleteReceipt(${receiptId},${r.id})">Delete item</button>` : ""}</div></div><b>${cash(r.total)}</b></div>`;
  }).join("");
  return `<article class="panel receipt-entry"><div class="bar"><h3>${esc(storeNames)}</h3><strong>${cash(sum(rows, (r) => r.total))}</strong></div>
  <small>${esc(range)} · Paid by ${esc(payers)}</small>${entries}
  <div class="stack"><button onclick="editReceipt(${receiptId})">Edit receipt</button>
  <button onclick="receiptPhotoForm(${receiptId})">${rows.some((r) => validPhotoKey(r.photoKey)) ? "View receipt photo" : "Attach receipt photo"}</button>
  <button onclick="deleteReceipt(${receiptId})">Delete receipt</button></div></article>`;
}

function receipts() {
  const purchases = receiptGroups(state.history).map(purchaseCard).join("");
  const payments = [...(state.settlements || [])].reverse().map((s) =>
    `<div class="row"><div class="detail"><b>${esc(s.from)} paid ${esc(s.to)} ${cash(s.amount)}</b>
    <small>${esc(s.date)}${s.note ? " · " + esc(s.note) : ""}</small></div>
    <button onclick="removeRepayment(${s.id})">Delete repayment</button></div>`).join("");
  return `${balancesCard()}${payments ? `<section class="panel"><h2>Repayments</h2>${payments}</section>` : ""}
  <section class="panel"><h2>Confirmed purchases</h2>${purchases || "<p>Confirm groceries from your list to start a receipt.</p>"}</section>`;
}

const validPhotoKey = (value) => typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function receiptPhotoStore(action, key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pantry-share-receipt-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("photos", action === "get" ? "readonly" : "readwrite");
      const photos = tx.objectStore("photos");
      const operation = action === "put" ? photos.put(value, key)
        : action === "get" ? photos.get(key) : action === "clear" ? photos.clear() : photos.delete(key);
      tx.oncomplete = () => { db.close(); resolve(operation.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}

function clearReceiptPhotos() {
  return receiptPhotoStore("clear").catch(() => {});
}

async function receiptPhotoForm(receiptId) {
  const rows = receiptLines(receiptId);
  if (!rows.length) return;
  const key = rows.find((r) => validPhotoKey(r.photoKey))?.photoKey;
  dlg("Receipt photo", `<p>Photos stay in this browser and are excluded from household exports.</p>
    <p role="status" id="photo-status"></p>
    <img id="receipt-image" alt="Photograph of this grocery receipt" hidden style="max-width:100%;max-height:50vh;object-fit:contain">
    <label>${key ? "Replace photo" : "Choose photo"}<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label>
    <small>JPEG, PNG or WebP, up to 10 MB.</small>
    ${key ? `<button type="button" onclick="removeReceiptPhoto(${receiptId})">Remove photo</button>` : ""}`,
    (f) => {
      const file = f.get("image");
      if (!file?.size) return true;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 ** 2) {
        return formError("Choose a JPEG, PNG or WebP image up to 10 MB.");
      }
      saveReceiptPhoto(rows, file, $("receipt-image"));
      return false;
    }, "Done");
  const image = $("receipt-image");
  if (key) {
    try {
      const blob = await receiptPhotoStore("get", key);
      if (!image.isConnected || !$("modal").open) return;
      if (!(blob instanceof Blob) || blob.type !== "image/jpeg") {
        $("photo-status").textContent = "This photo is unavailable on this device.";
        return;
      }
      const url = URL.createObjectURL(blob);
      image.src = url;
      image.hidden = false;
      $("modal").addEventListener("close", () => URL.revokeObjectURL(url), { once: true });
    } catch {
      if (image.isConnected) $("photo-status").textContent = "This browser could not load the photo.";
    }
  }
}

async function saveReceiptPhoto(rows, file, image) {
  const submit = $("form").querySelector(".primary");
  submit.disabled = true;
  const busy = () => image.isConnected && $("modal").open && rows.every((r) => state.history.includes(r));
  const close = () => { submit.disabled = false; };
  $("modal").addEventListener("close", close, { once: true });
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
    if (!blob) throw Error("Unable to encode image");
    if (!busy()) return;
    const key = crypto.randomUUID();
    await receiptPhotoStore("put", key, blob);
    if (!busy()) {
      await receiptPhotoStore("delete", key);
      return;
    }
    const oldKeys = rows.map((r) => r.photoKey).filter(validPhotoKey);
    for (const row of rows) row.photoKey = key;
    $("modal").close();
    save();
    for (const old of new Set(oldKeys)) {
      if (!state.history.some((r) => r.photoKey === old)) await receiptPhotoStore("delete", old);
    }
  } catch {
    if (busy()) formError("The photo could not be saved on this device. Try a smaller image.");
  } finally {
    bitmap?.close();
    if (image.isConnected) submit.disabled = false;
  }
}

function removeReceiptPhoto(receiptId) {
  const rows = receiptLines(receiptId);
  $("modal").close();
  dlg("Remove receipt photo?", "<p>This removes the photo from this device. The receipt stays in your ledger.</p>",
    () => {
      const keys = rows.map((r) => r.photoKey).filter(validPhotoKey);
      for (const row of rows) delete row.photoKey;
      for (const key of new Set(keys)) {
        if (!state.history.some((r) => r.photoKey === key)) receiptPhotoStore("delete", key).catch(() => {});
      }
    }, "Remove photo");
}

if (typeof module !== "undefined") module.exports = { receiptGroups, receiptKey, validPhotoKey };
