import { expect, test } from "@playwright/test";

import { stubApiPersona } from "./support/api";

test.describe("public routes", () => {
  test.beforeEach(async ({ page }) => {
    await stubApiPersona(page, "guest");
  });

  test("landing page renders the hero content", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /practice technical interviews/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });

  test("login page renders its main form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("signup page renders the account form", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByRole("heading", { name: "Create your account" })
    ).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
  });

  test("permission denied page renders both actions", async ({ page }) => {
    await page.goto("/permission-denied");

    await expect(page.getByText("Permission Denied")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Return Home" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Browse Questions" })
    ).toBeVisible();
  });

  test("service unavailable placeholder renders", async ({ page }) => {
    await page.goto("/service-unavailable");

    await expect(page.getByText("Service Unavailable Page")).toBeVisible();
  });

  test("settings profile placeholder renders", async ({ page }) => {
    await page.goto("/settings/profile");

    await expect(page.getByText("Profile Settings Page")).toBeVisible();
  });
});
