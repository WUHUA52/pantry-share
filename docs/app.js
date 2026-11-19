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
const stores = [
  "GIANT",
  "Target",
  "Walmart",
  "Wegmans",
  "ALDI",
  "Kroger",
  "Food Lion",
  "Stop & Shop",
  "MARTIN'S",
  "ACME Markets",
];
const products = Object.fromEntries(retailProducts.map((p) => [p.id, p]));
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
    version: 2,
    store: 0,
    location: "19107",
    target: 15000,
    members: names.map((name, i) => ({
      name,
      contribution: 5000,
      anchor: today(),
      cadence: ["Biweekly", "Weekly", "Monthly"][i],
    })),
    pay: 80000,
    percent: 12,
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
let state,
  recovery = "";
try {
  const raw =
    localStorage.getItem("pantry-share-v2") ??
    localStorage.getItem("pantry-share-v1");
  state = raw ? restore(JSON.parse(raw), products) : defaultState();
  if (raw) localStorage.setItem("pantry-share-v2", JSON.stringify(state));
} catch {
  state = defaultState();
  recovery = "The saved demo could not be loaded. Showing a fresh household.";
}
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
const taxRate = (p) =>
  p.cat === "Paper towels" && /\b19107\b/.test(state.location.trim())
    ? 0.08
    : 0;
const est = (i) => {
  const p = productFor(i),
    v = amount(p, i.store);
  return v + Math.round(v * taxRate(p));
};
const sum = (arr, fn) => arr.reduce((v, x) => v + fn(x), 0);
function spent(m, sharedOnly) {
  return sum(
    state.history.filter(
      (h) =>
        h.date >= periodStart(m.anchor, m.cadence) &&
        (!sharedOnly || h.scope === "Shared"),
    ),
    (h) => share(h.total, h.people, m.name),
  );
}
const available = () =>
  sum(state.members, (m) => m.contribution - spent(m, true));
const remaining = () =>
  Math.round((state.pay * state.percent) / 100) -
  spent(state.members[0], false);
