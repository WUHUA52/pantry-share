const dietChoices = ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free", "Organic"];

function matchesDiet(product, choices) {
  return [...choices].every((label) => product.diet?.includes(label));
}

const unitPrice = (product) => product.price / product.size;

function compareOptions(item, catalog, choices, otherStores = false) {
  const similar = catalog.filter((p) =>
    p.id !== item.id && (!item.url || p.url?.replace("://www.", "://") !== item.url.replace("://www.", "://")) &&
    p.cat === item.cat && p.unit === item.unit &&
    (otherStores ? p.store !== item.store : p.store === item.store) &&
    matchesDiet(p, choices)
  );
  const cheaper = similar.filter((p) => p.price < item.price || unitPrice(p) < unitPrice(item))
    .sort((a, b) => unitPrice(a) - unitPrice(b) || a.price - b.price);
  const featured = similar.filter((p) => p.feature && p.feature !== item.feature)
    .sort((a, b) => unitPrice(a) - unitPrice(b) || a.price - b.price);
  return { cheaper, featured };
}

if (typeof module !== "undefined") module.exports = { matchesDiet, compareOptions };
