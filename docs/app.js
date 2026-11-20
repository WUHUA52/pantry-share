const $ = (id) => document.getElementById(id),
  cash = (n) =>
    (n / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const products = Object.fromEntries(retailProducts.map((p) => [p.id, { ...p, ...productLabels[p.id] }]));
const listingKey = (p) => p.url.replace("://www.", "://");
const catalogProducts = [...new Map(Object.values(products).map((p) => [listingKey(p), p])).values()];
const selectedDiets = new Set();
let detailRow = null;
const icons = {
  Milk: "🥛",
  Eggs: "🥚",
  Bread: "🍞",
  Pasta: "🍝",
  Oats: "🥣",
  Cheese: "🧀",
  "Paper towels": "🧻",
  Rice: "🍚",
  Beans: "🫘",
  Fruit: "🍓",
  Yogurt: "🥣",
  Vegetables: "🥦",
};
function photo(p) {
  if (!p.image)
    return `<span class="photo-fallback">${icons[p.cat] || "🛒"}</span>`;
  return `<span class="product-frame"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden class="missing-photo">Photo unavailable</span></span>`;
}
function defaultState() {
  const names = ["You", "Sam", "Riley"];
  return {
    version: 3, householdName: "Maple House", archived: [], settlements: [], pantry: [], shopper: names[0],
    store: 0,
    location: "19107",
    target: null,
    members: names.map((name, i) => ({
      name,
      contribution: 0,
      anchor: today(),
      cadence: ["Biweekly", "Weekly", "Monthly"][i],
    })),
    pay: 0,
    percent: 0,
    items: ["Milk", "Eggs", "Bread", "Pasta"]
      .map((cat) => retailProducts.find((p) => p.store === 0 && p.cat === cat))
      .filter(Boolean)
      .map((p, i) => ({
        id: i + 1,
        product: p.id,
        snapshot: snapshot(p),
        people: [...names],
        scope: "Shared",
        store: 0,
      })),
    history: [],
  };
}
function snapshot(p) {
  return {
    name: p.name,
    cat: p.cat,
    price: p.price,
    size: p.size,
    unit: p.unit,
  };
}
function productFor(row) {
  return products[row.product] || row.snapshot;
}
let { state, recovery } = loadHousehold();
function members() {
  return state.members.map((m) => m.name);
}
function me() {
  return state.members[0].name;
}
let page = "Shopping list",
  scope = "Shared",
  filter = "",
  swap = null,
  checked = new Set(),
  saveHandler;
const amount = (p) => p.price;
const est = (i) => {
  const p = productFor(i),
    v = amount(p) * (i.qty || 1);
  return v + Math.round(v * taxRate(p));
};
const sum = (arr, fn) => arr.reduce((v, x) => v + fn(x), 0);
function spent(m, sharedOnly) {
  return sum(
    state.history.filter(
      (h) =>
        h.date >= periodStart(m.anchor, m.cadence) && h.date <= today() &&
        (!sharedOnly || h.scope === "Shared"),
    ),
    (h) => share(h.total, h.people, m.name, h.weights),
  );
}
const remaining = () =>
  Math.round((state.pay * state.percent) / 100) -
  spent(state.members[0], false);
function save() {
  try {
    persistHousehold(state);
  } catch (error) {
    recovery = error.message;
  }
  render();
}
function formError(message) {
  $("error").textContent = message;
  return false;
}
function dlg(title, html, fn, action = "Save") {
  formError("");
  $("title").textContent = title;
  $("fields").innerHTML = html;
  saveHandler = fn;
  $("form").querySelector(".primary").textContent = action;
  $("modal").showModal();
}
$("form").onsubmit = (e) => {
  e.preventDefault();
  if (saveHandler(new FormData(e.target)) === false) return;
  $("modal").close();
  save();
};
const dollars = (
  label,
  key,
  value,
) => `<label>${esc(label)}<input type="number" min="0" max="1000000" step=".01" name="${key}" value="${(value / 100).toFixed(2)}" required>
</label>`;
const cents = (f, k) => Math.round(Number(f.get(k)) * 100);
const options = (arr, current) =>
  arr
    .map(
      (v, i) =>
        `<option value="${i}" ${i === current ? "selected" : ""}>${esc(v)}</option>`,
    )
    .join("");
function stats() {
  const debts = netDebts(state.history, state.settlements);
  const out = sum(debts.filter(d=>d.from===me()),d=>d.amount);
  const incoming = sum(debts.filter(d=>d.to===me()),d=>d.amount);
  return [
    ["You owe", out, `${cash(incoming)} owed to you`],
    ["Shared spending", monthlySpending(), state.target === null ? "This calendar month" : `of ${cash(state.target)} this month`],
    ["Planned groceries", sum(state.items,est), "Household and personal lists"],
  ]
    .map(
      ([a, b, c]) =>
        `<div class="card"><div class="kicker">${a.toUpperCase()}</div><strong>${cash(b)}</strong><small>${c}</small></div>`,
    )
    .join("");
}
function navTo(p) {
  page = p;
  filter = "";
  swap = null;
  render();
}
function tab(s) {
  scope = s;
  checked.clear();
  render();
}
function render() {
  document.querySelectorAll("[data-household]").forEach(el => el.textContent = state.householdName);
  $("page-title").textContent =
    page === "Compare products" ? "Market shelves" : page;
  $("status").textContent = recovery;
  $("stats").innerHTML = stats();
  $("nav").innerHTML = [
    "Shopping list",
    "Compare products",
    "Pantry",
    "Receipts",
    "Budgets",
  ]
    .map(
      (v) =>
        `<button aria-current="${page === v ? "page" : "false"}" class="${page === v ? "on" : ""}" onclick="navTo('${v}')">${v === "Compare products" ? "Browse stores" : v}</button>`,
    )
    .join("");
  $("view").innerHTML =
    page === "Shopping list"
      ? list()
      : page === "Compare products"
        ? catalog()
        : page === "Budgets"
          ? budgets()
          : page === "Pantry" ? pantryPage() : receipts();
  if (page === "Compare products") refreshCount();
}
function list() {
  const items = state.items.filter((i) => i.scope === scope);
  const over = (state.pay * state.percent > 0 &&
    sum(state.items, i => share(est(i), i.people, me(), i.weights)) > remaining()) ||
    (state.target !== null && monthlySpending() + sum(state.items.filter(i=>i.scope==="Shared"),est) > state.target);
  return `<div class="bar"><div class="stack">${["Shared", "Personal"].map((s) => `<button class="${s === scope ? "primary" : ""}" onclick="tab('${s}')">${s}</button>`).join("")}</div>
<div class="stack"><button onclick="customForm()">Add custom item</button><button class="primary" onclick="navTo('Compare products')">Browse groceries</button></div>
</div>${over ? '<div class="notice">This list would put a budget over its limit. Select Compare on an item to see cheaper options.</div>' : ""}<section class="panel">
<div class="bar">
<h2>${scope === "Shared" ? "Household groceries" : "Your groceries"}</h2>
<span class="chip">${items.length} items</span>
</div>${
    items
      .map((i) => {
        const p = productFor(i);
        return `<div class="row"><input aria-label="Select ${esc(p.name)}" type="checkbox" ${checked.has(i.id) ? "checked" : ""} onchange="pick(${i.id},this.checked)">${products[i.product] ? `<button class="item-photo" aria-label="Compare ${esc(p.name)}" onclick="showProduct('${p.id}',${i.id})">${photo(p)}</button>` : photo(p)}<div class="detail">${products[i.product] ? `<button class="item-name" onclick="showProduct('${p.id}',${i.id})">${esc(p.name)}</button>` : `<b>${esc(p.name)}</b>`}<small>${stores[i.store]} · ${i.qty || 1} × ${p.size} ${esc(p.unit)} · ${i.people.map(esc).join(", ")}</small></div><b>${cash(est(i))}</b><button onclick="compare(${i.id})">Compare</button><button onclick="edit(${i.id})">Edit</button></div>`;
      })
      .join("") || "<p>Your list is empty. Add a grocery to start planning.</p>"
  }<div class="bar">
<small>Estimated total · ${inPhiladelphia(state.location) ? cash(sum(items, (i) => est(i) - productFor(i).price * (i.qty || 1))) + " estimated tax" : "tax unavailable for this location"}</small>
<b>${cash(sum(items, est))}</b>
</div>
<button class="primary" ${items.some((i) => checked.has(i.id)) ? "" : "disabled"} onclick="checkout()">Confirm selected purchases</button>
</section>`;
}
function pick(id, on) {
  on ? checked.add(id) : checked.delete(id);
  render();
}
function compare(id) {
  const current = state.items.find((i) => i.id === id);
  if (products[current.product]) return showProduct(current.product, id);
  swap = id;
  let i = state.items.find((i) => i.id === id);
  state.store = i.store;
  filter = productFor(i).cat;
  page = "Compare products";
  render();
}
function add(k, row = swap) {
  if (row !== null) {
    const i = state.items.find((i) => i.id === row);
    i.product = k;
    i.snapshot = snapshot(products[k]);
    i.store = products[k].store;
    navTo("Shopping list");
    save();
    return;
  }
  configure(
    {
      id: uniqueRowId(),
      scope,
      product: k,
      snapshot: snapshot(products[k]),
      people: scope === "Shared" ? members() : [me()],
      store: products[k].store,
    },
    true,
  );
}
function edit(id) {
  configure(
    state.items.find((i) => i.id === id),
    false,
  );
}
function qtyField(value) {
  return `<label>Quantity<input name="qty" type="number" min="1" max="999" required value="${value || 1}"></label>`;
}
function customForm({name="", scope:target=scope, onAdd}={}) {
  const id = uniqueRowId();
  configure({id, product:"custom-"+id, snapshot:{name,cat:"Unlisted",price:0,size:1,unit:"package"},
    qty:1, scope:target,store:state.store,people:target==="Shared" ? members() : [me()]}, true, onAdd);
}
function configure(i, fresh, onAdd) {
  const custom = i.product.startsWith("custom-"), p = productFor(i);
  const kinds = ["Unlisted","Food staple","Taxable supplies","Toilet paper"];
  dlg(custom ? (fresh ? "Add custom item" : "Edit custom item") : p.name,
    (custom ? `<label>Item name<input name="item" required maxlength="100" value="${esc(p.name)}"></label>` +
      dollars("Estimated price per package","price",p.price) +
      `<label>Type<select name="cat">${options(kinds,kinds.indexOf(p.cat))}</select></label><label>Store<select name="store">${options(stores,i.store)}</select></label>` : "") +
    qtyField(i.qty) + `<label>List<select name="scope" onchange="document.getElementById('split').hidden=this.value==='Personal'">${["Shared","Personal"].map(s=>`<option ${i.scope===s?"selected":""}>${s}</option>`).join("")}</select></label>
    <fieldset id="split" ${i.scope==="Personal"?"hidden":""}><legend>Split between roommates</legend><small>Use 1 for an equal share, 2 for a double share or 0 to leave someone out.</small>
    ${members().map((n,k)=>`<label>${esc(n)}<input name="part-${k}" type="number" min="0" max="1000" step="1" required value="${i.people.includes(n) ? i.weights?.[i.people.indexOf(n)] || 1 : 0}"></label>`).join("")}</fieldset>
    ${fresh ? "" : `<button type="button" onclick="removeItem(${i.id})">Remove item</button>`}`, f=>{
      const s = f.get("scope");
      const weights = members().map((_,k)=>s==="Personal" ? Number(!k) : Number(f.get("part-"+k)));
      const people = members().filter((_,k)=>weights[k]>0);
      if (!people.length) return formError("Give at least one roommate a share.");
      if (custom) {
        const name = f.get("item").trim();
        if (!name) return formError("Enter an item name.");
        i.snapshot = {...p,name,price:cents(f,"price"),cat:kinds[Number(f.get("cat"))]};
        i.store = Number(f.get("store"));
      }
      Object.assign(i,{qty:Number(f.get("qty")),scope:s,people,weights:weights.filter(w=>w>0)});
      if (fresh) state.items.push(i);
      if (onAdd) onAdd();
      scope=s;
      navTo("Shopping list");
    },fresh?"Add grocery":"Save changes");
}
function removeItem(id) {
  state.items = state.items.filter((i) => i.id !== id);
  checked.delete(id);
  $("modal").close();
  save();
}
render();
let renderedDay = today();
setInterval(() => {
  const day = today();
  if (
    day !== renderedDay &&
    !$("modal").open && !$("product-dialog").open &&
    !["INPUT", "SELECT"].includes(document.activeElement?.tagName)
  ) {
    renderedDay = day;
    render();
  }
}, 60000);
