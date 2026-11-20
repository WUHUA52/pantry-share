function monthlySpending(day = today()) {
  const month = day.slice(0, 7);
  return sum(state.history.filter((row) =>
    row.scope === "Shared" && row.date.startsWith(month) && row.date <= day
  ), (row) => row.total);
}

function householdTitleForm() {
  dlg("Name your household", `<label>Household name<input required maxlength="60" name="name" value="${esc(state.householdName)}"></label>`, (f) => {
    const name = f.get("name").trim();
    if (!name) return formError("Enter a household name.");
    state.householdName = name;
  });
}

function budgets() {
  const month = new Date().toLocaleDateString("en-US", {month: "long", year: "numeric"});
  return `<section class="panel"><div class="bar"><h2>${esc(state.householdName)}</h2>
    <button onclick="householdTitleForm()">Rename household</button></div>
    <div class="bar"><h3>Shared spending</h3><button onclick="targetForm()">Edit monthly limit</button></div>
    <p>${month} · <b>${cash(monthlySpending())} spent</b>${state.target === null ? " · No monthly limit set" : ` of ${cash(state.target)} · ${cash(state.target - monthlySpending())} remaining`}</p></section>
    <section class="panel"><div class="bar"><h2>Roommates</h2><button onclick="memberForm(-1)">Add roommate</button></div>
    ${state.members.map((m,k)=>`<div class="row"><div class="detail"><b>${esc(m.name)}</b>
    <small>${m.contribution ? `${cash(m.contribution - spent(m,true))} of ${cash(m.contribution)} left this pay period · ${esc(m.cadence)}` : "No payday contribution set"}</small></div>
    <button onclick="memberForm(${k})">Edit roommate</button></div>`).join("")}
    ${state.archived.map((name,k)=>`<div class="row"><div class="detail"><b>${esc(name)}</b><small>Moved out</small></div><button onclick="restoreMember(${k})">Restore</button></div>`).join("")}</section>
    <section class="panel"><div class="bar"><h2>Your private budget</h2><button onclick="privateForm()">Edit budget</button></div>
    <p>${state.pay && state.percent ? `${state.percent}% of ${cash(state.pay)} per paycheck · ${cash(remaining())} left` : "Set a paycheck percentage if you want a personal spending limit."}</p>
    <small>Your share of groceries counts on your own pay schedule.</small></section>
    ${sharingPanel()}
    <button onclick="resetDemo()">Reset demo data</button>`;
}

function targetForm() {
  dlg("Monthly household limit", `<label>Shared spending limit ($)<input name="target" type="number" min="0" max="1000000" step=".01" value="${state.target === null ? "" : (state.target/100).toFixed(2)}"></label>
    <small>Runs from the first to the last day of the month. Leave blank to turn off.</small>`, (f)=>{
    state.target = f.get("target") === "" ? null : cents(f,"target");
  });
}
function memberForm(k) {
  const m = state.members[k] || {name:"", contribution:0, cadence:"Weekly", anchor:today()};
  dlg(k < 0 ? "Add roommate" : "Edit roommate",
    `<label>Name<input required maxlength="40" name="name" value="${esc(m.name)}"></label>` +
    dollars("Optional contribution each payday", "contribution", m.contribution) +
    `<label>Pay schedule<select name="freq">${["Daily","Weekly","Biweekly","Monthly"].map(x=>`<option ${x === m.cadence ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label>Reference payday<input type="date" name="day" required value="${m.anchor}"></label>
    ${k > 0 ? `<button type="button" onclick="moveOutForm(${k})">Move out</button>` : ""}`, (f)=>{
    const name = f.get("name").trim();
    const inUse = [...members().filter(n=>n!==m.name), ...state.archived, "Household"].some(n=>n.toLowerCase()===name.toLowerCase());
    if (!name || inUse || (k !== 0 && name.toLowerCase() === "you")) return formError("Choose a unique name. A former roommate can be restored below.");
    if (k >= 0 && name !== m.name) renamePerson(m.name, name, state);
    Object.assign(m,{name, contribution:cents(f,"contribution"),cadence:f.get("freq"),anchor:f.get("day")});
    if (k < 0) state.members.push(m);
  });
}

function moveOutForm(k) {
  const m = state.members[k];
  if (!m || k === 0) return;
  const debts = netDebts(state.history, state.settlements).filter(d=>d.from===m.name || d.to===m.name);
  $("modal").close();
  dlg(`Move out ${m.name}?`, `<p>Remove this roommate from future shopping splits and the rotation. Any item split only with them moves to you. Their receipt history stays in the household.</p>
    ${debts.length ? `<h3>Outstanding balances</h3>${debts.map(d=>`<p>${esc(d.from)} owes ${esc(d.to)} <b>${cash(d.amount)}</b></p>`).join("")}
    <button type="button" onclick="document.getElementById('modal').close();navTo('Receipts')">Record a repayment first</button><small>You can also record it after move-out.</small>` : "<p>All balances are settled.</p>"}`, ()=>{
    for (const row of state.items) {
      const index = row.people.indexOf(m.name);
      if (index < 0) continue;
      row.people.splice(index,1);
      if (row.weights) row.weights.splice(index,1);
      if (!row.people.length) { row.people = [me()]; delete row.weights; }
    }
    if (state.shopper === m.name) state.shopper = rotationNames()[(rotationNames().indexOf(m.name)+1)%state.members.length];
    state.members.splice(k,1);
    state.archived.push(m.name);
  },"Archive roommate");
}

function restoreMember(k) {
  const [name] = state.archived.splice(k,1);
  if (!name) return;
  state.members.push({name,anchor:today(),cadence:"Weekly",contribution:0});
  save();
}

function privateForm() {
  dlg("Your paycheck budget", dollars("Paycheck amount","pay",state.pay) +
    `<label>Grocery percentage<input name="percent" required type="number" min="0" max="100" step=".1" value="${state.percent}"></label>
    <label>Pay schedule<select name="freq">${["Daily","Weekly","Biweekly","Monthly"].map(x=>`<option ${state.members[0].cadence === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label>Reference payday<input type="date" name="day" required value="${state.members[0].anchor}"></label>`, (f)=>{
    state.pay = cents(f,"pay"); state.percent = Number(f.get("percent"));
    Object.assign(state.members[0], {cadence:f.get("freq"),anchor:f.get("day")});
  });
}
function resetDemo() {
  dlg("Reset demo data?", "<p>Reset this browser’s household, pantry, receipts, repayments and budget settings?</p>", ()=>{
    const next = defaultState();
    try { replaceProtectedHousehold(next); }
    catch (error) { return formError(error.message); }
    clearReceiptPhotos();
    state = next;
    checked.clear(); filter = ""; scope = "Shared"; swap = null; recovery = "";
  }, "Reset demo data");
}
