import { expect, test } from "@playwright/test";

import { stubApiPersona } from "./support/api";

test.describe("user routes", () => {
  test.beforeEach(async ({ page }) => {
    await stubApiPersona(page, "user");
  });

  test("dashboard renders recent activity", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText(/welcome back, ada user!/i)).toBeVisible();
    await expect(page.getByText("Question History")).toBeVisible();
  });

  test("questions page renders the list view", async ({ page }) => {
    await page.goto("/questions");

    await expect(
      page.getByRole("heading", { name: "Browse Questions" })
    ).toBeVisible();
    await expect(page.getByText("Two Sum")).toBeVisible();
  });

  test("question detail page renders fetched content", async ({ page }) => {
    await page.goto("/questions/two-sum");

    await expect(
      page.getByRole("heading", { name: "Question Details" })
    ).toBeVisible();
    await expect(page.getByText("Find two indices that add up to the target.")).toBeVisible();
  });

  test("matching page can enter the waiting state", async ({ page }) => {
    await page.goto("/matching");

    await expect(
      page.getByRole("heading", { name: "Matching Preferences" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Start Matching" }).click();
    await expect(page.getByText("Searching for a peer…")).toBeVisible();
  });

  test("faq page renders the request card for normal users", async ({ page }) => {
    await page.goto("/faq");

    await expect(
      page.getByRole("heading", { name: "Frequently Asked Questions" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Request Admin Access" })
    ).toBeVisible();
  });

  test("profile page renders the editable profile form", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { name: "Profile Settings" })
    ).toBeVisible();
    await expect(
      page.locator('input[disabled][value="ada@example.com"]')
    ).toBeVisible();
  });
});
