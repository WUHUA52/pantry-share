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
function share(cents, people, name) {
  const i = people.indexOf(name);
  return i < 0
    ? 0
    : Math.floor(cents / people.length) + (i < cents % people.length ? 1 : 0);
}
if (typeof module !== "undefined") module.exports = { share, periodStart };
// Net each pair in both directions. A payday never erases money owed.
function netDebts(history) {
  const pairs = new Map();
  for (const row of history) {
    for (const person of row.people) {
      if (person === row.payer) continue;
      const [a, b] = [person, row.payer].sort(),
        key = JSON.stringify([a, b]);
      pairs.set(
        key,
        (pairs.get(key) || 0) +
          (person === a ? 1 : -1) * share(row.total, row.people, person),
      );
    }
  }
  return [...pairs]
    .filter(([, v]) => v !== 0)
    .map(([key, v]) => {
      const [a, b] = JSON.parse(key);
      return { from: v > 0 ? a : b, to: v > 0 ? b : a, amount: Math.abs(v) };
    });
}
if (typeof module !== "undefined") module.exports.netDebts = netDebts;
