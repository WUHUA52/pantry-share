// Calendar arithmetic uses UTC day numbers derived from local calendar dates.
function today() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
function periodStart(anchor, cadence, date = today()) {
  const day = 86400000,
    a = Date.parse(anchor),
    now = Date.parse(date);
  if (cadence !== "Monthly") {
    const step = { Daily: 1, Weekly: 7, Biweekly: 14 }[cadence] * day;
    return new Date(a + Math.floor((now - a) / step) * step)
      .toISOString()
      .slice(0, 10);
  }
  const d = new Date(now),
    n = new Date(a).getUTCDate(),
    y = d.getUTCFullYear(),
    m = d.getUTCMonth();
  const payday = (month) =>
    Date.UTC(
      y,
      month,
      Math.min(n, new Date(Date.UTC(y, month + 1, 0)).getUTCDate()),
    );
  return new Date(payday(m) <= now ? payday(m) : payday(m - 1))
    .toISOString()
    .slice(0, 10);
}
// The largest remainders get the leftover cents. Ties follow list order.
function allocateCents(total, weights) {
  if (!Number.isSafeInteger(total) || total < 0 || !weights.length ||
      weights.some((n) => !Number.isSafeInteger(n) || n < 0)) {
    throw new Error("Use a nonnegative cent total and integer shares.");
  }
  const amounts = weights.some((n) => n > 0) ? weights : weights.map(() => 1);
  const denominator = amounts.reduce((a, n) => a + BigInt(n), 0n);
  const portions = amounts.map((weight, index) => {
    const numerator = BigInt(total) * BigInt(weight);
    return { index, cents: Number(numerator / denominator), remainder: numerator % denominator };
  });
  const leftover = total - portions.reduce((a, p) => a + p.cents, 0);
  const ranked = [...portions].sort((a, b) =>
    a.remainder > b.remainder ? -1 : a.remainder < b.remainder ? 1 : a.index - b.index);
  for (let i = 0; i < leftover; i++) ranked[i].cents++;
  return portions.map((p) => p.cents);
}

function itemPortions(total, people, weights) {
  const valid = Array.isArray(weights) && weights.length === people.length &&
    weights.every((n) => Number.isSafeInteger(n) && n > 0);
  return allocateCents(total, valid ? weights : people.map(() => 1));
}

function share(total, people, name, weights) {
  const index = people.indexOf(name);
  return index < 0 ? 0 : itemPortions(total, people, weights)[index];
}

// A settlement moves money between roommates. It does not change grocery spending.
function netDebts(history, settlements = []) {
  const pairs = new Map();
  function post(from, to, amount) {
    if (from === to || !amount) return;
    const [a, b] = [from, to].sort();
    const key = JSON.stringify([a, b]);
    pairs.set(key, (pairs.get(key) || 0) + (from === a ? amount : -amount));
  }
  for (const row of history) {
    const portions = itemPortions(row.total, row.people, row.weights);
    row.people.forEach((person, index) => post(person, row.payer, portions[index]));
  }
  for (const payment of settlements) post(payment.to, payment.from, payment.amount);
  return [...pairs].filter(([, value]) => value !== 0).map(([key, value]) => {
    const [a, b] = JSON.parse(key);
    return { from: value > 0 ? a : b, to: value > 0 ? b : a, amount: Math.abs(value) };
  });
}

if (typeof module !== "undefined") module.exports = { share, periodStart, allocateCents, netDebts };
