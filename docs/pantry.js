function rotationNames() { return members().slice().sort((a,b)=>a.localeCompare(b, "en")); }
function pantryPage() {
  const shopper = members().includes(state.shopper) ? state.shopper : me();
  return `<section class="panel"><div class="bar"><div><h2>Shopping rotation</h2>
  <p>Up next <b>${esc(shopper)}</b></p></div>
  <button onclick="nextShopper()">Mark trip done</button></div>
  <small>${rotationNames().map(esc).join(" → ")}</small></section>
  <section class="panel"><div class="bar"><h2>What's on hand</h2><div class="stack"><button onclick="customForm({scope:'Shared'})">We’re out of…</button><button class="primary" onclick="pantryForm()">Add pantry item</button></div></div>
  ${state.pantry.length ? [...state.pantry].sort((a,b)=>(a.expires || "9999").localeCompare(b.expires || "9999")).map(p=>`<div class="row"><div class="detail"><b>${esc(p.name)}</b>
  <small>${p.qty} × · ${esc(p.place)} · ${esc(p.owner)}${p.expires ? ` · ${p.expires < today() ? "Past date" : "Expires"} ${esc(p.expires)}` : ""}</small></div>
  <button onclick="pantryForm(${p.id})">Edit</button><button onclick="outOfPantry(${p.id})">We're out</button></div>`).join("") : "<p>Add what’s in your fridge, freezer or cupboard and who it belongs to.</p>"}</section>`;
}
function nextShopper() {
  const names = rotationNames();
  state.shopper = names[(names.indexOf(state.shopper)+1)%names.length];
  save();
}
function pantryForm(id) {
  const entry = state.pantry.find(p=>p.id===id);
  const p = entry || {name:"",owner:"Household",qty:1,place:"Cupboard",expires:""};
  const choices = [...new Set(["Household",...members(),p.owner])];
  dlg(entry ? "Edit pantry item" : "Add pantry item",
    `<label>Item name<input name="name" required maxlength="100" value="${esc(p.name)}"></label>${qtyField(p.qty)}
    <label>Stored in<select name="place">${["Fridge","Freezer","Cupboard","Supply closet"].map(x=>`<option ${x===p.place ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label>Owner<select name="owner">${options(choices,choices.indexOf(p.owner))}</select></label>
    <label>Expiration date (optional)<input name="expires" type="date" value="${esc(p.expires || "")}"></label>`, (f)=>{
    const name = f.get("name").trim();
    if (!name) return formError("Enter an item name.");
    Object.assign(p,{name,qty:Number(f.get("qty")),owner:choices[Number(f.get("owner"))],expires:f.get("expires"),place:f.get("place")});
    if (!entry) state.pantry.push({...p,id:uniqueRowId()});
  });
}
function outOfPantry(id) {
  const p = state.pantry.find(x=>x.id===id);
  if (!p) return;
  const own = p.owner === me();
  customForm({name:p.name, scope:own ? "Personal" : "Shared", onAdd:()=>{state.pantry=state.pantry.filter(x=>x.id!==id);}});
}
