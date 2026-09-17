import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }) => {
  const response = await request.post("/api/prototype/reset");
  expect(response.ok()).toBe(true);
});

test.describe("content library", () => {
  test("lists content and opens a detail page", async ({ page }) => {
    await page.goto("/content");

    await expect(page.getByRole("heading", { name: "Content Library", level: 1 })).toBeVisible();
    await expect(page.getByRole("table", { name: /Daftar konten/ })).toBeVisible();

    await page.getByRole("link", { name: "Audit workflow AI mingguan" }).click();

    await expect(page).toHaveURL(/\/content\/8$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Audit workflow AI mingguan");
  });

  test("filters by search and recovers with an empty state", async ({ page }) => {
    await page.goto("/content");

    await page.getByRole("searchbox", { name: "Cari konten" }).fill("zzz-tidak-ada");
    await expect(page.getByText("Tidak ada konten yang cocok")).toBeVisible();

    await page.getByRole("button", { name: "Bersihkan filter" }).click();
    await expect(page.getByRole("table", { name: /Daftar konten/ })).toBeVisible();
  });

  test("exposes ten detail tabs and compares artifact versions", async ({ page }) => {
    await page.goto("/content/8");

    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(10);

    await page.getByRole("tab", { name: "Files" }).click();
    await expect(page.getByRole("heading", { name: "Artifact terversi" })).toBeVisible();

    await page.getByRole("button", { name: "Bandingkan" }).first().click();
    await expect(page.getByRole("dialog", { name: "Perbandingan artifact" })).toBeVisible();
  });

  test("never invents performance metrics", async ({ page }) => {
    await page.goto("/content/8");
    await page.getByRole("tab", { name: "Performance" }).click();

    await expect(page.getByText("Metrik belum tersedia")).toBeVisible();
  });
});

test.describe("approvals", () => {
  test("shows pending decisions with explicit status", async ({ page }) => {
    await page.goto("/approvals");

    await expect(page.getByRole("heading", { name: "Approvals", level: 1 })).toBeVisible();
    await expect(page.getByText("Tidak ada keputusan strategis yang dilewati otomatis.")).toBeVisible();
  });

  test("requires confirmation and a note before rejecting", async ({ page }) => {
    await page.goto("/approvals/103");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Paket final");

    await page.getByRole("button", { name: "Tolak" }).click();
    await expect(page.getByRole("alertdialog", { name: "Konfirmasi keputusan" })).toBeVisible();

    await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
    await expect(page.getByText("Catatan wajib diisi")).toBeVisible();
    await expect(page.getByText("Menunggu keputusan").first()).toBeVisible();
  });

  test("persists an approval decision across reload", async ({ page }) => {
    await page.goto("/approvals/101");

    await page.getByRole("button", { name: "Setujui" }).click();
    await page.getByRole("button", { name: "Ya, lanjutkan" }).click();

    await expect(page.getByText("Keputusan tersimpan")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Disetujui").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Setujui" })).toHaveCount(0);
  });
});

test.describe("cross-screen navigation", () => {
  test("moves from dashboard decision to the approval detail", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("link", { name: "Rencana editorial 14–20 September" }).click();

    await expect(page).toHaveURL(/\/approvals\/101$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Rencana editorial");
  });

  test("opens full content detail from a board card", async ({ page }) => {
    await page.goto("/content/board");

    await page.getByRole("button", { name: /AID-008/ }).first().click();
    await page.getByRole("link", { name: "Buka detail lengkap" }).click();

    await expect(page).toHaveURL(/\/content\/8$/);
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  });
});

test.describe("activity", () => {
  test("renders only real recorded events", async ({ page }) => {
    await page.goto("/activity");

    await expect(page.getByRole("heading", { name: "Aktivitas", level: 1 })).toBeVisible();
    await expect(
      page.getByText("Timeline kejadian nyata—bukan simulasi agent bekerja."),
    ).toBeVisible();
  });
});

test.describe("settings", () => {
  test("navigates all five settings sections", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Pengaturan", level: 1 })).toBeVisible();
    await expect(page.getByText("Auto-publish nonaktif")).toBeVisible();

    const settingsNav = page.getByRole("navigation", { name: "Navigasi pengaturan" });

    await settingsNav.getByRole("link", { name: "Workflow" }).click();
    await expect(page.getByRole("heading", { name: "Workflow", level: 1 })).toBeVisible();

    await settingsNav.getByRole("link", { name: "Agents" }).click();
    await expect(page.getByRole("heading", { name: "Agents", level: 1 })).toBeVisible();

    await settingsNav.getByRole("link", { name: "Instructions" }).click();
    await expect(page.getByRole("heading", { name: "Instructions", level: 1 })).toBeVisible();

    await settingsNav.getByRole("link", { name: "Integrasi" }).click();
    await expect(page.getByRole("heading", { name: "Integrasi", level: 1 })).toBeVisible();
  });

  test("keeps required approval gates enabled", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByText("Wajib").first()).toBeVisible();
    await expect(page.getByText("Aktif").first()).toBeVisible();
  });

  test("approves an instruction and persists the new active version", async ({ page }) => {
    await page.goto("/settings/instructions");

    const proposed = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Aturan safe area versi 2", level: 2 }) });
    await expect(proposed.getByText("Diusulkan", { exact: true })).toBeVisible();

    await proposed.getByRole("button", { name: /Setujui/ }).click();
    await expect(page.getByText("Versi instruksi diperbarui")).toBeVisible();

    await page.reload();
    const updated = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Aturan safe area versi 2", level: 2 }) });
    await expect(updated.getByText("Aktif", { exact: true })).toBeVisible();
    await expect(updated.getByRole("button", { name: /Setujui/ })).toHaveCount(0);
  });
});
