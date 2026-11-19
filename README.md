# Pantry Share

Plan a grocery trip with roommates, compare package sizes at one store, and see who owes whom after checkout.

[Open the hosted demo](https://pantry-share-roommates.dehuathemlgpro.chatgpt.site)

![Pantry Share household shopping list](preview.jpg)

## Try a grocery trip

1. Choose a retailer under **Compare products**. Compare prices per unit, open the retailer’s listing, and add an item to your personal or household list.
2. On the household list, select the roommates who share each item. Check off purchased items and enter their actual tax-inclusive prices and payer.
3. Open **Receipts** to see the net balance between each pair of roommates. **Budgets** tracks personal and shared spending across individual pay cycles. You can edit household members and reset the demo here.

## Run locally

Open **docs/index.html** in a browser. To serve it locally, run `python3 -m http.server 8000 --directory docs` and open http://localhost:8000. Run `npm test` with Node 22 or later. No packages or credentials are required.

## What the demo covers

- Browse GIANT, Target, Walmart, Wegmans, ALDI, Kroger, Food Lion, Stop & Shop, MARTIN’S and ACME Markets. Each store has its own selection. Prices are sample estimates, and availability is not checked live. Each product displays the photo from its retailer listing. Retailer links open the original product pages.
- Demo tax is limited to paper towels in ZIP 19107. Try Walmart’s Bounty paper towels to see estimated tax. Elsewhere the app shows that tax is unavailable. Enter the receipt price after shopping. [Philadelphia sales tax](https://www.phila.gov/services/business-self-employment/business-taxes/sales-use-hotel-occupancy-tax/) · [Pennsylvania taxable purchases](https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforbusinesses/sut/documents/rev-958.pdf)
- This is a single-browser demo. Each list saves locally. Google accounts, invitations, and syncing across devices are future features. Use fictional paycheck amounts.
- Earlier saves migrate to stable product IDs. Each item retains a description for receipts, even if it leaves the catalog. Resetting the demo clears this browser’s grocery records.