function save() {
  try {
    localStorage.setItem("pantry-share-v2", JSON.stringify(state));
  } catch {
    recovery =
      "Browser storage is unavailable. Changes last only for this visit.";
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
  return [
    [
      `Household funds available`,
      available(),
      `of ${cash(sum(state.members, (m) => m.contribution))} in payday contributions`,
    ],
    ["Your budget left", remaining(), "This pay period"],
    ["Planned groceries", sum(state.items, est), "Shared + your personal list"],
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
  $("page-title").textContent =
    page === "Compare products" ? "Market shelves" : page;
  $("status").textContent = recovery;
  $("stats").innerHTML = stats();
  $("nav").innerHTML = [
    "Shopping list",
    "Compare products",
    "Budgets",
    "Receipts",
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
          : receipts();
}
function list() {
  const items = state.items.filter((i) => i.scope === scope);
  const over =
    sum(state.items, (i) => share(est(i), i.people, me())) > remaining() ||
    sum(
      state.items.filter((i) => i.scope === "Shared"),
      est,
    ) >
      Math.min(
        available(),
        state.target - sum(state.members, (m) => spent(m, true)),
      );
  return `<div class="bar"><div class="stack">${["Shared", "Personal"].map((s) => `<button class="${s === scope ? "primary" : ""}" onclick="tab('${s}')">${s}</button>`).join("")}</div>
<button class="primary" onclick="navTo('Compare products')">+ Add groceries</button>
</div>${over ? '<div class="notice">This list would put a budget over its limit. Select Compare on an item to see cheaper options.</div>' : ""}<section class="panel">
<div class="bar">
<h2>${scope === "Shared" ? "Household groceries" : "Your groceries"}</h2>
<span class="chip">${items.length} items</span>
</div>${
    items
      .map((i) => {
        const p = productFor(i);
        return `<div class="row"><input aria-label="Select ${esc(p.name)}" type="checkbox" ${checked.has(i.id) ? "checked" : ""} onchange="pick(${i.id},this.checked)">${photo(p)}<div class="detail"><b>${esc(p.name)}</b><small>${stores[i.store]} · ${p.size} ${esc(p.unit)} · ${i.people.map(esc).join(", ")}</small></div><b>${cash(est(i))}</b><button onclick="compare(${i.id})">Compare</button><button onclick="edit(${i.id})">Edit</button></div>`;
      })
      .join("") || "<p>Your list is empty. Add a grocery to start planning.</p>"
  }<div class="bar">
<small>Estimated total · ${/\b19107\b/.test(state.location) ? cash(sum(items, (i) => est(i) - productFor(i).price)) + " estimated tax" : "tax unavailable for this location"}</small>
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
  swap = id;
  let i = state.items.find((i) => i.id === id);
  state.store = i.store;
  filter = productFor(i).cat;
  page = "Compare products";
  render();
}
function catalog() {
  return `<section class="panel">
<div class="bar">
<h2>${swap ? "Compare alternatives" : esc(stores[state.store])}</h2>
<button onclick="locationForm()">${esc(state.location)} · Change location</button>
</div>
<div class="shop-tools"><label>Supermarket<select aria-label="Supermarket" onchange="state.store=+this.value;save()">${options(stores, state.store)}</select></label>
<label>Find an item<input id="query" aria-label="Search groceries" placeholder="Search groceries" value="${esc(filter)}" oninput="filter=this.value;document.getElementById('cards').innerHTML=cards()"></label>
</div>
<p>
<small>${retailProducts.filter((p) => p.store === state.store).length} demo products · Lowest unit price first · Estimated prices.</small>
</p>
<div id="cards" class="catalog">${cards()}</div>
</section>`;
}
function cards() {
  return (
    retailProducts
      .map((p) => ({ p, k: p.id }))
      .filter(
        ({ p }) =>
          p.store === state.store &&
          (p.name + " " + p.cat).toLowerCase().includes(filter.toLowerCase()),
      )
      .sort((a, b) => a.p.price / a.p.size - b.p.price / b.p.size)
      .map(
        ({
          p,
          k,
        }) => `<article>${photo(p)}<div class="aisle">${esc(p.cat)}</div><b>${esc(p.name)}</b>
<p>${p.size} ${esc(p.unit)} · ${cash(amount(p, state.store) / p.size)}/${esc(p.unit)}</p>
<strong>${cash(amount(p, state.store))}</strong>
<br>
<button onclick="add('${k}')">${swap ? "Use this option" : "Add to list"}</button> <a rel="noreferrer" target="_blank" href="${esc(p.url)}">View product</a>
</article>`,
      )
      .join("") ||
    "<p>No matching items in this store’s demo selection.</p><button onclick=\"navTo('Compare products')\">Show all products</button>"
  );
}
function locationForm() {
  dlg(
    "Shopping location",
    `<label>ZIP or address<input required maxlength="100" name="loc" value="${esc(state.location)}">
</label>
<small>19107 has a Philadelphia tax example. Elsewhere, tax is excluded until you confirm the receipt. Store availability is simulated.</small>`,
    (f) => {
      state.location = f.get("loc").trim() || "19107";
    },
  );
}
function add(k) {
  if (swap) {
    const i = state.items.find((i) => i.id === swap);
    i.product = k;
    i.snapshot = snapshot(products[k]);
    i.store = state.store;
    navTo("Shopping list");
    save();
    return;
  }
  configure(
    {
      id: Date.now(),
      scope,
      product: k,
      snapshot: snapshot(products[k]),
      people: scope === "Shared" ? members() : [me()],
      store: state.store,
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
function configure(i, fresh) {
  dlg(
    productFor(i).name,
    `<label>List<select name="scope" onchange="document.getElementById('split').hidden=this.value==='Personal'">${["Shared", "Personal"].map((s) => `<option ${i.scope === s ? "selected" : ""}>${s}</option>`)}</select>
</label>
<fieldset id="split" ${i.scope === "Personal" ? "hidden" : ""}>
<legend>Split equally between</legend>${members()
      .map(
        (n) =>
          `<label><input type="checkbox" name="person" value="${esc(n)}" ${i.people.includes(n) ? "checked" : ""}> ${esc(n)}</label>`,
      )
      .join(
        "",
      )}</fieldset>${fresh ? "" : `<button type="button" onclick="removeItem(${i.id})">Remove item</button>`}`,
    (f) => {
      const s = f.get("scope"),
        people = s === "Personal" ? [me()] : f.getAll("person");
      if (!people.length) {
        formError("Choose at least one roommate.");
        return false;
      }
      Object.assign(i, { scope: s, people });
      if (fresh) state.items.push(i);
      scope = s;
      navTo("Shopping list");
    },
    fresh ? "Add grocery" : "Save changes",
  );
}
function removeItem(id) {
  state.items = state.items.filter((i) => i.id !== id);
  checked.delete(id);
  $("modal").close();
  save();
}
function checkout() {
  const items = state.items.filter(
    (i) => checked.has(i.id) && i.scope === scope,
  );
  dlg(
    "Confirm receipt",
    `<p>Enter the final cost for each item, including its tax.</p>${items.map((i) => dollars(productFor(i).name, i.id, est(i))).join("")}<label>Paid by<select name="payer">${options(scope === "Personal" ? [me()] : members(), 0)}</select>
</label>`,
    (f) => {
      for (const i of items)
        state.history.push({
          ...i,
          total: cents(f, i.id),
          payer: members()[+f.get("payer")],
          date: today(),
        });
      state.items = state.items.filter((i) => !items.includes(i));
      checked.clear();
      page = "Receipts";
    },
    "Confirm purchase",
  );
}
function budgets() {
  return `<section class="panel">
<div class="bar">
<h2>Household budget</h2>
<button onclick="targetForm()">Edit group target</button>
</div>
<p>Group spending target <b>${cash(state.target)}</b>
</p>
<p>Confirmed shared spending in active pay periods <b>${cash(sum(state.members, (m) => spent(m, true)))}</b>
</p>${state.members.map((m, k) => `<div class="row"><div class="detail"><b>${esc(m.name)}</b><small>${m.cadence} · Period started ${periodStart(m.anchor, m.cadence)}</small></div><b>${cash(m.contribution - spent(m, true))} left</b><button onclick="memberForm(${k})">Edit roommate</button></div>`).join("")}</section>
<section class="panel">
<div class="bar">
<h2>Your personal budget</h2>
<button onclick="privateForm()">Edit budget</button>
</div>
<p>${state.percent}% of ${cash(state.pay)} per paycheck. Personal groceries and your share of shared items both count.</p>
<b>${cash(spent(state.members[0], false))} spent · ${cash(remaining())} left</b>
</section>
<div class="stack">
<button onclick="memberForm(-1)">Add roommate</button>
<button onclick="resetDemo()">Reset demo data</button>
</div>`;
}
function targetForm() {
  dlg(
    "Household target",
    dollars("Shared spending limit", "target", state.target),
    (f) => (state.target = cents(f, "target")),
  );
}
function resetDemo() {
  dlg(
    "Reset demo data?",
    "<p>This clears lists, receipts, and budget settings in this browser.</p>",
    () => {
      state = defaultState();
      checked.clear();
      filter = "";
      scope = "Shared";
      swap = null;
      recovery = "";
      localStorage.removeItem("pantry-share-v1");
    },
    "Reset demo data",
  );
}
function balancesCard() {
  const owed = netDebts(state.history);
  return `<section class="panel"><h2>Balances</h2>${owed.map((d) => `<p>${esc(d.from)} owes ${esc(d.to)} <b>${cash(d.amount)}</b></p>`).join("") || "<p>Everyone is even.</p>"}</section>`;
}
function memberForm(k) {
  const adding = k < 0,
    m = state.members[k] || {
      name: "",
      anchor: today(),
      contribution: 0,
      cadence: "Weekly",
    };
  dlg(
    adding ? "Add roommate" : "Edit roommate",
    `<label>Name<input name="name" required maxlength="40" value="${esc(m.name)}"></label>` +
      dollars("Amount each payday", "amount", m.contribution) +
      `<label>Pay schedule<select name="freq">${["Daily", "Weekly", "Biweekly", "Monthly"].map((x) => `<option ${m.cadence === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Reference payday<input required type="date" name="day" value="${m.anchor}"></label>${k > 0 ? `<button type="button" onclick="removeMember(${k})">Remove roommate</button>` : ""}`,
    (f) => {
      const name = f.get("name").trim();
      if (
        !name ||
        state.members.some(
          (other) =>
            other !== m && other.name.toLowerCase() === name.toLowerCase(),
        ) ||
        state.history.some(
          (h) => [...h.people, h.payer].includes(name) && name !== m.name,
        )
      )
        return formError("Choose a unique name for this roommate.");
      if (!adding)
        for (const row of [...state.items, ...state.history]) {
          row.people = row.people.map((n) => (n === m.name ? name : n));
          if (row.payer === m.name) row.payer = name;
        }
      Object.assign(m, {
        name,
        contribution: cents(f, "amount"),
        cadence: f.get("freq"),
        anchor: f.get("day"),
      });
      if (adding) state.members.push(m);
    },
  );
}
function removeMember(k) {
  const m = state.members[k];
  if (!m || k === 0) return;
  if (state.items.some((i) => i.people.includes(m.name)))
    return formError("Remove this roommate from planned items first.");
  // Receipts retain the former roommate's name and balance.
  state.members.splice(k, 1);
  $("modal").close();
  save();
}
function privateForm() {
  dlg(
    "Your paycheck budget",
    dollars("Paycheck amount", "pay", state.pay) +
      `<label>Grocery percentage<input required name="percent" type="number" min="0" max="100" step=".1" value="${state.percent}">
</label>`,
    (f) => {
      state.pay = cents(f, "pay");
      state.percent = +f.get("percent");
    },
  );
}
function receipts() {
  return `${balancesCard()}<section class="panel"><h2>Confirmed purchases</h2>${
    [...state.history]
      .reverse()
      .map(
        (h) =>
          `<div class="row">${photo(productFor(h))}<div class="detail"><b>${esc(productFor(h).name)}</b><small>${h.date} · Paid by ${esc(h.payer)} · ${h.scope}</small>${h.people.map((n) => `${esc(n)} ${n === h.payer ? "covered" : "owe" + (n === "You" ? "" : "s")} ${cash(share(h.total, h.people, n))}${n === h.payer ? "" : " to " + esc(h.payer)}`).join(" · ")}</div><b>${cash(h.total)}</b></div>`,
      )
      .join("") ||
    "<p>Select groceries on your list and confirm their final prices to record your first receipt.</p>"
  }</section>`;
}
render();
let renderedDay = today();
setInterval(() => {
  const day = today();
  if (
    day !== renderedDay &&
    !$("modal").open &&
    !["INPUT", "SELECT"].includes(document.activeElement?.tagName)
  ) {
    renderedDay = day;
    render();
  }
}, 60000);
