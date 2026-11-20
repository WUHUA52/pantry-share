const { test, expect } = require("@playwright/test");

const button = (area, name) => area.getByRole("button", { name, exact: true });
const dialog = (page) => page.getByRole("dialog");

test.beforeEach(async ({ page }) => {
  // Retailer image availability should never decide whether a roommate can check out.
  await page.route("https://**/*", (route) => route.abort());
  await page.goto("/");
});

test("a custom quantity checks out, a corrected receipt fixes debts, and a repayment persists", async ({ page }) => {
  await button(page, "Shopping list").click();
  await button(page, "Add custom item").click();
  await dialog(page).getByLabel("Item name", { exact: true }).fill("Garlic bulbs");
  await dialog(page).getByLabel("Estimated price per package").fill("2.00");
  await dialog(page).getByLabel("Quantity", { exact: true }).fill("2");
  await button(dialog(page), "Add grocery").click();

  const garlic = page.locator(".row").filter({ has: page.getByRole("checkbox", { name: "Select Garlic bulbs" }) });
  await expect(garlic).toContainText("$4.00");
  await garlic.getByRole("checkbox").check();
  await button(page, "Confirm selected purchases").click();
  await dialog(page).getByLabel("Receipt total including tax").fill("30.00");
  await dialog(page).getByLabel("Paid by").selectOption({ label: "You" });
  await button(dialog(page), "Confirm purchase").click();

  const receipt = page.locator(".receipt-entry").filter({ hasText: "Garlic bulbs" });
  const samDebt = page.locator(".debt-row").filter({ hasText: /Sam owes You/i });
  await expect(samDebt).toContainText("$10.00");
  await button(receipt, "Edit receipt").click();
  await dialog(page).getByLabel("Receipt total including tax").fill("6.00");
  await button(dialog(page), "Save receipt").click();
  await expect(samDebt).toContainText("$2.00");
  await button(samDebt, "Record repayment").click();
  await dialog(page).getByLabel("Amount paid").fill("2.00");
  await button(dialog(page), "Save repayment").click();

  await page.reload();
  await button(page, "Receipts").click();
  await expect(receipt).toContainText("$6.00");
  await expect(samDebt).toHaveCount(0);
  await expect(page.locator(".debt-row").filter({ hasText: /Riley owes You/i })).toContainText("$2.00");
});

test("a roommate can be renamed, archived, and restored after reloading", async ({ page }) => {
  await button(page, "Budgets").click();
  const sam = page.locator(".row").filter({ has: page.getByText("Sam", { exact: true }) });
  await button(sam, "Edit roommate").click();
  await dialog(page).getByLabel("Name", { exact: true }).fill("Taylor");
  await button(dialog(page), "Save").click();

  const taylor = page.locator(".row").filter({ has: page.getByText("Taylor", { exact: true }) });
  await button(taylor, "Edit roommate").click();
  await button(dialog(page), "Move out").click();
  await button(dialog(page), "Archive roommate").click();
  await expect(button(taylor, "Edit roommate")).toHaveCount(0);

  await page.reload();
  await button(page, "Budgets").click();
  await button(taylor, "Restore").click();
  await expect(button(taylor, "Edit roommate")).toBeVisible();
});

test("saving after a damaged pay schedule keeps the receipt and original backup", async ({ page }) => {
  // Reproduce an older browser save with one malformed field and an otherwise valid receipt.
  const raw = await page.evaluate(() => {
    const snapshot = { name: "Garlic from last week", cat: "Unlisted", unit: "item", size: 1, price: 400 };
    const household = {
      version: 2, store: 0, location: "19122", target: 15000, pay: 80000, percent: 12,
      members: [{ name: "You", anchor: "2026-01-01", cadence: "Broken", contribution: 0 }],
      items: [],
      history: [{ id: 7, product: "custom-7", snapshot, scope: "Shared", store: 0,
        date: "2026-01-02", payer: "You", people: ["You"], total: 400 }],
    };
    const original = JSON.stringify(household);
    localStorage.setItem("pantry-share-v2", original);
    localStorage.removeItem("pantry-share-v3");
    return original;
  });
  await page.reload();
  await button(page, "Budgets").click();
  await button(page, "Rename household").click();
  await dialog(page).getByLabel("Household name").fill("Walnut House");
  await button(dialog(page), "Save").click();
  await page.reload();
  await button(page, "Receipts").click();
  await expect(page.locator(".receipt-entry")).toContainText("Garlic from last week");
  await expect(page.locator(".receipt-entry")).toContainText("$4.00");
  expect(await page.evaluate(() => localStorage.getItem("pantry-share-before-repair"))).toBe(raw);
});
