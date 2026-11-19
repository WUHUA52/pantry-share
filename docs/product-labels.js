// Reviewed by product ID. Each source is the retailer listing or the manufacturer.
// Ingredient-based preferences are separate from allergen and cross-contact guarantees.
const productLabels = {
  // Lehigh Valley Vitamin D Whole Milk
  "sku-5994bf1ef59d": {
    diet: ["Vegetarian"],
    source: "https://giantfoodstores.com/groceries/product/lehigh-valley-vitamin-d-whole-milk-1-2-gallon/165173",
  },
  // Our Brand Spaghetti Pasta
  "sku-9fc000da66f0": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://giantfoodstores.com/groceries/product/our-brand-spaghetti-pasta-16-oz-box/56514",
  },
  // San Giorgio Spaghetti Pasta
  "sku-046e8c2fafda": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    feature: "Non-GMO Project Verified spaghetti.",
    source: "https://giantfoodstores.com/groceries/product/san-giorgio-spaghetti-pasta-16-oz-box/3136",
  },
  // Our Brand Quick Rolled Oats
  "sku-e8dd9b92c4c8": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://giantfoodstores.com/groceries/product/our-brand-quick-rolled-oats-18-oz-can/197857",
  },
  // Our Brand Old Fashioned Rolled Oats
  "sku-62e071b0df42": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://giantfoodstores.com/groceries/product/our-brand-old-fashioned-rolled-oats-18-oz-pkg/57817",
  },
  // Our Brand Cage Free Large Brown Eggs - 12 ct
  "sku-743fd6e36e43": {
    diet: ["Gluten-free", "Vegetarian", "Dairy-free"],
    feature: "Cage-free eggs.",
    source: "https://giantfoodstores.com/groceries/product/our-brand-cage-free-large-brown-eggs-12-ct-1-doz/222594",
  },
  // Nature's Own Whole Grain 100% Whole Wheat Bread Sliced
  "sku-9c976a9e54c7": {
    diet: [],
    feature: "Made with 100% whole wheat.",
    source: "https://giantfoodstores.com/groceries/product/natures-own-whole-grain-100-whole-wheat-bread-sliced-20-oz-pkg/154239",
  },
  // Our Brand Long Grain White Rice
  "sku-13fe838a4183": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://giantfoodstores.com/groceries/product/our-brand-long-grain-white-rice-32-oz-bag/88417",
  },
  // Our Brand Black Beans
  "sku-cf78efb0684f": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://giantfoodstores.com/groceries/product/our-brand-black-beans-15-5-oz-can/56409",
  },
  // Strawberries
  "sku-85f6d87be12c": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://giantfoodstores.com/groceries/product/strawberries-16-oz-pkg/118795",
  },
  // Our Brand Broccoli Florets Frozen
  "sku-a24cead91c56": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://giantfoodstores.com/groceries/product/our-brand-broccoli-florets-frozen-12-oz-bag/414305",
  },
  // Price Whole Milk - 0.5gal
  "sku-b956a0dbf7b1": {
    diet: ["Gluten-free", "Vegetarian"],
    source: "https://www.target.com/p/-/A-84031590",
  },
  // United Whole Milk - 0.5gal
  "sku-1645490c2d61": {
    diet: ["Vegetarian"],
    source: "https://www.target.com/p/-/A-85650381",
  },
  // Spaghetti - 16oz - Good & Gather™
  "sku-7fa1135abdd8": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.target.com/p/-/A-78779052",
  },
  // Crystal Farms Cheddar Cheese - 8oz
  "sku-74111b110b33": {
    diet: [],
    feature: "Cheddar made in the Midwest.",
    source: "https://www.target.com/p/-/A-92908305",
  },
  // Sharp Cheddar Cheese - 8oz - Good & Gather™
  "sku-3852595442ec": {
    diet: ["Vegetarian"],
    feature: "Sharp cheddar made with microbial enzymes.",
    source: "https://www.target.com/p/-/A-54340519",
  },
  // Old Fashioned Oats - 18oz - Good & Gather™
  "sku-7fa14231588a": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.target.com/p/-/A-79364883",
  },
  // Grade A Extra Large Eggs - 12ct - Good & Gather™
  "sku-0828b02ed405": {
    diet: ["Gluten-free", "Vegetarian", "Dairy-free"],
    feature: "Extra-large eggs.",
    source: "https://www.target.com/p/-/A-14713532",
  },
  // 100% Whole Wheat Bread 20oz - Market Pantry
  "sku-a67ad10c0661": {
    diet: [],
    feature: "Made with 100% whole wheat.",
    source: "https://www.target.com/p/-/A-14766199",
  },
  // Enriched Long Grain White Rice - 32oz - Good & Gather™
  "sku-0071c6c2a676": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.target.com/p/-/A-54602335",
  },
  // Bush's Black Beans - 15oz: Low Fat, Gluten-Free, No Added Sugar
  "sku-5caa7edf4565": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.target.com/p/-/A-13536162",
  },
  // Fresh Organic Strawberries - 16oz
  "sku-2c6219089f19": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free", "Organic"],
    feature: "Organically grown strawberries.",
    source: "https://www.target.com/p/-/A-85762475",
  },
  // Greek Plain Yogurt - 32oz - Good & Gather™
  "sku-d0f3e70ceaba": {
    diet: ["Vegetarian"],
    source: "https://www.target.com/p/-/A-94895373",
  },
  // Frozen Broccoli Florets - 12oz - Good & Gather™
  "sku-1cd65e8c5d2b": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.target.com/p/-/A-79397039",
  },
  // Quaker Quick Oats 18oz
  "sku-6eeeed396f66": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    feature: "Whole grain oats that cook in one minute.",
    source: "https://www.quakeroats.com/products/hot-cereals/quick-oats",
  },
  // Maola Whole Milk
  "sku-5d381025bf32": {
    diet: ["Vegetarian"],
    source: "https://www.wegmans.com/shop/product/937027-Whole-Milk",
  },
  // Homestead Creamery Milk, Whole, Chocolate
  "sku-51ef4434da8d": {
    diet: ["Vegetarian"],
    feature: "Chocolate whole milk bottled in glass.",
    source: "https://www.wegmans.com/shop/product/709682",
  },
  // Wegmans Spaghetti Pasta
  "sku-662ea8a2574d": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.wegmans.com/shop/product/60164-Spaghetti-Pasta",
  },
  // Wegmans Sharp Cheddar Cheese
  "sku-b7c9a2bf4d23": {
    diet: ["Vegetarian"],
    feature: "Aged six months and made with non-animal rennet.",
    source: "https://www.wegmans.com/shop/product/83588",
  },
  // Wegmans Cheese, Cheddar, Sharp, White
  "sku-a2f32251b272": {
    diet: [],
    feature: "White cheddar aged six months.",
    source: "https://www.wegmans.com/shop/product/83600-Cheese-Cheddar-Sharp-White",
  },
  // Wegmans Oats, Old Fashioned
  "sku-ea26dc10ee28": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.wegmans.com/shop/product/41369-Oats-Old-Fashioned",
  },
  // Wegmans Cage Free Large Eggs
  "sku-1078c816bc85": {
    diet: ["Gluten-free", "Vegetarian", "Dairy-free"],
    feature: "Cage-free eggs.",
    source: "https://www.wegmans.com/shop/product/52603",
  },
  // Nature's Own 100% Whole Wheat Bread
  "sku-9d37d8543f97": {
    diet: [],
    feature: "Made with 100% whole wheat.",
    source: "https://www.wegmans.com/shop/product/273441-100-Whole-Wheat-Bread",
  },
  // Wegmans Organic Long Grain White Rice
  "sku-e0e59b8c14bc": {
    diet: ["Vegan", "Vegetarian", "Dairy-free", "Organic"],
    feature: "USDA organic long grain white rice.",
    source: "https://www.wegmans.com/shop/product/56701",
  },
  // Wegmans Black Beans
  "sku-7e8a5f493aea": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.wegmans.com/shop/product/10328-Black-Beans",
  },
  // Strawberries
  "sku-ebc8b8dd5b70": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.wegmans.com/shop/product/225689",
  },
  // Wegmans 0% Greek Plain Nonfat Yogurt
  "sku-243c909d9dbb": {
    diet: ["Gluten-free", "Vegetarian"],
    source: "https://www.wegmans.com/shop/product/25605-Greek-Plain-Nonfat-Yogurt",
  },
  // Wegmans Steamable Broccoli Florets
  "sku-d86415731771": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.wegmans.com/shop/product/62358-Frozen-Broccoli-Florets",
  },
  // Friendly Farms Vitamin D Whole Milk
  "sku-ec138d9a636e": {
    diet: ["Vegetarian"],
    source: "https://www.aldi.us/store/aldi/products/18647583-friendly-farms-whole-milk-0-5-gal",
  },
  // Simply Nature Organic Spaghetti
  "sku-3ed3e8d94483": {
    diet: ["Vegan", "Vegetarian", "Dairy-free", "Organic"],
    feature: "Made with organic durum wheat semolina.",
    source: "https://www.aldi.us/store/aldi/products/18648690-simply-nature-organic-spaghetti-pasta-16-oz",
  },
  // Priano Bronze Cut Spaghetti
  "sku-bd8af0ffc96a": {
    diet: [],
    feature: "Spaghetti shaped through a bronze die.",
    source: "https://www.aldi.us/store/aldi/products/34917883-priano-bronze-cut-spaghetti-16-oz",
  },
  // Emporium Selection Aged Cheddar Cheese
  "sku-407c17556d4e": {
    diet: [],
    feature: "Aged cheddar with a sharper flavor than mild cheddar.",
    source: "https://www.aldi.us/store/aldi/products/112683107-emporium-selection-aged-cheddar-8-oz",
  },
  // Millville Old Fashioned Rolled Oats
  "sku-62508f32e34f": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.aldi.us/store/aldi/products/18647728-millville-hearty-100-whole-grain-old-fashioned-rolled-oats-42-oz",
  },
  // Goldhen Large Grade A Eggs - 1 Dozen
  "sku-770a7b2405b0": {
    diet: ["Gluten-free", "Vegetarian", "Dairy-free"],
    source: "https://www.aldi.us/store/aldi/products/115095-goldhen-grade-a-large-eggs-12-ct",
  },
  // L'oven Fresh 100% Whole Wheat Bread, 20 oz
  "sku-1ed8ea2a4c2b": {
    diet: [],
    feature: "Made with 100% whole wheat.",
    source: "https://www.aldi.us/store/aldi/products/20114923-l-oven-fresh-100-whole-wheat-bread-20-oz",
  },
  // Season's Choice Frozen Steamed Broccoli Florets
  "sku-5c5241ed2c33": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.aldi.us/store/aldi/products/26548777-season-s-choice-steamable-frozen-broccoli-florets-12-oz",
  },
  // Kroger® Spaghetti, 16 oz
  "sku-7479b212a291": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.kroger.com/p/kroger-spaghetti-pasta/0001111085004",
  },
  // Simple Truth Organic® 100% Whole Grain Rolled 1 Minute Oats, 18 oz
  "sku-d385adc04f44": {
    diet: ["Vegan", "Vegetarian", "Dairy-free", "Organic"],
    feature: "Organic whole grain oats that cook in one minute.",
    source: "https://www.kroger.com/p/simple-truth-organic-100-whole-grain-rolled-1-minute-oats/0001111002805",
  },
  // Kroger® Grade A Large White Eggs, 12 ct
  "sku-1790a61cacdc": {
    diet: ["Gluten-free", "Vegetarian", "Dairy-free"],
    source: "https://www.kroger.com/p/kroger-grade-a-large-white-eggs/0001111060903",
  },
  // Kroger® Enriched Long Grain White Rice, 32 oz
  "sku-dd0006b49b82": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.kroger.com/p/kroger-long-grain-white-rice/0001111089875",
  },
  // Kroger® Black Beans, 15.5 oz
  "sku-67ec7456f01e": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.kroger.com/p/kroger-black-beans/0001111010647",
  },
  // Strawberries, 16 OZ
  "sku-d7b55407f056": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.kroger.com/p/strawberries/0003338320129",
  },
  // Kroger® Plain Nonfat Greek Yogurt Tub, 32 oz
  "sku-344cbe519f9b": {
    diet: ["Vegetarian"],
    source: "https://www.kroger.com/p/kroger-plain-nonfat-greek-yogurt-tub/0001111002817",
  },
  // Kroger® Frozen Broccoli Florets, 12 oz
  "sku-ec310d587370": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.kroger.com/p/product/0001111012841",
  },
  // Great Value Large White Eggs, 12 Count
  "sku-113d2ea327ec": {
    diet: ["Gluten-free", "Vegetarian", "Dairy-free"],
    source: "https://www.walmart.com/ip/Great-Value-Large-White-Eggs-12-Count/145051970",
  },
  // Great Value Milk Whole Vitamin D, Half Gallon, 64 fl oz
  "sku-0080d212deb1": {
    diet: ["Vegetarian"],
    source: "https://www.walmart.com/ip/Great-Value-Milk-Whole-Vitamin-D-Half-Gallon-Plastic-Jug-64oz/10450118",
  },
  // Great Value Black Beans, 15 oz
  "sku-bc8f3efd7926": {
    diet: ["Vegan", "Vegetarian"],
    source: "https://www.walmart.com/ip/Great-Value-Black-Beans-15-oz-Can/10534038",
  },
  // Food Lion Spaghetti Pasta
  "sku-d150f62635f3": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://foodlion.com/groceries/product/food-lion-spaghetti-pasta-16-oz-box/296997",
  },
  // Food Lion Spaghetti Pasta
  "sku-9e5205509768": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.foodlion.com/groceries/product/food-lion-spaghetti-pasta-16-oz-box/296997",
  },
  // Food Lion 100% Whole Grain Old Fashioned Rolled Oats
  "sku-3a9af1aad5fb": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://foodlion.com/groceries/product/food-lion-100-whole-grain-old-fashioned-rolled-oats-18-oz-can/295415",
  },
  // Food Lion Natural Extra Sharp New York Cheddar Cheese Block
  "sku-67d429a89964": {
    diet: [],
    feature: "Extra-sharp New York cheddar.",
    source: "https://foodlion.com/groceries/product/food-lion-natural-extra-sharp-new-york-cheddar-cheese-block-8-oz-pkg/296531",
  },
  // Strawberries
  "sku-1c2c6e90c122": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://foodlion.com/groceries/product/strawberries-16-oz-pkg/118795",
  },
  // Stop & Shop Spaghetti Pasta
  "sku-ddf3c54f0fd8": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://stopandshop.com/groceries/product/stop-shop-spaghetti-pasta-16-oz-box/56514",
  },
  // Stop & Shop Quick Rolled Oats
  "sku-228f1aaaa1d4": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://stopandshop.com/groceries/product/stop-shop-quick-rolled-oats-18-oz-can/197857",
  },
  // Strawberries
  "sku-8a9c02713bb7": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://stopandshop.com/groceries/product/strawberries-16-oz-pkg/118795",
  },
  // Our Brand Spaghetti Pasta
  "sku-e388d2de1481": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://martinsfoods.com/groceries/product/our-brand-spaghetti-pasta-16-oz-box/56514",
  },
  // Our Brand Old Fashioned Rolled Oats
  "sku-94e31a29ed0b": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://martinsfoods.com/groceries/product/our-brand-old-fashioned-rolled-oats-18-oz-pkg/57817",
  },
  // Our Brand Whole Strawberries Frozen
  "sku-5082776dbf0c": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://martinsfoods.com/groceries/product/our-brand-whole-strawberries-frozen-16-oz-bag/58237",
  },
  // Barilla Spaghetti Pasta - 16 Oz
  "sku-ee86061766e7": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    feature: "Kosher-certified durum wheat spaghetti.",
    source: "https://www.acmemarkets.com/shop/pd/barilla-spaghetti-pasta-16-oz/128200289",
  },
  // Barilla Whole Grain Spaghetti Pasta - 16 Oz
  "sku-6fbf9826baf4": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    feature: "Made with 100% whole grain durum wheat.",
    source: "https://www.acmemarkets.com/shop/pd/barilla-whole-grain-spaghetti-pasta-16-oz/960150487",
  },
  // Lucerne Milk - Half Gallon (container may vary)
  "sku-d33bd6fcb1b6": {
    diet: ["Vegetarian"],
    source: "https://www.acmemarkets.com/shop/pd/lucerne-milk-half-gallon-container-may-vary/136010013",
  },
  // a2 Milk Whole Milk - Half Gallon
  "sku-6e80083e13b6": {
    diet: ["Vegetarian"],
    feature: "Milk from cows that produce only the A2 form of beta-casein.",
    source: "https://www.acmemarkets.com/shop/pd/a2-milk-whole-milk-half-gallon/960158209",
  },
  // Bush's Black Beans - 15 Oz
  "sku-aa5f868897bb": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.acmemarkets.com/shop/pd/bushs-black-beans-15-oz/124150102",
  },
  // Bush's Organic Black Beans - 15 Oz
  "sku-84b5b5995ceb": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free", "Organic"],
    feature: "Organically grown black beans.",
    source: "https://www.acmemarkets.com/shop/pd/bushs-organic-black-beans-15-oz/960235366",
  },
  // Signature SELECT Old Fashioned Oats - 18 Oz
  "sku-c3d7effb0426": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.acmemarkets.com/shop/pd/signature-select-old-fashioned-oats-18-oz/111050252",
  },
  // Signature SELECT Quick Oats - 18 Oz
  "sku-27fdec79ff70": {
    diet: ["Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.acmemarkets.com/shop/pd/signature-select-quick-oats-18-oz/111050068",
  },
  // Strawberries Prepacked - 1 Lb
  "sku-5a27294bb0c1": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.acmemarkets.com/shop/pd/strawberries-prepacked-1-lb/184070124",
  },
  // Strawberries Prepacked - 2 Lb
  "sku-b43fe8add40a": {
    diet: ["Gluten-free", "Vegan", "Vegetarian", "Dairy-free"],
    source: "https://www.acmemarkets.com/shop/pd/strawberries-prepacked-2-lb/960012546",
  },
};
