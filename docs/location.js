// City residential ZIPs from the Philadelphia Department of Human Services ZIP map.
// A named city is also accepted when no conflicting ZIP is supplied.
const cityZips = new Set("02 03 04 06 07 11 12 14 15 16 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54".split(" ").map(s => "191" + s));
function inPhiladelphia(location) {
  const zip = location.match(/\b\d{5}(?:-\d{4})?\b/)?.[0].slice(0,5);
  if (zip && cityZips.has(zip)) return true;
  const city = /(?:^|[,\s])philadelphia(?:\s*,?\s*(?:pa|pennsylvania))?(?:\s+19113(?:-\d{4})?)?\s*$/i.test(location.trim()) &&
    !/\bnew philadelphia\b/i.test(location);
  return city && (!zip || zip === "19113");
}
const taxableSupplies = new Set(["Paper towels","Dish soap","Trash bags","Laundry detergent","Sponges","Taxable supplies"]);
function taxRate(p) {
  return inPhiladelphia(state.location) && taxableSupplies.has(p.cat) ? 0.08 : 0;
}
function estimateDate(p) {
  return p.priceAsOf ? "Price checked " + p.priceAsOf : "Demo estimate · recorded Nov 19, 2026";
}
