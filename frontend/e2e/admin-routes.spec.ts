import { expect, test } from "@playwright/test";

import { stubApiPersona } from "./support/api";

test.describe("admin routes", () => {
  test.beforeEach(async ({ page }) => {
    await stubApiPersona(page, "admin");
  });

  test("admin dashboard renders management panels", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(
      page.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeVisible();
    await expect(page.getByText("All Users")).toBeVisible();
  });

  test("admin questions page renders the list", async ({ page }) => {
    await page.goto("/admin/questions");

    await expect(
      page.getByRole("heading", { name: "Manage Questions" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Add Question" })).toBeVisible();
  });

  test("admin add question page renders the composer", async ({ page }) => {
    await page.goto("/admin/questions/add");

    await expect(
      page.getByRole("heading", { name: "Add Question" })
    ).toBeVisible();
    await expect(page.getByText("Preview will appear here.").last()).toBeVisible();
  });

  test("admin question detail page renders the question and actions", async ({ page }) => {
    await page.goto("/admin/questions/two-sum");

    await expect(
      page.getByRole("heading", { name: "Question Details" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit Question" })).toBeVisible();
  });
});
