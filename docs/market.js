function dietInputs() {
  return dietChoices.map((label) => `<label><input type="checkbox" value="${label}" ${selectedDiets.has(label) ? "checked" : ""} onchange="setDiet(this)">${label}</label>`).join("");
}
function storeChoices() {
  if (!inPhiladelphia(state.location)) return options(stores, state.store);
  const local = [0,1,2,3,4,9,10,11,12,13,14];
  const option = k => `<option value="${k}" ${k===state.store?"selected":""}>${esc(stores[k])}</option>`;
  return `<optgroup label="Philadelphia area">${local.map(option).join("")}</optgroup><optgroup label="Other demo stores">${[5,6,7,8].map(option).join("")}</optgroup>`;
}
function catalog() {
  return `<section class="panel">
<div class="bar">
<h2>${swap ? "Compare alternatives" : esc(stores[state.store])}</h2>
<button onclick="locationForm()">${esc(state.location)} · Change location</button>
</div>
<div class="shop-tools"><label>Supermarket<select aria-label="Supermarket" onchange="state.store=+this.value;save()">${storeChoices()}</select></label>
<label>Find an item<input id="query" aria-label="Search groceries" placeholder="Search groceries" value="${esc(filter)}" oninput="filter=this.value;refreshCards()"></label>
</div>
<fieldset class="diet-filter"><legend>Dietary preferences</legend>
<div>${dietInputs()}</div>
<small>Choose any combination. Matches must meet every selected preference.</small></fieldset>
<p><small id="result-count" role="status"></small></p>
<div id="cards" class="catalog">${cards()}</div>
</section>`;
}
function setDiet(input) {
  if (input.checked) selectedDiets.add(input.value);
  else selectedDiets.delete(input.value);
  if ($("cards")) {
    for (const box of document.querySelectorAll("#view .diet-filter input")) box.checked = selectedDiets.has(box.value);
    refreshCards();
  }
  if ($("product-dialog").open) {
    const p = products[$("product-dialog").dataset.product];
    $("local-options").innerHTML = optionSections(p, false);
    $("other-options").innerHTML = optionSections(p, true);
  }
}
function clearSearch() {
  selectedDiets.clear();
  filter = "";
  render();
}
function visibleProducts() {
  return catalogProducts.filter((p) => p.store === state.store && matchesDiet(p, selectedDiets) &&
    (p.name + " " + p.cat).toLowerCase().includes(filter.trim().toLowerCase()))
    .sort((a, b) => unitPrice(a) - unitPrice(b));
}
function refreshCount() {
  $("result-count").textContent = `${visibleProducts().length} items · Lowest unit price first · Estimated prices`;
}
function refreshCards() {
  $("cards").innerHTML = cards();
  refreshCount();
}
function badges(p) {
  return (p.diet || []).map((label) => `<span class="diet-badge">${esc(label)}</span>`).join("");
}
function cards() {
  return visibleProducts().map((p) => `<article>
<button class="product-link" onclick="showProduct('${p.id}',swap)">${photo(p)}<span class="aisle">${esc(p.cat)}</span><b>${esc(p.name)}</b></button>
<div class="badges">${badges(p)}</div>
<p>${p.size} ${esc(p.unit)} · ${cash(unitPrice(p))}/${esc(p.unit)}</p><strong>${cash(p.price)}</strong><small>${esc(estimateDate(p))}</small>
<button onclick="add('${p.id}')">${swap ? "Use this option" : "Add to list"}</button>
<button class="compare-link" onclick="showProduct('${p.id}',swap)">Compare options</button>
</article>`).join("") ||
    '<div class="empty-shelf"><p>No matches at this store. Try another store or clear your filters.</p><button onclick="clearSearch()">Clear filters and search</button></div>';
}
function savingsNote(item, p) {
  const notes = [];
  if (p.price < item.price) notes.push(`Save ${cash(item.price - p.price)} per package`);
  if (unitPrice(p) < unitPrice(item)) {
    const percent = (1 - unitPrice(p) / unitPrice(item)) * 100;
    notes.push(`${percent < 1 ? "Under 1" : Math.round(percent)}% less per ${esc(p.unit)}`);
  }
  return notes.join(" · ");
}
function optionRows(items, item, featured) {
  return items.slice(0, 3).map((p) => `<div class="option-row">${photo(p)}
<div><b>${esc(p.name)}</b><small>${esc(stores[p.store])} · ${p.size} ${esc(p.unit)} · ${cash(unitPrice(p))}/${esc(p.unit)}</small>
<small>${esc(estimateDate(p))}</small><span class="option-note">${featured ? esc(p.feature) : savingsNote(item, p)}</span>
<a target="_blank" rel="noreferrer" href="${esc(p.url)}">Retailer listing</a></div>
<div class="option-action"><b>${cash(p.price)}</b><button onclick="chooseDetail('${p.id}')">${detailRow === null ? "Add to list" : "Swap item"}</button></div></div>`).join("");
}
function optionSections(item, otherStores) {
  const { cheaper, featured } = compareOptions(item, catalogProducts, selectedDiets, otherStores);
  return `<section><h3>Budget picks</h3>${optionRows(cheaper, item, false) || "<p>No lower-priced match in this selection.</p>"}</section>
<section><h3>Brand &amp; specialty picks</h3>${optionRows(featured, item, true) || "<p>No specialty alternative listed in this selection.</p>"}</section>`;
}
function showProduct(id, row = null) {
  const p = products[id];
  detailRow = row;
  $("product-dialog").dataset.product = id;
  $("product-heading").textContent = p.name;
  $("product-body").innerHTML = `<div class="product-hero">${photo(p)}<div><span class="aisle">${esc(stores[p.store])} · ${esc(p.cat)}</span>
<strong>${cash(p.price)}</strong><small>${p.size} ${esc(p.unit)} · ${cash(unitPrice(p))}/${esc(p.unit)}</small>
<small>${esc(estimateDate(p))}</small><a href="${esc(p.url)}" target="_blank" rel="noreferrer">View at ${esc(stores[p.store])}</a></div></div>
<section><h3>Dietary details</h3><div class="badges">${badges(p) || "No dietary details recorded for this item."}</div>
<small>Based on listed ingredients and product details. For allergies, check the package for cross-contact warnings.</small>
${p.source || p.dietSource ? `<a class="label-source" href="${esc(p.source || p.dietSource)}" target="_blank" rel="noreferrer">Product information</a>` : ""}</section>
${row === null ? `<button class="primary" onclick="chooseDetail('${p.id}')">Add this item to list</button>` : ""}
<h2 class="option-heading">Alternatives at ${esc(stores[p.store])}</h2>
<fieldset class="diet-filter"><legend>Filter alternatives</legend><div>${dietInputs()}</div></fieldset>
<div id="local-options">${optionSections(p, false)}</div>
<details><summary>Compare other stores</summary><div id="other-options">${optionSections(p, true)}</div></details>`;
  $("product-dialog").showModal();
  $("product-dialog").scrollTop = 0;
}
function chooseDetail(id) {
  $("product-dialog").close();
  add(id, detailRow);
}
function locationForm() {
  dlg(
    "Shopping location",
    `<label>ZIP or address<input required maxlength="100" name="loc" value="${esc(state.location)}">
</label>
<small>Philadelphia estimates use 8% on taxable supplies. Enter the shopping or delivery location. Confirm actual tax in the receipt total.</small>`,
    (f) => {
      state.location = f.get("loc").trim() || "19107";
    },
  );
}
