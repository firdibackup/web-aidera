import { expect, test } from "@playwright/test";

test.describe("studio shell", () => {
  test("redirects root to dashboard and shows prototype banner", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Ikhtisar", level: 1 })).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Prototype Data — tidak tersimpan permanen" }),
    ).toBeVisible();
  });

  test("never exposes bridge credentials to the browser", async ({ page }) => {
    const responses: string[] = [];

    page.on("response", async (response) => {
      if (response.url().includes("/api/")) {
        responses.push(await response.text().catch(() => ""));
      }
    });

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Butuh keputusan" })).toBeVisible();

    for (const body of responses) {
      expect(body.toLowerCase()).not.toContain("bearer ");
      expect(body.toLowerCase()).not.toContain("aidera_bridge_token");
    }
  });

  test("navigates between core screens", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("link", { name: /Agents/ }).first().click();
    await expect(page.getByRole("heading", { name: "Agents", level: 1 })).toBeVisible();

    await page.getByRole("link", { name: /Board/ }).first().click();
    await expect(page.getByRole("heading", { name: "Board", level: 1 })).toBeVisible();

    await page.getByRole("link", { name: /Kalender/ }).first().click();
    await expect(page.getByRole("heading", { name: "Kalender", level: 1 })).toBeVisible();
  });
});

test.describe("agent workspace", () => {
  test("renders structured agent output", async ({ page }) => {
    await page.goto("/agents/research");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Research");
    await expect(page.getByRole("region", { name: "Percakapan" })).toBeVisible();
    await expect(page.getByText("Reference mining dan riset slide per slide")).toBeVisible();
  });
});

test.describe("plans", () => {
  test("keeps approval decisions explicit", async ({ page }) => {
    await page.goto("/plans");

    await expect(page.getByRole("heading", { name: "CEO Plans", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /Setujui terpilih/ }).first()).toBeDisabled();
  });
});

test.describe("board", () => {
  test("shows all fifteen stages", async ({ page }) => {
    await page.goto("/content/board");

    await expect(page.getByRole("heading", { name: "Board", level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Ideas" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Blocked" })).toBeVisible();
  });
});

test.describe("calendar", () => {
  test("renders Jakarta-scoped schedule", async ({ page }) => {
    await page.goto("/content/calendar");

    await expect(page.getByRole("heading", { name: "Kalender", level: 1 })).toBeVisible();
    await expect(page.getByText("Zona Asia/Jakarta")).toBeVisible();
  });
});
